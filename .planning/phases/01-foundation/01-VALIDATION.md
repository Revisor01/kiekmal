---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (Backend) — Wave 0 installs |
| **Config file** | `apps/api/vitest.config.ts` — Wave 0 anlegen |
| **Quick run command** | `pnpm --filter api test --run` |
| **Full suite command** | `pnpm turbo test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm turbo build --filter=...`
- **After every plan wave:** Run `pnpm turbo build && pnpm turbo typecheck`
- **Before `/gsd:verify-work`:** All 5 Success Criteria verified
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | SC-4 | build | `pnpm turbo build` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | SC-1 | smoke | `docker compose up -d && docker compose ps` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | SC-2 | integration | `pnpm --filter api db:migrate` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | SC-3 | smoke | `curl -f http://localhost:3000/health` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 2 | SC-5 | unit | `pnpm --filter api typecheck` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/vitest.config.ts` — Vitest setup for backend tests
- [ ] `apps/api/src/__tests__/health.test.ts` — Health endpoint test stub
- [ ] Framework install: `pnpm add -D vitest --filter api`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Docker Compose startet alle Services | SC-1 | Requires Docker daemon | `docker compose up -d && docker compose ps` — alle Container "Up" |
| Drizzle-Migration legt GIST-Index an | SC-2 | Requires running DB | `psql -c "\di" \| grep gist` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
