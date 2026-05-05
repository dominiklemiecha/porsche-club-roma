import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Categoria } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassificaService } from './classifica.service';

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
  constructor(private svc: ClassificaService) {}
  @Get() get(
    @Query('categoria') c: Categoria,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('eventi') eventi?: string,
  ) {
    return this.svc.build(c, parseDate(from), parseDate(to), parseIds(eventi));
  }
}
