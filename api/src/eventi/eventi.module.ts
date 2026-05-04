import { Module } from '@nestjs/common';
import { EventiController } from './eventi.controller';
import { EventiService } from './eventi.service';
import { PartecipazioniService } from './partecipazioni.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [EventiController],
  providers: [EventiService, PartecipazioniService, PrismaService],
})
export class EventiModule {}
