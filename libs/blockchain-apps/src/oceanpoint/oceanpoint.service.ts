import { TokenModel, TokenService } from '@app/database';
import { HolderService } from '@app/database';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Bottleneck from 'bottleneck';
import { ethers } from 'ethers';
import { ISyncService } from '../types';
import { OceanpointTokenModel } from './types';
// const CREATOR_ADDRESS = '0x6e074b3aA4B1fDDDa2b0FCb6B4c4C70875B548B3';
const applicationId = 4;

@Injectable()
export class OceanpointService implements ISyncService {
  private readonly logger = new Logger(OceanpointService.name);
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
        'ETHEREUM_HTTP_RPC_URL',
        'https://rpc.ankr.com/eth',
      ),
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
    this.logger.log('🔍 Searching for OCEANPOINT tokens on Ethereum...');

    const tokenInfos = await this.getTokenInfos();
    try {
      const logs = await this.indexerLimiter.schedule(
        () =>
          this.provider.getLogs({
            fromBlock: 'earliest',
            toBlock: 'latest',
            topics: [
              '0x2c28e98235d90a5a66515fabbc6913ccdd057477d7d54a1e276f03cd3ed1921e',
            ],
          }),
        {
          priority: 2,
        },
      );

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

      await Promise.all(
        Object.entries(uniqueAddresses).map(([contractAddress]) => {
          const tokenInfo = tokenInfos.find(
            (token) => token.token.address === contractAddress,
          );

          return this.updateToken(contractAddress, tokenInfo);
        }),
      );

      await Promise.all(
        tokensToUpdate.map((contractAddress) => {
          const tokenInfo = tokenInfos.find(
            (token) => token.token.address === contractAddress,
          );

          return this.updateToken(contractAddress, tokenInfo);
        }),
      );
    } catch (error) {
      this.logger.error('🚨 Error syncing tokens:', error);
      throw error;
    }
  }

  private async getTokenInfos() {
    try {
      const tokenInfo = await fetch(
        'https://app.blocksquare.io/api/property?type=MARKETPLACE',
        {
          headers: {
            Authorization:
              'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2Jsb2Nrc3F1YXJlLmlvIiwiZXhwIjoxNzM5MTM4NTYyLCJ1cG4iOiJhbGwtaGltaWtAeWEucnUiLCJhdXRoX3RpbWUiOjE3Mzg5NjU3NjIsImdyb3VwcyI6WyJST0xFX1VTRVIiXSwiY29tcGFueSI6Im9jZWFucG9pbnQiLCJpYXQiOjE3Mzg5NjU3NjIsImp0aSI6IjlkZGYxZDg1LTM4OTEtNGE3MC04MDg5LWMyZTM3OTdiMzBkMCJ9.vmoRzc-0ypoRqupxvqmGdTPAESbmL9oL6nKiCFQlscrVVch-RYUZ6-i7PzD-Wx4TBXpbphMqTZQOnt8uMKKQY7DVQLlW-cy5D32qbDFnlqMhNhpLT-G9lAmhQsRMtlgNuQvR6xTr2LdQcyHTb3-GUenNx4VwjSRe5JXHnQ58y7FzZZ7WAZIYe4ZQIYmqelD9L6uDP6S7L20RmANURvbJV5xXyVwKmPQVFXLSa4Ij8SiPqyHqZQmZjlKP_1P9mVXzrtTexVYFyq3IaKx7rcY-xe9uixa7Fu_rQYP91Q1m-ZFTjMcbKGmO3C0tNQAIqVtSgeRSm20PNFwVzWHUxr634g',
          },
        },
      );
      const tokenInfoJson: OceanpointTokenModel[] = await tokenInfo.json();
      return tokenInfoJson;
    } catch (error) {
      this.logger.error('🚨 Error getting token infos:', error);
      return [];
    }
  }

  private async updateToken(
    contractAddress: string,
    tokenInfo: OceanpointTokenModel | undefined,
  ) {
    try {
      const tokenContract = this.getContract(contractAddress);

      const symbol = await tokenContract.symbol();

      if (symbol.startsWith('BSPT')) {
        const name = await this.indexerLimiter.schedule(
          () => tokenContract.name(),
          {
            priority: 1,
          },
        );
        const decimals = await this.indexerLimiter.schedule(
          () => tokenContract.decimals(),
          {
            priority: 1,
          },
        );
        const totalSupply = await this.indexerLimiter.schedule(
          () => tokenContract.totalSupply(),
          {
            priority: 1,
          },
        );
        const owner = await this.indexerLimiter.schedule(
          () => tokenContract.owner(),
          {
            priority: 1,
          },
        );
        // Track unique holders
        if (!tokenInfo) {
          this.logger.debug(`Token info not found for ${contractAddress}`);
        }
        await this.tokenService.findOrCreate({
          tokenAddress: contractAddress,
          applicationId: applicationId,
          network: 'ethereum',
          name: name.toString(),
          symbol: symbol.toString(),
          isGlobalToken: false,
          totalSupply: BigInt(
            parseInt(ethers.formatUnits(totalSupply, decimals)) || 0,
          ),
          decimals: decimals,
          creator: owner,
          description: '',
          tokenAdditionalInfo: tokenInfo
            ? JSON.stringify(tokenInfo)
            : undefined,
        });
        //await this.syncPrice(priceOracle, token);
        //await this.updateTokenHolders(token, tokenContract, contractAddress);
      }
    } catch (error) {
      this.logger.error(`Error syncing token ${contractAddress}:`, error);
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
    for (const holder of holders) {
      await this.updateHolder(tokenContract, holder, token, decimals);
    }
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
        'function owner() view returns (address)',
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
