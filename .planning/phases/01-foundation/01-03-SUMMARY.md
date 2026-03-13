---
phase: 01-foundation
plan: 03
subsystem: api
tags: [fastify, vitest, docker, traefik, health-endpoint]

requires:
  - phase: 01-foundation-01
    provides: Monorepo-Struktur mit @prayback/api workspace
  - phase: 01-foundation-02
    provides: PostgreSQL/PostGIS DB mit Drizzle Schema

provides:
  - Fastify-Server mit buildApp() Factory fuer testbare Instanz
  - GET /health Endpoint mit JSON {status, timestamp}
  - Vitest-Test via app.inject() (kein HTTP-Server noetig)
  - Multi-stage Dockerfile mit Repo-Root als Build-Context
  - docker-compose.prod.yml mit Traefik-Labels fuer kiek-mal.de

affects: [02-event-discovery, 03-admin-ui, all-api-routes]

tech-stack:
  added: [fastify@5, vitest@3]
  patterns:
    - buildApp() Factory-Funktion fuer Fastify — ermoeglicht Unit-Tests via inject() ohne HTTP-Stack
    - Multi-stage Docker Build mit pnpm Workspace-Filterung
    - Traefik-Labels direkt im docker-compose.prod.yml

key-files:
  created:
    - apps/api/src/server.ts
    - apps/api/src/routes/health.ts
    - apps/api/src/__tests__/health.test.ts
    - apps/api/vitest.config.ts
    - apps/api/Dockerfile
    - apps/api/.dockerignore
    - docker-compose.prod.yml
  modified:
    - apps/api/src/index.ts
    - apps/api/package.json
    - docker-compose.yml

key-decisions:
  - "buildApp() als Factory exportiert (nicht direkt starten) — ermoeglicht app.inject() in Tests ohne laufenden Server"
  - "logger: false in buildApp() fuer Tests — vermeidet Log-Rauschen in Testausgabe"
  - "Docker Build-Context ist Repo-Root — pnpm Workspaces benoetigen Zugriff auf alle package.json und pnpm-lock.yaml"
  - "docker-compose.prod.yml enthaelt eigenstaendigen DB-Service — kein Rueckgriff auf lokale docker-compose.yml auf Server"

patterns-established:
  - "Fastify Plugins via fastify.register() registrieren — jede Route-Gruppe als eigenes Plugin"
  - "Tests via app.inject() schreiben — kein echter HTTP-Server noetig"

requirements-completed: [SC-3]

duration: 12min
completed: 2026-03-13
---

# Phase 1 Plan 3: Fastify-API-Geruest mit Health-Endpoint Summary

**Fastify-Server mit buildApp()-Factory, GET /health Endpoint, Vitest-Test via inject(), Multi-stage Dockerfile und Traefik-ready docker-compose.prod.yml fuer kiek-mal.de**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-13T15:58:00Z
- **Completed:** 2026-03-13T16:10:00Z
- **Tasks:** 2 (+ 1 Checkpoint ausstehend)
- **Files modified:** 10

## Accomplishments
- Fastify-Server mit testbarer buildApp()-Factory — kein HTTP-Stack noetig fuer Unit-Tests
- GET /health gibt 200 mit {status: "ok", timestamp: ISO-String} zurueck, Vitest-Test gruen
- Multi-stage Dockerfile fuer Repo-Root Build-Context mit pnpm Workspace-Unterstuetzung
- docker-compose.prod.yml deployment-ready mit Traefik-Labels fuer kiek-mal.de

## Task Commits

1. **Task 1: Fastify-Server mit Health-Endpoint und Vitest-Setup** - `1d86e4d` (feat)
2. **Task 2: Dockerfile und Produktions-Docker-Compose** - `1de2bb2` (feat)

## Files Created/Modified
- `apps/api/src/server.ts` - buildApp() Factory mit healthRoutes-Plugin
- `apps/api/src/routes/health.ts` - FastifyPluginAsync fuer GET /health
- `apps/api/src/__tests__/health.test.ts` - Vitest-Test via app.inject()
- `apps/api/vitest.config.ts` - Vitest-Konfiguration mit globals: true
- `apps/api/src/index.ts` - Entrypoint: buildApp() + listen auf 0.0.0.0
- `apps/api/package.json` - fastify@5, vitest@3, start/test scripts
- `apps/api/Dockerfile` - Multi-stage Build (base/deps/build/production)
- `apps/api/.dockerignore` - node_modules, dist, .turbo
- `docker-compose.prod.yml` - Produktions-Stack mit Traefik-Labels fuer kiek-mal.de
- `docker-compose.yml` - Optionaler API-Service fuer lokalen Docker-Test

## Decisions Made
- `buildApp()` als Factory exportiert (nicht direkt starten) — ermoeglicht saubere Unit-Tests
- `logger: false` in buildApp() — Tests bleiben sauber ohne Log-Output
- Build-Context ist Repo-Root — zwingend noetig fuer pnpm Workspace-Auflosung
- docker-compose.prod.yml hat eigenstaendigen DB-Service — Server braucht keine separate DB-Config

## Deviations from Plan

### Abweichung: Docker-Build-Verify lokal uebersprungen

- **Gefunden bei:** Task 2
- **Grund:** Kein Docker Desktop lokal installiert — Docker laeuft nur auf server.godsapp.de
- **Massnahme:** Build-Verify wird beim Deployment auf dem Server durchgefuehrt
- **Impact:** Kein funktionaler Unterschied — Checkpoint deckt Deployment-Verifikation ab

---

**Total deviations:** 1 (geplant/dokumentiert in Aufgabenstellung)
**Impact:** Kein Scope Creep, Build-Verifikation erfolgt auf Server

## Issues Encountered
- Kein Docker lokal — Build-Verify-Schritt per Design uebersprungen (keine unerwarteten Probleme)

## User Setup Required

Deployment auf server.godsapp.de (beim Checkpoint):
1. `ssh root@server.godsapp.de`
2. `cd /opt/stacks/prayback && git pull`
3. `.env` mit POSTGRES_PASSWORD erstellen
4. KeyHelp vHost fuer kiek-mal.de anlegen (Custom Config fuer Traefik)
5. `docker-compose -f docker-compose.prod.yml up -d --build`
6. `curl https://kiek-mal.de/health` — erwartet: `{"status":"ok","timestamp":"..."}`

## Next Phase Readiness
- Fastify-API-Geruest bereit fuer weitere Routes (Plan 02)
- Health-Endpoint als Deployment-Probe nutzbar
- Vitest-Setup fuer weitere Tests vorhanden
- Deployment ausstehend: Checkpoint wartet auf Server-Deployment-Bestaetigung

---
*Phase: 01-foundation*
*Completed: 2026-03-13*
