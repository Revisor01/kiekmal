# Phase 2: Event Discovery - Research

**Researched:** 2026-03-13
**Domain:** PostGIS Radius Queries / React Native Maps + Clustering / TanStack Query Offline Persistence
**Confidence:** HIGH (API-Seite), MEDIUM (Mobile-Seite — Expo noch nicht initialisiert)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-01 | User kann Karte mit Kirchen und Events in der Nähe sehen | PostGIS ST_DWithin-Query (Plan 02-01) + react-native-maps MapView mit Markern (Plan 02-02) |
| DISC-02 | User kann Events nach Kategorie filtern | API-Query-Parameter mit Zod-Validierung; eventCategoryEnum bereits im Schema |
| DISC-03 | User kann Events nach Radius und Datum filtern | ST_DWithin für Radius; `startsAt >= ?` für Datum; Query-Params lat/lon/radius/dateFrom/dateTo |
| DISC-04 | User kann Event-Detailseite sehen | EventDTO erweitern um fehlende Felder (price, registrationUrl, bringItems, persons); Detailscreen in Expo Router |
| DISC-05 | User kann Navigation zu einem Event starten | `Linking.openURL()` mit apple-maps / geo: URL-Schema; keine externe Library nötig |
| DISC-06 | User kann zuletzt geladene Events auch offline sehen | TanStack Query v5 + MMKV + @tanstack/query-sync-storage-persister |
| DISC-07 | User kann minimales Gemeindeprofil sehen | Eigener Endpoint GET /congregations/:id mit kommenden Events |
| AUTH-01 | User kann App ohne Account nutzen | Alle Endpoints öffentlich (kein Auth-Header nötig); Auth kommt in Phase 3 |
</phase_requirements>

---

## Summary

Phase 2 baut auf dem fertigen Fundament (Fastify 5 + Drizzle + PostGIS auf server.godsapp.de) auf und liefert den ersten echten Nutzerwert: eine interaktive Karte mit kirchlichen Events. Die drei Pläne sind klar trennbar — Backend-Service, Mobile Map-View und Offline-Cache.

**API-Seite (Plan 02-01)** ist gut abgesichert: Das Datenbankschema ist bereits deployed, PostGIS GIST-Index existiert. Der Radius-Query erfolgt mit `ST_DWithin(location::geography, ST_MakePoint(lon, lat)::geography, radiusInMeters)` via Drizzle `sql`-Template. Zod via `fastify-type-provider-zod` liefert typsichere Query-Parameter-Validierung. EventDTO muss um `price`, `registrationUrl`, `bringItems`, `persons` erweitert werden — diese Felder liegen in DB und Schema, fehlen aber im DTO.

**Mobile-Seite (Plan 02-02)** ist der komplizierteste Part: Die Mobile-App ist noch ein leeres Gerüst ohne Expo SDK. SDK 52 muss erst initialisiert werden (New Architecture default). Clustering erfordert eine aktive Entscheidung: `react-native-map-clustering` ist veraltet, die empfohlene Alternative ist eine manuelle Integration von `@mapbox/supercluster` mit `react-native-maps` oder die lightweight Library `react-native-clusterer`. Navigationsweitergabe an externe Maps-Apps erfolgt mit `Linking.openURL()` — ohne externe Library.

**Offline (Plan 02-03)** ist gut standardisiert: TanStack Query v5 + MMKV v3 + `@tanstack/query-sync-storage-persister` ist das etablierte Muster für React Native. MMKV v3 erfordert New Architecture (Expo SDK 52 Default), daher kein Konflikt.

**Primary recommendation:** Expo SDK 52 initialisieren (New Architecture on), react-native-maps 1.20.x mit manueller supercluster-Integration für Clustering, PostGIS-Radius-Query via `::geography`-Cast.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fastify-type-provider-zod | ^4.0.2 | Zod-Schemas als Fastify Query/Body/Response Validators | Offizielle Empfehlung für Fastify 5 TypeScript-Typsicherheit |
| zod | ^3.23 | Schema-Definition für API-Validierung | Ecosystem-Standard für TypeScript-Validation |
| @fastify/cors | ^10.x | CORS für Mobile-App-Requests | Fastify-offizielles Plugin |
| react-native-maps | ~1.20.x | Karten-Komponente (MapView, Marker) | Expo-Standard, via `npx expo install` |
| @mapbox/supercluster | ^8.0.1 | Geospatial Point Clustering | De-facto-Standard, framework-agnostisch |
| @tanstack/react-query | ^5.x | Server State Management + Offline-Cache-Basis | Ecosystem-Standard, Expo-kompatibel |
| react-native-mmkv | ^3.x | Schneller Key-Value-Speicher für Cache-Persistenz | 30x schneller als AsyncStorage, New Arch native |
| @tanstack/query-sync-storage-persister | ^5.x | MMKV als synchroner Query-Cache-Speicher | Offizielles TanStack Plugin |
| @tanstack/react-query-persist-client | ^5.x | PersistQueryClientProvider für Offline-Wrap | Offizielles TanStack Plugin |
| expo-router | ^4.x | File-based Navigation (Screens, Deep Links) | Expo-Standard für SDK 52 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-linking | SDK 52 | `Linking.openURL()` für externe Maps-Apps | Maps-Navigation-Deep-Link |
| react-native-safe-area-context | SDK 52 | Safe Area für Karten-UI | Immer in Expo-Apps |
| react-native-gesture-handler | SDK 52 | Bottom Sheet / Swipe für Event-Details | Expo Router Dependency |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @mapbox/supercluster (manuell) | react-native-map-clustering | react-native-map-clustering ist mit New Architecture nicht kompatibel / veraltet |
| @mapbox/supercluster (manuell) | react-native-clusterer | react-native-clusterer nutzt C++ JSI — New Arch kompatibel, aber weniger dokumentiert |
| @tanstack/query-sync-storage-persister | AsyncStorage Persister | MMKV deutlich performanter, kein Async nötig |
| fastify-type-provider-zod | @sinclair/typebox | Zod schon im Projekt verwendet, konsequenter Stack |

### Installation API

```bash
# Im apps/api Verzeichnis (lokal, dann push + deploy)
pnpm add fastify-type-provider-zod zod @fastify/cors
```

### Installation Mobile

```bash
# Expo SDK initialisieren (einmalig, in apps/mobile)
npx create-expo-app@latest . --template blank-typescript
# oder bestehende app.json upgraden:
npx expo install expo@52 expo-router react-native react-native-safe-area-context \
  react-native-screens react-native-gesture-handler

# Dann Maps + Datenstack
npx expo install react-native-maps
pnpm add @mapbox/supercluster
pnpm add @tanstack/react-query react-native-mmkv \
  @tanstack/query-sync-storage-persister \
  @tanstack/react-query-persist-client
```

---

## Architecture Patterns

### Recommended Project Structure (02-01 API)

```
apps/api/src/
├── routes/
│   ├── health.ts              # bereits vorhanden
│   ├── events.ts              # NEU: GET /events (Radius-Query + Filter)
│   └── congregations.ts       # NEU: GET /congregations/:id (Profil + Events)
├── db/
│   ├── schema.ts              # bereits vorhanden
│   └── index.ts               # bereits vorhanden
└── server.ts                  # buildApp() — Plugins + Routes registrieren
```

### Recommended Project Structure (02-02 Mobile)

```
apps/mobile/
├── app/
│   ├── _layout.tsx            # Root Layout mit QueryClientProvider
│   ├── (tabs)/
│   │   ├── index.tsx          # Karten-Tab (MapView + Marker + Cluster)
│   │   └── _layout.tsx
│   └── events/
│       └── [id].tsx           # Event-Detailseite
├── components/
│   ├── EventMarker.tsx        # Einzelner Marker
│   ├── ClusterMarker.tsx      # Cluster-Marker (Anzahl anzeigen)
│   └── EventDetailSheet.tsx   # Bottom Sheet für Event-Details
├── hooks/
│   ├── useEvents.ts           # TanStack Query für Events
│   └── useClustering.ts       # Supercluster-Hook
└── lib/
    ├── queryClient.ts         # QueryClient + MMKV Persister
    └── mapsNavigation.ts      # Linking.openURL Helper
```

### Pattern 1: PostGIS Radius-Query mit Drizzle

**Was:** ST_DWithin mit `::geography`-Cast für metergenaue Distanzberechnung
**Wann:** Immer wenn Radius in Metern statt Grad angegeben wird

```typescript
// Source: https://wanago.io/2025/01/13/api-nestjs-distance-radius-postgresql-drizzle/
// apps/api/src/routes/events.ts

import { sql, and, gte, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { events, congregations } from "../db/schema.js";

async function getEventsInRadius(
  lat: number,
  lon: number,
  radiusMeters: number,
  category?: string,
  dateFrom?: Date
) {
  return db
    .select({
      id: events.id,
      title: events.title,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      category: events.category,
      description: events.description,
      imageUrl: events.imageUrl,
      price: events.price,
      registrationUrl: events.registrationUrl,
      bringItems: events.bringItems,
      persons: events.persons,
      congregationId: events.congregationId,
      // Geo aus Congregation joinen
      address: congregations.address,
      lat: sql<number>`ST_Y(${congregations.location})`,
      lon: sql<number>`ST_X(${congregations.location})`,
    })
    .from(events)
    .innerJoin(congregations, eq(events.congregationId, congregations.id))
    .where(
      and(
        sql`ST_DWithin(
          ${congregations.location}::geography,
          ST_MakePoint(${lon}, ${lat})::geography,
          ${radiusMeters}
        )`,
        category ? eq(events.category, category as any) : undefined,
        dateFrom ? gte(events.startsAt, dateFrom) : undefined
      )
    )
    .orderBy(events.startsAt);
}
```

### Pattern 2: Fastify Route mit Zod-Validierung

**Was:** Type Provider + Zod-Schema für Query-Parameter mit automatischer Coercion
**Wann:** Alle Endpoints mit Query-Parametern

```typescript
// Source: https://github.com/turkerdev/fastify-type-provider-zod
// apps/api/src/routes/events.ts

import { z } from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

const eventsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(100000).default(10000),
  category: z.enum(["gottesdienst","konzert","jugend","gemeindeleben","lesung","diskussion","andacht"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const eventsPlugin: FastifyPluginAsyncZod = async (app) => {
  app.get("/events", {
    schema: { querystring: eventsQuerySchema },
  }, async (req, reply) => {
    const { lat, lon, radius, category, dateFrom } = req.query;
    const result = await getEventsInRadius(lat, lon, radius, category, dateFrom);
    return result;
  });
};
```

### Pattern 3: Supercluster Hook für Map Clustering

**Was:** Manueller supercluster-Hook der MapView-Region in Cluster umrechnet
**Wann:** Karten-Tab mit vielen Markern

```typescript
// Source: https://www.upsilonit.com/blog/how-to-do-map-clustering-with-react-native
// apps/mobile/hooks/useClustering.ts

import { useMemo } from "react";
import Supercluster from "@mapbox/supercluster";
import type { Region } from "react-native-maps";

interface Point {
  id: string;
  lat: number;
  lon: number;
  type: "event" | "congregation";
}

export function useClustering(points: Point[], region: Region, mapDimensions: { width: number; height: number }) {
  const supercluster = useMemo(() => {
    const sc = new Supercluster({ radius: 60, maxZoom: 16 });
    sc.load(
      points.map((p) => ({
        type: "Feature",
        properties: { id: p.id, type: p.type },
        geometry: { type: "Point", coordinates: [p.lon, p.lat] },
      }))
    );
    return sc;
  }, [points]);

  const clusters = useMemo(() => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    const bbox: [number, number, number, number] = [
      longitude - longitudeDelta / 2,
      latitude - latitudeDelta / 2,
      longitude + longitudeDelta / 2,
      latitude + latitudeDelta / 2,
    ];
    const zoom = Math.round(
      Math.log2(360 / longitudeDelta)
    );
    return supercluster.getClusters(bbox, zoom);
  }, [supercluster, region]);

  return { clusters, supercluster };
}
```

### Pattern 4: MMKV + TanStack Query Offline-Persistenz

**Was:** Synchroner MMKV-Persister für den gesamten Query-Cache
**Wann:** App-Root, einmalig einrichten

```typescript
// Source: https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_REACT_QUERY.md
// apps/mobile/lib/queryClient.ts

import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "query-cache" });

const mmkvStorageAdapter = {
  setItem: (key: string, value: string) => storage.set(key, value),
  getItem: (key: string) => storage.getString(key) ?? null,
  removeItem: (key: string) => storage.delete(key),
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 Minuten
      gcTime: 24 * 60 * 60 * 1000, // 24 Stunden (offline nutzbar)
    },
  },
});

export const persister = createSyncStoragePersister({
  storage: mmkvStorageAdapter,
  throttleTime: 3000, // max. alle 3s serialisieren
});
```

```typescript
// apps/mobile/app/_layout.tsx
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, persister } from "../lib/queryClient";

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {/* ... */}
    </PersistQueryClientProvider>
  );
}
```

### Pattern 5: Maps Navigation Deep Link

**Was:** `Linking.openURL()` mit plattformspezifischen URL-Schemas
**Wann:** "Navigation starten" Button auf Event-Detailseite

```typescript
// Source: https://docs.expo.dev/linking/into-other-apps/
// apps/mobile/lib/mapsNavigation.ts

import { Linking, Platform } from "react-native";

export async function openMapsNavigation(lat: number, lon: number, label: string) {
  const encodedLabel = encodeURIComponent(label);
  const url = Platform.select({
    ios: `maps://0,0?q=${encodedLabel}@${lat},${lon}`,
    android: `geo:${lat},${lon}?q=${lat},${lon}(${encodedLabel})`,
  })!;

  const fallbackUrl = `https://maps.google.com/?q=${lat},${lon}`;

  const canOpen = await Linking.canOpenURL(url);
  await Linking.openURL(canOpen ? url : fallbackUrl);
}
```

**iOS Info.plist Config** (in app.json Expo Plugin):
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "LSApplicationQueriesSchemes": ["maps", "comgooglemaps"]
      }
    }
  }
}
```

### Anti-Patterns to Avoid

- **Koordinaten als SRID 4326 übergeben:** `ST_MakePoint(lon, lat)` — NICHT `ST_MakePoint(lat, lon)`. PostGIS ist lon-first.
- **Ohne `::geography`-Cast rechnen:** Ohne Cast gibt ST_DWithin Ergebnisse in Grad zurück, nicht Metern.
- **GIST-Index nicht nutzen:** Index liegt auf `congregations.location`, nicht auf `events`. Join auf Congregation ist nötig, damit der Index greift.
- **react-native-map-clustering installieren:** Diese Library ist für New Architecture inkompatibel.
- **Gesamten QueryClient-State auf einmal persistieren ohne Throttle:** Kann zu CPU-/Batterie-Problemen führen. `throttleTime: 3000` setzt.
- **Google Maps als Default-Provider auf iOS in Expo Go:** Nur Apple Maps (`PROVIDER_DEFAULT`) funktioniert in Expo Go auf iOS.

---

## Don't Hand-Roll

| Problem | Nicht selbst bauen | Verwenden | Warum |
|---------|-------------------|-----------|-------|
| Map Clustering | Eigene Cluster-Logik | @mapbox/supercluster | Viewport-Zoom, Aggregation, Performance komplex |
| Query-Parameter-Validierung | Manuelles Type-Casting | fastify-type-provider-zod | Strings aus Query werden nicht automatisch zu Number |
| Offline-Cache | AsyncStorage mit eigenem TTL | TanStack Persister + MMKV | Cache-Invalidierung, Serialisierung, GC sind gelöst |
| Maps-Navigation | eigene Maps-URL-Logik | Linking.openURL + Platform.select | Edge Cases pro Plattform (Google Maps App vs Web Fallback) |
| Radius in Metern | Grad-basierte Approximation | ST_DWithin + ::geography Cast | Erd-Krümmung, Meridian-Verzerrung korrekt berücksichtigt |

---

## Common Pitfalls

### Pitfall 1: Koordinaten-Reihenfolge in PostGIS

**Was schief geht:** `ST_MakePoint(lat, lon)` statt `ST_MakePoint(lon, lat)` — Query gibt falsche Ergebnisse ohne Fehler.
**Warum:** PostGIS ist immer X=Longitude, Y=Latitude. Standard-Konvention, aber umgekehrt von üblicher "lat, lon"-Notation.
**Wie vermeiden:** Immer `ST_MakePoint(${lon}, ${lat})` schreiben. In Code-Reviews explizit kommentieren.
**Warnsignal:** Kein DB-Fehler, aber Events in völlig falschen Regionen.

### Pitfall 2: Expo Mobile App nicht initialisiert

**Was schief geht:** Die aktuelle `apps/mobile` ist ein leeres Gerüst (nur package.json + app.json mit 2 Feldern). Expo SDK, expo-router, React Native müssen erst installiert werden.
**Warum:** 01-01 hat nur das Gerüst angelegt, kein echtes Expo-Projekt.
**Wie vermeiden:** Plan 02-02 muss als ersten Schritt `npx create-expo-app` ausführen oder manuell SDK 52 installieren und `app.json` vollständig befüllen.
**Warnsignal:** `expo start` schlägt fehl, kein `expo` in package.json.

### Pitfall 3: react-native-maps Marker auf Android in Expo SDK 52

**Was schief geht:** Marker erscheinen auf Android zufällig nicht (bekannter Bug #5221).
**Warum:** Bekanntes Issue im react-native-maps Issue Tracker für SDK 52.
**Wie vermeiden:** `tracksViewChanges={false}` auf Markern setzen (Standard-Workaround). Nur Development Build verwenden, nicht Expo Go auf Android.
**Warnsignal:** Marker auf iOS sichtbar, auf Android nicht.

### Pitfall 4: MMKV v3 ohne New Architecture

**Was schief geht:** `react-native-mmkv@^3.x` crasht wenn New Architecture nicht aktiv.
**Warum:** V3 nutzt TurboModules / JSI — nur New Arch.
**Wie vermeiden:** Expo SDK 52 initialisiert New Architecture by default. `newArchEnabled: true` in app.json prüfen.
**Warnsignal:** Native Crash beim App-Start.

### Pitfall 5: ST_DWithin verwendet keinen GIST-Index

**Was schief geht:** Query ist langsam obwohl GIST-Index existiert.
**Warum:** Der Index liegt auf `congregations.location`. Wenn direkt auf `events` gequeries wird ohne Join, wird der Index nicht genutzt.
**Wie vermeiden:** Immer über `congregations` joinen. Index liegt dort — ST_DWithin auf `congregations.location` trifft den Index.
**Warnsignal:** `EXPLAIN ANALYZE` zeigt Sequential Scan statt Index Scan.

### Pitfall 6: EventDTO fehlen Felder für DISC-04

**Was schief geht:** Das aktuelle `EventDTO` in `packages/types/src/index.ts` hat `price`, `registrationUrl`, `bringItems`, `persons` NICHT — diese Felder existieren in der DB und im Drizzle-Schema, aber nicht im DTO.
**Warum:** DTO wurde in 01-01 als Minimal-Scaffold erstellt.
**Wie vermeiden:** Plan 02-01 muss EventDTO erweitern und als erstes den Typ-Vertrag aktualisieren.

---

## State of the Art

| Alter Ansatz | Aktueller Ansatz | Geändert | Impact |
|--------------|------------------|----------|--------|
| react-native-map-clustering | @mapbox/supercluster manuell | 2024 (New Arch) | Library inkompatibel, manuell nötig |
| AsyncStorage Persistence | MMKV + Sync Persister | MMKV v3 (2024) | 30x schneller, New Arch nativ |
| Fastify JSON Schema (AJV) | fastify-type-provider-zod | Fastify 5 era | Vollständige TypeScript-Typen ohne manuelle Typen |
| Google Maps als Default | Apple Maps (`PROVIDER_DEFAULT`) auf iOS | Expo SDK 52 | Google Maps in Expo Go Android deprecated ab SDK 53 |

**Deprecated/veraltet:**
- `react-native-map-clustering`: Nicht mit New Architecture kompatibel — nicht verwenden
- `@tanstack/react-query v4 persistQueryClient`: Nutzt anderes API als v5 — v5-Pakete verwenden
- Fastify `ajv`-Schema für Query-Params: Kein automatisches Type-Casting für Strings → Numbers

---

## Open Questions

1. **Expo SDK-Initialisierung der Mobile-App**
   - Was wir wissen: apps/mobile ist ein leeres Gerüst
   - Unklar: Ob `create-expo-app` oder manuelle Konfiguration sauberer für bestehende Monorepo-Struktur
   - Empfehlung: Manuell SDK 52 installieren und app.json befüllen — kein `create-expo-app` um existierende Monorepo-Struktur nicht zu überschreiben

2. **Clustering-Library-Wahl**
   - Was wir wissen: react-native-map-clustering ist veraltet; supercluster manuell funktioniert; react-native-clusterer (C++ JSI) ist New-Arch-nativ aber wenig dokumentiert
   - Unklar: Ob react-native-clusterer stabil genug für Produktion ist
   - Empfehlung: @mapbox/supercluster manuell — bewährt, gut dokumentiert, kein extra Native Build nötig

3. **Server-seitiges vs. Client-seitiges Clustering**
   - Was wir wissen: SuperCluster läuft auf dem Client
   - Unklar: Bei vielen Events (1000+) könnte Server-seitiges Clustering via PostGIS nötig sein
   - Empfehlung: Client-seitig starten (realistischer Datenumfang für MVP), Server-seitiges Clustering als spätere Optimierung

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^3.0.0 (API) |
| Config file | `apps/api/vitest.config.ts` |
| Quick run command | `pnpm --filter @prayback/api test` |
| Full suite command | `pnpm --filter @prayback/api test -- --reporter=verbose` |

**Hinweis Mobile:** apps/mobile hat noch kein Test-Framework. Jest/Vitest für React Native kann in Plan 02-02 hinzugefügt werden, ist aber kein MVP-Blocker für Phase 2 — manuelle Verifikation über Expo Go / Development Build ist akzeptabel.

### Phase Requirements → Test Map (API)

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-01 | GET /events gibt Events mit Geo-Koordinaten zurück | unit/inject | `pnpm --filter @prayback/api test` | ❌ Wave 0 |
| DISC-02 | GET /events?category=gottesdienst filtert korrekt | unit/inject | `pnpm --filter @prayback/api test` | ❌ Wave 0 |
| DISC-03 | GET /events?lat=&lon=&radius= gibt nur Events in Radius zurück | unit/inject | `pnpm --filter @prayback/api test` | ❌ Wave 0 |
| DISC-04 | EventDTO enthält price, registrationUrl, bringItems, persons | type-check | `pnpm turbo typecheck` | ❌ Wave 0 |
| DISC-05 | — | manual | Expo Go / Dev Build | n/a |
| DISC-06 | — | manual | Expo Go offline testen | n/a |
| DISC-07 | GET /congregations/:id gibt Profil + Events zurück | unit/inject | `pnpm --filter @prayback/api test` | ❌ Wave 0 |
| AUTH-01 | Alle Endpoints antworten ohne Auth-Header mit 200 | unit/inject | `pnpm --filter @prayback/api test` | ❌ Wave 0 |

### Sampling Rate

- **Per Task Commit:** `pnpm --filter @prayback/api test`
- **Per Wave Merge:** `pnpm turbo typecheck && pnpm --filter @prayback/api test`
- **Phase Gate:** Alle API-Tests grün + Manuelle Verifikation in Expo Go bevor `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/api/src/__tests__/events.test.ts` — deckt DISC-01, DISC-02, DISC-03
- [ ] `apps/api/src/__tests__/congregations.test.ts` — deckt DISC-07
- [ ] Auth-less Test Helper (wiederverwendbar für spätere Routen)

---

## Sources

### Primary (HIGH confidence)

- [Drizzle ORM PostGIS Guide](https://orm.drizzle.team/docs/guides/postgis-geometry-point) — Geometry-Spalten, `sql`-Template-Pattern
- [wanago.io ST_DWithin + Drizzle (Jan 2025)](https://wanago.io/2025/01/13/api-nestjs-distance-radius-postgresql-drizzle/) — `::geography`-Cast-Pattern für Meter-basierte Distanz
- [PostGIS ST_DWithin Docs](https://postgis.net/documentation/tips/st-dwithin/) — Offizielle Dokumentation
- [fastify-type-provider-zod GitHub](https://github.com/turkerdev/fastify-type-provider-zod) — Offizielle Fastify 5 Zod Integration
- [react-native-mmkv WRAPPER_REACT_QUERY.md](https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_REACT_QUERY.md) — Offizielles MMKV+TanStack-Pattern
- [Expo SDK 52 Changelog](https://expo.dev/changelog/2024-11-12-sdk-52) — New Architecture by Default

### Secondary (MEDIUM confidence)

- [Expo react-native-maps Docs](https://docs.expo.dev/versions/latest/sdk/map-view/) — Installations-Guide + Plugin-Config
- [Expo Linking into other apps](https://docs.expo.dev/linking/into-other-apps/) — Maps Deep Link Pattern
- [TanStack Query persistQueryClient Docs](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient) — PersistQueryClientProvider API
- [mapbox/supercluster GitHub](https://github.com/mapbox/supercluster) — Clustering-Library API

### Tertiary (LOW confidence)

- [Medium: Map Clustering with React Native (Expo)](https://medium.com/@chris00hernandez/map-clustering-with-react-native-expo-32644a41b399) — Supercluster + react-native-maps Beispiel, nicht offiziell verifiziert
- [react-native-maps Issue #5221](https://github.com/react-native-maps/react-native-maps/issues/5221) — Android Marker Bug SDK 52, Community-Report

---

## Metadata

**Confidence breakdown:**

- Standard Stack (API): HIGH — Drizzle + PostGIS + Fastify + Zod sind deployed und etabliert
- Standard Stack (Mobile): MEDIUM — Expo noch nicht initialisiert, Clustering-Library-Wahl nicht in Produktion verifiziert
- Architecture (API): HIGH — Klar, basiert auf bestehendem Schema und bewährten Patterns
- Architecture (Mobile): MEDIUM — Supercluster-Hook-Pattern aus mehreren Quellen, aber nicht im Projekt getestet
- Pitfalls: HIGH — lon/lat-Reihenfolge und GIST-Index offiziell verifiziert; Marker-Bug ist GitHub-Issue; MMKV New Arch ist offizielle Anforderung

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stabil bis auf Expo SDK Updates)
