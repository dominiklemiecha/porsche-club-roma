# Porsche Club Roma — CRM

Gestionale soci, eventi e classifica.

## Sviluppo locale

```bash
cp .env.example .env   # poi modifica i valori
docker compose up -d --build
```

Apri http://localhost:3100 e accedi con le credenziali in `.env` (`ADMIN_USER` / `ADMIN_PASS`).

Al primo avvio l'app crea l'utente admin e importa i soci da `def_2026 Classifica PCR.xlsx`.

## Deploy in produzione

Vedi `docker-compose.prod.yml` e `.env.production.example`.

## Stack

PostgreSQL · NestJS · Prisma · Next.js · Tailwind · Docker Compose
