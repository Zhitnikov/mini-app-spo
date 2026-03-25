import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api/health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth() {
    return this.appService.getHealth();
  }
}
