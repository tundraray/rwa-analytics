import { Module } from '@nestjs/common';
import { RealtService } from './realt.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [RealtService],
  exports: [RealtService],
})
export class RealtModule {}
