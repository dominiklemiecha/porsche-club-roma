import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnniService } from './anni.service';
import { CreateAnnoDto } from './dto/create-anno.dto';

@UseGuards(JwtAuthGuard)
@Controller('anni')
export class AnniController {
  constructor(private svc: AnniService) {}
  @Get() list() { return this.svc.list(); }
  @Post() create(@Body() dto: CreateAnnoDto) { return this.svc.create(dto.anno); }
  @Patch(':anno/attiva') attiva(@Param('anno', ParseIntPipe) anno: number) { return this.svc.attiva(anno); }
}
