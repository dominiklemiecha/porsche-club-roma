import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassificaService, Scope } from './classifica.service';
import { ClassificaXlsxService } from './classifica-xlsx.service';

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
@Controller('classifica')
export class ClassificaController {
  constructor(private svc: ClassificaService, private xlsx: ClassificaXlsxService) {}
  @Get() get(
    @Query('categoria') c: Scope,
    @Query('anno') anno?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('eventi') eventi?: string,
  ) {
    return this.svc.build(c, anno ? Number(anno) : undefined, parseDate(from), parseDate(to), parseIds(eventi));
  }

  /** Export Excel con gli stessi filtri della classifica a video. */
  @Get('xlsx') async excel(
    @Res() res: Response,
    @Query('categoria') c: Scope,
    @Query('anno') anno?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('eventi') eventi?: string,
  ) {
    const buf = await this.xlsx.build(c, anno ? Number(anno) : undefined, parseDate(from), parseDate(to), parseIds(eventi));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=classifica-${c}${anno ? `-${anno}` : ''}.xlsx`);
    res.send(buf);
  }
}
