import { Module } from '@nestjs/common';
import { EventiController } from './eventi.controller';
import { EventiService } from './eventi.service';
import { PartecipazioniService } from './partecipazioni.service';
import { ImportPartecipantiService } from './import-partecipanti.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnniModule } from '../anni/anni.module';

@Module({
  imports: [AnniModule],
  controllers: [EventiController],
  providers: [EventiService, PartecipazioniService, ImportPartecipantiService, PrismaService],
})
export class EventiModule {}
