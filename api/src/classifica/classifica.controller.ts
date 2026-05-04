import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Categoria } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassificaService } from './classifica.service';

@UseGuards(JwtAuthGuard)
@Controller('classifica')
export class ClassificaController {
  constructor(private svc: ClassificaService) {}
  @Get() get(@Query('categoria') c: Categoria) { return this.svc.build(c); }
}
