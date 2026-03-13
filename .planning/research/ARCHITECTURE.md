# Architecture Research

**Domain:** Event Discovery App with Maps, Gamification, and Multi-Source Data
**Researched:** 2026-03-13
**Confidence:** MEDIUM (standard patterns well-documented; ChurchDesk API details require access to actual rendered docs)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
├────────────────────────────┬────────────────────────────────────────┤
│  React Native App (Expo)   │    Web Admin Panel (React)             │
│  - Map + Event Discovery   │    - Event Management                  │
│  - Check-In (QR/Geo)       │    - Congregation Profile              │
│  - Prayback Points/Badges  │    - Admin Verification                │
│  - Offline Cache           │    - Volunteer Management              │
└────────────┬───────────────┴────────────┬───────────────────────────┘
             │  HTTPS/REST                │  HTTPS/REST
┌────────────▼───────────────────────────▼───────────────────────────┐
│                         API GATEWAY                                  │
│         (Express/Fastify — Auth, Rate Limiting, Routing)             │
├─────────────┬──────────────┬────────────────┬────────────────────── ┤
│             │              │                │                        │
│  ┌──────────▼───┐  ┌───────▼──────┐  ┌─────▼──────┐  ┌───────────┐ │
│  │ Event Service│  │ User/Auth    │  │ Check-In   │  │ Admin     │ │
│  │              │  │ Service      │  │ Service    │  │ Service   │ │
│  │ - CRUD Events│  │ - JWT Auth   │  │ - QR Codes │  │ - Verify  │ │
│  │ - Geo Queries│  │ - Accounts   │  │ - Geofence │  │   Admins  │ │
│  │ - Categories │  │ - Roles      │  │ - Points   │  │ - Invite  │ │
│  └──────────────┘  └──────────────┘  └─────┬──────┘  └───────────┘ │
│                                             │                        │
│  ┌──────────────────────────────────────────▼──────────────────┐    │
│  │                  Gamification Engine                          │    │
│  │  - Badge Rule Evaluation   - Points Ledger                   │    │
│  │  - Achievement Triggers    - Progress Tracking               │    │
│  └─────────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────┤
│                      BACKGROUND SERVICES                              │
│  ┌─────────────────────────────────┐                                  │
│  │     ChurchDesk Sync Service     │                                  │
│  │  - Scheduled Polling            │                                  │
│  │  - Data Normalization           │                                  │
│  │  - Deduplication                │                                  │
│  └─────────────────────────────────┘                                  │
├──────────────────────────────────────────────────────────────────────┤
│                         DATA LAYER                                    │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │         PostgreSQL + PostGIS                             │          │
│  │  events | congregations | users | check_ins             │          │
│  │  badges | user_badges | points_ledger | qr_codes        │          │
│  └─────────────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| API Gateway | Auth middleware, rate limiting, request routing | Express or Fastify with JWT middleware |
| Event Service | Create/read/update/delete events, geospatial radius queries, clustering data | Node.js service + PostGIS ST_DWithin for radius, DBSCAN for clustering |
| User/Auth Service | Registration, login, JWT issuance, role management (anonymous/user/admin) | Passport.js or custom JWT; bcrypt for passwords |
| Check-In Service | QR code generation per congregation, geofence validation, trigger point award | node-qrcode for QR; backend geofence check (lat/lon + radius) |
| Gamification Engine | Evaluate badge rules against user activity, maintain points ledger | Event-listener pattern: check-in event → evaluate rules → award badges |
| Admin Service | Congregation admin verification flow, invite code issuance, congregation profile | Standard CRUD with role guards |
| ChurchDesk Sync Service | Poll ChurchDesk API on schedule, normalize events to internal schema, deduplicate | node-cron + axios; upsert by external ID; runs independently of API |
| React Native App | Map view, event discovery, check-in flow, points/badges UI, offline cache | Expo + expo-maps or react-native-maps; react-query for caching; MMKV for local storage |
| Web Admin Panel | Event management, congregation profile, volunteer management | React + react-admin or custom; shares types with backend via monorepo |

## Recommended Project Structure

Monorepo with Turborepo — enables shared TypeScript types between backend, mobile app, and web panel.

```
prayback/
├── apps/
│   ├── api/                    # Node.js backend (Express/Fastify)
│   │   ├── src/
│   │   │   ├── routes/         # Route handlers per domain
│   │   │   ├── services/       # Business logic (event, user, checkin, gamification)
│   │   │   ├── jobs/           # ChurchDesk sync (node-cron)
│   │   │   ├── middleware/     # Auth, rate limiting, error handling
│   │   │   └── db/             # Postgres client, migrations (e.g. drizzle or knex)
│   │   └── Dockerfile
│   ├── mobile/                 # React Native (Expo)
│   │   ├── app/                # Expo Router screens
│   │   ├── components/         # Shared UI components
│   │   ├── hooks/              # Custom hooks (useEvents, useCheckin, etc.)
│   │   ├── services/           # API client functions
│   │   └── store/              # Local state (Zustand or React Query)
│   └── admin/                  # React web panel
│       ├── src/
│       │   ├── pages/          # Admin screens
│       │   ├── components/     # Admin-specific UI
│       │   └── api/            # API client (shared with packages/api-client)
│       └── Dockerfile
└── packages/
    ├── types/                  # Shared TypeScript types (Event, User, Badge, etc.)
    ├── api-client/             # Generated or handwritten API client for apps
    └── config/                 # Shared ESLint, TypeScript configs
```

### Structure Rationale

- **packages/types/:** Single source of truth for data shapes — prevents mobile/backend drift on EventDTO, CheckInPayload, BadgeDefinition, etc.
- **apps/api/jobs/:** ChurchDesk sync isolated as a background job, not coupled to HTTP request cycle.
- **apps/mobile/services/:** API calls abstracted from UI — makes it easy to add offline fallback or swap endpoints.
- **apps/admin/:** Separate deployable, shares types but has no mobile-specific dependencies.

## Architectural Patterns

### Pattern 1: Event-Listener (Internal) for Gamification

**What:** Check-in actions emit internal events (Node EventEmitter or a lightweight in-process bus). The Gamification Engine listens and evaluates badge rules asynchronously.
**When to use:** Avoids coupling check-in logic to badge logic. Adding a new badge rule does not require touching the check-in handler.
**Trade-offs:** Simple and fast for a monolith. If the system later splits to microservices, replace with a message queue (Redis Streams, etc.).

**Example:**
```typescript
// check-in handler emits:
eventBus.emit('checkin.completed', { userId, congregationId, eventId, timestamp });

// gamification engine listens:
eventBus.on('checkin.completed', async (payload) => {
  await evaluateBadgeRules(payload);
  await awardPoints(payload.userId, CHECKIN_POINTS);
});
```

### Pattern 2: Upsert-by-External-ID for ChurchDesk Sync

**What:** The sync service fetches ChurchDesk events and upserts them into the local database keyed on `churchdesk_id`. Manual events use a null `churchdesk_id`. This prevents duplicates across re-runs.
**When to use:** Any time an external data source is polled repeatedly.
**Trade-offs:** Simple and idempotent. Risk: if ChurchDesk changes an event's ID, a new duplicate appears. Mitigation: also match on congregation + start_time + title hash as secondary dedup check.

**Example:**
```typescript
// Postgres upsert:
INSERT INTO events (churchdesk_id, title, starts_at, ...)
VALUES ($1, $2, $3, ...)
ON CONFLICT (churchdesk_id)
DO UPDATE SET title = EXCLUDED.title, starts_at = EXCLUDED.starts_at, ...
WHERE events.source = 'churchdesk';
```

### Pattern 3: Dual Check-In Validation (QR + Geofence)

**What:** QR code is the authoritative check-in method. Geofence is a convenience layer — if the user is within radius, the app can auto-suggest check-in or auto-confirm QR intent. Backend validates both paths.
**When to use:** QR is reliable and fraud-resistant (requires physical presence). Geofence alone is too easy to spoof with a mocked GPS.
**Trade-offs:** QR requires the congregation to display a code. Geofence alone is not secure. Combined: best UX with acceptable fraud resistance for low-stakes points.

### Pattern 4: Read-Heavy Optimization with Query-Side Caching

**What:** Event list and map queries are read-heavy (many users, frequent refreshes). Cache the results of radius queries in the app with a short TTL (5–10 minutes). Backend uses PostGIS spatial index (GIST on geometry column) for fast ST_DWithin queries.
**When to use:** Always for map queries — PostGIS is fast but repeated identical queries from many devices add up.
**Trade-offs:** Slightly stale map data acceptable for events. Cache must be invalidated or short-TTL to show newly added events.

## Data Flow

### Event Discovery Flow (Read Path)

```
User opens map
    ↓
React Native App
    ↓  GET /events?lat=&lon=&radius=&zoom=
API Gateway (auth optional — anonymous allowed)
    ↓
Event Service
    ↓  ST_DWithin(location, point, radius)
PostgreSQL + PostGIS
    ↓
Event Service: apply clustering if zoom < threshold
    ↓
JSON response: [{ id, title, lat, lon, cluster: true/false, count? }]
    ↓
App: render markers / cluster markers on map
    ↓
react-query caches result for 5min (offline fallback via MMKV)
```

### Check-In Flow

```
User scans QR Code (congregation-level, static)
    ↓
React Native QR scanner reads congregationId from code
    ↓
App sends: POST /checkins { congregationId, userLocation? }
    ↓
Check-In Service:
  1. Verify user is authenticated (JWT required)
  2. Verify no duplicate check-in today for this congregation
  3. If userLocation provided: validate within geofence radius (optional extra check)
  4. Persist check-in record
  5. Emit 'checkin.completed' internal event
    ↓
Gamification Engine (async, same process):
  1. Award CHECKIN_POINTS to user
  2. Evaluate badge rules against user's full check-in history
  3. Award any newly unlocked badges
    ↓
Response to app: { points_awarded, badges_unlocked: [] }
```

### ChurchDesk Sync Flow

```
node-cron fires every N hours (e.g. every 4h)
    ↓
Sync Service: for each registered ChurchDesk congregation:
  1. Fetch congregation's events from ChurchDesk API
  2. Normalize to internal EventDTO (map fields, set source='churchdesk')
  3. Upsert by churchdesk_id
  4. Mark past events as is_synced=true
    ↓
PostgreSQL: events table updated
    ↓
Next API request for map returns updated data
```

### State Management (Mobile App)

```
React Query (server state)
    ↓ (cache + background refetch)
Map Screen ←→ useEvents(lat, lon, radius) → GET /events
Event Detail ←→ useEvent(id) → GET /events/:id
Profile ←→ useProfile() → GET /me (with points + badges)
    ↓
Zustand (UI state only — no server data)
    - Selected event, map region, check-in modal state
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–5k users | Single Node.js process, monolith — no queues needed. In-process EventEmitter for gamification. |
| 5k–50k users | Add Redis for caching frequent radius queries. Add pg-pool connection pooling. Background jobs stay in-process. |
| 50k–200k users | Extract ChurchDesk sync and gamification engine to separate processes. Add a job queue (BullMQ + Redis). Consider read replica for PostgreSQL. |
| 200k+ users | Horizontal API scaling behind load balancer. Dedicated PostGIS query service. Full message queue for gamification events. |

### Scaling Priorities

1. **First bottleneck:** PostGIS radius queries under map load — add GIST spatial index immediately, add Redis query cache at 5k users.
2. **Second bottleneck:** ChurchDesk sync blocking API process — move to separate worker process with BullMQ.
3. **Third bottleneck:** Gamification rule evaluation for high-volume check-ins — extract to separate worker, process via queue.

## Anti-Patterns

### Anti-Pattern 1: Per-Event QR Codes

**What people do:** Generate a unique QR code for every event instead of per congregation.
**Why it's wrong:** Requires regeneration for every event, breaks if event is rescheduled, creates operational burden for congregations. A secretary who posts a weekly QR code in the church can't manage a new QR per event.
**Do this instead:** QR code per congregation (permanent). Check-in records the timestamp; backend determines which current/recent event the check-in maps to.

### Anti-Pattern 2: Blocking Gamification in the Check-In HTTP Response

**What people do:** Run all badge evaluation synchronously before returning the check-in response.
**Why it's wrong:** Badge evaluation may involve complex queries (all user history, rule matrix). Slow badge rules block the user's check-in confirmation.
**Do this instead:** Persist check-in immediately, emit async event, return `{ success: true }` fast. Push badge result to the app via next poll or a follow-up GET /me.

### Anti-Pattern 3: Direct ChurchDesk API Calls from Mobile App

**What people do:** Have the React Native app call ChurchDesk's API directly to fetch events.
**Why it's wrong:** Exposes ChurchDesk API credentials in the app. Ties app to ChurchDesk format (breaks for manual-entry congregations). Rate limits hit per user instead of per sync run.
**Do this instead:** All events flow through the internal backend. ChurchDesk is a data source for the backend sync service only.

### Anti-Pattern 4: Storing Geofence Validation Only Client-Side

**What people do:** Trust the mobile app's "I am within geofence" assertion without backend validation.
**Why it's wrong:** Trivially spoofed with a mock GPS location. Points/badges become worthless if users game them.
**Do this instead:** App sends its location with check-in request. Backend independently calculates distance from congregation coordinates. QR code remains the primary fraud-resistant path; geofence is convenience, not authorization.

### Anti-Pattern 5: Tightly Coupling ChurchDesk Sync to HTTP Routes

**What people do:** Trigger ChurchDesk sync on every event list request or as a route middleware.
**Why it's wrong:** Makes every map load dependent on ChurchDesk's availability and latency. A ChurchDesk outage breaks the app.
**Do this instead:** Sync runs on a schedule (cron). API serves from local database. ChurchDesk downtime = stale data, not broken app.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| ChurchDesk API | Scheduled polling (every 4h recommended) | Use polling — webhook support unclear from available docs. API key auth. Normalize events to internal schema. Rate-limit-aware: fetch per congregation, not bulk. |
| Google Maps / Apple Maps | Deeplink from app (`maps://` / `https://maps.google.com`) | No SDK needed. Build URL with destination coordinates. Handled entirely client-side. |
| PostGIS | Direct PostgreSQL queries with spatial functions | ST_DWithin for radius search; ST_MakePoint for coordinate storage; GIST index mandatory. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| API Gateway → Event Service | Direct function call (monolith) | No network hop — same process. Route handler calls service function. |
| Check-In Service → Gamification Engine | In-process EventEmitter | Decoupled but synchronous process. Upgrade to BullMQ queue if badge evaluation becomes slow. |
| ChurchDesk Sync → Event Service | Direct DB write (shared Postgres pool) | Sync job writes to same `events` table. No HTTP API between them — avoid internal HTTP calls in a monolith. |
| Mobile App → API | REST over HTTPS | JSON. React Query handles caching, retry, background refetch. No GraphQL — REST simpler for this scope. |
| Admin Panel → API | REST over HTTPS | Same API as mobile. Admin endpoints gated by role middleware. Separate auth route is not needed. |
| Backend → DB | pg (node-postgres) with connection pool | Keep pool size ≤ 20 for Postgres default max_connections. Use drizzle-orm or knex for type-safe queries. |

## Build Order Implications

Components have these hard dependencies that dictate phase sequence:

```
1. Database Schema + PostGIS setup
        ↓
2. Event Service (CRUD + geo queries)     ← required by everything
        ↓
3. User/Auth Service                      ← required by check-in and admin
        ↓
4. Event Map View (mobile, read-only)     ← first user-visible value, no auth needed
        ↓
5. ChurchDesk Sync Service                ← feeds Event Service with real data
        ↓
6. Check-In Service (QR generation)       ← requires Auth
        ↓
7. Gamification Engine                    ← requires Check-In events
        ↓
8. Admin Service + Web Panel              ← requires Auth + Event CRUD
        ↓
9. Congregation verification flow         ← requires Admin Service
```

**Rationale:** Event Service must be the first functional service — everything downstream reads from or writes to events. Map view (step 4) is the earliest thing a real user can use, and ships without requiring account or gamification infrastructure. ChurchDesk sync (step 5) can be wired in as soon as events exist. Gamification (step 7) is the last pure-backend concern before the admin panel — it enriches an already-usable app.

## Sources

- ChurchDesk API overview: https://support.churchdesk.com/en/article/churchdesk-api-lu2eyw/ (MEDIUM confidence — specific endpoint details require direct API access)
- ChurchDesk API docs structure: https://docs.churchdesk.com/public/ (template only, actual spec not accessible)
- expo-maps announcement: https://expo.dev/blog/introducing-expo-maps-a-modern-maps-api-for-expo-developers (HIGH confidence — official Expo)
- react-native-maps Expo SDK docs: https://docs.expo.dev/versions/latest/sdk/map-view/ (HIGH confidence — official)
- react-native-clusterer (C++ Supercluster): https://github.com/JiriHoffmann/react-native-clusterer (HIGH confidence — GitHub)
- PostGIS spatial clustering patterns: https://mapscaping.com/examples-of-spatial-clustering-with-postgis/ (MEDIUM confidence)
- Badge system schema pattern: https://www.namitjain.com/blog/backend-driven-badge-system-part-1 (MEDIUM confidence — community source, patterns verified against standard DB design)
- Monorepo structure with Turborepo: https://feature-sliced.design/blog/frontend-monorepo-explained (MEDIUM confidence)

---
*Architecture research for: Prayback — Church Event Discovery App with Maps and Gamification*
*Researched: 2026-03-13*
