import { TokenModel, TokenService } from '@app/database';
import { HolderService } from '@app/database';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import Bottleneck from 'bottleneck';
import { ethers } from 'ethers';

const CREATOR_ADDRESS = '0x5Fc96c182Bb7E0413c08e8e03e9d7EFc6cf0B099';

const UNISWAP_ROUTER_ABI = [
  'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint amountA, uint amountB, uint liquidity)',
];

@Injectable()
export class RealtService {
  private readonly logger = new Logger(RealtService.name);
  private httpProvider: ethers.JsonRpcProvider;
  private provider: ethers.Provider;
  private indexerLimiter: Bottleneck;
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly holderService: HolderService,
  ) {
    this.httpProvider = new ethers.JsonRpcProvider(
      this.configService.get(
        'GNOSIS_HTTP_RPC_URL',
        'https://rpc.gnosischain.com/',
      ),
    );

    this.indexerLimiter = new Bottleneck({
      maxConcurrent: 20,
      minTime: 1,
    });

    // Use WebSocket provider by default, fallback to HTTP
    this.provider = this.httpProvider;
  }
  async parseAddLiquidityTransaction(txHash: string) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        return { error: 'Транзакция не найдена.' };
      }

      if (!tx.data || tx.data === '0x') {
        return { error: 'Нет входных данных.' };
      }

      // Создаём интерфейс контракта Uniswap V2 Router
      const uniswapInterface = new ethers.Interface(UNISWAP_ROUTER_ABI);

      // Распознаем, какую функцию вызвали
      const decodedData = uniswapInterface.parseTransaction({ data: tx.data });
      if (!decodedData) {
        return { error: 'Не удалось декодировать транзакцию.' };
      }
      const erc20Interface = new ethers.Interface([
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
      ]);
      // Достаем аргументы транзакции
      const { tokenA, tokenB } = decodedData.args;

      // Получаем информацию о токенах
      const tokenAContract = new ethers.Contract(
        tokenA,
        erc20Interface,
        this.provider,
      );
      const tokenBContract = new ethers.Contract(
        tokenB,
        erc20Interface,
        this.provider,
      );

      const [
        tokenASymbol,
        tokenBSymbol,
        tokenADecimals,
        tokenBDecimals,
        tokenAName,
        tokenBName,
      ] = await Promise.all([
        tokenAContract.symbol(),
        tokenBContract.symbol(),
        tokenAContract.decimals(),
        tokenBContract.decimals(),
        tokenAContract.name(),
        tokenBContract.name(),
      ]);

      // Формируем JSON-объект
      const result = {
        transactionHash: tx.hash,
        blockNumber: await tx.blockNumber,
        timestamp: new Date(
          Number(decodedData.args.deadline) * 1000,
        ).toISOString(),
        type: 'addLiquidity',
        status: 'pending', // можно получить из receipt
        from: tx.from,
        to: tx.to,
        gas: {
          limit: tx.gasLimit.toString(),
          price: ethers.formatUnits(tx.gasPrice, 'gwei'),
        },
        exchange: {
          protocol: 'UniswapV2',
          action: 'Add Liquidity',
          from: {
            token: {
              address: decodedData.args.tokenA,
              name: tokenAName,
              symbol: tokenASymbol,
            },
            amount: ethers.formatUnits(
              decodedData.args.amountADesired,
              tokenADecimals,
            ),
            minAmount: ethers.formatUnits(
              decodedData.args.amountAMin,
              tokenADecimals,
            ),
          },
          to: {
            token: {
              address: decodedData.args.tokenB,
              name: tokenBName,
              symbol: tokenBSymbol,
            },
            amount: ethers.formatUnits(
              decodedData.args.amountBDesired,
              tokenBDecimals,
            ),
            minAmount: ethers.formatUnits(
              decodedData.args.amountBMin,
              tokenBDecimals,
            ),
          },
          details: {
            recipient: decodedData.args.to,
            deadline: new Date(
              Number(decodedData.args.deadline) * 1000,
            ).toISOString(),
            router: tx.to, // адрес router контракта
          },
        },
      };

      return result;
    } catch (error) {
      return { error: 'Ошибка при разборе транзакции.', details: error };
    }
  }

  @Cron('* * 0 * * *', {
    name: 'realt-sync',
  })
  async sync(): Promise<void> {
    this.logger.log('🔍 Searching for REALTOKEN tokens on Gnosis Chain...');

    try {
      const logs = await this.provider.getLogs({
        fromBlock: 'earliest',
        toBlock: 'latest',
        topics: [
          '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
          ethers.zeroPadValue(CREATOR_ADDRESS, 32),
        ],
      });

      if (logs.length === 0) {
        this.logger.log('❌ No tokens found.');
        return;
      }

      this.logger.log(`✅ Found ${logs.length} logs.`);

      const uniqueAddresses = logs.reduce(
        (acc, log) => {
          acc[log.address] = log;
          return acc;
        },
        {} as Record<string, ethers.Log>,
      );
      this.logger.log(`✅ Found ${uniqueAddresses.length} unique addresses.`);

      await Promise.all(
        Object.entries(uniqueAddresses).map(([contractAddress, log]) => {
          //this.logger.debug(log.toJSON());
          return this.indexerLimiter.schedule(() =>
            this.updateToken(contractAddress),
          );
        }),
      );
    } catch (error) {
      this.logger.error('🚨 Error syncing tokens:', error);
      throw error;
    }
  }
  private async updateToken(contractAddress: string) {
    try {
      const tokenContract = new ethers.Contract(
        contractAddress,
        [
          'function priceOracle() external view returns (address)',
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)',
          'function totalSupply() view returns (uint256)',
          'function balanceOf(address) view returns (uint256)',
          'function owner() view returns (address)',
        ],
        this.provider,
      );

      const name = await tokenContract.name();
      const symbol = await tokenContract.symbol();

      if (symbol.startsWith('REALTOKEN')) {
        const decimals = await tokenContract.decimals();
        const totalSupply = await tokenContract.totalSupply();
        const owner = await tokenContract.owner();
        const priceOracle = await tokenContract.priceOracle();
        // Track unique holders
        const price = await this.getPrice(priceOracle);
        const token = await this.tokenService.findOrCreate({
          tokenId: contractAddress,
          network: 'gnosis',
          name: name.toString(),
          isGlobalToken: false,
          totalSupply: parseInt(ethers.formatUnits(totalSupply, decimals)),
          decimals: decimals,
          creator: owner,
          description: '',
        });
        this.logger.debug(
          `\n=== ${name} ===\n` +
            `Symbol: ${symbol}\n` +
            `Contract: ${contractAddress}\n` +
            `Price Oracle: ${priceOracle}\n` +
            `Decimals: ${decimals}\n` +
            `Price: ${price}\n` +
            `Total Supply: ${ethers.formatUnits(totalSupply, decimals)}\n` +
            `Owner: ${owner}\n`,
        );
        await this.updateTokenHolders(token, tokenContract, contractAddress);
      }
    } catch (error) {
      this.logger.debug(`Error syncing token ${contractAddress}:`, error);
    }
  }

  async getPrice(priceOracle: string) {
    try {
      const oracleContract = new ethers.Contract(
        priceOracle,
        [
          // Здесь функции из интерфейса IPriceOracle
          'function latestAnswer() view returns (uint256)',
          'function multiFactor() view returns (uint256)',
          // другие функции...
        ],
        this.provider,
      );

      const price = await oracleContract.latestAnswer();
      const decimals = await oracleContract.multiFactor();
      return parseInt(price) / parseInt(decimals);
    } catch {
      this.logger.error(`Error getting price for ${priceOracle}`);
      return 0;
    }
  }

  async updateTokenHolders(
    token: TokenModel,
    tokenContract: ethers.Contract,
    contractAddress: string,
  ): Promise<void> {
    try {
      const transferEvents = await this.provider.getLogs({
        fromBlock: 'earliest',
        toBlock: 'latest',
        address: contractAddress,
        topics: [ethers.id('Transfer(address,address,uint256)')],
      });

      // Собираем уникальные адреса
      const holders = new Set<string>();

      for (const event of transferEvents) {
        const from = ethers.dataSlice(event.topics[1], 12); // получаем адрес отправителя
        const to = ethers.dataSlice(event.topics[2], 12); // получаем адрес получателя

        if (from !== ethers.ZeroAddress) holders.add(from);
        if (to !== ethers.ZeroAddress) holders.add(to);
      }

      // Получаем decimals для форматирования
      const decimals = await tokenContract.decimals();

      this.logger.debug(`holders[${contractAddress}]: ${holders.size}`);

      // Параллельное обновление холдеров
      await Promise.all(
        Array.from(holders).map((holder) =>
          this.indexerLimiter.schedule(() =>
            this.updateHolder(tokenContract, holder, token, decimals),
          ),
        ),
      );
    } catch (error) {
      this.logger.error(`holders[${contractAddress}]`, error);
    }
  }

  private async updateHolder(
    tokenContract: ethers.Contract,
    holder: string,
    token: TokenModel,
    decimals: any,
  ) {
    try {
      const balance = await tokenContract.balanceOf(holder);
      if (balance != null) {
        try {
          await this.holderService.findOrCreate({
            tokenId: token.id,
            address: holder,
            balance: parseInt(ethers.formatUnits(balance, decimals)),
            deleted: false,
          });
          this.logger.debug(
            `holder[${holder}]: ${token.id} ${parseInt(ethers.formatUnits(balance, decimals))}`,
          );
        } catch (dbError) {
          this.logger.error(`holder[${holder}]: ${token.id}:`, dbError);
        }
      }
    } catch (contractError) {
      this.logger.error(`holder[${holder}]: ${token.id}:`, contractError);
    }
  }
}
