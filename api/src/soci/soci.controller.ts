import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SociService } from './soci.service';
import { ImportSociService } from './import-soci.service';
import { CreateSocioDto } from './dto/create-socio.dto';
import { UpdateSocioDto } from './dto/update-socio.dto';
import { ConfermaImportSociDto } from './dto/import-soci.dto';

@UseGuards(JwtAuthGuard)
@Controller('soci')
export class SociController {
  constructor(private svc: SociService, private importSvc: ImportSociService) {}
  @Get()    list(@Query('q') q?: string) { return this.svc.list(q); }
  @Post()   create(@Body() dto: CreateSocioDto) { return this.svc.create(dto); }

  /** Anteprima import elenco soci: nessuna scrittura. */
  @Post('import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  importAnteprima(@UploadedFile() file?: { buffer: Buffer }) {
    if (!file) throw new BadRequestException('Nessun file caricato');
    return this.importSvc.preview(file.buffer);
  }

  @Post('import/conferma')
  importConferma(@Body() dto: ConfermaImportSociDto) { return this.importSvc.conferma(dto); }

  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSocioDto) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
