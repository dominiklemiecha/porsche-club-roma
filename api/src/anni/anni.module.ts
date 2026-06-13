import { Module } from '@nestjs/common';
import { AnniController } from './anni.controller';
import { AnniService } from './anni.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AnniController],
  providers: [AnniService, PrismaService],
  exports: [AnniService],
})
export class AnniModule {}
