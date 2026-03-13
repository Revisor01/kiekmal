---
phase: 01-foundation
plan: 01
subsystem: monorepo
tags: [turborepo, pnpm, typescript, monorepo, shared-types]
dependency_graph:
  requires: []
  provides: [monorepo-structure, shared-types, workspace-packages]
  affects: [01-02, 01-03, all-subsequent-plans]
tech_stack:
  added:
    - turbo@2.8.16
    - pnpm@9.15.9
    - typescript@5.9.3
    - vite@8.0.0
    - "@vitejs/plugin-react@6.0.1"
    - tsx@4.21.0
    - react@18.3.1
    - react-dom@18.3.1
  patterns:
    - pnpm Workspaces mit node-linker=hoisted fuer Expo/RN-Kompatibilitaet
    - Turborepo build mit dependsOn fuer korrekte Build-Reihenfolge
    - packages/types als Shared-Package ohne Build-Step (direkte TS-Source-Exporte)
key_files:
  created:
    - package.json
    - pnpm-workspace.yaml
    - turbo.json
    - .npmrc
    - .gitignore
    - tsconfig.json
    - packages/types/package.json
    - packages/types/tsconfig.json
    - packages/types/src/index.ts
    - apps/api/package.json
    - apps/api/tsconfig.json
    - apps/api/src/index.ts
    - apps/mobile/package.json
    - apps/mobile/app.json
    - apps/admin/package.json
    - apps/admin/tsconfig.json
    - apps/admin/vite.config.ts
    - apps/admin/index.html
    - apps/admin/src/main.tsx
    - apps/admin/src/App.tsx
    - pnpm-lock.yaml
  modified: []
decisions:
  - "packages/types exportiert direkt aus src/index.ts ohne Compile-Schritt — kein dist/-Verzeichnis noetig solange alle Consumer TypeScript verwenden"
  - "apps/mobile build-Script ist nur ein echo (Expo baut via EAS, nicht Turborepo) — Warnung in turbo ist expected"
  - ".npmrc mit node-linker=hoisted gesetzt trotz moeglicher SDK-55-Fixes — schadet nicht, verhindert potenzielle RN-Singleton-Konflikte"
metrics:
  duration: "~3 Minuten"
  tasks_completed: 2
  tasks_total: 2
  files_created: 21
  files_modified: 0
  completed_date: "2026-03-13"
---

# Phase 1 Plan 1: Monorepo-Setup und Shared Types Summary

Turborepo-Monorepo mit pnpm Workspaces aufgesetzt: apps/api, apps/mobile, apps/admin und packages/types mit direkten TypeScript-Source-Exporten ohne Compile-Step.

## What Was Built

Vollstaendiges Turborepo-Monorepo mit 4 Workspace-Packages. `@prayback/types` exportiert `EventDTO`, `CongregationDTO` und `EventCategory` und ist von `@prayback/api` und `@prayback/mobile` via `workspace:*` dependency importierbar. `@prayback/admin` ist als Vite+React Geruest registriert. `.npmrc` mit `node-linker=hoisted` sichert Expo/React Native Singleton-Kompatibilitaet.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Monorepo-Root und packages/types erstellen | 408638c | package.json, pnpm-workspace.yaml, .npmrc, turbo.json, tsconfig.json, packages/types/src/index.ts |
| 2 | App-Scaffolds erstellen (api, mobile, admin) | e3b800c | apps/api/src/index.ts, apps/mobile/package.json, apps/admin/vite.config.ts, apps/admin/src/App.tsx |

## Verification Results

- `pnpm turbo build`: 4/4 Packages erfolgreich (exit code 0)
- `pnpm turbo typecheck`: 4/4 Packages erfolgreich (exit code 0)
- `pnpm ls -r`: Zeigt alle 4 Workspace-Packages mit korrekten workspace-Links
- `@prayback/types` Import in `apps/api/src/index.ts` kompiliert fehlerfrei
- `.npmrc` enthaelt `node-linker=hoisted`

## Deviations from Plan

Keine — Plan exakt wie geplant ausgefuehrt.

## Self-Check: PASSED

### Created Files Verification
- package.json: vorhanden
- pnpm-workspace.yaml: vorhanden
- .npmrc: vorhanden (enthaelt node-linker=hoisted)
- turbo.json: vorhanden (enthaelt dependsOn)
- packages/types/src/index.ts: vorhanden (exportiert EventDTO, CongregationDTO, EventCategory)
- apps/api/package.json: vorhanden (enthaelt @prayback/types workspace:*)
- apps/mobile/package.json: vorhanden (enthaelt @prayback/types workspace:*)

### Commit Verification
- 408638c: feat(01-01): Monorepo-Root und packages/types erstellen
- e3b800c: feat(01-01): App-Scaffolds fuer api, mobile und admin erstellen
