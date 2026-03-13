# Stack Research

**Domain:** Cross-platform church event discovery app with maps, QR check-in, geofencing, gamification
**Researched:** 2026-03-13
**Confidence:** MEDIUM (most choices HIGH, maps layer MEDIUM due to active SDK 55 compatibility issues)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo SDK | 55.x | React Native build toolchain + OTA updates | Current stable release (Feb 2026), includes React Native 0.83 + React 19. CNG (Continuous Native Generation) eliminates manual native code management — critical for a two-person team. |
| Expo Router | 55.x | File-based navigation (bundled with SDK 55) | Built on React Navigation, file-system routes → deep links without config. Replaces react-navigation setup cost. No separate version pin needed. |
| TypeScript | 5.x | Type safety across frontend + backend | Shared types possible between app and API. Catches coordinate/GeoJSON shape mismatches at compile time — especially valuable for geo data. |
| Node.js | 22 LTS | Backend runtime | LTS until 2027. Fastify and Drizzle work best on 20+. Consistent TS throughout full stack. |
| Fastify | 5.x | HTTP framework | Greenfield in 2026: Fastify handles 2-3x more req/s than Express, has native TypeScript support, built-in JSON schema validation (no extra middleware), and auto-generates Swagger docs. Express is only better for legacy projects. |
| PostgreSQL | 16 + PostGIS 3.4 | Primary database with spatial queries | `ST_DWithin` for radius searches, `ST_Distance` for sorting by proximity, clustering support. PostGIS 3.4 supports GIST indexes on geography columns — essential for performant "events near me" queries. |
| Drizzle ORM | 0.31+ | Type-safe PostgreSQL client with PostGIS support | Native PostGIS geometry types since 0.31.0 (point, geometry). Raw SQL escape hatch for complex ST_ functions. Drizzle-kit for migrations. Lighter than Prisma, no query engine binary to ship in Docker. |
| Redis | 7.x | BullMQ queue backend + session cache | BullMQ requires Redis. Also used for API rate limiting and short-lived cache (ChurchDesk sync results). Runs as sidecar container on existing Docker stack. |
| BullMQ | 5.x | Job queue for ChurchDesk sync + scheduled tasks | Written in TypeScript, active maintenance (Bull is in maintenance-only mode). Repeatable jobs via cron expressions for periodic ChurchDesk API polling. Delayed jobs for badge award processing. |

### Supporting Libraries — Frontend (React Native / Expo)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-maps | 1.26.x (pinned) | Map rendering (Apple Maps on iOS, Google Maps on Android) | Core map screen. **IMPORTANT:** Use Apple Maps provider on iOS (`PROVIDER_DEFAULT`). Avoid `PROVIDER_GOOGLE` on iOS with SDK 55 — active compatibility bug (expo/expo#43288). Google Maps on Android works fine. Pin version to avoid regressions. |
| react-native-clusterer | latest | Supercluster via JSI/C++ bindings for map marker clustering | Use when rendering >50 church/event markers on map. 10x faster than JS-based clustering because it runs natively via JSI. Required for Deutschland-wide coverage. |
| expo-location | SDK 55 bundled | Foreground + background location, geofencing | Geofencing check-in comfort layer. Use `startGeofencingAsync` + `expo-task-manager` for background region enter/exit events. No third-party needed for this use case. |
| expo-task-manager | SDK 55 bundled | Background task registration | Required companion to expo-location for background geofencing. Register tasks at module level (not inside components). |
| expo-camera | SDK 55 bundled | Camera access + QR code scanning | QR check-in screen. `CameraView` with `onBarcodeScanned` handles QR scanning natively. No separate scanner library needed — expo-barcode-scanner is deprecated. |
| react-native-qrcode-svg | 6.x | QR code generation (for Gemeinde-admin panel) | Render the per-Gemeinde QR code on admin screen. SVG output scales perfectly on all densities. |
| @tanstack/react-query | 5.x | Server state management + offline cache layer | `networkMode: "offlineFirst"`, `staleTime`, `gcTime` configuration gives automatic offline serving of cached event data. Use with `@tanstack/query-async-storage-persister` for cross-session persistence. |
| @tanstack/query-async-storage-persister | 5.x | Persist TanStack Query cache to MMKV | Bridge between TanStack Query cache and MMKV storage. Survives app restarts. |
| react-native-mmkv | 3.x | Fast key-value storage | 30x faster than AsyncStorage. Use for: cached event lists, user session tokens, last-known map region, onboarding state, Prayback point total. |
| lottie-react-native | 7.x | Lottie animation player | Badge unlock animations, check-in celebration. Lightweight, vector-based, Airbnb-originated. Use `expo install lottie-react-native` — no manual pod step. |
| react-native-svg | 15.x | SVG rendering | QR code display (dependency of react-native-qrcode-svg) + custom badge icons as SVG. |
| expo-linking | SDK 55 bundled | Deep links + external navigation handoff | Opening Google Maps / Apple Maps for navigation to event location. `Linking.openURL('maps://...')` with fallback to `https://maps.google.com`. |
| zustand | 5.x | Client-side global state (non-server state) | Auth state, current user Prayback points/badges, UI state (selected map filter, sheet open/closed). Lighter than Redux, no boilerplate. |
| zod | 3.x | Runtime validation | Validate ChurchDesk API responses, form inputs in event creation, API request bodies. Share schema types between frontend and backend via a shared package. |

### Supporting Libraries — Backend (Node.js / Fastify)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-kit | 0.22+ | Database migrations + schema introspection | `drizzle-kit generate` + `drizzle-kit migrate` in CI/Docker startup. Never run raw SQL migrations manually. |
| @fastify/jwt | 9.x | JWT authentication | Stateless auth for mobile clients. Access token (15min) + refresh token (7 days). Standard Fastify plugin, no boilerplate. |
| @fastify/swagger | 9.x | Auto-generated OpenAPI docs | Free from Fastify's JSON schema validation. Use during development for ChurchDesk sync endpoint contracts. |
| @fastify/rate-limit | 10.x | Rate limiting per IP/user | Protect check-in endpoint from abuse (one check-in per user per event window). Also limits ChurchDesk API passthrough. |
| axios | 1.x | HTTP client for ChurchDesk API calls | Used in BullMQ workers only (not hot path). Typed with ChurchDesk response interfaces. |
| node-cron / BullMQ repeatable | via BullMQ | Scheduled ChurchDesk sync | Use BullMQ Job Schedulers (v5.16+ API) with cron expressions instead of standalone node-cron. Survives process restarts, Redis-backed. |
| zod | 3.x | Shared validation (monorepo shared package) | Same schemas used on frontend and backend if using a monorepo or shared `packages/` folder. |
| pino | 9.x | Structured JSON logging | Fastify's default logger. Ships to Docker log driver. Zero config needed — just set `logger: true` in Fastify init. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| EAS Build | Cloud builds for iOS + Android | Required for native modules (expo-camera, react-native-maps). Expo Go insufficient for production features. Use EAS Build profiles: `development`, `preview`, `production`. |
| EAS Update | OTA JavaScript updates | Push JS-only fixes without app store review. Critical for fixing ChurchDesk sync bugs quickly post-launch. |
| Drizzle Studio | Visual DB browser | `npx drizzle-kit studio` — inspect PostGIS data locally during development. |
| Vitest | Unit + integration testing (backend) | Native TypeScript, fast. Test Drizzle queries against a test PostgreSQL container. |
| Docker Compose | Local dev environment | Spin up PostgreSQL + PostGIS + Redis locally. Mirror production Docker stack on server.godsapp.de. |

## Installation

```bash
# Frontend — Expo app
npx create-expo-app@latest prayback --template default
cd prayback
npx expo install react-native-maps react-native-clusterer
npx expo install expo-location expo-task-manager expo-camera
npx expo install react-native-qrcode-svg react-native-svg
npx expo install lottie-react-native

npm install @tanstack/react-query @tanstack/query-async-storage-persister
npm install react-native-mmkv
npm install zustand zod

# Backend — Node.js / Fastify
mkdir prayback-api && cd prayback-api
npm init -y
npm install fastify @fastify/jwt @fastify/swagger @fastify/rate-limit
npm install drizzle-orm pg
npm install bullmq ioredis axios zod pino

# Dev dependencies (backend)
npm install -D typescript tsx drizzle-kit vitest @types/node @types/pg
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| react-native-maps (Apple Maps on iOS) | expo-maps | expo-maps is alpha (breaking changes expected) — viable when it reaches stable, or if iOS 17 min-version is enforced and you only need Apple Maps |
| react-native-maps (Google Maps on Android) | Mapbox via @rnmapbox/maps | If you need offline tile caching or custom vector tile styling. Requires Mapbox account + token. More setup cost not justified here. |
| expo-camera (QR scan) | react-native-vision-camera | vision-camera has better autofocus and works from image gallery, but requires Expo config plugin setup. expo-camera is sufficient for QR-only use case. |
| Fastify | Express | Only if migrating an existing Express codebase. For greenfield in 2026, Fastify is strictly better. |
| Drizzle ORM | Prisma | Prisma has better PostGIS support via `@prisma/client` extensions, but ships a 40MB query engine binary — bad for Docker image size. Drizzle is lighter and the raw SQL escape hatch covers the PostGIS gap. |
| BullMQ | node-cron | node-cron dies on process restart and has no job history. BullMQ is Redis-backed and production-grade. |
| TanStack Query + MMKV | WatermelonDB | WatermelonDB better for complex relational offline-first sync. Overkill here — events are fetched, not locally mutated. TanStack Query handles the caching model correctly. |
| zustand | Redux Toolkit | Redux is justified for very large teams or complex global state. For this app size, zustand is simpler and fully typed. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| expo-barcode-scanner | Deprecated as of SDK 52 — removed in SDK 53 | `expo-camera` with `onBarcodeScanned` |
| react-native-qrcode-scanner | Abandoned, depends on the deprecated `react-native-camera` | `expo-camera` |
| AsyncStorage | 10-30x slower than MMKV for frequent reads (auth tokens, cached data), no encryption | `react-native-mmkv` |
| PROVIDER_GOOGLE on iOS with react-native-maps + SDK 55 | Active bug: AppDelegate mutation fails (expo/expo#43288, as of Jan 2026, unresolved) | Default provider (Apple Maps) on iOS |
| Bull (v4) | Maintenance-only mode since 2022 — no new features, TypeScript support limited | `bullmq` (v5) |
| Sequelize | Has GEOMETRY type support but its TypeScript types are notoriously broken; no PostGIS extension awareness | `drizzle-orm` with raw SQL for ST_ functions |
| react-native-maps-super-cluster | Unmaintained, JS-only clustering, no JSI | `react-native-clusterer` (C++ JSI, 10x faster) |
| expo-maps | Alpha stage — breaking changes with every release as of March 2026 | `react-native-maps` (stable, battle-tested) |

## Stack Patterns by Variant

**If ChurchDesk API uses webhook push (not polling):**
- Register a Fastify POST endpoint for webhook delivery instead of BullMQ repeatable jobs
- Still use BullMQ for processing the webhook payload asynchronously (webhook handler should return 200 fast)
- Keep the polling fallback as a catch-up mechanism

**If cluster becomes a performance issue on low-end Android devices:**
- Move clustering to the backend: compute cluster centroids server-side using PostGIS `ST_ClusterKMeans`
- Return pre-clustered GeoJSON to the app instead of running react-native-clusterer client-side

**If geofencing battery drain becomes a user complaint:**
- Reduce geofencing to opt-in only (explicit "I'm at this church" toggle instead of always-on)
- Use `expo-location` foreground location only, triggered by the QR scan flow

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| expo@55.x | react-native-maps@1.26.x (Apple Maps on iOS only) | Google Maps on iOS broken with SDK 55 (expo/expo#43288). Pin to 1.26.x until fixed. Android Google Maps works. |
| expo@55.x | lottie-react-native@7.x | SDK 55 compatible. Use `expo install` to get the correct version. |
| drizzle-orm@0.31+ | PostGIS 3.4 | geometry(Point) type supported. Polygon types need custom `sql` template literal. |
| bullmq@5.x | ioredis@5.x | BullMQ 5 requires ioredis 5. Do not use the deprecated `redis` package. |
| @tanstack/react-query@5.x | @tanstack/query-async-storage-persister@5.x | Must match major versions. v4 persisters are incompatible with v5 QueryClient. |

## Sources

- Expo SDK 55 release: https://expo.dev/changelog/sdk-53 + search results confirming SDK 55 as Feb 2026 release — MEDIUM confidence (no direct SDK 55 changelog fetched)
- react-native-maps iOS/SDK 55 bug: https://github.com/expo/expo/issues/43288 + https://github.com/react-native-maps/react-native-maps/issues/5843 — HIGH confidence (active GitHub issues)
- expo-maps alpha status: https://docs.expo.dev/versions/latest/sdk/maps/ — HIGH confidence (official docs)
- Drizzle PostGIS support: https://orm.drizzle.team/docs/guides/postgis-geometry-point — HIGH confidence (official docs)
- BullMQ Job Schedulers (v5.16+): https://docs.bullmq.io/guide/job-schedulers — HIGH confidence (official docs)
- react-native-clusterer JSI performance: https://github.com/JiriHoffmann/react-native-clusterer — MEDIUM confidence (GitHub README)
- Fastify vs Express 2025: https://betterstack.com/community/guides/scaling-nodejs/fastify-express/ — MEDIUM confidence (multiple corroborating sources)
- TanStack Query offline: https://tanstack.com/query/latest/docs/framework/react/react-native — HIGH confidence (official docs)
- MMKV vs AsyncStorage performance: https://github.com/mrousavy/StorageBenchmark — HIGH confidence (benchmark repo by mrousavy/MMKV author)
- ChurchDesk API: https://docs.churchdesk.com/public/ — LOW confidence (docs rendered as Handlebars template, actual endpoints not inspectable via fetch; verify with direct API access)

---
*Stack research for: Prayback — cross-platform church event discovery app*
*Researched: 2026-03-13*
