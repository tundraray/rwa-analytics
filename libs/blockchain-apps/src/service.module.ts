import { Module } from '@nestjs/common';
import { RealtService } from './realt/realt.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { LoftyService } from './lofty.service';
import { BinaryxService } from './binaryx.service';
import { OceanpointService } from './oceanpoint';
@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [RealtService, LoftyService, BinaryxService, OceanpointService],
  exports: [RealtService, LoftyService, BinaryxService, OceanpointService],
})
export class ServiceModule {}
