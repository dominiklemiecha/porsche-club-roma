import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Categoria } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventiService } from './eventi.service';
import { PartecipazioniService } from './partecipazioni.service';
import { ImportPartecipantiService } from './import-partecipanti.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { SetPartecipantiDto } from './dto/partecipanti.dto';

@UseGuards(JwtAuthGuard)
@Controller('eventi')
export class EventiController {
  constructor(
    private svc: EventiService,
    private parts: PartecipazioniService,
    private importSvc: ImportPartecipantiService,
  ) {}
  @Get()       list(@Query('categoria') c?: Categoria) { return this.svc.list(c); }
  @Get(':id')  get(@Param('id', ParseIntPipe) id: number) { return this.svc.get(id); }
  @Post()      create(@Body() dto: CreateEventoDto) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventoDto) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
  @Put(':id/partecipazioni')
  setPart(@Param('id', ParseIntPipe) id: number, @Body() dto: SetPartecipantiDto) {
    return this.parts.setForEvento(id, dto);
  }
  @Post(':id/partecipazioni/import-xlsx')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  importXlsx(@Param('id', ParseIntPipe) id: number, @UploadedFile() file?: { buffer: Buffer }) {
    if (!file?.buffer) throw new BadRequestException('Nessun file caricato');
    return this.importSvc.preview(id, file.buffer);
  }
}
