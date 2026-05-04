# CRM Porsche Club Roma — Design Doc

**Data:** 2026-05-04
**Stato:** approvato (brainstorming)

## 1. Obiettivo

Sostituire il foglio Excel `def_2026 Classifica PCR.xlsx` con un CRM web a 3 pagine per gestire soci, eventi e classifica annuale del Porsche Club Roma. Tutto containerizzato con Docker.

## 2. Stack & Architettura

Tre servizi orchestrati via `docker compose`:

| Servizio | Tecnologia | Porta | Note |
|----------|------------|-------|------|
| `db`     | PostgreSQL 16 | 5432 (interno) | volume `./data/pg` |
| `api`    | NestJS + TypeScript + Prisma | 3001 | REST JSON, JWT cookie httpOnly |
| `web`    | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui | 3000 | SSR + client components |

**Comunicazione:** browser → `web` (Next) → `api` (Nest) → `db` (Postgres).
**PDF:** generati lato `api` con `pdfkit`, restituiti come `application/pdf` streaming.
**Auth:** singolo admin. Credenziali in env vars (`ADMIN_USER`, `ADMIN_PASS`). Login restituisce JWT in cookie httpOnly. Tutte le rotte API protette tranne `/auth/login`.

**Struttura repo:**
```
porsche/
├── docker-compose.yml
├── .env.example
├── api/                  (NestJS)
│   ├── prisma/schema.prisma
│   ├── src/...
│   └── assets/porsche-logo.png
├── web/                  (Next.js)
│   ├── app/(auth)/login/
│   ├── app/(app)/soci/
│   ├── app/(app)/eventi/
│   ├── app/(app)/classifica/
│   └── public/porsche-logo.svg
├── data/                 (volume Postgres, gitignored)
└── def_2026 Classifica PCR.xlsx  (montato read-only nel container api per il seed)
```

## 3. Modello Dati

```sql
soci (
  id              SERIAL PK,
  numero_tessera  INT UNIQUE NOT NULL,
  nome            VARCHAR(100) NOT NULL,
  cognome         VARCHAR(100) NOT NULL,
  created_at      TIMESTAMP DEFAULT now()
)

eventi (
  id              SERIAL PK,
  titolo          VARCHAR(200) NOT NULL,
  data_evento     DATE NOT NULL,
  categoria       categoria_enum NOT NULL,         -- 'turismo' | 'pista'
  punteggio_base  INT NOT NULL CHECK (>= 0),
  prova_abilita   BOOLEAN NOT NULL DEFAULT false,
  scala_prova     JSONB,                           -- es. [30,25,20,15,10,5]; NULL se prova_abilita=false
  created_at      TIMESTAMP DEFAULT now()
)

partecipazioni (
  id                SERIAL PK,
  evento_id         INT NOT NULL REFERENCES eventi(id) ON DELETE CASCADE,
  socio_id          INT NOT NULL REFERENCES soci(id) ON DELETE RESTRICT,
  posizione_prova   INT,                            -- 1..N, NULL se evento senza prova o socio non classificato
  punteggio_totale  INT NOT NULL,                   -- calcolato server-side
  UNIQUE (evento_id, socio_id)
)

admin_users (
  id              SERIAL PK,
  username        VARCHAR(50) UNIQUE NOT NULL,
  password_hash   VARCHAR(100) NOT NULL
)
```

**Regole calcolo `punteggio_totale`:**
- Base: `eventi.punteggio_base` (sempre, se il socio è in `partecipazioni`).
- Bonus prova: se `eventi.prova_abilita = true` e `posizione_prova` è valorizzata e ≤ `length(scala_prova)`, aggiungi `scala_prova[posizione_prova - 1]`.
- Validazione: `posizione_prova` solo se `prova_abilita=true`. Una sola posizione per evento (UNIQUE check applicativo).

## 4. API REST

Tutte le rotte (eccetto `/auth/login`) richiedono JWT cookie valido.

### Auth
- `POST /auth/login` — body `{username, password}` → set cookie + `{ok:true}`
- `POST /auth/logout` — clear cookie
- `GET  /auth/me` — `{username}` o 401

### Soci (Pagina 1)
- `GET    /soci?q=...` — lista
- `POST   /soci` — `{numero_tessera, nome, cognome}`
- `PATCH  /soci/:id`
- `DELETE /soci/:id` — 409 se ha partecipazioni

### Eventi (Pagina 2)
- `GET    /eventi?categoria=...`
- `GET    /eventi/:id` — include partecipazioni con dati socio
- `POST   /eventi` — `{titolo, data_evento, categoria, punteggio_base, prova_abilita, scala_prova?}`
- `PATCH  /eventi/:id`
- `DELETE /eventi/:id` — cascade su partecipazioni
- `PUT    /eventi/:id/partecipazioni` — `{partecipanti: [{socio_id, posizione_prova?}]}` — sostituisce tutte le partecipazioni dell'evento, ricalcolando `punteggio_totale` server-side. Atomic in transazione.

### Classifica (Pagina 3)
- `GET /classifica?categoria=turismo|pista` →
  ```json
  {
    "categoria": "turismo",
    "eventi": [{"id":1,"titolo":"...","data":"2026-..."}, ...],
    "righe": [
      {
        "posizione": 1,
        "socio": {"id":12,"numero_tessera":1,"nome":"Gian Luca","cognome":"Perna"},
        "totale": 190,
        "punti_per_evento": {"1": 10, "2": 9, ...}
      }
    ]
  }
  ```
  Eventi ordinati per `data_evento`. Righe ordinate per `totale DESC`, tie-break `cognome ASC`.

### PDF
- `GET /pdf/classifica?categoria=...` → `application/pdf` (landscape A4)
- `GET /pdf/evento/:id` → `application/pdf` (portrait A4)

## 5. UI Web (Next.js)

**Layout app (autenticato):** sidebar fissa a sinistra con logo Porsche in alto, link a Soci / Eventi / Classifica, bottone logout in fondo. Topbar con titolo pagina corrente. Tema chiaro, font Inter, accenti rossi per richiamo Porsche.

**Logo:** file `web/public/porsche-logo.svg` da fornire dall'utente. Codice usa un placeholder SVG generico finché non sostituito.

### Pagina 1 — `/soci`
- Tabella: tessera | cognome | nome | azioni
- Search bar (filtra cognome/tessera)
- Bottone "+ Nuovo socio" → dialog (3 campi obbligatori)
- Modifica via dialog, eliminazione con conferma

### Pagina 2 — `/eventi`
- Tabella eventi: data | titolo | categoria (badge) | punteggio base | prova abilità (sì/no) | n° partecipanti | azioni
- "+ Nuovo evento" → dialog: titolo, data, categoria, punteggio base, toggle prova abilità → se on, lista editabile scala punteggi (aggiungi/rimuovi posizioni)
- Click riga → `/eventi/:id`:
  - Riepilogo evento (con bottone Modifica)
  - Sezione "Partecipanti": tabella con posizione prova (se applicabile), socio, punti base, punti prova, totale
  - "Registra partecipanti" → dialog wizard:
    - Step 1: multi-select soci (search + checkbox)
    - Step 2 (solo se prova abilità): per ogni socio selezionato, input numerico posizione (validazione: 1..N, no duplicati). Posizione vuota = solo punti base.
  - "Scarica PDF evento" → download

### Pagina 3 — `/classifica`
- Tab: **Turismo** | **Pista**
- Tabella ad ampia larghezza: pos | tessera | cognome | nome | una colonna per ogni evento (header con data breve + titolo abbreviato, tooltip pieno) | **Totale**
- Cella vuota = non partecipato; valore = punteggio guadagnato
- Bottone "Scarica PDF classifica"

## 6. Generazione PDF

Libreria `pdfkit` lato NestJS, streaming.

**PDF Classifica:**
- Orientamento: landscape A4
- Header: logo + "Classifica [Turismo|Pista] — Porsche Club Roma 2026" + data generazione
- Tabella: pos | tessera | cognome | nome | colonne eventi | totale
- Footer: pagina X/Y

**PDF Evento:**
- Orientamento: portrait A4
- Header: logo + titolo evento + data + categoria + punteggio base + (se prova) scala punteggi
- Tabella partecipanti ordinata per totale desc: pos prova | tessera | cognome | nome | base | prova | totale
- Footer: pagina X/Y

## 7. Seed Iniziale

Eseguito dal container `api` al boot se le tabelle sono vuote.

**Soci:** legge `def_2026 Classifica PCR.xlsx` (montato `:/seed/soci.xlsx:ro`) con `exceljs`. Foglio "Classifica PCR". Estrae colonne `#` → `numero_tessera`, `Cognome`, `Nome`. Salta riga di intestazione e riga con `#=0` (riga punteggi massimi). Insert con `ON CONFLICT (numero_tessera) DO NOTHING`.

**Admin:** se `admin_users` vuota, crea record con `username = ADMIN_USER` e `password_hash = bcrypt(ADMIN_PASS, 10)`.

**Eventi:** non importati. L'admin li registra dall'interfaccia.

## 8. docker-compose.yml (sintesi)

```yaml
services:
  db:
    image: postgres:16
    environment: { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB }
    volumes: ["./data/pg:/var/lib/postgresql/data"]
  api:
    build: ./api
    depends_on: [db]
    environment:
      DATABASE_URL: postgresql://...@db:5432/porsche
      JWT_SECRET: ...
      ADMIN_USER: admin
      ADMIN_PASS: <plain, hashed at first boot>
    volumes:
      - "./def_2026 Classifica PCR.xlsx:/seed/soci.xlsx:ro"
    ports: ["3001:3001"]
  web:
    build: ./web
    depends_on: [api]
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    ports: ["3000:3000"]
```

`.env.example` con tutte le variabili.

## 9. Sicurezza

- JWT in cookie httpOnly, SameSite=Lax, secure in prod
- bcrypt per password
- CORS: solo `http://localhost:3000` (configurabile via env)
- Validazione input lato API con `class-validator`
- Rate limit basico su `/auth/login`

## 10. Out of Scope (YAGNI)

- Multi-utente / ruoli (solo single admin)
- Email/notifiche
- Storico anni precedenti (modello supporta più stagioni se servirà — `data_evento` permette filtri, non c'è entità `Stagione` esplicita)
- Import eventi da Excel
- Mobile app
- Esportazione CSV (solo PDF)

## 11. Testing

- API: unit test su servizi di calcolo punteggi (Jest), e2e su rotte principali (Supertest)
- Web: smoke test manuale dopo `docker compose up`
