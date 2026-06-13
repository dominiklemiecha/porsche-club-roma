import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private svc: DashboardService) {}
  @Get() get(@Query('anno') anno?: string) {
    return this.svc.get(anno ? Number(anno) : undefined);
  }
}
