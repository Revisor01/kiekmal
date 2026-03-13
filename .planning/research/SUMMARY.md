# Project Research Summary

**Project:** Prayback
**Domain:** Church event discovery app with maps, gamification, and ChurchDesk integration (React Native / Expo + Node.js)
**Researched:** 2026-03-13
**Confidence:** MEDIUM

## Executive Summary

Prayback ist eine konfessionsübergreifende Event-Discovery-App für Kirchengemeinden in Deutschland, die eine unbesetzte Nische besetzt: Kein bestehender Wettbewerber kombiniert kartenbasierte Discovery für Außenstehende, ChurchDesk-Integration und Gamification. Die App folgt einem gut dokumentierten Stack-Muster — Expo SDK 55 + React Native als Frontend, Fastify + PostgreSQL/PostGIS als Backend, BullMQ für asynchrone Jobs. Das grösste Risiko ist nicht technischer Natur, sondern ein Supply-Problem: Ohne ausreichend Gemeinden mit Events ist die Karte beim Launch leer und der Kernwert der App nicht erfahrbar.

Die empfohlene Architektur ist ein Node.js-Monolith mit Turborepo-Monorepo-Struktur, der die drei Clients (Mobile-App, Web-Admin-Panel, ChurchDesk-Sync) über eine gemeinsame Fastify-API verbindet. PostGIS übernimmt Geo-Queries, BullMQ die asynchrone Verarbeitung des ChurchDesk-Syncs und der Gamification-Auswertung. Shared TypeScript-Types zwischen Frontend und Backend verhindern Schnittstellendrift — besonders wichtig bei den GeoJSON/Koordinaten-Datenstrukturen, die an mehreren Stellen verwendet werden.

Das kritischste technische Risiko ist der Known Bug in react-native-maps mit Expo SDK 55 auf iOS: Google Maps als Provider ist defekt (Issue #43288, ungelöst Stand März 2026), daher muss iOS mit Apple Maps (PROVIDER_DEFAULT) gearbeitet werden. Das grösste strategische Risiko ist das Gamification-Framing: Kirchenbesuche als Punkte-System zu behandeln kann auf die ältere Zielgruppe manipulativ wirken. Beide Risiken sind handhabbar, müssen aber von Beginn an in Design und Implementierung berücksichtigt werden, nicht als Retrofit.

## Key Findings

### Recommended Stack

Expo SDK 55 (CNG-basiert, kein manuelles Native-Code-Management) mit Expo Router als File-based Navigation ist der klare Favorit für ein Zwei-Personen-Team. Auf der Backend-Seite ist Fastify der Nachfolger von Express für Greenfield-Projekte in 2026 — mit nativem TypeScript, JSON-Schema-Validierung und 2–3x höherem Durchsatz. PostgreSQL mit PostGIS 3.4 ist die einzige vernünftige Wahl für Geo-Queries. Die wichtigste Versionsbeschränkung: `react-native-maps` auf iOS muss auf Apple Maps (PROVIDER_DEFAULT) bleiben und auf Version 1.26.x gepinnt werden, solange der SDK-55-Bug offen ist.

**Core technologies:**
- **Expo SDK 55 + Expo Router:** Cross-platform Build-Toolchain + File-based Navigation — CNG eliminiert manuellen Native-Code, EAS Build/Update ermöglicht OTA-Fixes
- **Fastify 5.x + Node.js 22 LTS:** Backend-Framework — 2–3x schneller als Express, native TypeScript-Unterstützung, JSON-Schema-Validation out of the box
- **PostgreSQL 16 + PostGIS 3.4:** Primäre Datenbank — `ST_DWithin` + GIST-Index für performante Radius-Queries; keine Alternative für Geo-Daten in dieser Größenordnung
- **Drizzle ORM 0.31+:** Type-safe DB-Client mit PostGIS-Unterstützung — leichter als Prisma, kein 40MB Query-Engine-Binary
- **Redis 7 + BullMQ 5:** Job-Queue für ChurchDesk-Sync und Gamification — Redis-backed, survives restarts, Cron-Support
- **TanStack Query 5 + MMKV 3:** Offline-Cache-Schicht — 30x schneller als AsyncStorage, cross-session persistent via Async-Storage-Persister
- **react-native-maps 1.26.x (gepinnt):** Karten-Rendering — Apple Maps auf iOS (Bug-Workaround), Google Maps auf Android

### Expected Features

**Must have (table stakes):**
- Karte mit Events und Marker-Clustering — Kernwert der App, ohne sie gibt es nichts zu validieren
- Event-Liste als Listenalternative — Barrierefreiheit für 60+-Zielgruppe
- Event-Detailseite (alle Felder) — Entscheidungsgrundlage für Nutzer
- Kategoriefilter (Gottesdienst, Konzert, Jugend, etc.) — ohne Filter unbrauchbar bei vielen Events
- Navigation starten (Deep-Link zu Apple/Google Maps) — Use-Case unvollständig ohne das
- Browse ohne Account — niedrige Einstiegshürde, oberste Priorität
- Gemeindeprofil (minimal) — Nutzer wollen wissen, wer das Event ausrichtet
- Manuelle Event-Eingabe durch verifizierten Gemeinde-Admin
- Gemeinde-Admin-Verifizierung (Antrag + Einladungscode)
- User-Account mit Prayback-Punkten und QR-Code-Check-In
- Badges / Achievements (Basis-Set)
- Offline-Cache (geladene Events und Kartendaten)
- ChurchDesk-Synchronisation — skaliert Datenbasis ohne manuelle Arbeit

**Should have (competitive):**
- Geofencing als Komfort-Check-In-Layer (optional, nie primär) — verbessert UX für 60+
- Web-Panel für Sekretariate — wenn App-Eingabe zu unkomfortabel ist
- Ansprechpartner-Verzeichnis — wenn Gemeinden bereit sind Kontakte zu pflegen
- Push-Benachrichtigungen (Opt-in) — nach Validierung der Nutzerbasis

**Defer (v2+):**
- KI-Empfehlungen / Personalisierung — braucht Verhaltensdaten im Umfang
- Erweiterte Badge-Sets (Kirchenkreis-Badges, Jahres-Badges)
- iOS/Android Widgets
- Konfessionsfilter in der Suche (wenn Nutzerfeedback es belegt)

**Explizit nicht bauen:**
- Leaderboards / öffentliche Rankings — kontraproduktiv im kirchlichen Kontext
- In-App-Chat / Messaging — Moderationsrisiko, Datenschutz, Out-of-Scope
- Serientermin-Logik — ChurchDesk liefert Einzelinstanzen; eigene Logik verdoppelt Komplexität

### Architecture Approach

Die Architektur folgt einem Monolith-First-Ansatz mit Turborepo-Monorepo: Ein Fastify-Backend (apps/api) bedient Mobile-App (apps/mobile) und Web-Admin-Panel (apps/admin) über dieselbe REST-API, differenziert nur durch Rollen-Middleware. Geteilte TypeScript-Types in packages/types verhindern Drifts zwischen Frontend und Backend. Der ChurchDesk-Sync-Service läuft als isolierter BullMQ-Worker — entkoppelt vom HTTP-Request-Cycle, sodass ChurchDesk-Ausfälle die App nicht brechen. Die Gamification-Engine wird per In-Process-EventEmitter entkoppelt (Check-In emitiert Event, Gamification-Engine lauscht asynchron) — einfach für den Monolith-Start, später auf BullMQ-Queue upgradeable.

**Major components:**
1. **Event Service + PostGIS** — CRUD Events, ST_DWithin-Radius-Queries, Clustering; bildet die Grundlage für alle anderen Services
2. **Check-In Service** — QR-Code-Generierung pro Gemeinde, Event-Zeitfenster-Validierung, Geofence-Soft-Check
3. **Gamification Engine** — Badge-Rule-Evaluation, Points-Ledger; async per EventEmitter entkoppelt von Check-In
4. **ChurchDesk Sync Service** — Scheduled BullMQ-Job, Upsert-by-External-ID, isoliertes Fehler-Logging
5. **Admin Service** — Gemeinde-Verifizierung, Einladungscode-System, Rollen-Management
6. **React Native App (Expo)** — Map + Event-Discovery, QR-Scanner, Prayback-Punkte/Badges, Offline-Cache via TanStack Query + MMKV

### Critical Pitfalls

1. **Cold-Start / leere Karte beim Launch** — Vor dem ersten Nutzer-Test mindestens 20–30 Gemeinden in der Pilot-Region manuell seed-en; ChurchDesk-Sync-fähige Gemeinden priorisieren; Soft-Launch in einer eng definierten Region starten, nicht deutschlandweit
2. **Geofencing als primärer Check-In-Mechanismus** — Niemals. Geofencing ist iOS 18+ unzuverlässig (bis zu 2 Min Latenz, "Always Allow" erforderlich, 20-Geofence-Limit auf iOS). QR-Code ist Primär-Mechanismus; Geofencing nur als optionaler Komfort-Prompt mit Nutzer-Bestätigung
3. **QR-Code-Missbrauch durch fehlende Event-Zeitfenster-Validierung** — Check-In-API muss von Anfang an prüfen, ob ein laufendes/kürzlich begonnenes Event in der Gemeinde existiert. Retrofit ist teuer; Rate-Limiting (1 Check-in pro Gemeinde pro Tag) als zusätzliche Schicht
4. **Gamification-Framing wirkt manipulativ** — Keine Leaderboards, kein Streak-Verlust, keine Kompetitionsmechanik. Punkte als "persönliches Erinnerungsbuch" framen ("Deine Reise"), nicht als Score. Vor Entwicklungsstart mit 60+-Nutzern testen
5. **ChurchDesk-API-Abhängigkeit ohne Fallback** — ChurchDesk-Sync als isolierten Service mit eigenem Fehler-Logging implementieren. Sync-Status pro Gemeinde tracken. Exponential Backoff. Manuelle Events und ChurchDesk-Events im selben Datenmodell — ChurchDesk-Ausfall = stale data, nicht kaputte App

## Implications for Roadmap

Die Architektur definiert eine klare Build-Reihenfolge: Datenbank-Schema zuerst, dann Event Service, dann Auth, dann Map-View (erstes User-facing Feature), dann ChurchDesk-Sync, dann Check-In, dann Gamification, dann Admin-Panel. Diese Reihenfolge ist durch harte Abhängigkeiten erzwungen und sollte nicht umgestellt werden.

### Phase 1: Foundation — Datenbank, API-Gerüst, Deployment

**Rationale:** Kein Feature kann gebaut werden, bevor Schema, PostGIS-Setup und das Fastify-Gerüst stehen. Monorepo-Setup und Docker-Compose-Umgebung hier erledigen — nicht später.
**Delivers:** Lauffähiges Fastify-Backend mit PostgreSQL + PostGIS, Drizzle-Migrationen, Docker-Compose für lokale Entwicklung, Turborepo-Monorepo-Struktur mit packages/types
**Addresses:** Technische Grundlage für alle Features
**Avoids:** GIST-Index muss hier angelegt werden (nie als Afterthought); `ST_DWithin` vs `ST_Distance` muss von Beginn an korrekt sein

### Phase 2: Event Service + Map-MVP (Read-Only)

**Rationale:** Event-Discovery ist der Kern-Use-Case. Die Map-View ist das erste Feature, das echten Nutzerwert liefert — und sie braucht keinen Account. Hier wird auch Marker-Clustering eingebaut, bevor überhaupt viele Marker existieren.
**Delivers:** Funktionierende Karte mit Events in der Nähe (Radius-Query), Event-Liste, Event-Detailseite, Kategoriefilter, Navigation-Deep-Link, Browse ohne Account
**Uses:** react-native-maps 1.26.x (Apple Maps auf iOS), react-native-clusterer (JSI), TanStack Query + MMKV für Offline-Cache, PostGIS ST_DWithin
**Implements:** Event Service, Event Discovery Flow (Read Path)
**Avoids:** `onRegionChange` statt `onRegionChangeComplete`; Google Maps Provider auf iOS; fehlender Offline-Cache

### Phase 3: Auth + Gemeinde-Onboarding

**Rationale:** Check-In und Gamification brauchen User-Auth. Admin-Verifizierung muss vor Event-Eingabe stehen — ohne verifizierte Admins sind Daten unzuverlässig.
**Delivers:** User-Registrierung/Login (JWT), Gemeinde-Admin-Verifizierungsflow (Antrag + manuelle Prüfung + Einladungscode), minimales Gemeindeprofil
**Uses:** @fastify/jwt, @fastify/rate-limit, Einladungscode mit Ablaufdatum + Single-Use-Flag
**Avoids:** Admin-Rollen ohne manuelle Verifikation vergeben; Einladungscodes ohne Ablaufdatum

### Phase 4: ChurchDesk-Sync

**Rationale:** ChurchDesk ist der primäre automatische Daten-Lieferant. Wenn der Sync steht, füllt sich die Karte ohne manuelle Arbeit der Gemeinden. Dieser Phase kommt direkt nach Auth, weil Sync-Jobs den Gemeinde-Datensatz brauchen.
**Delivers:** BullMQ-Job für periodischen ChurchDesk-Sync (alle 4h), Upsert-by-External-ID, Sync-Status-Tracking pro Gemeinde, Fehler-Logging + Exponential-Backoff, Admin-Notification bei Sync-Ausfall
**Implements:** ChurchDesk Sync Service (isoliert vom HTTP-Request-Cycle)
**Avoids:** Sync als synchrone Request-Chain; ChurchDesk-Events die manuelle Einträge überschreiben; kein Monitoring auf Sync-Fehler

### Phase 5: Check-In + Gamification

**Rationale:** Prayback-Punkte und Badges sind der Kern-Differenziator. Check-In und Gamification werden zusammen gebaut, weil sie direkt aufeinander aufbauen (Pitfall: Badge-Evaluation nicht synchron im HTTP-Response-Path).
**Delivers:** QR-Code-Generierung pro Gemeinde (statisch), QR-Scanner in der App (expo-camera), Check-In-API mit Event-Zeitfenster-Validierung, Rate-Limiting (1/Tag/Gemeinde), Prayback-Punkte, Basis-Badge-Set (Gottesdienste, Kategorien), Lottie-Badge-Unlock-Animation
**Implements:** Check-In Service, Gamification Engine (async EventEmitter-Pattern)
**Avoids:** Synchrone Badge-Evaluation im HTTP-Response; QR ohne Zeitfenster-Validierung; Gamification-Sprache die kompetitiv wirkt; Leaderboards

### Phase 6: Gemeinde-Admin-Panel (Web)

**Rationale:** Manuelle Event-Eingabe über die Mobile-App ist für Sekretariate unkomfortabel. Das Web-Panel als separates React-Deployable shares Types und API mit dem Backend, benötigt aber eigene UX.
**Delivers:** Browser-basiertes Admin-Panel für Event-Management, Gemeindeprofil-Pflege, QR-Code-Download, ChurchDesk-Sync-Status-Anzeige
**Uses:** Shared packages/types, selbe Fastify-API (Role-gated endpoints), React
**Implements:** Admin Service (Rollen-Middleware bereits in Phase 3 vorhanden)

### Phase 7: Geofencing + UX-Polish

**Rationale:** Geofencing ist ein optionaler Komfort-Layer — er wird nach QR-Check-In gebaut, niemals davor, und nur wenn QR-Check-In stabil läuft. Ebenfalls: Push-Benachrichtigungen (Opt-in), Accessibility-Verbesserungen für 60+-Zielgruppe.
**Delivers:** Geofencing als optionaler "Soll ich einchecken?"-Prompt (nie Auto-Check-in), expo-location + expo-task-manager, Push-Benachrichtigungen (Opt-in), UX-Polish (48px Tap-Targets, Accessibility)
**Avoids:** Geofencing als primären Check-In-Mechanismus; Auto-Check-in bei Geofence-Eintritt; "Always Allow"-Permission ohne Kontext-Erklärung

### Phase Ordering Rationale

- **Datenbank zuerst** (Phase 1): GIST-Index und ST_DWithin-Query-Muster sind nicht als Retrofit korrigierbar ohne Performance-Einbruch
- **Map vor Auth** (Phase 2 vor Phase 3): Browse ohne Account ist UX-Maxime; die Karte soll ohne Barriere benutzbar sein
- **ChurchDesk-Sync vor Check-In** (Phase 4 vor Phase 5): Check-In macht nur Sinn, wenn die Karte ausreichend befüllt ist — ChurchDesk-Sync ist der primäre Befüllungsweg
- **Check-In und Gamification zusammen** (Phase 5): Badge-System ohne funktionierenden Check-In unmöglich; beides wird in einem Schritt designed und getestet
- **Admin-Panel nach Check-In** (Phase 6): Das Panel braucht stabile Auth + Event-CRUD, die in Phasen 3–5 entstehen
- **Geofencing zuletzt** (Phase 7): Geofencing ist kein MVP-Feature; es wird erst gebaut, wenn QR-Check-In validiert ist

### Research Flags

Phasen mit erhöhtem Research-Bedarf während der Planung:
- **Phase 4 (ChurchDesk-Sync):** ChurchDesk-API-Dokumentation ist nicht vollständig öffentlich zugänglich. Rate-Limits, Webhook-Support und Breaking-Change-Policy müssen mit direktem API-Zugang verifiziert werden. Mögliche Anpassungen: Webhook statt Polling, andere Sync-Intervalle.
- **Phase 5 (Check-In + Gamification):** Badge-Rule-Engine-Design braucht sorgfältige Modellierung bevor Implementierung. Badge-Definitionen müssen ohne App-Update erweiterbar sein (konfigurierbar im Backend). Erfordert Research zu konfigurierbaren Rule-Engines oder JSON-basierten Badge-Definitionen.
- **Phase 7 (Geofencing):** iOS-Geofencing-Verhalten unter iOS 18+ ist aktiv regressiv (Apple Developer Forums). Muss auf echten Geräten getestet werden, nicht im Simulator.

Phasen mit gut dokumentierten Mustern (Research-Phase kann übersprungen werden):
- **Phase 1 (Foundation):** Turborepo-Monorepo, Fastify-Setup, Drizzle-Migrationen — alles durch offizielle Docs gut abgedeckt
- **Phase 2 (Map-MVP):** react-native-maps + TanStack Query + MMKV — etablierte Patterns, offizielle Docs verfügbar; iOS-Bug-Workaround dokumentiert
- **Phase 3 (Auth):** JWT + Role-based Auth mit Fastify — Standard-Pattern, @fastify/jwt gut dokumentiert
- **Phase 6 (Admin-Panel):** React + Fastify + Shared Types — Standard-Monorepo-Pattern

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Meiste Choices HIGH confidence (offizielle Docs); react-native-maps SDK-55-Bug MEDIUM (GitHub Issues, kein offizieller Expo Fix-Termin); ChurchDesk-API LOW (Docs nicht vollständig öffentlich) |
| Features | MEDIUM | Competitor-Analyse via WebSearch; Gamification-Patterns durch mehrere Quellen bestätigt; Geofencing-Limitations HIGH confidence (offizielle Platform-Docs) |
| Architecture | MEDIUM | Standard-Patterns gut dokumentiert; ChurchDesk-API-spezifische Details brauchen direkten Zugang; Gamification-Rule-Engine-Design ist community-sourced |
| Pitfalls | MEDIUM | Platform-Pitfalls (Maps, Geofencing, PostGIS) HIGH confidence; ChurchDesk-spezifische Risiken LOW confidence (unvollständige Docs) |

**Overall confidence:** MEDIUM

### Gaps to Address

- **ChurchDesk-API-Spezifikation:** Rate-Limits, verfügbare Felder, Webhook vs. Polling-Support, Breaking-Change-Policy sind unklar. Vor Phase 4 direkten API-Zugang beschaffen und Endpoints testen. Alternativ: ChurchDesk direkt kontaktieren.
- **react-native-maps SDK-55-Bug (iOS):** Issue #43288 ist offen (Stand März 2026). Vor Phase 2 verifizieren ob der Bug inzwischen gefixt ist; falls nicht, Apple Maps als feste Entscheidung treffen und im Design berücksichtigen (keine Google-Maps-spezifischen Features planen).
- **Badge-Rule-Engine-Design:** Konfigurierbare Badge-Definitionen im Backend (erweiterbar ohne App-Update) brauchen konkretes Datenmodell-Design vor Phase 5. Community-Pattern gefunden, aber nicht durch offizielle Quellen abgesichert.
- **Gamification-Framing-Validierung:** Research-Empfehlung ist klar (kein Score-Charakter, persönliches Erinnerungsbuch), aber tatsächliche Nutzer-Reaktion bei der 60+-Zielgruppe ist ungeklärt. Vor Phase 5-Start Nutzertest mit Zielgruppe einplanen.
- **Seed-Daten-Strategie:** Cold-Start-Problem ist identifiziert, aber konkreter Prozess zum Befüllen der Pilotregion (Kirchenkreis-Daten, ChurchDesk-Gemeinden) muss operativ geplant werden — nicht als technisches Problem, sondern als Go-to-Market-Aufgabe.

## Sources

### Primary (HIGH confidence)
- Expo SDK 55 / Expo Router Docs — Stack-Entscheidungen, CNG-Workflow
- react-native-maps GitHub Issues #43288 + #5843 — iOS SDK-55-Bug-Dokumentation
- PostGIS Offizielle Docs — ST_DWithin, GIST-Index, Radius-Search-Patterns
- BullMQ Offizielle Docs (v5.16+) — Job Schedulers, Cron-Support
- TanStack Query Offizielle Docs — Offline-First-Patterns für React Native
- MMKV GitHub (mrousavy/StorageBenchmark) — Performance vs AsyncStorage
- Drizzle ORM Docs — PostGIS geometry(Point) Support ab 0.31.0
- Apple Developer Forums (iOS Geofencing Regression) — iOS 18 Background Geofencing
- Android Geofencing Docs — Background-Batch-Auslieferung, Einschränkungen

### Secondary (MEDIUM confidence)
- Fastify vs. Express 2025 (BetterStack) — Performance-Vergleich
- react-native-clusterer GitHub (JiriHoffmann) — JSI-Performance-Claims
- PostGIS Spatial Clustering Patterns (Mapscaping) — Clustering-Ansätze
- Badge System Schema Pattern (namitjain.com) — Backend-driven Badge-Architektur
- Foursquare Swarm Gamification Analysis — Badges, Punkte, Mayors
- When Gamification Is Harmful (Medium/Bootcamp) — Overjustification Effect
- Gamification in Church Context (Medium/@digitalchurchcc) — religiöser Kontext

### Tertiary (LOW confidence)
- ChurchDesk API Docs (docs.churchdesk.com) — Template-only, keine echten Endpoints erreichbar; muss mit direktem API-Zugang verifiziert werden
- ChurchDesk API Support Overview (support.churchdesk.com) — Allgemeine Beschreibung, keine Rate-Limit-Details

---
*Research completed: 2026-03-13*
*Ready for roadmap: yes*
