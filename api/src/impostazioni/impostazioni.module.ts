import { Module } from '@nestjs/common';
import { ImpostazioniController } from './impostazioni.controller';
import { ImpostazioniService } from './impostazioni.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ImpostazioniController],
  providers: [ImpostazioniService, PrismaService],
})
export class ImpostazioniModule {}
