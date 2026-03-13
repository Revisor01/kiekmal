---
phase: 01-foundation
plan: 02
subsystem: database
tags: [postgresql, postgis, drizzle, docker]

requires:
  - phase: 01-foundation-01
    provides: Monorepo-Struktur mit @prayback/api workspace
provides:
  - PostgreSQL/PostGIS Datenbank mit congregations und events Schema
  - Drizzle ORM Konfiguration und Migration Pipeline
  - Docker Compose für lokale/Server DB
  - GIST-Index auf congregations.location
affects: [01-foundation-03, 02-event-discovery]

tech-stack:
  added: [drizzle-orm, drizzle-kit, pg, postgis/postgis:16-3.4]
  patterns: [Drizzle schema-first migrations, PostGIS geometry columns]

key-files:
  created:
    - docker-compose.yml
    - apps/api/src/db/schema.ts
    - apps/api/src/db/index.ts
    - apps/api/src/db/migrate.ts
    - apps/api/drizzle.config.ts
    - apps/api/drizzle/0000_create_postgis.sql
  modified:
    - apps/api/package.json

key-decisions:
  - "PostGIS Extension via custom SQL migration (0000_create_postgis.sql) statt Drizzle-Extension"
  - "DB läuft auf server.godsapp.de, nicht lokal — kein Docker Desktop nötig"

patterns-established:
  - "Drizzle Schema in apps/api/src/db/schema.ts — alle Tabellen hier definieren"
  - "Migrations via tsx src/db/migrate.ts — programmatisch, nicht CLI"
  - "Docker Compose für DB auf Server, Entwicklung lokal ohne Docker"

requirements-completed: [SC-1, SC-2]

duration: 8min
completed: 2026-03-13
---

# Plan 01-02: PostgreSQL/PostGIS + Drizzle Summary

**PostGIS-Datenbank mit congregations/events Schema, GIST-Index und Drizzle Migrations auf server.godsapp.de deployed**

## Performance

- **Duration:** 8 min
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- PostgreSQL/PostGIS 16-3.4 läuft als Docker Container auf server.godsapp.de
- Drizzle Schema mit congregations (PostGIS geometry point + GIST-Index) und events Tabellen
- Migrations erfolgreich auf Server ausgeführt
- PostGIS Extension aktiv, GIST-Index verifiziert

## Task Commits

1. **Task 1: Docker Compose und Drizzle-Schema** - `7219e87` (feat)
2. **Task 2: DB starten und Migrations ausführen** - manuell auf Server verifiziert

## Files Created/Modified
- `docker-compose.yml` - PostgreSQL/PostGIS Service mit Healthcheck
- `.env.example` - Beispiel-Umgebungsvariablen
- `apps/api/src/db/schema.ts` - Drizzle Schema (congregations, events, eventCategoryEnum)
- `apps/api/src/db/index.ts` - DB Connection Pool
- `apps/api/src/db/migrate.ts` - Programmatische Migration
- `apps/api/drizzle.config.ts` - Drizzle Kit Config mit extensionsFilters
- `apps/api/drizzle/0000_create_postgis.sql` - PostGIS Extension Setup

## Decisions Made
- DB auf Server statt lokal — kein Docker Desktop installiert, Server hat Docker
- Workflow: Code lokal → git push → Server git pull → docker-compose up
- Server-Repo unter /opt/stacks/prayback/

## Deviations from Plan
- Task 2 wurde auf server.godsapp.de statt lokal ausgeführt (kein Docker lokal)
- DB-Passwort initial falsch (hardcoded vs .env) — Volume neu erstellt mit korrektem Passwort

## Issues Encountered
- Docker Compose Plugin (`docker compose`) nicht auf Server — nutzt `docker-compose` v1.29.2
- Corepack auf Server veraltet — pnpm via npm installiert

## Next Phase Readiness
- DB bereit für Fastify-Server (Plan 01-03)
- Schema importierbar via `apps/api/src/db/schema.ts`

---
*Phase: 01-foundation*
*Completed: 2026-03-13*
