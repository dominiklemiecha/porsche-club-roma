# CRM Porsche Club Roma

Gestionale soci/eventi/classifica per Porsche Club Roma.

## Avvio

1. `cp .env.example .env` (su Windows: `copy .env.example .env`) e modifica i valori
2. (Opzionale) sostituisci il logo placeholder con il logo Porsche reale:
   - `web/public/porsche-logo.svg`
   - `api/assets/porsche-logo.png`
3. `docker compose up -d --build`
4. Apri http://localhost:3000 e accedi con le credenziali admin (`ADMIN_USER` / `ADMIN_PASS` da `.env`)

Al primo avvio:
- viene creato l'utente admin
- vengono importati i soci dal file `def_2026 Classifica PCR.xlsx`

## Struttura

- `api/` — NestJS + Prisma + PostgreSQL
- `web/` — Next.js 15 (App Router) + Tailwind
- `db/` — volume Postgres persistente in `./data/pg`

## Stack

PostgreSQL 16 · NestJS 10 · Prisma 5 · Next.js 15 · Tailwind · Docker Compose
