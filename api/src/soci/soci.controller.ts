import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SociService } from './soci.service';
import { CreateSocioDto } from './dto/create-socio.dto';
import { UpdateSocioDto } from './dto/update-socio.dto';

@UseGuards(JwtAuthGuard)
@Controller('soci')
export class SociController {
  constructor(private svc: SociService) {}
  @Get()    list(@Query('q') q?: string) { return this.svc.list(q); }
  @Post()   create(@Body() dto: CreateSocioDto) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSocioDto) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
