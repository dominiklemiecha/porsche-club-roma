# CRM Porsche Club Roma — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 3-page CRM (soci, eventi, classifica) for Porsche Club Roma, dockerized with PostgreSQL + NestJS + Next.js, with PDF export.

**Architecture:** Monorepo with `api/` (NestJS + Prisma), `web/` (Next.js App Router), `db/` (Postgres). Three docker-compose services. Single-admin JWT cookie auth. PDF via `pdfkit` lato API. Soci seeded from existing Excel.

**Tech Stack:** Docker Compose, PostgreSQL 16, NestJS 10, Prisma 5, Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, pdfkit, exceljs, bcrypt, JWT.

---

## File Structure

```
porsche/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── api/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── prisma/prisma.service.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-auth.guard.ts
│   │   ├── soci/
│   │   │   ├── soci.module.ts
│   │   │   ├── soci.controller.ts
│   │   │   ├── soci.service.ts
│   │   │   └── dto/
│   │   ├── eventi/
│   │   │   ├── eventi.module.ts
│   │   │   ├── eventi.controller.ts
│   │   │   ├── eventi.service.ts
│   │   │   ├── partecipazioni.service.ts
│   │   │   ├── score.util.ts
│   │   │   └── dto/
│   │   ├── classifica/
│   │   │   ├── classifica.module.ts
│   │   │   ├── classifica.controller.ts
│   │   │   └── classifica.service.ts
│   │   ├── pdf/
│   │   │   ├── pdf.module.ts
│   │   │   ├── pdf.controller.ts
│   │   │   ├── pdf-classifica.service.ts
│   │   │   └── pdf-evento.service.ts
│   │   └── seed/
│   │       ├── seed.module.ts
│   │       └── seed.service.ts
│   ├── test/
│   │   ├── score.util.spec.ts
│   │   ├── auth.e2e-spec.ts
│   │   ├── soci.e2e-spec.ts
│   │   ├── eventi.e2e-spec.ts
│   │   └── classifica.e2e-spec.ts
│   └── assets/porsche-logo.png
├── web/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── components.json
│   ├── public/porsche-logo.svg
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── (auth)/login/page.tsx
│   │   ├── (app)/layout.tsx
│   │   ├── (app)/soci/page.tsx
│   │   ├── (app)/eventi/page.tsx
│   │   ├── (app)/eventi/[id]/page.tsx
│   │   └── (app)/classifica/page.tsx
│   ├── components/
│   │   ├── sidebar.tsx
│   │   ├── soci-table.tsx
│   │   ├── socio-form-dialog.tsx
│   │   ├── eventi-table.tsx
│   │   ├── evento-form-dialog.tsx
│   │   ├── partecipazioni-dialog.tsx
│   │   ├── classifica-table.tsx
│   │   └── ui/ (shadcn)
│   └── lib/
│       ├── api.ts
│       └── types.ts
└── data/pg/  (gitignored)
```

---

## Task 1: Repo bootstrap, git, .gitignore, README skeleton

**Files:**
- Create: `.gitignore`, `README.md`, `.env.example`

- [ ] **Step 1: Init git repository**

Run:
```bash
git init
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.next/
dist/
data/
*.log
.env
.env.local
api/.env
web/.env.local
.DS_Store
```

- [ ] **Step 3: Create `.env.example`**

```
# Database
POSTGRES_USER=porsche
POSTGRES_PASSWORD=changeme
POSTGRES_DB=porsche

# API
DATABASE_URL=postgresql://porsche:changeme@db:5432/porsche
JWT_SECRET=change-this-to-a-long-random-string
ADMIN_USER=admin
ADMIN_PASS=admin123
CORS_ORIGIN=http://localhost:3000

# Web
NEXT_PUBLIC_API_URL=http://localhost:3001
```

- [ ] **Step 4: Create minimal `README.md`**

```markdown
# CRM Porsche Club Roma

Gestionale soci/eventi/classifica per Porsche Club Roma.

## Avvio
1. `cp .env.example .env` e modifica i valori
2. `docker compose up -d --build`
3. Apri http://localhost:3000 e accedi con le credenziali admin

## Stack
PostgreSQL 16 · NestJS · Next.js 15 · Prisma · Docker
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore README.md .env.example
git commit -m "chore: repo bootstrap"
```

---

## Task 2: NestJS scaffold + Prisma + base modules

**Files:**
- Create: `api/package.json`, `api/tsconfig.json`, `api/nest-cli.json`, `api/src/main.ts`, `api/src/app.module.ts`, `api/src/prisma/prisma.service.ts`, `api/Dockerfile`

- [ ] **Step 1: Create `api/package.json`**

```json
{
  "name": "porsche-api",
  "version": "0.0.1",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "prisma:generate": "prisma generate",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:migrate:dev": "prisma migrate dev",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/throttler": "^5.1.0",
    "@prisma/client": "^5.10.0",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "cookie-parser": "^1.4.6",
    "exceljs": "^4.4.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "pdfkit": "^0.14.0",
    "reflect-metadata": "^0.2.1",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/schematics": "^10.1.0",
    "@nestjs/testing": "^10.3.0",
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.7",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.11.0",
    "@types/passport-jwt": "^4.0.1",
    "@types/pdfkit": "^0.13.4",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "prisma": "^5.10.0",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.2",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.3.3"
  },
  "jest": {
    "moduleFileExtensions": ["js","json","ts"],
    "rootDir": ".",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Create `api/tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": false,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

- [ ] **Step 3: Create `api/nest-cli.json`**

```json
{ "collection": "@nestjs/schematics", "sourceRoot": "src" }
```

- [ ] **Step 4: Create `api/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');
  await app.listen(3001);
}
bootstrap();
```

- [ ] **Step 5: Create `api/src/prisma/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

- [ ] **Step 6: Create `api/src/app.module.ts` (placeholder, modules added in later tasks)**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
```

- [ ] **Step 7: Create `api/Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["sh","-c","npx prisma migrate deploy && node dist/main"]
```

- [ ] **Step 8: Verify build locally (optional, otherwise verified by docker compose)**

Run:
```bash
cd api && npm install && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add api/
git commit -m "feat(api): NestJS scaffold + Prisma service"
```

---

## Task 3: Prisma schema + initial migration

**Files:**
- Create: `api/prisma/schema.prisma`

- [ ] **Step 1: Write `api/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Categoria {
  turismo
  pista
}

model Socio {
  id              Int             @id @default(autoincrement())
  numero_tessera  Int             @unique
  nome            String          @db.VarChar(100)
  cognome         String          @db.VarChar(100)
  created_at      DateTime        @default(now())
  partecipazioni  Partecipazione[]

  @@map("soci")
}

model Evento {
  id              Int             @id @default(autoincrement())
  titolo          String          @db.VarChar(200)
  data_evento     DateTime        @db.Date
  categoria       Categoria
  punteggio_base  Int
  prova_abilita   Boolean         @default(false)
  scala_prova     Json?
  created_at      DateTime        @default(now())
  partecipazioni  Partecipazione[]

  @@map("eventi")
}

model Partecipazione {
  id                Int      @id @default(autoincrement())
  evento_id         Int
  socio_id          Int
  posizione_prova   Int?
  punteggio_totale  Int
  evento            Evento   @relation(fields: [evento_id], references: [id], onDelete: Cascade)
  socio             Socio    @relation(fields: [socio_id], references: [id], onDelete: Restrict)

  @@unique([evento_id, socio_id])
  @@map("partecipazioni")
}

model AdminUser {
  id              Int      @id @default(autoincrement())
  username        String   @unique @db.VarChar(50)
  password_hash   String   @db.VarChar(100)

  @@map("admin_users")
}
```

- [ ] **Step 2: Generate first migration locally (requires running Postgres)**

Skip this step if Postgres isn't running locally — it'll be done by `prisma migrate deploy` in Docker. To do it now:
```bash
cd api
DATABASE_URL=postgresql://porsche:changeme@localhost:5432/porsche npx prisma migrate dev --name init
```
Expected: creates `prisma/migrations/<timestamp>_init/`.

- [ ] **Step 3: Commit**

```bash
git add api/prisma/
git commit -m "feat(api): Prisma schema with soci, eventi, partecipazioni, admin_users"
```

---

## Task 4: Score calculation utility (TDD)

**Files:**
- Create: `api/src/eventi/score.util.ts`, `api/test/score.util.spec.ts`

- [ ] **Step 1: Write failing test `api/test/score.util.spec.ts`**

```typescript
import { calcolaPunteggio } from '../src/eventi/score.util';

describe('calcolaPunteggio', () => {
  it('returns base points when no skill challenge', () => {
    expect(calcolaPunteggio({
      punteggio_base: 10,
      prova_abilita: false,
      scala_prova: null,
      posizione_prova: null,
    })).toBe(10);
  });

  it('adds skill bonus when position is in scale', () => {
    expect(calcolaPunteggio({
      punteggio_base: 10,
      prova_abilita: true,
      scala_prova: [30,25,20,15,10,5],
      posizione_prova: 1,
    })).toBe(40);
    expect(calcolaPunteggio({
      punteggio_base: 10,
      prova_abilita: true,
      scala_prova: [30,25,20,15,10,5],
      posizione_prova: 6,
    })).toBe(15);
  });

  it('returns base only when position is null on prova_abilita event', () => {
    expect(calcolaPunteggio({
      punteggio_base: 10,
      prova_abilita: true,
      scala_prova: [30,25,20],
      posizione_prova: null,
    })).toBe(10);
  });

  it('returns base only when position out of scale range', () => {
    expect(calcolaPunteggio({
      punteggio_base: 10,
      prova_abilita: true,
      scala_prova: [30,25,20],
      posizione_prova: 5,
    })).toBe(10);
  });

  it('throws if posizione_prova set on non-prova event', () => {
    expect(() => calcolaPunteggio({
      punteggio_base: 10,
      prova_abilita: false,
      scala_prova: null,
      posizione_prova: 1,
    })).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd api && npx jest test/score.util.spec.ts
```
Expected: FAIL with "Cannot find module '../src/eventi/score.util'".

- [ ] **Step 3: Create `api/src/eventi/score.util.ts`**

```typescript
export interface ScoreInput {
  punteggio_base: number;
  prova_abilita: boolean;
  scala_prova: number[] | null;
  posizione_prova: number | null;
}

export function calcolaPunteggio(i: ScoreInput): number {
  if (!i.prova_abilita && i.posizione_prova !== null) {
    throw new Error('posizione_prova cannot be set when prova_abilita is false');
  }
  if (!i.prova_abilita || i.posizione_prova === null || !i.scala_prova) {
    return i.punteggio_base;
  }
  const idx = i.posizione_prova - 1;
  if (idx < 0 || idx >= i.scala_prova.length) return i.punteggio_base;
  return i.punteggio_base + i.scala_prova[idx];
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
cd api && npx jest test/score.util.spec.ts
```
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add api/src/eventi/score.util.ts api/test/score.util.spec.ts
git commit -m "feat(api): score calculation utility with tests"
```

---

## Task 5: Auth module (login, JWT cookie, guard)

**Files:**
- Create: `api/src/auth/auth.module.ts`, `auth.service.ts`, `auth.controller.ts`, `jwt.strategy.ts`, `jwt-auth.guard.ts`, `dto/login.dto.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Create `api/src/auth/dto/login.dto.ts`**

```typescript
import { IsString, MinLength } from 'class-validator';
export class LoginDto {
  @IsString() username!: string;
  @IsString() @MinLength(1) password!: string;
}
```

- [ ] **Step 2: Create `api/src/auth/auth.service.ts`**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async validate(username: string, password: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new UnauthorizedException();
    }
    return { sub: user.id, username: user.username };
  }

  signToken(payload: { sub: number; username: string }) {
    return this.jwt.sign(payload);
  }
}
```

- [ ] **Step 3: Create `api/src/auth/jwt.strategy.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.['auth'] ?? null,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }
  async validate(payload: any) { return { id: payload.sub, username: payload.username }; }
}
```

- [ ] **Step 4: Create `api/src/auth/jwt-auth.guard.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 5: Create `api/src/auth/auth.controller.ts`**

```typescript
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const payload = await this.auth.validate(dto.username, dto.password);
    const token = this.auth.signToken(payload);
    res.cookie('auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: '/',
    });
    return { ok: true };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth', { path: '/' });
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request) { return req.user; }
}
```

- [ ] **Step 6: Create `api/src/auth/auth.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService],
  exports: [JwtStrategy],
})
export class AuthModule {}
```

- [ ] **Step 7: Wire into `api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    AuthModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
```

- [ ] **Step 8: Commit**

```bash
git add api/src/auth api/src/app.module.ts
git commit -m "feat(api): JWT cookie auth module"
```

---

## Task 6: Soci CRUD module

**Files:**
- Create: `api/src/soci/soci.module.ts`, `soci.controller.ts`, `soci.service.ts`, `dto/create-socio.dto.ts`, `dto/update-socio.dto.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Create DTOs**

`api/src/soci/dto/create-socio.dto.ts`:
```typescript
import { IsInt, IsString, MaxLength, Min } from 'class-validator';
export class CreateSocioDto {
  @IsInt() @Min(1) numero_tessera!: number;
  @IsString() @MaxLength(100) nome!: string;
  @IsString() @MaxLength(100) cognome!: string;
}
```

`api/src/soci/dto/update-socio.dto.ts`:
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateSocioDto } from './create-socio.dto';
export class UpdateSocioDto extends PartialType(CreateSocioDto) {}
```

- [ ] **Step 2: Create `api/src/soci/soci.service.ts`**

```typescript
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocioDto } from './dto/create-socio.dto';
import { UpdateSocioDto } from './dto/update-socio.dto';

@Injectable()
export class SociService {
  constructor(private prisma: PrismaService) {}

  list(q?: string) {
    return this.prisma.socio.findMany({
      where: q ? {
        OR: [
          { cognome: { contains: q, mode: 'insensitive' } },
          { nome:    { contains: q, mode: 'insensitive' } },
          { numero_tessera: Number.isFinite(+q) ? +q : undefined },
        ].filter(Boolean) as any,
      } : undefined,
      orderBy: [{ cognome: 'asc' }, { nome: 'asc' }],
    });
  }

  async create(dto: CreateSocioDto) {
    try {
      return await this.prisma.socio.create({ data: dto });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('numero_tessera già esistente');
      throw e;
    }
  }

  async update(id: number, dto: UpdateSocioDto) {
    const s = await this.prisma.socio.findUnique({ where: { id } });
    if (!s) throw new NotFoundException();
    try {
      return await this.prisma.socio.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('numero_tessera già esistente');
      throw e;
    }
  }

  async remove(id: number) {
    const count = await this.prisma.partecipazione.count({ where: { socio_id: id } });
    if (count > 0) throw new ConflictException('Socio ha partecipazioni, impossibile eliminare');
    await this.prisma.socio.delete({ where: { id } });
    return { ok: true };
  }
}
```

- [ ] **Step 3: Create `api/src/soci/soci.controller.ts`**

```typescript
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SociService } from './soci.service';
import { CreateSocioDto } from './dto/create-socio.dto';
import { UpdateSocioDto } from './dto/update-socio.dto';

@UseGuards(JwtAuthGuard)
@Controller('soci')
export class SociController {
  constructor(private svc: SociService) {}
  @Get()    list(@Query('q') q?: string) { return this.svc.list(q); }
  @Post()   create(@Body() dto: CreateSocioDto) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSocioDto) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
```

- [ ] **Step 4: Create `api/src/soci/soci.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { SociController } from './soci.controller';
import { SociService } from './soci.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SociController],
  providers: [SociService, PrismaService],
})
export class SociModule {}
```

- [ ] **Step 5: Add `SociModule` to `api/src/app.module.ts` `imports` array**

Edit `api/src/app.module.ts` to add `import { SociModule } from './soci/soci.module';` and append `SociModule` to the imports array.

- [ ] **Step 6: Install `@nestjs/mapped-types`**

```bash
cd api && npm install @nestjs/mapped-types
```

- [ ] **Step 7: Commit**

```bash
git add api/src/soci api/src/app.module.ts api/package.json api/package-lock.json
git commit -m "feat(api): soci CRUD"
```

---

## Task 7: Eventi + partecipazioni module

**Files:**
- Create: `api/src/eventi/eventi.module.ts`, `eventi.controller.ts`, `eventi.service.ts`, `partecipazioni.service.ts`, `dto/create-evento.dto.ts`, `dto/update-evento.dto.ts`, `dto/partecipanti.dto.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Create `api/src/eventi/dto/create-evento.dto.ts`**

```typescript
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, ValidateIf } from 'class-validator';
import { Categoria } from '@prisma/client';

export class CreateEventoDto {
  @IsString() @MaxLength(200) titolo!: string;
  @IsDateString() data_evento!: string;
  @IsEnum(Categoria) categoria!: Categoria;
  @IsInt() @Min(0) punteggio_base!: number;
  @IsBoolean() prova_abilita!: boolean;
  @ValidateIf(o => o.prova_abilita === true)
  @IsArray() @IsInt({ each: true }) @IsOptional()
  scala_prova?: number[];
}
```

- [ ] **Step 2: Create `api/src/eventi/dto/update-evento.dto.ts`**

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateEventoDto } from './create-evento.dto';
export class UpdateEventoDto extends PartialType(CreateEventoDto) {}
```

- [ ] **Step 3: Create `api/src/eventi/dto/partecipanti.dto.ts`**

```typescript
import { IsArray, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PartecipanteItem {
  @IsInt() socio_id!: number;
  @IsOptional() @IsInt() @Min(1) posizione_prova?: number;
}

export class SetPartecipantiDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => PartecipanteItem)
  partecipanti!: PartecipanteItem[];
}
```

- [ ] **Step 4: Create `api/src/eventi/eventi.service.ts`**

```typescript
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Categoria } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Injectable()
export class EventiService {
  constructor(private prisma: PrismaService) {}

  list(categoria?: Categoria) {
    return this.prisma.evento.findMany({
      where: categoria ? { categoria } : undefined,
      orderBy: { data_evento: 'desc' },
      include: { _count: { select: { partecipazioni: true } } },
    });
  }

  async get(id: number) {
    const e = await this.prisma.evento.findUnique({
      where: { id },
      include: { partecipazioni: { include: { socio: true }, orderBy: { punteggio_totale: 'desc' } } },
    });
    if (!e) throw new NotFoundException();
    return e;
  }

  create(dto: CreateEventoDto) {
    if (dto.prova_abilita && (!dto.scala_prova || dto.scala_prova.length === 0)) {
      throw new BadRequestException('scala_prova richiesta quando prova_abilita=true');
    }
    if (!dto.prova_abilita && dto.scala_prova) {
      throw new BadRequestException('scala_prova non valida senza prova_abilita');
    }
    return this.prisma.evento.create({
      data: {
        titolo: dto.titolo,
        data_evento: new Date(dto.data_evento),
        categoria: dto.categoria,
        punteggio_base: dto.punteggio_base,
        prova_abilita: dto.prova_abilita,
        scala_prova: dto.prova_abilita ? (dto.scala_prova as any) : null,
      },
    });
  }

  async update(id: number, dto: UpdateEventoDto) {
    const ex = await this.prisma.evento.findUnique({ where: { id } });
    if (!ex) throw new NotFoundException();
    return this.prisma.evento.update({
      where: { id },
      data: {
        ...dto,
        data_evento: dto.data_evento ? new Date(dto.data_evento) : undefined,
        scala_prova: dto.scala_prova as any,
      },
    });
  }

  async remove(id: number) {
    await this.prisma.evento.delete({ where: { id } });
    return { ok: true };
  }
}
```

- [ ] **Step 5: Create `api/src/eventi/partecipazioni.service.ts`**

```typescript
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calcolaPunteggio } from './score.util';
import { SetPartecipantiDto } from './dto/partecipanti.dto';

@Injectable()
export class PartecipazioniService {
  constructor(private prisma: PrismaService) {}

  async setForEvento(evento_id: number, dto: SetPartecipantiDto) {
    const ev = await this.prisma.evento.findUnique({ where: { id: evento_id } });
    if (!ev) throw new NotFoundException('evento');

    const scala = (ev.scala_prova as number[] | null) ?? null;
    const seenSoci = new Set<number>();
    const seenPos  = new Set<number>();
    for (const p of dto.partecipanti) {
      if (seenSoci.has(p.socio_id)) throw new BadRequestException('socio duplicato');
      seenSoci.add(p.socio_id);
      if (p.posizione_prova !== undefined && p.posizione_prova !== null) {
        if (!ev.prova_abilita) throw new BadRequestException('posizione_prova non ammessa');
        if (seenPos.has(p.posizione_prova)) throw new BadRequestException('posizione duplicata');
        seenPos.add(p.posizione_prova);
      }
    }

    const rows = dto.partecipanti.map(p => ({
      evento_id,
      socio_id: p.socio_id,
      posizione_prova: p.posizione_prova ?? null,
      punteggio_totale: calcolaPunteggio({
        punteggio_base: ev.punteggio_base,
        prova_abilita: ev.prova_abilita,
        scala_prova: scala,
        posizione_prova: p.posizione_prova ?? null,
      }),
    }));

    await this.prisma.$transaction([
      this.prisma.partecipazione.deleteMany({ where: { evento_id } }),
      ...rows.map(r => this.prisma.partecipazione.create({ data: r })),
    ]);

    return { count: rows.length };
  }
}
```

- [ ] **Step 6: Create `api/src/eventi/eventi.controller.ts`**

```typescript
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Categoria } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventiService } from './eventi.service';
import { PartecipazioniService } from './partecipazioni.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { SetPartecipantiDto } from './dto/partecipanti.dto';

@UseGuards(JwtAuthGuard)
@Controller('eventi')
export class EventiController {
  constructor(private svc: EventiService, private parts: PartecipazioniService) {}
  @Get()       list(@Query('categoria') c?: Categoria) { return this.svc.list(c); }
  @Get(':id')  get(@Param('id', ParseIntPipe) id: number) { return this.svc.get(id); }
  @Post()      create(@Body() dto: CreateEventoDto) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventoDto) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
  @Put(':id/partecipazioni')
  setPart(@Param('id', ParseIntPipe) id: number, @Body() dto: SetPartecipantiDto) {
    return this.parts.setForEvento(id, dto);
  }
}
```

- [ ] **Step 7: Create `api/src/eventi/eventi.module.ts`**

```typescript
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
```

- [ ] **Step 8: Add `EventiModule` to app imports**

Edit `api/src/app.module.ts` to import and add `EventiModule`.

- [ ] **Step 9: Commit**

```bash
git add api/src/eventi api/src/app.module.ts
git commit -m "feat(api): eventi + partecipazioni"
```

---

## Task 8: Classifica module

**Files:**
- Create: `api/src/classifica/classifica.module.ts`, `classifica.controller.ts`, `classifica.service.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Create `api/src/classifica/classifica.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { Categoria } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassificaService {
  constructor(private prisma: PrismaService) {}

  async build(categoria: Categoria) {
    const eventi = await this.prisma.evento.findMany({
      where: { categoria },
      orderBy: { data_evento: 'asc' },
      select: { id: true, titolo: true, data_evento: true },
    });
    const eventoIds = eventi.map(e => e.id);

    const partecipazioni = eventoIds.length
      ? await this.prisma.partecipazione.findMany({
          where: { evento_id: { in: eventoIds } },
          include: { socio: true },
        })
      : [];

    const bySocio = new Map<number, {
      socio: { id: number; numero_tessera: number; nome: string; cognome: string };
      totale: number;
      punti_per_evento: Record<string, number>;
    }>();

    for (const p of partecipazioni) {
      const cur = bySocio.get(p.socio_id) ?? {
        socio: {
          id: p.socio.id,
          numero_tessera: p.socio.numero_tessera,
          nome: p.socio.nome,
          cognome: p.socio.cognome,
        },
        totale: 0,
        punti_per_evento: {},
      };
      cur.totale += p.punteggio_totale;
      cur.punti_per_evento[String(p.evento_id)] = p.punteggio_totale;
      bySocio.set(p.socio_id, cur);
    }

    const righe = [...bySocio.values()]
      .sort((a, b) => b.totale - a.totale || a.socio.cognome.localeCompare(b.socio.cognome))
      .map((r, i) => ({ posizione: i + 1, ...r }));

    return { categoria, eventi, righe };
  }
}
```

- [ ] **Step 2: Create `api/src/classifica/classifica.controller.ts`**

```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Categoria } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassificaService } from './classifica.service';

@UseGuards(JwtAuthGuard)
@Controller('classifica')
export class ClassificaController {
  constructor(private svc: ClassificaService) {}
  @Get() get(@Query('categoria') c: Categoria) { return this.svc.build(c); }
}
```

- [ ] **Step 3: Create `api/src/classifica/classifica.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ClassificaController } from './classifica.controller';
import { ClassificaService } from './classifica.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ClassificaController],
  providers: [ClassificaService, PrismaService],
  exports: [ClassificaService],
})
export class ClassificaModule {}
```

- [ ] **Step 4: Add `ClassificaModule` to app imports**

Edit `api/src/app.module.ts` to import and add `ClassificaModule`.

- [ ] **Step 5: Commit**

```bash
git add api/src/classifica api/src/app.module.ts
git commit -m "feat(api): classifica computation"
```

---

## Task 9: PDF module (classifica + evento)

**Files:**
- Create: `api/src/pdf/pdf.module.ts`, `pdf.controller.ts`, `pdf-classifica.service.ts`, `pdf-evento.service.ts`
- Add: `api/assets/porsche-logo.png` (placeholder if not provided)
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Create logo placeholder**

Place `api/assets/porsche-logo.png` (any PNG; user can replace later). If creating a stub, use a 1x1 transparent PNG. Code must check existence before embedding.

- [ ] **Step 2: Create `api/src/pdf/pdf-classifica.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Categoria } from '@prisma/client';
import { ClassificaService } from '../classifica/classifica.service';

@Injectable()
export class PdfClassificaService {
  constructor(private classifica: ClassificaService) {}

  async stream(categoria: Categoria, res: Response) {
    const data = await this.classifica.build(categoria);
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=classifica-${categoria}.pdf`);
    doc.pipe(res);

    const logo = path.join(__dirname, '..', '..', 'assets', 'porsche-logo.png');
    if (fs.existsSync(logo)) doc.image(logo, 30, 25, { width: 60 });

    doc.fontSize(16).text(`Classifica ${categoria.toUpperCase()} — Porsche Club Roma`, 100, 35);
    doc.fontSize(9).text(`Generato: ${new Date().toLocaleString('it-IT')}`, 100, 55);
    doc.moveDown(2);

    const startY = 90;
    const colWidth = 50;
    const fixedCols = ['Pos', 'Tess.', 'Cognome', 'Nome'];
    const fixedW = [30, 35, 100, 100];
    let x = 30;
    doc.fontSize(8).font('Helvetica-Bold');
    fixedCols.forEach((c, i) => { doc.text(c, x, startY, { width: fixedW[i] }); x += fixedW[i]; });
    data.eventi.forEach(e => {
      const lbl = `${new Date(e.data_evento).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}`;
      doc.text(lbl, x, startY, { width: colWidth });
      x += colWidth;
    });
    doc.text('Tot', x, startY, { width: 35 });
    doc.font('Helvetica');

    let y = startY + 20;
    for (const r of data.righe) {
      x = 30;
      const cells = [r.posizione, r.socio.numero_tessera, r.socio.cognome, r.socio.nome];
      cells.forEach((c, i) => { doc.text(String(c), x, y, { width: fixedW[i] }); x += fixedW[i]; });
      data.eventi.forEach(e => {
        const v = r.punti_per_evento[String(e.id)];
        doc.text(v != null ? String(v) : '', x, y, { width: colWidth });
        x += colWidth;
      });
      doc.font('Helvetica-Bold').text(String(r.totale), x, y, { width: 35 }).font('Helvetica');
      y += 18;
      if (y > doc.page.height - 40) { doc.addPage(); y = 40; }
    }

    doc.end();
  }
}
```

- [ ] **Step 3: Create `api/src/pdf/pdf-evento.service.ts`**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PdfEventoService {
  constructor(private prisma: PrismaService) {}

  async stream(id: number, res: Response) {
    const ev = await this.prisma.evento.findUnique({
      where: { id },
      include: { partecipazioni: { include: { socio: true }, orderBy: { punteggio_totale: 'desc' } } },
    });
    if (!ev) throw new NotFoundException();

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=evento-${id}.pdf`);
    doc.pipe(res);

    const logo = path.join(__dirname, '..', '..', 'assets', 'porsche-logo.png');
    if (fs.existsSync(logo)) doc.image(logo, 50, 40, { width: 60 });

    doc.fontSize(14).font('Helvetica-Bold').text(ev.titolo, 130, 50);
    doc.fontSize(10).font('Helvetica').text(
      `${new Date(ev.data_evento).toLocaleDateString('it-IT')} · ${ev.categoria.toUpperCase()} · base ${ev.punteggio_base} pt`,
      130, 70,
    );
    if (ev.prova_abilita && ev.scala_prova) {
      doc.text(`Prova abilità: ${(ev.scala_prova as number[]).join(' / ')}`, 130, 85);
    }

    let y = 130;
    doc.fontSize(9).font('Helvetica-Bold');
    const cols = ['Pos', 'Tess.', 'Cognome', 'Nome', 'Base', 'Prova', 'Totale'];
    const w =    [30,    40,      100,        100,    40,     40,      40];
    let x = 50;
    cols.forEach((c, i) => { doc.text(c, x, y, { width: w[i] }); x += w[i]; });
    doc.font('Helvetica');
    y += 18;

    for (const p of ev.partecipazioni) {
      x = 50;
      const base = ev.punteggio_base;
      const bonus = p.punteggio_totale - base;
      const row = [
        p.posizione_prova ?? '',
        p.socio.numero_tessera,
        p.socio.cognome,
        p.socio.nome,
        base,
        bonus > 0 ? bonus : '',
        p.punteggio_totale,
      ];
      row.forEach((c, i) => { doc.text(String(c), x, y, { width: w[i] }); x += w[i]; });
      y += 16;
      if (y > doc.page.height - 50) { doc.addPage(); y = 50; }
    }

    doc.end();
  }
}
```

- [ ] **Step 4: Create `api/src/pdf/pdf.controller.ts`**

```typescript
import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Categoria } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PdfClassificaService } from './pdf-classifica.service';
import { PdfEventoService } from './pdf-evento.service';

@UseGuards(JwtAuthGuard)
@Controller('pdf')
export class PdfController {
  constructor(private cls: PdfClassificaService, private ev: PdfEventoService) {}
  @Get('classifica') classifica(@Query('categoria') c: Categoria, @Res() res: Response) {
    return this.cls.stream(c, res);
  }
  @Get('evento/:id') evento(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    return this.ev.stream(id, res);
  }
}
```

- [ ] **Step 5: Create `api/src/pdf/pdf.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfClassificaService } from './pdf-classifica.service';
import { PdfEventoService } from './pdf-evento.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClassificaModule } from '../classifica/classifica.module';

@Module({
  imports: [ClassificaModule],
  controllers: [PdfController],
  providers: [PdfClassificaService, PdfEventoService, PrismaService],
})
export class PdfModule {}
```

- [ ] **Step 6: Add `PdfModule` to app imports**

Edit `api/src/app.module.ts` to import and add `PdfModule`.

- [ ] **Step 7: Commit**

```bash
git add api/src/pdf api/assets api/src/app.module.ts
git commit -m "feat(api): PDF generation for classifica and evento"
```

---

## Task 10: Seed module (admin + soci from Excel)

**Files:**
- Create: `api/src/seed/seed.module.ts`, `seed.service.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Create `api/src/seed/seed.service.ts`**

```typescript
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly log = new Logger('Seed');
  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
    await this.seedSoci();
  }

  private async seedAdmin() {
    const count = await this.prisma.adminUser.count();
    if (count > 0) return;
    const username = process.env.ADMIN_USER || 'admin';
    const pass     = process.env.ADMIN_PASS || 'admin123';
    await this.prisma.adminUser.create({
      data: { username, password_hash: await bcrypt.hash(pass, 10) },
    });
    this.log.log(`Admin user '${username}' created`);
  }

  private async seedSoci() {
    const count = await this.prisma.socio.count();
    if (count > 0) return;
    const file = '/seed/soci.xlsx';
    if (!fs.existsSync(file)) { this.log.warn(`Seed file ${file} not found, skipping`); return; }

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);
    const ws = wb.getWorksheet('Classifica PCR');
    if (!ws) { this.log.warn('Sheet "Classifica PCR" not found'); return; }

    const created: { numero_tessera: number; nome: string; cognome: string }[] = [];
    ws.eachRow({ includeEmpty: false }, (row, idx) => {
      if (idx === 1) return;                       // header
      const tess = Number(row.getCell(1).value);   // col '#'
      const cognome = String(row.getCell(3).value ?? '').trim();
      const nome    = String(row.getCell(4).value ?? '').trim();
      if (!Number.isFinite(tess) || tess <= 0) return;
      if (!cognome || !nome) return;
      created.push({ numero_tessera: tess, nome, cognome });
    });

    if (created.length === 0) { this.log.warn('No soci rows found in Excel'); return; }
    await this.prisma.socio.createMany({ data: created, skipDuplicates: true });
    this.log.log(`Seeded ${created.length} soci`);
  }
}
```

- [ ] **Step 2: Create `api/src/seed/seed.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({ providers: [SeedService, PrismaService] })
export class SeedModule {}
```

- [ ] **Step 3: Add `SeedModule` to app imports**

Edit `api/src/app.module.ts` to import and add `SeedModule`.

- [ ] **Step 4: Commit**

```bash
git add api/src/seed api/src/app.module.ts
git commit -m "feat(api): seed admin user and soci from Excel on first boot"
```

---

## Task 11: docker-compose.yml + first end-to-end boot

**Files:**
- Create: `docker-compose.yml`, `web/Dockerfile` (placeholder, real one in Task 12)

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - ./data/pg:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build: ./api
    depends_on:
      db: { condition: service_healthy }
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET:   ${JWT_SECRET}
      ADMIN_USER:   ${ADMIN_USER}
      ADMIN_PASS:   ${ADMIN_PASS}
      CORS_ORIGIN:  ${CORS_ORIGIN}
      NODE_ENV:     production
    volumes:
      - "./def_2026 Classifica PCR.xlsx:/seed/soci.xlsx:ro"
    ports:
      - "3001:3001"

  web:
    build: ./web
    depends_on: [api]
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    ports:
      - "3000:3000"
```

- [ ] **Step 2: Create `web/Dockerfile` placeholder**

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN echo '{"name":"web","version":"0.0.1","scripts":{"start":"node -e \"require(\\\"http\\\").createServer((q,r)=>r.end(\\\"ok\\\")).listen(3000)\"" }}' > package.json
EXPOSE 3000
CMD ["npm","start"]
```

(This will be replaced in Task 12.)

- [ ] **Step 3: Boot stack and verify API**

```bash
cp .env.example .env
docker compose up -d --build
# Wait ~30s for migrations + seed
docker compose logs api | tail -50
```
Expected: log shows "Seeded N soci", "Admin user 'admin' created", and Nest listens on 3001.

- [ ] **Step 4: Smoke test login + soci endpoint**

```bash
curl -i -c /tmp/c.txt -X POST http://localhost:3001/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"admin","password":"admin123"}'
curl -i -b /tmp/c.txt http://localhost:3001/api/soci
```
Expected: login returns 201 + Set-Cookie; `/soci` returns JSON array of seeded soci.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml web/Dockerfile
git commit -m "feat: docker-compose stack with db, api, web placeholder"
```

---

## Task 12: Next.js scaffold + Tailwind + shadcn

**Files:**
- Create: `web/package.json`, `web/tsconfig.json`, `web/next.config.ts`, `web/tailwind.config.ts`, `web/postcss.config.js`, `web/components.json`, `web/Dockerfile`, `web/app/layout.tsx`, `web/app/globals.css`, `web/lib/api.ts`, `web/lib/types.ts`, `web/public/porsche-logo.svg`

- [ ] **Step 1: Create `web/package.json`**

```json
{
  "name": "porsche-web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.330.0",
    "next": "15.0.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create `web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom","dom.iterable","esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": { "@/*": ["./*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `web/next.config.ts`**

```typescript
import type { NextConfig } from 'next';
const config: NextConfig = { output: 'standalone' };
export default config;
```

- [ ] **Step 4: Create Tailwind/PostCSS config**

`web/tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: { porsche: '#d5001c' } } },
  plugins: [],
};
export default config;
```

`web/postcss.config.js`:
```javascript
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 5: Create `web/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: light; }
body { @apply bg-neutral-50 text-neutral-900; }
```

- [ ] **Step 6: Create `web/app/layout.tsx`**

```tsx
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = { title: 'Porsche Club Roma — CRM' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create `web/lib/types.ts`**

```typescript
export type Categoria = 'turismo' | 'pista';

export interface Socio { id: number; numero_tessera: number; nome: string; cognome: string; }

export interface Evento {
  id: number;
  titolo: string;
  data_evento: string;
  categoria: Categoria;
  punteggio_base: number;
  prova_abilita: boolean;
  scala_prova: number[] | null;
  _count?: { partecipazioni: number };
}

export interface Partecipazione {
  id: number; evento_id: number; socio_id: number;
  posizione_prova: number | null; punteggio_totale: number;
  socio?: Socio;
}

export interface ClassificaResponse {
  categoria: Categoria;
  eventi: { id: number; titolo: string; data_evento: string }[];
  righe: {
    posizione: number;
    socio: Socio;
    totale: number;
    punti_per_evento: Record<string, number>;
  }[];
}
```

- [ ] **Step 8: Create `web/lib/api.ts`**

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).message ?? msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiPdf(path: string): Promise<Blob> {
  const res = await fetch(`${BASE}/api${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(res.statusText);
  return res.blob();
}
```

- [ ] **Step 9: Create placeholder logo `web/public/porsche-logo.svg`**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#d5001c"/><text x="50" y="58" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold" font-size="18">PCR</text></svg>
```

(User will replace with real Porsche logo.)

- [ ] **Step 10: Create `web/Dockerfile`**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node","server.js"]
```

- [ ] **Step 11: Initialize and verify build**

```bash
cd web && npm install && npm run build
```
Expected: build succeeds.

- [ ] **Step 12: Commit**

```bash
git add web/
git commit -m "feat(web): Next.js + Tailwind scaffold"
```

---

## Task 13: shadcn/ui base components + sidebar

**Files:**
- Create: `web/components/ui/button.tsx`, `input.tsx`, `dialog.tsx`, `label.tsx`, `tabs.tsx`, `table.tsx`, `web/lib/utils.ts`, `web/components/sidebar.tsx`, `web/app/(app)/layout.tsx`

- [ ] **Step 1: Create `web/lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

- [ ] **Step 2: Create `web/components/ui/button.tsx`**

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-porsche text-white hover:bg-red-700',
        outline: 'border border-neutral-300 bg-white hover:bg-neutral-100',
        ghost:   'hover:bg-neutral-100',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: { default: 'h-9 px-4', sm: 'h-8 px-3', icon: 'h-9 w-9' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) =>
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />,
);
Button.displayName = 'Button';
```

- [ ] **Step 3: Create `web/components/ui/input.tsx`**

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) =>
    <input ref={ref} className={cn('h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-porsche', className)} {...props} />,
);
Input.displayName = 'Input';
```

- [ ] **Step 4: Create `web/components/ui/label.tsx`**

```tsx
import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';
export const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>>(
  ({ className, ...props }, ref) =>
    <LabelPrimitive.Root ref={ref} className={cn('text-sm font-medium', className)} {...props} />,
);
Label.displayName = 'Label';
```

- [ ] **Step 5: Create `web/components/ui/dialog.tsx`**

```tsx
'use client';
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(
  ({ className, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn('fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg', className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4"><X className="h-4 w-4" /></DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('mb-4 flex flex-col gap-1', className)} {...p} />;
export const DialogTitle = DialogPrimitive.Title;
export const DialogFooter = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('mt-4 flex justify-end gap-2', className)} {...p} />;
```

- [ ] **Step 6: Create `web/components/ui/tabs.tsx`**

```tsx
'use client';
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;
export const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(
  ({ className, ...props }, ref) =>
    <TabsPrimitive.List ref={ref} className={cn('inline-flex h-9 items-center rounded-md bg-neutral-100 p-1', className)} {...props} />,
);
TabsList.displayName = 'TabsList';
export const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
  ({ className, ...props }, ref) =>
    <TabsPrimitive.Trigger ref={ref} className={cn('px-3 py-1 rounded-sm text-sm data-[state=active]:bg-white data-[state=active]:shadow', className)} {...props} />,
);
TabsTrigger.displayName = 'TabsTrigger';
export const TabsContent = TabsPrimitive.Content;
```

- [ ] **Step 7: Create `web/components/ui/table.tsx`**

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
export const Table = (p: React.HTMLAttributes<HTMLTableElement>) =>
  <table {...p} className={cn('w-full text-sm', p.className)} />;
export const Thead = (p: React.HTMLAttributes<HTMLTableSectionElement>) =>
  <thead {...p} className={cn('bg-neutral-100 text-left', p.className)} />;
export const Tbody = (p: React.HTMLAttributes<HTMLTableSectionElement>) =>
  <tbody {...p} />;
export const Tr = (p: React.HTMLAttributes<HTMLTableRowElement>) =>
  <tr {...p} className={cn('border-b border-neutral-200', p.className)} />;
export const Th = (p: React.ThHTMLAttributes<HTMLTableCellElement>) =>
  <th {...p} className={cn('px-3 py-2 font-medium', p.className)} />;
export const Td = (p: React.TdHTMLAttributes<HTMLTableCellElement>) =>
  <td {...p} className={cn('px-3 py-2', p.className)} />;
```

- [ ] **Step 8: Create `web/components/sidebar.tsx`**

```tsx
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Calendar, Trophy, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const links = [
  { href: '/soci',       label: 'Soci',       icon: Users },
  { href: '/eventi',     label: 'Eventi',     icon: Calendar },
  { href: '/classifica', label: 'Classifica', icon: Trophy },
];

export function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    router.push('/login');
  }
  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-white">
      <div className="flex items-center gap-2 px-4 py-5">
        <Image src="/porsche-logo.svg" alt="Porsche Club Roma" width={40} height={40} />
        <div className="text-sm font-semibold leading-tight">Porsche<br/>Club Roma</div>
      </div>
      <nav className="flex-1 px-2">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-neutral-100',
              path?.startsWith(l.href) && 'bg-neutral-100 font-medium text-porsche')}>
            <l.icon className="h-4 w-4" /> {l.label}
          </Link>
        ))}
      </nav>
      <button onClick={logout} className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-neutral-100">
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </aside>
  );
}
```

- [ ] **Step 9: Create `web/app/(app)/layout.tsx`**

```tsx
import { Sidebar } from '@/components/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto h-screen">{children}</main>
    </div>
  );
}
```

- [ ] **Step 10: Commit**

```bash
git add web/components web/lib/utils.ts web/app/\(app\)/layout.tsx
git commit -m "feat(web): UI base + sidebar"
```

---

## Task 14: Login page + auth gate

**Files:**
- Create: `web/app/(auth)/login/page.tsx`, `web/middleware.ts`

- [ ] **Step 1: Create `web/middleware.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC = ['/login', '/_next', '/favicon', '/porsche-logo.svg'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();
  const token = req.cookies.get('auth');
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api).*)'] };
```

- [ ] **Step 2: Create `web/app/(auth)/login/page.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const r = useRouter();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) });
      r.push('/soci');
    } catch (e: any) { setErr('Credenziali non valide'); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100">
      <form onSubmit={submit} className="w-80 rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex justify-center">
          <Image src="/porsche-logo.svg" alt="" width={64} height={64} />
        </div>
        <h1 className="mb-4 text-center text-lg font-semibold">Porsche Club Roma</h1>
        <div className="space-y-3">
          <div>
            <Label htmlFor="u">Username</Label>
            <Input id="u" value={u} onChange={e => setU(e.target.value)} autoFocus />
          </div>
          <div>
            <Label htmlFor="p">Password</Label>
            <Input id="p" type="password" value={p} onChange={e => setP(e.target.value)} />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Accesso…' : 'Accedi'}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

```bash
docker compose up -d --build web
```
Open http://localhost:3000 — should redirect to `/login`. Submit `admin` / `admin123` → redirect to `/soci`.

- [ ] **Step 4: Commit**

```bash
git add web/middleware.ts web/app/\(auth\)
git commit -m "feat(web): login page + auth middleware"
```

---

## Task 15: Soci page (Pagina 1)

**Files:**
- Create: `web/app/(app)/soci/page.tsx`, `web/components/soci-table.tsx`, `web/components/socio-form-dialog.tsx`

- [ ] **Step 1: Create `web/components/socio-form-dialog.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import type { Socio } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  socio?: Socio | null;
  onSaved: () => void;
}

export function SocioFormDialog({ open, onOpenChange, socio, onSaved }: Props) {
  const [tess, setTess] = useState('');
  const [nome, setNome] = useState('');
  const [cog, setCog] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const editing = !!socio;

  useEffect(() => {
    if (open) {
      setTess(socio ? String(socio.numero_tessera) : '');
      setNome(socio?.nome ?? '');
      setCog(socio?.cognome ?? '');
      setErr(null);
    }
  }, [open, socio]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const body = JSON.stringify({ numero_tessera: Number(tess), nome, cognome: cog });
      if (editing) await api(`/soci/${socio!.id}`, { method: 'PATCH', body });
      else         await api('/soci',                { method: 'POST', body });
      onSaved(); onOpenChange(false);
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? 'Modifica socio' : 'Nuovo socio'}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div><Label>N. tessera</Label><Input type="number" value={tess} onChange={e => setTess(e.target.value)} required /></div>
          <div><Label>Cognome</Label><Input value={cog} onChange={e => setCog(e.target.value)} required /></div>
          <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} required /></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">Salva</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create `web/components/soci-table.tsx`**

```tsx
'use client';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Socio } from '@/lib/types';

interface Props {
  rows: Socio[];
  onEdit: (s: Socio) => void;
  onDelete: (s: Socio) => void;
}

export function SociTable({ rows, onEdit, onDelete }: Props) {
  return (
    <Table>
      <Thead><Tr><Th>Tessera</Th><Th>Cognome</Th><Th>Nome</Th><Th></Th></Tr></Thead>
      <Tbody>
        {rows.map(s => (
          <Tr key={s.id}>
            <Td>{s.numero_tessera}</Td>
            <Td>{s.cognome}</Td>
            <Td>{s.nome}</Td>
            <Td className="text-right">
              <Button size="sm" variant="ghost" onClick={() => onEdit(s)}>Modifica</Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(s)}>Elimina</Button>
            </Td>
          </Tr>
        ))}
        {rows.length === 0 && <Tr><Td colSpan={4} className="text-center text-neutral-500">Nessun socio</Td></Tr>}
      </Tbody>
    </Table>
  );
}
```

- [ ] **Step 3: Create `web/app/(app)/soci/page.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SociTable } from '@/components/soci-table';
import { SocioFormDialog } from '@/components/socio-form-dialog';
import { api } from '@/lib/api';
import type { Socio } from '@/lib/types';

export default function SociPage() {
  const [rows, setRows] = useState<Socio[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Socio | null>(null);

  async function load() { setRows(await api<Socio[]>(`/soci${q ? `?q=${encodeURIComponent(q)}` : ''}`)); }
  useEffect(() => { load(); }, [q]);

  async function del(s: Socio) {
    if (!confirm(`Eliminare ${s.cognome} ${s.nome}?`)) return;
    try { await api(`/soci/${s.id}`, { method: 'DELETE' }); load(); }
    catch (e: any) { alert(e.message); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Soci</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>+ Nuovo socio</Button>
      </div>
      <Input placeholder="Cerca per cognome o tessera…" value={q} onChange={e => setQ(e.target.value)} className="mb-4 max-w-sm" />
      <SociTable rows={rows} onEdit={s => { setEditing(s); setOpen(true); }} onDelete={del} />
      <SocioFormDialog open={open} onOpenChange={setOpen} socio={editing} onSaved={load} />
    </div>
  );
}
```

- [ ] **Step 4: Verify in browser**

Run `docker compose up -d --build web`. Login. Open `/soci`. Verify list, search, create, edit, delete (delete should fail if soci have partecipazioni).

- [ ] **Step 5: Commit**

```bash
git add web/app/\(app\)/soci web/components/soci-table.tsx web/components/socio-form-dialog.tsx
git commit -m "feat(web): soci page (CRUD + search)"
```

---

## Task 16: Eventi page + form (Pagina 2 — list + create)

**Files:**
- Create: `web/app/(app)/eventi/page.tsx`, `web/components/eventi-table.tsx`, `web/components/evento-form-dialog.tsx`

- [ ] **Step 1: Create `web/components/evento-form-dialog.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import type { Categoria, Evento } from '@/lib/types';

interface Props { open: boolean; onOpenChange: (b: boolean) => void; evento?: Evento | null; onSaved: () => void; }

export function EventoFormDialog({ open, onOpenChange, evento, onSaved }: Props) {
  const [titolo, setTitolo] = useState('');
  const [data, setData] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('turismo');
  const [base, setBase] = useState('10');
  const [prova, setProva] = useState(false);
  const [scala, setScala] = useState<number[]>([30,25,20,15,10,5]);
  const [err, setErr] = useState<string | null>(null);
  const editing = !!evento;

  useEffect(() => {
    if (open) {
      setTitolo(evento?.titolo ?? '');
      setData(evento?.data_evento?.slice(0,10) ?? '');
      setCategoria(evento?.categoria ?? 'turismo');
      setBase(String(evento?.punteggio_base ?? 10));
      setProva(evento?.prova_abilita ?? false);
      setScala(evento?.scala_prova ?? [30,25,20,15,10,5]);
      setErr(null);
    }
  }, [open, evento]);

  function setScalaAt(i: number, v: string) {
    const n = Number(v); if (!Number.isFinite(n)) return;
    setScala(scala.map((x, idx) => idx === i ? n : x));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const body = JSON.stringify({
        titolo, data_evento: data, categoria,
        punteggio_base: Number(base), prova_abilita: prova,
        scala_prova: prova ? scala : undefined,
      });
      if (editing) await api(`/eventi/${evento!.id}`, { method: 'PATCH', body });
      else         await api('/eventi',                { method: 'POST',  body });
      onSaved(); onOpenChange(false);
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? 'Modifica evento' : 'Nuovo evento'}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div><Label>Titolo</Label><Input value={titolo} onChange={e => setTitolo(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} required /></div>
            <div>
              <Label>Categoria</Label>
              <select className="h-9 w-full rounded-md border border-neutral-300 px-3 text-sm" value={categoria} onChange={e => setCategoria(e.target.value as Categoria)}>
                <option value="turismo">Turismo</option>
                <option value="pista">Pista</option>
              </select>
            </div>
          </div>
          <div><Label>Punteggio base</Label><Input type="number" min="0" value={base} onChange={e => setBase(e.target.value)} required /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={prova} onChange={e => setProva(e.target.checked)} />
            Prova abilità
          </label>
          {prova && (
            <div>
              <Label>Scala punteggi (1°, 2°, ...)</Label>
              <div className="flex flex-wrap gap-2">
                {scala.map((v, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-xs text-neutral-500">{i+1}°</span>
                    <Input className="w-20" type="number" value={v} onChange={e => setScalaAt(i, e.target.value)} />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setScala([...scala, 0])}>+</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setScala(scala.slice(0, -1))} disabled={scala.length <= 1}>−</Button>
              </div>
            </div>
          )}
          {err && <p className="text-sm text-red-600">{err}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">Salva</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create `web/components/eventi-table.tsx`**

```tsx
'use client';
import Link from 'next/link';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Evento } from '@/lib/types';

interface Props { rows: Evento[]; onEdit: (e: Evento) => void; onDelete: (e: Evento) => void; }

export function EventiTable({ rows, onEdit, onDelete }: Props) {
  return (
    <Table>
      <Thead><Tr><Th>Data</Th><Th>Titolo</Th><Th>Categoria</Th><Th>Base</Th><Th>Prova</Th><Th>Partecipanti</Th><Th></Th></Tr></Thead>
      <Tbody>
        {rows.map(e => (
          <Tr key={e.id}>
            <Td>{new Date(e.data_evento).toLocaleDateString('it-IT')}</Td>
            <Td><Link href={`/eventi/${e.id}`} className="text-porsche hover:underline">{e.titolo}</Link></Td>
            <Td><span className={e.categoria === 'pista' ? 'rounded bg-red-100 px-2 py-0.5 text-xs text-red-700' : 'rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700'}>{e.categoria}</span></Td>
            <Td>{e.punteggio_base}</Td>
            <Td>{e.prova_abilita ? 'sì' : 'no'}</Td>
            <Td>{e._count?.partecipazioni ?? 0}</Td>
            <Td className="text-right">
              <Button size="sm" variant="ghost" onClick={() => onEdit(e)}>Modifica</Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(e)}>Elimina</Button>
            </Td>
          </Tr>
        ))}
        {rows.length === 0 && <Tr><Td colSpan={7} className="text-center text-neutral-500">Nessun evento</Td></Tr>}
      </Tbody>
    </Table>
  );
}
```

- [ ] **Step 3: Create `web/app/(app)/eventi/page.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EventiTable } from '@/components/eventi-table';
import { EventoFormDialog } from '@/components/evento-form-dialog';
import { api } from '@/lib/api';
import type { Evento } from '@/lib/types';

export default function EventiPage() {
  const [rows, setRows] = useState<Evento[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);

  async function load() { setRows(await api<Evento[]>('/eventi')); }
  useEffect(() => { load(); }, []);

  async function del(e: Evento) {
    if (!confirm(`Eliminare evento "${e.titolo}"? Tutte le partecipazioni saranno rimosse.`)) return;
    await api(`/eventi/${e.id}`, { method: 'DELETE' }); load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Eventi</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>+ Nuovo evento</Button>
      </div>
      <EventiTable rows={rows} onEdit={e => { setEditing(e); setOpen(true); }} onDelete={del} />
      <EventoFormDialog open={open} onOpenChange={setOpen} evento={editing} onSaved={load} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add web/app/\(app\)/eventi/page.tsx web/components/eventi-table.tsx web/components/evento-form-dialog.tsx
git commit -m "feat(web): eventi list + create/edit dialog"
```

---

## Task 17: Evento detail + partecipazioni dialog

**Files:**
- Create: `web/app/(app)/eventi/[id]/page.tsx`, `web/components/partecipazioni-dialog.tsx`

- [ ] **Step 1: Create `web/components/partecipazioni-dialog.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import type { Evento, Partecipazione, Socio } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  evento: Evento;
  current: Partecipazione[];
  onSaved: () => void;
}

interface Selected { socio_id: number; posizione_prova: number | null; }

export function PartecipazioniDialog({ open, onOpenChange, evento, current, onSaved }: Props) {
  const [step, setStep] = useState(1);
  const [soci, setSoci] = useState<Socio[]>([]);
  const [selected, setSelected] = useState<Map<number, Selected>>(new Map());
  const [filter, setFilter] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(1); setErr(null); setFilter('');
    api<Socio[]>('/soci').then(setSoci);
    const m = new Map<number, Selected>();
    current.forEach(p => m.set(p.socio_id, { socio_id: p.socio_id, posizione_prova: p.posizione_prova }));
    setSelected(m);
  }, [open, current]);

  function toggle(s: Socio) {
    const m = new Map(selected);
    if (m.has(s.id)) m.delete(s.id);
    else m.set(s.id, { socio_id: s.id, posizione_prova: null });
    setSelected(m);
  }

  function setPos(socio_id: number, val: string) {
    const m = new Map(selected);
    const cur = m.get(socio_id);
    if (!cur) return;
    cur.posizione_prova = val.trim() === '' ? null : Number(val);
    m.set(socio_id, cur);
    setSelected(m);
  }

  async function save() {
    const partecipanti = [...selected.values()].map(s => ({
      socio_id: s.socio_id,
      posizione_prova: s.posizione_prova ?? undefined,
    }));
    try {
      await api(`/eventi/${evento.id}/partecipazioni`, {
        method: 'PUT', body: JSON.stringify({ partecipanti }),
      });
      onSaved(); onOpenChange(false);
    } catch (e: any) { setErr(e.message); }
  }

  const visible = soci.filter(s =>
    !filter
    || s.cognome.toLowerCase().includes(filter.toLowerCase())
    || String(s.numero_tessera).includes(filter));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Registra partecipanti — {evento.titolo}</DialogTitle></DialogHeader>
        {step === 1 && (
          <div className="space-y-3">
            <Input placeholder="Cerca…" value={filter} onChange={e => setFilter(e.target.value)} />
            <div className="max-h-80 overflow-auto rounded border">
              {visible.map(s => (
                <label key={s.id} className="flex items-center gap-2 border-b px-3 py-2 last:border-0">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s)} />
                  <span className="text-xs text-neutral-500 w-10">#{s.numero_tessera}</span>
                  <span>{s.cognome} {s.nome}</span>
                </label>
              ))}
            </div>
            <div className="text-sm text-neutral-600">{selected.size} selezionati</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
              {evento.prova_abilita
                ? <Button onClick={() => setStep(2)} disabled={selected.size === 0}>Avanti</Button>
                : <Button onClick={save} disabled={selected.size === 0}>Salva</Button>}
            </DialogFooter>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Inserisci la posizione nella prova abilità (lascia vuoto se non classificato).
              Scala: {evento.scala_prova?.join(' / ')}
            </p>
            <div className="max-h-80 overflow-auto rounded border">
              {[...selected.values()].map(s => {
                const socio = soci.find(x => x.id === s.socio_id)!;
                return (
                  <div key={s.socio_id} className="flex items-center gap-2 border-b px-3 py-2 last:border-0">
                    <span className="flex-1">{socio.cognome} {socio.nome}</span>
                    <Input className="w-20" type="number" min="1" value={s.posizione_prova ?? ''} onChange={e => setPos(s.socio_id, e.target.value)} />
                  </div>
                );
              })}
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Indietro</Button>
              <Button onClick={save}>Salva</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create `web/app/(app)/eventi/[id]/page.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { PartecipazioniDialog } from '@/components/partecipazioni-dialog';
import { api, apiPdf } from '@/lib/api';
import type { Evento, Partecipazione } from '@/lib/types';

type EventoDetail = Evento & { partecipazioni: (Partecipazione & { socio: any })[] };

export default function EventoPage() {
  const { id } = useParams<{ id: string }>();
  const [ev, setEv] = useState<EventoDetail | null>(null);
  const [open, setOpen] = useState(false);

  async function load() { setEv(await api<EventoDetail>(`/eventi/${id}`)); }
  useEffect(() => { load(); }, [id]);

  async function downloadPdf() {
    const blob = await apiPdf(`/pdf/evento/${id}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `evento-${id}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  if (!ev) return <div>Caricamento…</div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{ev.titolo}</h1>
          <p className="text-sm text-neutral-600">
            {new Date(ev.data_evento).toLocaleDateString('it-IT')} · {ev.categoria} · base {ev.punteggio_base} pt
            {ev.prova_abilita && ev.scala_prova && ` · prova: ${ev.scala_prova.join('/')}`}
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={downloadPdf}>Scarica PDF</Button>
          <Button onClick={() => setOpen(true)}>Registra partecipanti</Button>
        </div>
      </div>

      <Table>
        <Thead><Tr>
          {ev.prova_abilita && <Th>Pos. prova</Th>}
          <Th>Tessera</Th><Th>Cognome</Th><Th>Nome</Th><Th>Punteggio</Th>
        </Tr></Thead>
        <Tbody>
          {ev.partecipazioni.map(p => (
            <Tr key={p.id}>
              {ev.prova_abilita && <Td>{p.posizione_prova ?? '—'}</Td>}
              <Td>{p.socio.numero_tessera}</Td>
              <Td>{p.socio.cognome}</Td>
              <Td>{p.socio.nome}</Td>
              <Td className="font-semibold">{p.punteggio_totale}</Td>
            </Tr>
          ))}
          {ev.partecipazioni.length === 0 && <Tr><Td colSpan={5} className="text-center text-neutral-500">Nessun partecipante</Td></Tr>}
        </Tbody>
      </Table>

      <PartecipazioniDialog open={open} onOpenChange={setOpen} evento={ev} current={ev.partecipazioni} onSaved={load} />
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Create event with prova abilità → register partecipanti → assign positions → save → verify scores. Test event without prova → register without step 2.

- [ ] **Step 4: Commit**

```bash
git add web/app/\(app\)/eventi/\[id\] web/components/partecipazioni-dialog.tsx
git commit -m "feat(web): evento detail + partecipanti registration wizard"
```

---

## Task 18: Classifica page (Pagina 3)

**Files:**
- Create: `web/app/(app)/classifica/page.tsx`, `web/components/classifica-table.tsx`

- [ ] **Step 1: Create `web/components/classifica-table.tsx`**

```tsx
'use client';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import type { ClassificaResponse } from '@/lib/types';

export function ClassificaTable({ data }: { data: ClassificaResponse }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <Thead>
          <Tr>
            <Th>Pos</Th><Th>Tessera</Th><Th>Cognome</Th><Th>Nome</Th>
            {data.eventi.map(e => (
              <Th key={e.id} className="text-center" title={e.titolo}>
                {new Date(e.data_evento).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
              </Th>
            ))}
            <Th className="text-right">Tot</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.righe.map(r => (
            <Tr key={r.socio.id}>
              <Td>{r.posizione}</Td>
              <Td>{r.socio.numero_tessera}</Td>
              <Td>{r.socio.cognome}</Td>
              <Td>{r.socio.nome}</Td>
              {data.eventi.map(e => (
                <Td key={e.id} className="text-center">{r.punti_per_evento[String(e.id)] ?? ''}</Td>
              ))}
              <Td className="text-right font-bold">{r.totale}</Td>
            </Tr>
          ))}
          {data.righe.length === 0 && <Tr><Td colSpan={4 + data.eventi.length + 1} className="text-center text-neutral-500">Nessun dato</Td></Tr>}
        </Tbody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 2: Create `web/app/(app)/classifica/page.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ClassificaTable } from '@/components/classifica-table';
import { api, apiPdf } from '@/lib/api';
import type { Categoria, ClassificaResponse } from '@/lib/types';

export default function ClassificaPage() {
  const [cat, setCat] = useState<Categoria>('turismo');
  const [data, setData] = useState<ClassificaResponse | null>(null);

  useEffect(() => {
    api<ClassificaResponse>(`/classifica?categoria=${cat}`).then(setData);
  }, [cat]);

  async function pdf() {
    const blob = await apiPdf(`/pdf/classifica?categoria=${cat}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `classifica-${cat}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Classifica</h1>
        <Button variant="outline" onClick={pdf}>Scarica PDF</Button>
      </div>
      <Tabs value={cat} onValueChange={v => setCat(v as Categoria)}>
        <TabsList>
          <TabsTrigger value="turismo">Turismo</TabsTrigger>
          <TabsTrigger value="pista">Pista</TabsTrigger>
        </TabsList>
        <TabsContent value="turismo">{data && cat === 'turismo' && <ClassificaTable data={data} />}</TabsContent>
        <TabsContent value="pista">{data && cat === 'pista' && <ClassificaTable data={data} />}</TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

After registering some events with partecipazioni, classifica should populate. Switch tabs. Download PDF.

- [ ] **Step 4: Commit**

```bash
git add web/app/\(app\)/classifica web/components/classifica-table.tsx
git commit -m "feat(web): classifica page with tabs and PDF download"
```

---

## Task 19: Root redirect + final smoke test

**Files:**
- Create: `web/app/page.tsx`

- [ ] **Step 1: Create root redirect**

`web/app/page.tsx`:
```tsx
import { redirect } from 'next/navigation';
export default function Home() { redirect('/soci'); }
```

- [ ] **Step 2: Full rebuild and smoke test**

```bash
docker compose down
docker compose up -d --build
```

- [ ] **Step 3: End-to-end check**

In browser at http://localhost:3000:
1. Redirected to `/login`
2. Login with admin/admin123 → arrive at `/soci`
3. Sidebar shows Porsche logo and 3 nav links
4. Soci list populated from Excel (~190 rows)
5. Create new socio, edit, delete (untouched ones)
6. Eventi: create event "Test Pista" (categoria pista, base 25, prova on, scala [30,25,20])
7. Open event → register 3 partecipanti, assign positions 1/2/3 → save
8. Verify punteggi calcolati: socio pos1 = 25+30=55, pos2 = 50, pos3 = 45
9. Classifica → tab Pista → 3 righe ordinate per totale
10. Download PDF classifica e PDF evento → file scaricati e leggibili

- [ ] **Step 4: Commit and tag**

```bash
git add web/app/page.tsx
git commit -m "feat(web): root redirect to /soci"
git tag v0.1.0
```

---

## Verification Summary

After all tasks complete:
- `docker compose up -d --build` boots the full stack
- Login works, all 3 pages functional
- Soci pre-populated from Excel
- Event creation + partecipazioni registration calculates scores correctly
- Classifica accurate per categoria
- Both PDFs generate
- All git commits in sequence
