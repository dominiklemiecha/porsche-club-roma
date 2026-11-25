import { Module } from '@nestjs/common';
import { ClassificaController } from './classifica.controller';
import { ClassificaService } from './classifica.service';
import { ClassificaXlsxService } from './classifica-xlsx.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ClassificaController],
  providers: [ClassificaService, ClassificaXlsxService, PrismaService],
  exports: [ClassificaService],
})
export class ClassificaModule {}
