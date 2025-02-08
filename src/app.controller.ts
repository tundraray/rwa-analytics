import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RealtService } from '@app/blockchain-apps';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly realtService: RealtService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('oceanpoint')
  getOceanpoint(): Promise<void> {
    return this.realtService.syncTokens();
  }
}
