import { Inject, Injectable, Logger } from '@nestjs/common';
import { BlockchainAppsServices, ISyncService } from '@app/blockchain-apps';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  constructor(
    @Inject(BlockchainAppsServices)
    private readonly services: ISyncService[],
  ) {}

  // Run every 1 minute
  @Cron(CronExpression.EVERY_9_HOURS, {
    name: 'sync-blockchain-apps',
    waitForCompletion: true,
  })
  async sync() {
    this.logger.log('Syncing blockchain apps');
    await Promise.all(
      this.services.map((service) => this.syncService(service)),
    ).finally(() => {
      this.logger.log('Synced blockchain apps');
    });
  }

  // Run every 1 minute
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'sync-blockchain-holders',
    waitForCompletion: true,
  })
  async syncBlockchainHolders() {
    this.logger.log('Syncing blockchain holders');
    await Promise.all(
      this.services.map((service) => this.syncHolders(service)),
    ).finally(() => {
      this.logger.log('Synced blockchain holders');
    });
  }

  private async syncService(service: ISyncService) {
    try {
      this.logger.log(` ${service.constructor.name}[tokens]: starting`);
      await service.syncTokens();
    } catch (err) {
      this.logger.error(
        `Error syncing ${service.constructor.name}: ${err.message}`,
      );
    } finally {
      this.logger.log(`${service.constructor.name}[tokens]: finished`);
    }
  }

  private async syncHolders(service: ISyncService) {
    try {
      this.logger.log(`${service.constructor.name}[holders]: starting`);
      await service.syncHolders();
    } catch (err) {
      this.logger.error(`${service.constructor.name}[holders]: ${err.message}`);
    } finally {
      this.logger.log(`${service.constructor.name}[holders]: finished`);
    }
  }
}
