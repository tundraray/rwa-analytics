import { Module } from '@nestjs/common';
import { ServiceModule } from './service.module';
import { RealtService } from './realt/realt.service';
import { LoftyService } from './lofty.service';
import { BinaryxService } from './binaryx.service';
import { OceanpointService } from './oceanpoint';
import { EquitoService } from './equito.service';
import { ReentalService } from './reental';
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
        equitoService: EquitoService,
        reentalService: ReentalService,
      ) => {
        return [
          realtService,
          loftyService,
          binaryxService,
          oceanpointService,
          equitoService,
          reentalService,
        ];
      },
      inject: [
        RealtService,
        LoftyService,
        BinaryxService,
        OceanpointService,
        EquitoService,
        ReentalService,
      ],
    },
  ],
  exports: [BlockchainAppsServices],
})
export class BlockchainAppsModule {}
