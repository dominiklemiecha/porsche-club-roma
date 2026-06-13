import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { SociModule } from './soci/soci.module';
import { EventiModule } from './eventi/eventi.module';
import { AnniModule } from './anni/anni.module';
import { ClassificaModule } from './classifica/classifica.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PdfModule } from './pdf/pdf.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    AuthModule,
    SociModule,
    EventiModule,
    AnniModule,
    ClassificaModule,
    DashboardModule,
    PdfModule,
    SeedModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
