---
phase: 02-event-discovery
plan: 01
subsystem: api
tags: [fastify, drizzle, postgis, zod, typescript, postgres]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Fastify-API mit health-Route, Drizzle-Schema, DB auf server.godsapp.de

provides:
  - GET /events mit PostGIS ST_DWithin Radius-Query und Kategorie-/Datum-Filtern
  - GET /congregations/:id mit Gemeindeprofil und kommenden Events
  - EventListItemDTO und CongregationDetailDTO Typen
  - fastify-type-provider-zod Integration fuer Request-Validierung
  - @fastify/cors fuer CORS-Support

affects: [02-02, 02-03, 02-04, mobile-app]

# Tech tracking
tech-stack:
  added: [fastify-type-provider-zod, zod, "@fastify/cors"]
  patterns:
    - "Zod-Schema als Single Source of Truth fuer Query-Validierung und TypeScript-Typen"
    - "PostGIS ST_DWithin mit ::geography Cast fuer Meter-basierte Radius-Suche"
    - "Inner Join events->congregations fuer Location-Extraktion via ST_X/ST_Y"
    - "withTypeProvider<ZodTypeProvider>() pro Route fuer typsichere Handler"

key-files:
  created:
    - apps/api/src/routes/events.ts
    - apps/api/src/routes/congregations.ts
    - apps/api/src/__tests__/events.test.ts
    - apps/api/src/__tests__/congregations.test.ts
  modified:
    - packages/types/src/index.ts
    - apps/api/src/server.ts
    - apps/api/package.json

key-decisions:
  - "fastify-type-provider-zod als Validierungsschicht — Zod-Schema direkt als Fastify-Schema ohne Duplikation"
  - "ST_DWithin mit ::geography Cast — gibt Meter-genaue Distanz ohne Koordinaten-Umrechnung"
  - "PostGIS lon-first Konvention: ST_MakePoint(lon, lat) nicht (lat, lon)"
  - "DB-Migration muss vor Tests laufen — events/congregations Tabellen waren auf Server noch nicht angelegt"
  - "SSH-Tunnel auf Container-IP (nicht localhost) notwendig, da DB-Port nicht auf Host gemappt"

patterns-established:
  - "Route-Dateien exportieren FastifyPluginAsync Default-Export"
  - "Koordinaten-Extraktion: ST_Y(geometry) = lat, ST_X(geometry) = lon"
  - "Tests nutzen app.inject() Pattern ohne echten HTTP-Stack"

requirements-completed: [DISC-01, DISC-02, DISC-03, DISC-04, DISC-07, AUTH-01]

# Metrics
duration: 25min
completed: 2026-03-13
---

# Phase 2 Plan 01: Event Discovery API Summary

**GET /events mit PostGIS-Radius-Query und GET /congregations/:id via fastify-type-provider-zod mit Zod-Validierung und 10 gruenen Tests**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-13T18:36:07Z
- **Completed:** 2026-03-13T18:47:10Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- GET /events mit PostGIS ST_DWithin Radius-Query (Pflichtfelder: lat/lon, default 10km), Kategorie- und Datumfilter
- GET /congregations/:id mit UUID-Validierung, 404-Handling und kommenden Events (max 20, chronologisch)
- EventDTO um price/registrationUrl/bringItems/persons erweitert, EventListItemDTO und CongregationDetailDTO hinzugefuegt
- 10 Tests gruen, Deployment auf kiek-mal.de verifiziert

## Task Commits

1. **Task 1: Type-Contracts und Dependencies** - `d1215cd` (feat)
2. **Task 2: GET /events Endpoint** - `379cbc9` (feat)
3. **Task 3: GET /congregations/:id Endpoint** - `21537b9` (feat)

## Files Created/Modified

- `packages/types/src/index.ts` - EventDTO erweitert, EventListItemDTO und CongregationDetailDTO hinzugefuegt
- `apps/api/src/routes/events.ts` - GET /events mit PostGIS-Query, Zod-Validierung, Filtern
- `apps/api/src/routes/congregations.ts` - GET /congregations/:id mit UUID-Param, 404-Handling, Events-Query
- `apps/api/src/server.ts` - Zod TypeProvider, CORS, neue Routen registriert
- `apps/api/src/__tests__/events.test.ts` - 6 Tests fuer Validierung und Response
- `apps/api/src/__tests__/congregations.test.ts` - 3 Tests fuer UUID-Validierung und 404
- `apps/api/package.json` - fastify-type-provider-zod, zod, @fastify/cors hinzugefuegt

## Decisions Made

- **fastify-type-provider-zod:** Zod-Schemas direkt als Fastify-Schemas — kein separates JSON-Schema noetig
- **ST_DWithin mit ::geography:** Meter-genaue Distanz ohne manuellen Koordinaten-Umrechnung
- **lon-first in PostGIS:** ST_MakePoint(lon, lat) — NICHT (lat, lon), sonst falsche Ergebnisse

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] DB-Migration fehlte — events/congregations Tabellen nicht in Produktions-DB**
- **Found during:** Task 2 (Tests lieferten 500 "relation events does not exist")
- **Issue:** Die Drizzle-Migrationen wurden nach Phase-1-Deployment nie ausgefuehrt
- **Fix:** `pnpm --filter @prayback/api db:migrate` ueber SSH-Tunnel gegen Produktions-DB
- **Files modified:** keine Code-Aenderungen — nur DB-Schema angelegt
- **Verification:** `docker exec prayback_db_1 psql -U prayback -c '\dt public.*'` zeigt congregations und events
- **Committed in:** Teil von Task-2-Commit 379cbc9

**2. [Rule 3 - Blocking] SSH-Tunnel auf Docker-Container-IP notwendig**
- **Found during:** Task 2 (ECONNRESET bei Verbindung ueber localhost:5432)
- **Issue:** DB-Port 5432 ist nicht auf den Host gemappt — Tunnel auf localhost:5432 schlug fehl
- **Fix:** SSH-Tunnel auf Container-IP 172.24.0.2:5432 statt localhost:5432 (lokaler Port 5433)
- **Files modified:** keine
- **Verification:** `SELECT 1` erfolgreich, Tests gruenen

---

**Total deviations:** 2 auto-fixed (beide Rule 3 - Blocking)
**Impact on plan:** Beide Fixes notwendig um Tests laufen zu lassen. Kein Scope Creep.

## Issues Encountered

- docker-compose v1.29.2 auf dem Server hat einen Bug mit `ContainerConfig` bei neuen Docker-Images — Workaround: alten Container manuell loeschen, dann `docker-compose up -d` funktioniert
- Commits muessen erst auf GitHub gepusht werden bevor `git pull` auf dem Server die neuen Dateien holt

## Next Phase Readiness

- GET /events und GET /congregations/:id auf kiek-mal.de produktiv
- DB-Schema vollstaendig migriert (events + congregations Tabellen)
- Basis fuer ChurchDesk-Sync (Phase 4) vorhanden
- Naechster Schritt: Plan 02-02 (Mobile Map UI oder ChurchDesk-Daten-Import)

---
*Phase: 02-event-discovery*
*Completed: 2026-03-13*
