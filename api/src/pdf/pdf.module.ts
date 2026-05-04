import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfClassificaService } from './pdf-classifica.service';
import { PdfEventoService } from './pdf-evento.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClassificaModule } from '../classifica/classifica.module';

@Module({
  imports: [ClassificaModule],
  controllers: [PdfController],
  providers: [PdfClassificaService, PdfEventoService, PrismaService],
})
export class PdfModule {}
