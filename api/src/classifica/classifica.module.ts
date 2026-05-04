import { Module } from '@nestjs/common';
import { ClassificaController } from './classifica.controller';
import { ClassificaService } from './classifica.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ClassificaController],
  providers: [ClassificaService, PrismaService],
  exports: [ClassificaService],
})
export class ClassificaModule {}
