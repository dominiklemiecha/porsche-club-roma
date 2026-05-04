import { Module } from '@nestjs/common';
import { SociController } from './soci.controller';
import { SociService } from './soci.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SociController],
  providers: [SociService, PrismaService],
})
export class SociModule {}
