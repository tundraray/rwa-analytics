import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { BlockchainAppsModule } from '@app/blockchain-apps';

@Module({
  imports: [BlockchainAppsModule],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
