import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PdfClassificaService } from './pdf-classifica.service';
import { Scope } from '../classifica/classifica.service';
import { PdfEventoService } from './pdf-evento.service';

function parseDate(s?: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}
function parseIds(s?: string): number[] | undefined {
  if (!s) return undefined;
  const ids = s.split(',').map(x => Number(x.trim())).filter(n => Number.isFinite(n) && n > 0);
  return ids.length ? ids : undefined;
}

@UseGuards(JwtAuthGuard)
@Controller('pdf')
export class PdfController {
  constructor(private cls: PdfClassificaService, private ev: PdfEventoService) {}
  @Get('classifica') classifica(
    @Query('categoria') c: Scope,
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('eventi') eventi?: string,
  ) {
    return this.cls.stream(c, res, parseDate(from), parseDate(to), parseIds(eventi));
  }
  @Get('evento/:id') evento(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    return this.ev.stream(id, res);
  }
}
