import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Categoria } from '@prisma/client';
import { UPLOADS_DIR } from '../uploads.config';
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
  @Get() list(@Query('anno') anno?: string, @Query('categoria') c?: Categoria) {
    return this.svc.list(anno ? Number(anno) : undefined, c);
  }
  @Get(':id')  get(@Param('id', ParseIntPipe) id: number) { return this.svc.get(id); }
  @Post()      create(@Body() dto: CreateEventoDto) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventoDto) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
  @Put(':id/partecipazioni')
  setPart(@Param('id', ParseIntPipe) id: number, @Body() dto: SetPartecipantiDto) {
    return this.parts.setForEvento(id, dto);
  }
  @Post(':id/immagine')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: UPLOADS_DIR,
      filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => cb(null, /^image\/(jpe?g|png|webp)$/.test(file.mimetype)),
  }))
  uploadImmagine(@Param('id', ParseIntPipe) id: number, @UploadedFile() file?: { filename: string }) {
    if (!file?.filename) throw new BadRequestException('Immagine non valida (usa JPG, PNG o WEBP, max 5MB)');
    return this.svc.setImmagine(id, `/uploads/${file.filename}`);
  }

  @Post(':id/partecipazioni/import-xlsx')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  importXlsx(@Param('id', ParseIntPipe) id: number, @UploadedFile() file?: { buffer: Buffer }) {
    if (!file?.buffer) throw new BadRequestException('Nessun file caricato');
    return this.importSvc.preview(id, file.buffer);
  }
}
