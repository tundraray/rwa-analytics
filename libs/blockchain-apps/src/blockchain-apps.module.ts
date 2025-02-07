import { Module } from '@nestjs/common';
import { ServiceModule } from './service.module';
import { RealtService } from './realt/realt.service';
import { LoftyService } from './lofty.service';
import { BinaryxService } from './binaryx.service';
import { OceanpointService } from './oceanpoint';
export const BlockchainAppsServices = Symbol('BlockchainAppsServices');
@Module({
  imports: [ServiceModule],
  providers: [
    {
      provide: BlockchainAppsServices,
      useFactory: (
        realtService: RealtService,
        loftyService: LoftyService,
        binaryxService: BinaryxService,
        oceanpointService: OceanpointService,
      ) => {
        return [realtService, loftyService, binaryxService, oceanpointService];
      },
      inject: [RealtService, LoftyService, BinaryxService, OceanpointService],
    },
  ],
  exports: [BlockchainAppsServices],
})
export class BlockchainAppsModule {}
