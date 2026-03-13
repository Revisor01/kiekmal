# Roadmap: Prayback

## Overview

Prayback wird in vier Phasen gebaut: Zuerst entsteht das technische Fundament (Monorepo, Datenbank, API-Gerüst), dann der erste echte Nutzerwert — eine Karte mit kirchlichen Events, die ohne Account benutzbar ist. In Phase 3 kommen Accounts, die Gemeinde-Admin-Verwaltung und das Web-Panel für manuelle Event-Pflege hinzu. Phase 4 schließt v1 mit dem automatischen ChurchDesk-Sync ab, der die Datenbasis ohne manuelle Arbeit füllt.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Monorepo-Setup, PostgreSQL/PostGIS, Fastify-API-Gerüst, Docker-Compose
- [ ] **Phase 2: Event Discovery** - Karte mit Events, Detailseiten, Filter, Navigation, Offline-Cache, Browse ohne Account
- [ ] **Phase 3: Auth + Admin** - User-Accounts, Gemeinde-Admin-Verifizierung, Einladungscode-System, Web-Panel
- [ ] **Phase 4: ChurchDesk-Sync** - Automatischer Event-Import aus ChurchDesk via BullMQ-Job

## Phase Details

### Phase 1: Foundation
**Goal**: Das Fundament steht — Entwickler können lokal arbeiten, Schema ist deployed, API antwortet
**Depends on**: Nothing (first phase)
**Requirements**: (keine direkt gemappten v1-Requirements — technische Voraussetzung für alle Phasen)
**Success Criteria** (what must be TRUE):
  1. `docker-compose up` startet Backend, PostgreSQL mit PostGIS und alle Services lokal ohne manuelle Eingriffe
  2. Drizzle-Migration läuft durch und legt Schema inkl. PostGIS-Geometrie-Spalten und GIST-Index an
  3. Fastify-API antwortet auf `GET /health` mit 200 OK
  4. Turborepo-Build läuft sauber durch (`turbo build` ohne Fehler für alle Packages)
  5. TypeScript-Types in `packages/types` sind von API und Mobile-App importierbar
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Turborepo-Monorepo-Grundstruktur (apps/api, apps/mobile, apps/admin, packages/types)
- [x] 01-02-PLAN.md — PostgreSQL/PostGIS + Drizzle-Schema + Docker-Compose-Umgebung
- [x] 01-03-PLAN.md — Fastify-API-Geruest mit Health-Endpoint, Vitest, Docker-Build und Deployment

### Phase 2: Event Discovery
**Goal**: Nutzer können auf einer Karte kirchliche Events in ihrer Nähe finden und Details einsehen — ohne Account
**Depends on**: Phase 1
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07, AUTH-01
**Success Criteria** (what must be TRUE):
  1. Nutzer öffnet App ohne Account und sieht eine Karte mit geclusterten Gemeinde- und Event-Markern in seiner Umgebung
  2. Nutzer kann Events nach Kategorie (Gottesdienst, Konzert, Jugend, etc.) und Radius/Datum filtern und die Karte aktualisiert sich
  3. Nutzer tippt auf einen Event-Marker und sieht alle Felder: Titel, Datum, Zeit, Ort, Personen, Beschreibung, Bild, Anmeldung, Preis, Mitbringen
  4. Nutzer tippt "Navigation starten" und wird an Google Maps / Apple Maps mit der Event-Adresse weitergeleitet
  5. Nutzer öffnet zuletzt besuchte Events und die Karte auch ohne Internetverbindung (Offline-Cache)
  6. Nutzer tippt auf eine Gemeinde und sieht das Gemeindeprofil: Name, Adresse, Website-Link, kommende Events
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md — Types erweitern, Event-API mit PostGIS-Radius-Query und Filtern, Congregations-Endpoint
- [ ] 02-02-PLAN.md — Expo SDK 52 initialisieren, MapView mit Supercluster-Clustering
- [ ] 02-03-PLAN.md — API-Anbindung, FilterBar, Event-Detailseite, Gemeindeprofil, Maps-Navigation
- [ ] 02-04-PLAN.md — Offline-Cache mit MMKV und TanStack Query Persistence

### Phase 3: Auth + Admin
**Goal**: Nutzer können Accounts erstellen, Gemeinde-Admins können verifiziert werden und Events über ein Web-Panel pflegen
**Depends on**: Phase 2
**Requirements**: AUTH-02, AUTH-03, ADMN-01, ADMN-02, ADMN-03, ADMN-04
**Success Criteria** (what must be TRUE):
  1. Nutzer kann Account mit E-Mail und Passwort erstellen und sich einloggen; die Session bleibt nach App-Neustart erhalten
  2. Eine Person kann über die App einen Admin-Antrag für eine Gemeinde stellen; der Antrag erscheint zur manuellen Prüfung
  3. Ein verifizierter Admin kann einen Einladungscode generieren und damit einen weiteren Admin hinzufügen
  4. Admin kann im Web-Panel Events für seine Gemeinde anlegen, bearbeiten und löschen
  5. Admin kann das Gemeindeprofil (Name, Adresse, Website) im Web-Panel aktualisieren und die Änderung ist sofort in der App sichtbar
**Plans**: TBD

Plans:
- [ ] 03-01: Auth-Service: JWT-Login, Registrierung, Session-Persistenz (@fastify/jwt, @fastify/rate-limit)
- [ ] 03-02: Admin-Verifizierungs-Flow: Antrag, manuelle Prüfung, Einladungscode-System mit Ablaufdatum
- [ ] 03-03: Web-Panel (apps/admin): Event-CRUD, Gemeindeprofil-Pflege, rollenbasierte API-Endpunkte

### Phase 4: ChurchDesk-Sync
**Goal**: Events aus ChurchDesk-Gemeinden erscheinen automatisch auf der Karte ohne manuelle Eingabe
**Depends on**: Phase 3
**Requirements**: ADMN-05
**Success Criteria** (what must be TRUE):
  1. Events aus einer ChurchDesk-verknüpften Gemeinde erscheinen nach spätestens 4 Stunden automatisch auf der Karte
  2. Wenn ChurchDesk nicht erreichbar ist, bleiben bestehende Events erhalten und die App funktioniert weiterhin (stale data, keine kaputte App)
  3. Im Web-Panel ist der Sync-Status pro Gemeinde sichtbar (letzter Sync, Fehler falls vorhanden)
  4. ChurchDesk-Events und manuell eingetragene Events erscheinen einheitlich in derselben Listenansicht
**Plans**: TBD

Plans:
- [ ] 04-01: ChurchDesk-Sync-Service: BullMQ-Cron-Job (4h), Upsert-by-External-ID, Exponential-Backoff, Sync-Status-Tracking

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-03-13 |
| 2. Event Discovery | 0/4 | In progress | - |
| 3. Auth + Admin | 0/3 | Not started | - |
| 4. ChurchDesk-Sync | 0/1 | Not started | - |

---
*Roadmap created: 2026-03-13*
*Coverage: 15/15 v1 requirements mapped*
