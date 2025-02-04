import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoftyModule } from '@app/lofty';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { RealtModule } from '@app/realt';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local', '.env.development'],
      isGlobal: true,
    }),
    DatabaseModule,
    LoftyModule,
    RealtModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
