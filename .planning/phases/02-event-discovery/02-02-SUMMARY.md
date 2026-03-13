---
phase: 02-event-discovery
plan: "02"
subsystem: ui
tags: [expo, react-native, react-native-maps, supercluster, tanstack-query, typescript]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Monorepo-Struktur mit apps/mobile-Geruest und packages/types

provides:
  - Expo SDK 52 App mit expo-router und New Architecture
  - MapView (Apple Maps) mit Supercluster-Clustering
  - QueryClient mit staleTime 5min/gcTime 24h
  - Tab-Navigation mit Karten-Tab
  - 10 Mock-Events in Dithmarschen fuer Cluster-Demo

affects: [02-event-discovery/02-03, 02-event-discovery/02-04]

# Tech tracking
tech-stack:
  added:
    - expo@52.0.49
    - expo-router@4.0.22
    - react-native@0.76.7
    - react-native-maps@1.20.1
    - supercluster@8.0.1 (statt @mapbox/supercluster — nicht mehr im npm-Registry)
    - "@tanstack/react-query@^5"
    - react-native-gesture-handler
    - react-native-safe-area-context
    - react-native-screens
  patterns:
    - useClustering Hook (supercluster + MapView Region → Cluster-Array)
    - PROVIDER_DEFAULT fuer Apple Maps auf iOS in Expo Go
    - tracksViewChanges=false auf allen Markern (Android Marker-Bug Workaround)
    - QueryClientProvider wrapping Stack in Root Layout

key-files:
  created:
    - apps/mobile/app/_layout.tsx
    - apps/mobile/app/(tabs)/_layout.tsx
    - apps/mobile/app/(tabs)/index.tsx
    - apps/mobile/hooks/useClustering.ts
    - apps/mobile/components/ClusterMarker.tsx
    - apps/mobile/lib/queryClient.ts
    - apps/mobile/tsconfig.json
  modified:
    - apps/mobile/package.json
    - apps/mobile/app.json

key-decisions:
  - "supercluster (unscoped) statt @mapbox/supercluster verwenden — @mapbox-Package nicht mehr im npm-Registry verfuegbar"
  - "Expo SDK 52.0.49 exakt gepinnt (nicht ~52) wegen Kompatibilitaet mit expo-router@4 und dessen peer deps expo-linking@7 / expo-constants@17"
  - "MMKV-Persister erst in Plan 02-03 hinzufuegen — queryClient.ts bleibt vorerst ohne MMKV (Plan-Entscheidung)"
  - "PROVIDER_DEFAULT (Apple Maps) auf iOS — kein Google Maps wegen Expo Go Bug"

patterns-established:
  - "useClustering Hook: Input Points[]+Region+Dimensionen, Output clusters+supercluster-Instanz"
  - "Cluster-Tap: getClusterExpansionZoom() fuer dynamisches Zoomen auf Cluster-Inhalt"
  - "ClusterMarker: blauer Kreis (#2563EB) mit weisser Zahl, tracksViewChanges=false"

requirements-completed: [DISC-01]

# Metrics
duration: 4min
completed: 2026-03-13
---

# Phase 2 Plan 02: Mobile-App mit Expo SDK 52, MapView und Supercluster-Clustering

**Expo SDK 52 App mit expo-router, Apple Maps MapView und manuellem supercluster-Clustering — 10 Mock-Events in Dithmarschen sichtbar und zoombar**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-13T17:36:06Z
- **Completed:** 2026-03-13T17:39:43Z
- **Tasks:** 2 completed
- **Files modified:** 9

## Accomplishments

- Expo SDK 52 mit New Architecture (newArchEnabled: true) und expo-router@4 installiert
- MapView mit PROVIDER_DEFAULT (Apple Maps) zentriert auf Dithmarschen/Nordfriesland
- Supercluster-Hook (radius 60, maxZoom 16) mit Region-basierter Cluster-Berechnung
- Tab-Navigation und QueryClient mit staleTime 5min/gcTime 24h eingerichtet
- TypeScript strict mode — alle Checks gruen (pnpm turbo typecheck: 5/5 Tasks gruen)

## Task Commits

1. **Task 1: Expo SDK 52 initialisieren** - `3b900a4` (feat)
2. **Task 2: MapView, Clustering und QueryClient** - `06883c7` (feat)

## Files Created/Modified

- `apps/mobile/app.json` - Expo-Konfiguration: kiek-mal Slug, New Architecture, Apple Maps Info.plist
- `apps/mobile/package.json` - main=expo-router/entry, alle Dependencies
- `apps/mobile/tsconfig.json` - extends expo/tsconfig.base, strict, @prayback/types Path
- `apps/mobile/lib/queryClient.ts` - QueryClient mit staleTime 5min / gcTime 24h
- `apps/mobile/hooks/useClustering.ts` - supercluster Hook: Points+Region → clusters+supercluster
- `apps/mobile/components/ClusterMarker.tsx` - Blauer Badge-Marker mit Anzahl
- `apps/mobile/app/_layout.tsx` - Root Layout mit SafeAreaProvider + QueryClientProvider
- `apps/mobile/app/(tabs)/_layout.tsx` - Tab-Navigation (Karte-Tab)
- `apps/mobile/app/(tabs)/index.tsx` - MapView mit 10 Mock-Events in Dithmarschen

## Decisions Made

- **supercluster (unscoped) statt @mapbox/supercluster:** `@mapbox/supercluster` ist nicht mehr im npm-Registry verfuegbar. `supercluster` (gleiche Library, gleiche API, unscoped) ist 8.0.1 und wird verwendet.
- **Expo SDK 52 exakt pinnen:** pnpm installierte mit `expo@~52` nicht SDK 52 sondern die aktuelle Version. Geloest durch exakte Version `52.0.49` und passende peer-deps `expo-linking@7.0.5` + `expo-constants@17.0.8`.
- **MMKV-Persister separiert:** queryClient.ts hat vorerst nur QueryClient ohne MMKV-Persister — dieser kommt in Plan 02-03 gemaess Plan-Aufteilung.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] @mapbox/supercluster nicht im npm-Registry**
- **Found during:** Task 1 (Dependencies installieren)
- **Issue:** `pnpm add @mapbox/supercluster` scheiterte mit 404 — Package nicht mehr im npm-Registry verfuegbar
- **Fix:** `supercluster@^8.0.1` (unscoped) installiert — identische API und Codebase, nur anderer Package-Name
- **Files modified:** apps/mobile/package.json, pnpm-lock.yaml
- **Verification:** Import `import Supercluster from "supercluster"` funktioniert, tsc --noEmit fehlerfrei
- **Committed in:** 3b900a4 (Task 1 Commit)

**2. [Rule 3 - Blocking] Expo SDK 52 Versionskonflikt bei pnpm-Installation**
- **Found during:** Task 1 (Expo installieren)
- **Issue:** `pnpm add expo@~52` installierte Expo 55 (aktuelle Version). `expo-router@4.0.22` erfordert `expo-linking@~7.0.5` und `expo-constants@~17.0.8` (SDK 52 Versionen), was zu peer-dep-Warnings fuehrte
- **Fix:** Exakte Versionen gepinnt: `expo@52.0.49`, `expo-linking@7.0.5`, `expo-constants@17.0.8`
- **Files modified:** apps/mobile/package.json, pnpm-lock.yaml
- **Verification:** Keine peer-dep-Warnings, `npx expo config` zeigt korrekte SDK 52 Konfiguration
- **Committed in:** 3b900a4 (Task 1 Commit)

---

**Total deviations:** 2 auto-fixed (2x Rule 3 - Blocking)
**Impact on plan:** Beide Auto-Fixes notwendig fuer korrekte Dependency-Auflosung. Kein Scope Creep.

## Issues Encountered

- `npx expo install` schlaegt ohne installiertes Expo-SDK fehl (Henne-Ei-Problem) — geloest durch direktes `pnpm add` mit exakten Versionsnummern

## User Setup Required

None — kein externes Service-Setup benoetigt. Manuelle Verifikation via `npx expo start` in apps/mobile moeglich.

## Next Phase Readiness

- Plan 02-03: MMKV-Persister und Offline-Cache koennen direkt auf queryClient.ts aufbauen
- Plan 02-04: Echte API-Anbindung ersetzt Mock-Events in index.tsx — Hook `useEvents` wird hinzugefuegt
- Kein Blocker fuer nachfolgende Plans

## Self-Check: PASSED

- All 7 created files verified on disk
- Both task commits (3b900a4, 06883c7) verified in git log
- TypeScript: tsc --noEmit passes with no errors

---
*Phase: 02-event-discovery*
*Completed: 2026-03-13*
