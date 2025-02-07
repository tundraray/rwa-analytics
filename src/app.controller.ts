import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { OceanpointService } from '@app/blockchain-apps/oceanpoint';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly oceanpointService: OceanpointService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('oceanpoint')
  getOceanpoint(): Promise<void> {
    return this.oceanpointService.syncHolders();
  }
}
