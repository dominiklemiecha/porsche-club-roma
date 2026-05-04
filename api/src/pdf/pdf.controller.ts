import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Categoria } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PdfClassificaService } from './pdf-classifica.service';
import { PdfEventoService } from './pdf-evento.service';

@UseGuards(JwtAuthGuard)
@Controller('pdf')
export class PdfController {
  constructor(private cls: PdfClassificaService, private ev: PdfEventoService) {}
  @Get('classifica') classifica(@Query('categoria') c: Categoria, @Res() res: Response) {
    return this.cls.stream(c, res);
  }
  @Get('evento/:id') evento(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    return this.ev.stream(id, res);
  }
}
