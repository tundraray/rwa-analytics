import { TokenService } from '@app/database';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Bottleneck from 'bottleneck';
import { ethers } from 'ethers';
import { ISyncService } from './types';
const CREATOR_ADDRESS = '0x0635e2FB7C74f59fFe9dA28654Bc50Dfa468d600';
const applicationId = 5;

@Injectable()
export class EquitoService implements ISyncService {
  private readonly logger = new Logger(EquitoService.name);
  private httpProvider: ethers.JsonRpcProvider;
  private provider: ethers.Provider;
  private indexerLimiter: Bottleneck;
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
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
    return Promise.resolve();
  }

  async syncTokens(): Promise<void> {
    this.logger.log('🔍 Searching for EQUITO tokens on POLYGON...');

    try {
      const logs = await this.indexerLimiter.schedule(
        () =>
          this.provider.getLogs({
            fromBlock: 'earliest',
            toBlock: 'latest',
            topics: [
              '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0',
              '0x0000000000000000000000000000000000000000000000000000000000000000',
              ethers.zeroPadValue(CREATOR_ADDRESS, 32),
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
          acc[log.address] = log;
          return acc;
        },
        {} as Record<string, ethers.Log>,
      );
      this.logger.log(
        `✅ Found ${Object.keys(uniqueAddresses).length} unique addresses.`,
      );

      let i = 1;
      for (const [contractAddress] of Object.entries(uniqueAddresses)) {
        await this.updateToken(contractAddress, i++);
      }
    } catch (error) {
      this.logger.error('🚨 Error syncing tokens:', error);
      throw error;
    }
  }

  private async updateToken(contractAddress: string, idx: number) {
    try {
      const tokenContract = this.getContract(contractAddress);

      const symbol = await this.indexerLimiter.schedule(
        () => tokenContract.symbol(),
        {
          priority: 2 * idx,
        },
      );

      if (symbol.startsWith('EQT')) {
        const name = await this.indexerLimiter.schedule(
          () => tokenContract.name(),
          {
            priority: 1 * idx,
          },
        );
        const decimals = await this.indexerLimiter.schedule(
          () => tokenContract.decimals(),
          {
            priority: 1 * idx,
          },
        );
        const totalSupply = await this.indexerLimiter.schedule(
          () => tokenContract.totalSupply(),
          {
            priority: 1 * idx,
          },
        );
        const owner = await this.indexerLimiter.schedule(
          () => tokenContract.owner(),
          {
            priority: 1 * idx,
          },
        );

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
          creator: owner,
          description: '',
        });
        //await this.syncPrice(priceOracle, token);
        //await this.updateTokenHolders(token, tokenContract, contractAddress);
      }
    } catch (error) {
      this.logger.error(
        `Error syncing token ${contractAddress}: ${error.message}`,
      );
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
}
