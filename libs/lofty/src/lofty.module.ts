import { Module } from '@nestjs/common';
import { LoftyService } from './lofty.service';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [DatabaseModule],
  providers: [LoftyService],
  exports: [LoftyService],
})
export class LoftyModule {}
