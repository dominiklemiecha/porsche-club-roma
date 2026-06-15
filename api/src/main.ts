import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './uploads.config';

async function bootstrap() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/api/uploads' });
  await app.listen(3001);
}
bootstrap();
