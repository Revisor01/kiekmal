---
phase: 2
slug: event-discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^3.0.0 (API) |
| **Config file** | `apps/api/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @prayback/api test` |
| **Full suite command** | `pnpm --filter @prayback/api test -- --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @prayback/api test`
- **After every plan wave:** Run `pnpm turbo typecheck && pnpm --filter @prayback/api test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DISC-04 | type-check | `pnpm turbo typecheck` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | DISC-01, DISC-03 | unit/inject | `pnpm --filter @prayback/api test` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | DISC-02 | unit/inject | `pnpm --filter @prayback/api test` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | DISC-07 | unit/inject | `pnpm --filter @prayback/api test` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | AUTH-01 | unit/inject | `pnpm --filter @prayback/api test` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | DISC-05 | manual | Expo Go / Dev Build | n/a | ⬜ pending |
| 02-03-01 | 03 | 2 | DISC-06 | manual | Expo Go offline test | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/__tests__/events.test.ts` — stubs for DISC-01, DISC-02, DISC-03
- [ ] `apps/api/src/__tests__/congregations.test.ts` — stubs for DISC-07
- [ ] Auth-less test helper (reusable for later routes)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Map view with clustered markers | DISC-05 | UI rendering on device | Open Expo Go, verify map loads with markers |
| Navigation deep-link | DISC-05 | OS-level intent | Tap "Navigation starten", verify Maps app opens |
| Offline cache | DISC-06 | Network state | Load events, toggle airplane mode, verify cached data |
| Event detail fields | DISC-05 | Visual layout | Tap event marker, verify all fields displayed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
