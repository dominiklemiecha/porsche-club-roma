import { Module } from '@nestjs/common';
import { SociController } from './soci.controller';
import { SociService } from './soci.service';
import { ImportSociService } from './import-soci.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SociController],
  providers: [SociService, ImportSociService, PrismaService],
})
export class SociModule {}
