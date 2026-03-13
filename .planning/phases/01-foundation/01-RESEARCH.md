# Phase 1: Foundation - Research

**Researched:** 2026-03-13
**Domain:** Turborepo-Monorepo, PostgreSQL/PostGIS mit Drizzle, Fastify-API-Gerüst, Docker Compose
**Confidence:** HIGH (alle Kernbereiche durch offizielle Docs verifiziert)

---

## Summary

Phase 1 legt das technische Fundament für alle nachfolgenden Phasen. Drei parallele Arbeitsbereiche: (1) Turborepo-Monorepo mit pnpm Workspaces, das `apps/api`, `apps/mobile`, `apps/admin` und `packages/types` strukturiert; (2) PostgreSQL 16 + PostGIS 3.4 via Docker Compose mit Drizzle-Schema und GIST-Index; (3) Fastify 5 API-Gerüst mit Health-Endpoint, das im Deployment auf server.godsapp.de läuft.

Das kritischste Risiko in dieser Phase ist die Expo/pnpm-Interaktion: pnpm isolierte Dependencies und React Native vertragen sich schlecht. Ab SDK 53 empfiehlt Expo `.npmrc` mit `node-linker=hoisted` — das muss in Plan 01-01 berücksichtigt werden. Drizzle + PostGIS hat einen bekannten Kapitalisierungsfehler in `drizzle-kit` (geometry vs. Geometry), der durch ein Custom-Migration-File umgangen wird.

**Primary recommendation:** pnpm + Turborepo + `node-linker=hoisted` + PostGIS per Custom-Migration + Fastify-Host auf `0.0.0.0`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Turborepo | latest | Monorepo Build-Orchestrierung mit Caching | Vercel-maintained, beste Expo+RN+Node-Kompatibilität 2026 |
| pnpm | 9.x | Package Manager mit Workspace-Unterstützung | Effizienteste Lösung für Monorepos; Symlink-basiertes node_modules |
| TypeScript | 5.x | Typsicherheit im gesamten Stack | Shared Types zwischen API und Mobile sind das Kernziel der Phase |
| Fastify | 5.x | HTTP-Framework für Backend | 2-3x schneller als Express, native TS-Unterstützung, Greenfield-Standard |
| PostgreSQL | 16 | Primäre Datenbank | LTS-Version, PostGIS 3.4-kompatibel |
| PostGIS | 3.4 | Spatial Extensions für PostgreSQL | ST_DWithin + GIST-Index für "Events in der Nähe"-Queries |
| Drizzle ORM | 0.31+ | Type-safe PostgreSQL-Client mit PostGIS-Support | Native geometry(Point)-Unterstützung seit 0.31.0, leichter als Prisma |
| drizzle-kit | 0.22+ | Migrations-Generierung und -Ausführung | `extensionsFilters: ["postgis"]` verhindert PostGIS-Systemtabellen-Konflikte |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pg (node-postgres) | 8.x | PostgreSQL-Client für Node.js | Drizzle-Basis; connection pool für Produktion |
| pino | 9.x | Structured JSON Logging | Fastify-Default-Logger, kein Zusatzsetup nötig |
| tsx | latest | TypeScript Execution für Development | Kein Build-Step nötig für lokale Entwicklung |
| @types/node | 20+ | Node.js TypeScript Definitionen | Dev-Dependency, immer benötigt |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pnpm | npm/yarn workspaces | pnpm schneller, effizienterer Disk-Verbrauch; npm workspaces haben mehr Hoisting-Probleme mit RN |
| Drizzle | Prisma | Prisma hat besseres Tooling, aber 40MB Query-Engine-Binary — schlecht für Docker Image Size |
| Fastify | Express | Nur für Legacy-Migration sinnvoll; für Greenfield 2026 ist Fastify strikt besser |

### Installation

```bash
# Monorepo Bootstrap
npm install -g pnpm
npx create-turbo@latest prayback --package-manager pnpm

# API Backend
cd apps/api
pnpm add fastify
pnpm add drizzle-orm pg
pnpm add -D typescript tsx drizzle-kit @types/node @types/pg

# Shared Types Package
cd packages/types
pnpm add -D typescript
```

---

## Architecture Patterns

### Recommended Project Structure

```
prayback/
├── apps/
│   ├── api/                    # Node.js + Fastify Backend
│   │   ├── src/
│   │   │   ├── routes/         # Route-Handler pro Domain
│   │   │   ├── db/             # Drizzle-Client + Schema
│   │   │   │   ├── schema.ts   # Drizzle-Tabellen-Definitionen
│   │   │   │   ├── index.ts    # DB-Connection-Export
│   │   │   │   └── migrate.ts  # Programmatische Migration
│   │   │   └── server.ts       # Fastify-Instanz
│   │   ├── drizzle/            # Generierte Migration-Files
│   │   ├── drizzle.config.ts   # Drizzle-Kit-Konfiguration
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── mobile/                 # React Native + Expo
│   │   ├── app/                # Expo Router Screens
│   │   ├── components/
│   │   └── package.json
│   └── admin/                  # React Web Panel
│       ├── src/
│       └── package.json
├── packages/
│   └── types/                  # Shared TypeScript Types
│       ├── src/
│       │   └── index.ts        # Event, Congregation, User DTOs
│       ├── tsconfig.json
│       └── package.json
├── turbo.json
├── pnpm-workspace.yaml
├── .npmrc                      # KRITISCH: node-linker=hoisted
├── package.json                # Root workspace
└── docker-compose.yml          # Lokale Dev-Umgebung
```

### Pattern 1: pnpm Workspace + Turborepo Konfiguration

**Was:** Root `package.json` definiert Turborepo-Tasks; `pnpm-workspace.yaml` listet Workspace-Pakete.
**Wann:** Immer — das Fundament des gesamten Monorepos.

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// turbo.json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

```
# .npmrc — PFLICHT für Expo/React Native in pnpm Monorepo
node-linker=hoisted
```

**Quelle:** Expo Official Docs (https://docs.expo.dev/guides/monorepos/) — HIGH confidence

### Pattern 2: packages/types als Shared Package

**Was:** Ein dediziertes `packages/types`-Paket exportiert TypeScript-Interfaces die sowohl die API als auch die Mobile-App importieren.
**Wann:** Immer bei Turborepo-Monorepo mit mehreren Apps die dieselben Datenstrukturen verwenden.

```json
// packages/types/package.json
{
  "name": "@prayback/types",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  }
}
```

```typescript
// packages/types/src/index.ts
export type EventCategory =
  | "gottesdienst"
  | "konzert"
  | "jugend"
  | "gemeindeleben"
  | "lesung"
  | "diskussion"
  | "andacht";

export interface EventDTO {
  id: string;
  title: string;
  startsAt: string; // ISO 8601
  endsAt?: string;
  category: EventCategory;
  location: {
    lat: number;
    lon: number;
    address: string;
  };
  congregationId: string;
  description?: string;
  imageUrl?: string;
  source: "manual" | "churchdesk";
}

export interface CongregationDTO {
  id: string;
  name: string;
  address: string;
  websiteUrl?: string;
  location: {
    lat: number;
    lon: number;
  };
}
```

**Nutzung in API und Mobile:**
```json
// apps/api/package.json und apps/mobile/package.json
{
  "dependencies": {
    "@prayback/types": "workspace:*"
  }
}
```

### Pattern 3: Drizzle Schema mit PostGIS

**Was:** Drizzle-Tabellendefinitionen mit `geometry`-Typ, GIST-Index und `extensionsFilters` in der Konfiguration.
**Wann:** Für alle Tabellen mit Geo-Koordinaten (events, congregations).

```typescript
// apps/api/src/db/schema.ts
// Source: https://orm.drizzle.team/docs/guides/postgis-geometry-point
import { geometry, index, pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const eventCategoryEnum = pgEnum("event_category", [
  "gottesdienst", "konzert", "jugend", "gemeindeleben",
  "lesung", "diskussion", "andacht",
]);

export const congregations = pgTable(
  "congregations",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    address: text("address").notNull(),
    websiteUrl: text("website_url"),
    location: geometry("location", { type: "point", mode: "xy", srid: 4326 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("congregations_location_gist_idx").using("gist", t.location),
  ]
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    description: text("description"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    category: eventCategoryEnum("category").notNull(),
    congregationId: uuid("congregation_id").references(() => congregations.id).notNull(),
    churchdeskId: text("churchdesk_id").unique(), // null für manuell eingetragene Events
    source: text("source", { enum: ["manual", "churchdesk"] }).notNull().default("manual"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);
```

```typescript
// apps/api/drizzle.config.ts
// Source: https://orm.drizzle.team/docs/drizzle-config-file
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  extensionsFilters: ["postgis"], // KRITISCH: Verhindert PostGIS-Systemtabellen in Migrations
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**PostGIS-Extension per Custom Migration:**
```sql
-- drizzle/0000_create_postgis.sql (manuell erstellt)
CREATE EXTENSION IF NOT EXISTS postgis;
```

Danach normales `drizzle-kit generate` für Schema-Migrations.

**Quelle:** Offiziell (https://orm.drizzle.team/docs/guides/postgis-geometry-point, https://orm.drizzle.team/docs/extensions/pg) — HIGH confidence

### Pattern 4: Fastify Server mit Health-Endpoint

**Was:** Minimaler Fastify 5 Server der auf `0.0.0.0` (Docker-kompatibel) lauscht, mit strukturiertem Logging und `/health`-Endpoint.

```typescript
// apps/api/src/server.ts
// Source: https://fastify.dev/docs/latest/Guides/Getting-Started/
import Fastify from "fastify";

const fastify = Fastify({ logger: true });

fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await fastify.listen({
      port: Number(process.env.PORT) || 3000,
      host: "0.0.0.0", // PFLICHT für Docker
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

### Pattern 5: Docker Compose für lokale Entwicklung

**Was:** Docker Compose startet PostgreSQL+PostGIS und optionale Services, API läuft lokal mit `pnpm dev`.

```yaml
# docker-compose.yml
services:
  db:
    image: postgis/postgis:16-3.4
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: prayback
      POSTGRES_PASSWORD: prayback_dev
      POSTGRES_DB: prayback
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U prayback"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pg_data:
```

**Quelle:** Docker Hub postgis/postgis (https://hub.docker.com/r/postgis/postgis) — HIGH confidence

### Anti-Patterns zu vermeiden

- **`PROVIDER_GOOGLE` auf iOS mit Expo SDK 55**: Aktiver Bug (expo/expo#43288). Immer `PROVIDER_DEFAULT` (Apple Maps) auf iOS verwenden.
- **pnpm ohne `node-linker=hoisted`**: React Native kann Singleton-Packages (react, react-native) nicht korrekt auflösen. Führt zu kryptischen Build-Fehlern.
- **`geometry(Point)` Kapitalisierungs-Problem in drizzle-kit**: Drizzle-Kit schreibt `geometry(point)`, PostgreSQL zeigt `geometry(Point)`. Führt zu falsch-positiven Schema-Diff-Warnungen. Lösung: `extensionsFilters: ["postgis"]` setzen.
- **Fastify auf `localhost` statt `0.0.0.0`**: Service ist im Docker-Container nicht erreichbar von außen.
- **PostGIS-Extension manuell anlegen statt per Migration**: Extension muss in der Datenbank vorhanden sein bevor Drizzle-Migrations laufen. Erste Migration muss `CREATE EXTENSION IF NOT EXISTS postgis;` enthalten.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Migrations-Tracking | Eigene Migrations-Tabelle | `drizzle-kit migrate` | Drizzle trackt angewandte Migrations in `__drizzle_migrations` automatisch |
| Monorepo Package-Resolution | Manuelle tsconfig.paths | pnpm `workspace:*` + package.json exports | Kein Compiler-Plugin nötig, funktioniert mit Metro, Node.js, Vite |
| PostGIS-Extension Setup | Init-Skript in Docker entrypoint | Custom Drizzle-Migration (`0000_create_postgis.sql`) | Versioniert, reproduzierbar, kein separates Init-Skript |
| Structured Logging | Winston/Morgan | Fastify built-in Pino logger | Zero Config, JSON-Output für Docker Logs, bereits in Fastify enthalten |
| Health-Check-Logik | Eigener Health-Service | Einfacher GET `/health`-Handler in Fastify | Für Phase 1 reicht ein 200 OK — Komplexität erst bei echten Dependencies |

**Key insight:** Der Großteil der Boilerplate in Phase 1 wird durch die Wahl der richtigen Toolchain-Konfiguration eliminiert — nicht durch Code.

---

## Common Pitfalls

### Pitfall 1: pnpm Isolated Modules + React Native Singleton-Konflikt

**What goes wrong:** pnpm installiert Packages per Default isoliert (non-hoisted). React Native erwartet genau eine Instanz von `react`, `react-native`, `expo` im Modul-Graph. Wenn Metro zwei verschiedene Pfade für `react` findet, bekommt man kryptische Fehler wie "Invalid Hook Call" oder Expo Linking Fehler.

**Why it happens:** pnpm's Symlink-Struktur legt Packages pro App in `node_modules/.pnpm`, nicht ins Root. Metro verfolgt Symlinks und findet ggf. mehrere Versionen.

**How to avoid:** `.npmrc` mit `node-linker=hoisted` im Root des Repos anlegen. Das ist Expros offizielle Empfehlung für SDK 53+.

**Warning signs:** "Invalid hook call", "Cannot read property of undefined" beim ersten `expo start`, oder Build-Fehler bei `eas build`.

### Pitfall 2: PostGIS-Extension nicht in erster Migration

**What goes wrong:** `drizzle-kit generate` erzeugt SQL für `geometry`-Spalten, aber die `postgis`-Extension ist nicht aktiv. Erste `drizzle-kit migrate` Ausführung schlägt mit `type "geometry" does not exist` fehl.

**Why it happens:** Drizzle erstellt Extensions nicht automatisch. Die Extension muss vor allen Schema-Migrations existieren.

**How to avoid:** Eine leere Migration `0000_create_postgis.sql` manuell anlegen (via `drizzle-kit generate --custom`) mit `CREATE EXTENSION IF NOT EXISTS postgis;` — und sicherstellen dass diese vor allen Schema-Migrations ausgeführt wird (durch Dateinamen-Reihenfolge).

**Warning signs:** `ERROR: type "geometry" does not exist` beim ersten `drizzle-kit migrate`.

### Pitfall 3: drizzle-kit geometry(Point) Kapitalisierungs-Bug

**What goes wrong:** Drizzle-Kit erzeugt Diffs die `geometry(point) → geometry(Point)` als Breaking Change erkennen (oder umgekehrt), obwohl es dieselbe Spalte ist. Das führt zu Warnungen über Datenverlust bei `drizzle-kit push`.

**Why it happens:** PostgreSQL normalisiert `geometry(point)` intern zu `geometry(Point)`. Drizzle-Kit vergleicht String-Werte ohne Case-Normalisierung.

**How to avoid:** `extensionsFilters: ["postgis"]` in `drizzle.config.ts` setzen. Für `drizzle-kit push` (nur Dev): Warnungen sind false positives solange keine Spalte wirklich geändert wird.

**Warning signs:** `drizzle-kit push` zeigt `geometry(point) → geometry(Point)` als Schema-Änderung an.

### Pitfall 4: Turborepo Build-Reihenfolge für packages/types

**What goes wrong:** `apps/api` und `apps/mobile` importieren `@prayback/types`. Wenn Turborepo `apps/api` und `packages/types` parallel baut und `types` kein Pre-Build-Schritt hat, kann der Import fehlschlagen.

**Why it happens:** Turborepo respektiert `dependsOn: ["^build"]`, aber nur wenn die Dependency korrekt in `package.json` deklariert ist und die `build`-Task im Package vorhanden ist.

**How to avoid:** `packages/types/package.json` muss ein `build`-Script haben (auch wenn es nur `tsc --noEmit` ist). In `turbo.json`: `"build": { "dependsOn": ["^build"] }`. Für Phase 1 reicht es, `main` direkt auf `./src/index.ts` zu zeigen (kein Compile-Schritt nötig), solange alle Consumer TypeScript verwenden.

**Warning signs:** `Cannot find module '@prayback/types'` beim Build, aber `pnpm install` zeigt das Package korrekt an.

### Pitfall 5: Docker Compose healthcheck fehlt — API startet vor DB

**What goes wrong:** Der API-Container startet und versucht die Datenbankverbindung herzustellen, bevor PostgreSQL bereit ist. Resultat: Verbindungsfehler beim Start, Container crasht.

**Why it happens:** `depends_on` in Docker Compose wartet nur auf Container-Start, nicht auf Service-Bereitschaft.

**How to avoid:** `depends_on` mit `condition: service_healthy` + PostgreSQL-`healthcheck` (`pg_isready`) im Docker Compose konfigurieren.

**Warning signs:** API-Container crasht beim Start mit `ECONNREFUSED 5432`.

---

## Code Examples

Verifizierte Patterns aus offiziellen Quellen:

### Programmatische Drizzle-Migration beim Server-Start

```typescript
// apps/api/src/db/migrate.ts
// Source: https://orm.drizzle.team/docs/migrations
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { resolve } from "path";

export async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: resolve(__dirname, "../../drizzle") });
  await pool.end();
}
```

### Fastify mit Plugin-Pattern (für spätere Erweiterung)

```typescript
// apps/api/src/routes/health.ts
import type { FastifyPluginAsync } from "fastify";

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));
};

export default healthRoutes;

// apps/api/src/server.ts
import Fastify from "fastify";
import healthRoutes from "./routes/health.js";

const fastify = Fastify({ logger: true });
fastify.register(healthRoutes);

await fastify.listen({ port: Number(process.env.PORT) || 3000, host: "0.0.0.0" });
```

### packages/types Konsumierung

```typescript
// In apps/api — importiert direkt aus workspace-Package
import type { EventDTO, CongregationDTO } from "@prayback/types";

// In apps/mobile — identischer Import
import type { EventDTO } from "@prayback/types";
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Metro config für Monorepos | Expo SDK 52+ konfiguriert Metro automatisch | SDK 52 (Okt 2024) | Kein `metro.config.js` nötig wenn `expo/metro-config` verwendet wird |
| npm/yarn workspaces für RN Monorepos | pnpm + `node-linker=hoisted` | 2024–2025 | Effizientere Disk-Nutzung, aber `.npmrc` muss gesetzt werden |
| Express für Node.js Backends | Fastify 5 | v5 release 2024 | Type-safe, 2-3x schneller, native JSON-Schema-Validation |
| Manuelle PostGIS-Extension in Docker entrypoint | Custom Drizzle-Migration `0000_create_postgis.sql` | Drizzle 0.31+ | Versioniert, reproduzierbar, kein Bash-Script nötig |
| Bull v4 für Job-Queues | BullMQ v5 | 2022 (Bull in maintenance) | Relevant für Phase 4 (ChurchDesk-Sync) — schon jetzt richtige Library wählen |

**Deprecated/outdated:**
- `expo-barcode-scanner`: Deprecated seit SDK 52, entfernt in SDK 53. Verwende `expo-camera` mit `onBarcodeScanned`.
- `mdillon/postgis` Docker Image: Veraltet. Verwende `postgis/postgis` (offizielles Image).
- `AsyncStorage`: 10-30x langsamer als MMKV für häufige Lese/Schreib-Operationen.

---

## Open Questions

1. **Expo SDK-Version: 53 oder 55?**
   - Was wir wissen: STACK.md nennt Expo SDK 55.x als aktuellen Stand (Feb 2026). Expo Docs zeigen SDK 53 als Referenz für `.npmrc`-Empfehlung.
   - Was unklar ist: SDK 55 könnte das pnpm-Hoisting-Problem bereits gelöst haben (SDK 54 soll isolated deps unterstützen).
   - Empfehlung: `.npmrc node-linker=hoisted` trotzdem setzen — schadet nicht, verhindert potenzielle Fehler.

2. **Deployment-Setup für Plan 01-03**
   - Was wir wissen: server.godsapp.de läuft Docker + Traefik (aus CLAUDE.md). Bestehende Stacks unter `/opt/stacks/`.
   - Was unklar ist: Ob ein neuer Stack unter `/opt/stacks/prayback/` angelegt wird oder ein bestehender Stack erweitert wird.
   - Empfehlung: Neuer Stack `/opt/stacks/prayback/` mit eigenem `docker-compose.yml`. Standard Traefik-Labels für Routing.

3. **Admin-App in Phase 1**
   - Was wir wissen: Plan 01-01 soll `apps/admin` anlegen. Admin-App wird erst in Phase 3 aktiv genutzt.
   - Was unklar ist: Soll `apps/admin` in Phase 1 nur als leeres Gerüst existieren oder komplett konfiguriert sein?
   - Empfehlung: Leeres Vite+React Gerüst mit korrektem `package.json` anlegen, damit Turborepo die Struktur kennt. Kein funktionaler Code in Phase 1.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (Backend) — noch nicht installiert |
| Config file | `apps/api/vitest.config.ts` — Wave 0 anlegen |
| Quick run command | `pnpm --filter api test --run` |
| Full suite command | `pnpm turbo test` |

### Phase Requirements → Test Map

Phase 1 hat keine direkt gemappten v1-Requirements (rein technische Voraussetzungen). Verifizierung erfolgt über Success Criteria:

| Kriterium | Verhalten | Test-Typ | Automated Command | File |
|-----------|-----------|----------|-------------------|------|
| SC-1 | docker-compose up startet ohne Fehler | smoke | `docker-compose up -d && docker-compose ps` | ❌ Wave 0 |
| SC-2 | Drizzle-Migration legt Schema + GIST-Index an | integration | `pnpm --filter api db:migrate && psql -c "\\d congregations"` | ❌ Wave 0 |
| SC-3 | GET /health antwortet mit 200 | smoke | `curl -f http://localhost:3000/health` | ❌ Wave 0 |
| SC-4 | turbo build läuft durch | build | `pnpm turbo build` | ❌ Wave 0 |
| SC-5 | @prayback/types importierbar | unit | `pnpm --filter api typecheck` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm turbo build --filter=...`
- **Per wave merge:** `pnpm turbo build && pnpm turbo typecheck`
- **Phase gate:** Alle 5 Success Criteria manuell verifiziert

### Wave 0 Gaps

- [ ] `apps/api/vitest.config.ts` — Vitest-Setup für Backend-Tests
- [ ] `apps/api/src/__tests__/health.test.ts` — Health-Endpoint-Test
- [ ] Framework install: `pnpm add -D vitest --filter api`

---

## Sources

### Primary (HIGH confidence)

- [Expo Monorepo Guide (Offiziell)](https://docs.expo.dev/guides/monorepos/) — pnpm-Konfiguration, `.npmrc node-linker=hoisted`
- [Drizzle ORM PostGIS Geometry Point (Offiziell)](https://orm.drizzle.team/docs/guides/postgis-geometry-point) — Schema-Definition, GIST-Index
- [Drizzle ORM PostgreSQL Extensions (Offiziell)](https://orm.drizzle.team/docs/extensions/pg) — `extensionsFilters: ["postgis"]`
- [Drizzle ORM Migrations (Offiziell)](https://orm.drizzle.team/docs/migrations) — `migrate`-Funktion, programmatisch
- [Fastify Getting Started (Offiziell)](https://fastify.dev/docs/latest/Guides/Getting-Started/) — Server-Setup, Plugin-Registrierung, `0.0.0.0`
- [Turborepo Repository-Struktur (Offiziell)](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) — Workspace-Konfiguration, turbo.json
- [postgis/postgis Docker Hub (Offiziell)](https://hub.docker.com/r/postgis/postgis) — Image-Tags, Docker Compose

### Secondary (MEDIUM confidence)

- [byCedric/expo-monorepo-example](https://github.com/byCedric/expo-monorepo-example) — Praxiserprobtes Expo+pnpm+Turborepo Setup, verifiziert gegen Expo Docs
- Drizzle-Kit geometry Kapitalisierungs-Bug: GitHub Issue #2806 + #3347 — durch mehrere Quellen bestätigt

### Tertiary (LOW confidence)

- Expo SDK 55 als Feb 2026 Release — STACK.md referenziert, kein direkter Changelog-Fetch; SDK-Version-Verhalten mit pnpm SDK 55 spezifisch nicht separat verifiziert

---

## Metadata

**Confidence breakdown:**
- Turborepo/pnpm Setup: HIGH — Offizielle Turborepo + Expo Docs konsultiert
- Drizzle + PostGIS Schema: HIGH — Offizielle Drizzle Docs + bekannte Bugs dokumentiert
- Fastify Setup: HIGH — Offizielle Fastify Docs konsultiert
- Docker Compose: HIGH — Offizielles postgis/postgis Image dokumentiert
- Expo/pnpm Kompatibilität: MEDIUM — Offizielle Docs + community-verifiziert, aber SDK 55 spezifisch nicht vollständig verifiziert

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stabile Libraries; Expo SDK-Patch-Releases können Kompatibilität leicht ändern)
