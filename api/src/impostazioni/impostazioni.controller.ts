import { BadRequestException, Controller, Get, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImpostazioniService } from './impostazioni.service';
import { UPLOADS_DIR } from '../uploads.config';

@UseGuards(JwtAuthGuard)
@Controller('impostazioni')
export class ImpostazioniController {
  constructor(private svc: ImpostazioniService) {}

  @Get() get() { return this.svc.get(); }

  @Post('hero')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: UPLOADS_DIR,
      filename: (_req, file, cb) => cb(null, `hero-${randomUUID()}${extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => cb(null, /^image\/(jpe?g|png|webp)$/.test(file.mimetype)),
  }))
  uploadHero(@UploadedFile() file?: { filename: string }) {
    if (!file?.filename) throw new BadRequestException('Immagine non valida (JPG, PNG o WEBP, max 8MB)');
    return this.svc.setHero(`/uploads/${file.filename}`);
  }
}
