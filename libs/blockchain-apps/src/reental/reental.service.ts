import { TokenModel, TokenService } from '@app/database';
import { HolderService } from '@app/database';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Bottleneck from 'bottleneck';
import { ethers } from 'ethers';
import { ISyncService } from '../types';
import { Item, ReentalResponse } from './types';
//const CREATOR_ADDRESS = '0x74fF5b71C043645ceDe9cacA31a693F8CF819fB5';
const applicationId = 6;

@Injectable()
export class ReentalService implements ISyncService {
  private readonly logger = new Logger(ReentalService.name);
  private httpProvider: ethers.JsonRpcProvider;
  private provider: ethers.Provider;
  private indexerLimiter: Bottleneck;
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly holderService: HolderService,
  ) {
    this.httpProvider = new ethers.JsonRpcProvider(
      this.configService.get('POLYGON_HTTP_RPC_URL', 'https://polygon-rpc.com'),
    );

    // 30 reqs/sec
    this.indexerLimiter = new Bottleneck({
      maxConcurrent: 5, // Не больше 5 запросов одновременно
      minTime: 1000 / 30, // Минимальное время между запросами (~33ms)
      reservoir: 30, // Максимум 30 запросов в секунду
      reservoirRefreshAmount: 30,
      reservoirRefreshInterval: 1000, // Обновляет лимит раз в секунду
    });

    // Use WebSocket provider by default, fallback to HTTP
    this.provider = this.httpProvider;
  }
  async syncHolders(): Promise<void> {
    const tokens = await this.tokenService.listLastSyncedTokens(applicationId);
    this.logger.log(`Syncing ${tokens.length} tokens`);
    await Promise.all(tokens.map((token) => this.syncToken(token)));
    this.logger.log('Synced holders');
  }

  private async syncToken(token: TokenModel) {
    try {
      await this.updateTokenHolders(token);
      await this.tokenService.updateLastSyncedAt(token.id);
    } catch (error) {
      this.logger.error(`holders[${token.tokenAddress}]: ${error.message}`);
    }
  }

  async syncTokens(): Promise<void> {
    this.logger.log('🔍 Searching for REENTAL tokens on Polygon...');

    const tokenInfos = await this.getTokenInfos();
    this.logger.log(`Found ${tokenInfos.length} tokens`);
    try {
      const logs = (
        await this.provider.getLogs({
          fromBlock: 'earliest',
          toBlock: 'latest',
          topics: [
            '0xed93bcc1017e3f19794bfdf2fe5184a39a268e8a4540c3da97fb484ca9e842bc',
          ],
        })
      ).filter((log) => log.topics.length === 3);

      if (logs.length === 0) {
        this.logger.log('❌ No tokens found.');
        return;
      }

      this.logger.log(`✅ Found ${logs.length} logs.`);

      const uniqueAddresses = logs.reduce(
        (acc, log) => {
          acc['0x' + log.topics[log.topics.length - 1].slice(-40)] = log;
          return acc;
        },
        {} as Record<string, ethers.Log>,
      );
      this.logger.log(
        `✅ Found ${Object.keys(uniqueAddresses).length} unique addresses.`,
      );
      const tokensFromApi = tokenInfos.map((token) => token.token.address);
      const tokenFromEth = Object.keys(uniqueAddresses);
      const tokensToUpdate = tokensFromApi.filter(
        (token) => !tokenFromEth.includes(token),
      );
      for (const contractAddress of tokensToUpdate) {
        const tokenInfo = tokenInfos.find(
          (token) => token.token.address === contractAddress,
        );

        await this.updateToken(contractAddress, tokenInfo);
      }

      for (const [contractAddress] of Object.entries(uniqueAddresses)) {
        const tokenInfo = tokenInfos.find(
          (token) => token.token.address === contractAddress,
        );

        await this.updateToken(contractAddress, tokenInfo);
      }

      /*
      await Promise.all(
        tokensToUpdate.map((contractAddress) => {
          const tokenInfo = tokenInfos.find(
            (token) => token.token.address === contractAddress,
          );

          return this.updateToken(contractAddress, tokenInfo);
        }),
        
      );*/
    } catch (error) {
      this.logger.error(`🚨 Error syncing tokens: ${error.message}`);
      throw error;
    }
  }

  private async getTokenInfos() {
    try {
      const tokenInfo = await fetch('https://backend.reental.co/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query:
            '\n\t\t\t\tquery GETPROPERTIES_QUERY($input: GetPropertiesInput!) {\n    getPublicProperties(input: $input) {\n      __typename\n      ... on PropertyAssets {\n          items {\n            externalStatus\n            _id\n            name\n            slug\n            status\n            description_es\n            description_en\n            images {\n                id\n                name\n                type\n                size\n                keyS3\n                url\n            }\n            address\n            locality\n            administrative_area_level_2\n            administrative_area_level_1\n            country\n            geo {\n                lat\n                lng\n            }\n            tokenPrice {\n                value\n                currency\n            }\n            amount {\n                value\n                currency\n            }\n            minInvestmentTokens\n            netYearlyBenefit {\n                value\n                currency\n            }\n            emittedTokens\n            saleProfitability\n            apr\n            gains\n            netSale\n            aprNetSale\n            saleProfitability\n            starts_on\n            closingDate\n            dividends_starts_on\n            dividends\n            tokenName\n            investmentDuration {value, period}\n            typeOfSale\n            docs_es {\n                id\n                name\n                type\n                size\n                keyS3\n                url\n                title\n            }\n            docs_en {\n                id\n                name\n                type\n                size\n                keyS3\n                url\n                title\n            }\n            token {\n                id\n                hashId\n                whitelistId\n                address\n                name\n                symbol\n                totalSupply\n                maxSupply\n                reservedSupply\n                nWallets\n                price\n                wallets\n                status\n                sold\n            }\n            whitelist {\n                _id\n                name\n                hashId\n                tokens\n                wallets\n                isGlobal\n            }\n          }\n      metadata {\n              numElements\n              offset\n              limit\n              page\n              pages\n              orderBy\n              orderDirection\n          }\n      }\n      ... on Error {\n          code\n          message\n          description\n      }\n    }\n  }\n\t\t\t',
          variables: {
            input: {
              fields: [
                'name',
                'address',
                'country',
                'description_en',
                'description_es',
              ],
              search: '',
              orderBy: 'starts_on',
              orderDirection: 'DESC',
              limit: 2000,
              offset: 0,
              hidePrivate: false,
            },
          },
        }),
      });
      const tokenInfoJson: ReentalResponse = await tokenInfo.json();
      return tokenInfoJson.data.getPublicProperties.items;
    } catch (error) {
      this.logger.error('🚨 Error getting token infos:', error);
      return [];
    }
  }

  private async updateToken(
    contractAddress: string,
    tokenInfo: Item | undefined,
  ) {
    try {
      const tokenContract = this.getContract(contractAddress);

      const symbol = await tokenContract.symbol();

      if (symbol.startsWith('Reental')) {
        const name = await tokenContract.name();
        const decimals = await tokenContract.decimals();
        const totalSupply = await tokenContract.totalSupply();

        // Track unique holders
        if (!tokenInfo) {
          this.logger.debug(`Token info not found for ${contractAddress}`);
        }
        await this.tokenService.findOrCreate({
          tokenAddress: contractAddress,
          applicationId: applicationId,
          network: 'polygon',
          name: name.toString(),
          symbol: symbol.toString(),
          isGlobalToken: false,
          totalSupply: BigInt(
            parseInt(ethers.formatUnits(totalSupply, decimals)) || 0,
          ),
          decimals: decimals,
          description: '',
          tokenAdditionalInfo: tokenInfo
            ? JSON.stringify(tokenInfo)
            : undefined,
        });
        //await this.syncPrice(priceOracle, token);
        //await this.updateTokenHolders(token, tokenContract, contractAddress);
      } else {
        this.logger.debug(`Token ${contractAddress} is not a Reental token`);
      }
    } catch (error) {
      this.logger.error(
        `Error syncing token ${contractAddress}: ${error.message}`,
      );
    }
  }

  async updateTokenHolders(token: TokenModel): Promise<void> {
    const transferEvents = await this.indexerLimiter.schedule(
      () =>
        this.provider.getLogs({
          fromBlock: 'earliest',
          toBlock: 'latest',
          address: token.tokenAddress,
          topics: [ethers.id('Transfer(address,address,uint256)')],
        }),
      {
        priority: 2,
      },
    );
    if (transferEvents.length === 0) {
      this.logger.log(`No transfer events found for ${token.tokenAddress}`);
      return;
    }

    // Собираем уникальные адреса
    const holders = new Set<string>();

    for (const event of transferEvents) {
      const from = ethers.dataSlice(event.topics[1], 12); // получаем адрес отправителя
      const to = ethers.dataSlice(event.topics[2], 12); // получаем адрес получателя

      if (from !== ethers.ZeroAddress) holders.add(from);
      if (to !== ethers.ZeroAddress) holders.add(to);
    }

    // Получаем decimals для форматирования
    const tokenContract = this.getContract(token.tokenAddress);
    const decimals = await this.indexerLimiter.schedule(
      () => tokenContract.decimals(),
      {
        priority: 1,
      },
    );

    // Параллельное обновление холдеров
    await Promise.all(
      Array.from(holders).map((holder) =>
        this.updateHolder(tokenContract, holder, token, decimals),
      ),
    );
  }

  private getContract(contractAddress: string): ethers.Contract {
    return new ethers.Contract(
      contractAddress,
      [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address) view returns (uint256)',
      ],
      this.provider,
    );
  }

  private async updateHolder(
    tokenContract: ethers.Contract,
    holder: string,
    token: TokenModel,
    decimals: any,
  ) {
    const balance = await this.indexerLimiter.schedule(
      () => tokenContract.balanceOf(holder),
      {
        priority: 1,
      },
    );
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
  }
}
