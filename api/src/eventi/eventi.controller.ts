import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Categoria } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventiService } from './eventi.service';
import { PartecipazioniService } from './partecipazioni.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { SetPartecipantiDto } from './dto/partecipanti.dto';

@UseGuards(JwtAuthGuard)
@Controller('eventi')
export class EventiController {
  constructor(private svc: EventiService, private parts: PartecipazioniService) {}
  @Get()       list(@Query('categoria') c?: Categoria) { return this.svc.list(c); }
  @Get(':id')  get(@Param('id', ParseIntPipe) id: number) { return this.svc.get(id); }
  @Post()      create(@Body() dto: CreateEventoDto) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventoDto) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
  @Put(':id/partecipazioni')
  setPart(@Param('id', ParseIntPipe) id: number, @Body() dto: SetPartecipantiDto) {
    return this.parts.setForEvento(id, dto);
  }
}
