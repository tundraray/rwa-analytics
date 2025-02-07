import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { ISyncService } from './types';
@Injectable()
export class BinaryxService implements ISyncService {
  private readonly logger = new Logger(BinaryxService.name);
  private provider: ethers.JsonRpcProvider;

  constructor(private readonly configService: ConfigService) {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get('BINARYX_RPC_URL'),
    );
  }
  syncHolders(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  syncTokens(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
