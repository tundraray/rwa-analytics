import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { LoftyService } from '@app/lofty';
import { RealtService } from '@app/realt';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly loftyService: LoftyService,
    private readonly realtService: RealtService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('lofty')
  getLofty() {
    // return this.loftyService.getTransaction();
    return this.loftyService.updateLofty();
  }

  @Get('realtoken')
  getRealToken() {
    return this.realtService.sync();
  }
}
