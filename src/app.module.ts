import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncModule } from '@app/sync';
import { ServiceModule } from '@app/blockchain-apps/service.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local', '.env.development'],
      isGlobal: true,
    }),
    DatabaseModule,
    ServiceModule,
    ScheduleModule.forRoot(),
    SyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
