import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClassificaModule } from '../classifica/classifica.module';
import { AnniModule } from '../anni/anni.module';

@Module({
  imports: [ClassificaModule, AnniModule],
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService],
})
export class DashboardModule {}
