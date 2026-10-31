# QuestOS release, security and acceptance report

31 October 2026. Repository: https://github.com/visheshgupta0404/QuestOS

**Live public demo:** https://questos-eight-chi.vercel.app

## Deployment boundary

Vercel project `questos`, ID `prj_Uux9aMdpItNJ9HU1dDFM1MaLfUJz`, was created in the authenticated owner's team. Initial deployment returned 403; the operator delegated completion of the existing team-access authorization, which was completed in the signed-in browser. The subsequent production deployment reached READY. The live URL was opened in Chrome and browser acceptance tests ran against the public domain, not localhost.

Production deployment `dpl_HvMcMX6PHs9AhqZAGv2rADN8z7ga` used source commit `bf8a102` and the configured HTTPS APP_URL. Later documentation/tests can be newer than that deployment; do not infer deployment of a commit from GitHub alone.

**Public Gmail is sample data.** Public File Forest creates actual ZIPs locally. No Google client secret, Gemini key, session secret or private database was copied to Vercel. Public live Gmail remains intentionally unconfigured pending dedicated durable storage and production consent/redirect configuration. Local authenticated Gmail was independently verified during the technical audit.

Required for hosted live Gmail: dedicated persistent backend; server-side credentials; a generated production session secret; exact HTTPS callback `https://questos-eight-chi.vercel.app/api/auth/callback/google` registered in Google Cloud; appropriate test/production consent settings; retention and monitoring. That production Google callback was **not** registered by this release. Existing Supabase projects remain untouched.

## Executed acceptance results

| Journey / check | Result | Evidence and limits |
|---|---|---|
| A: new visitor → landing → onboarding → dashboard/demo → quest → simulated verified receipt | PASS | New visitor browser test plus sample inbox test. Sample designation remains visible |
| B: Google account → metadata → recommendations → approval → game → archive → verification → undo | PASS locally, prior live audit | Real OAuth and forced refresh succeeded; 12 candidates; one approved archive and restoration; eleven kept. Final receipt undone. Not represented as public hosted live Gmail |
| C: files → analysis → preview approval → sorting → ZIP → download verification | PASS on public deployment | Uploaded in-memory fixtures, detected duplicate, played, downloaded, independently read ZIP/manifest and checked bytes |
| Public deployed browser suite | **7 passed, 0 failed** | Includes sample receipt refresh/undo, real file ZIP, mobile layout/game, wrong-answer gating, API guards and landing/onboarding |
| Local browser suite before public run | **6 passed, 0 failed** | Landing/onboarding addition tested locally; extra seventh responsive/error case then ran publicly |
| Unit tests | **20 passed, 0 failed** | Hashes, ZIP integrity, filenames/errors, approval, expiry, ownership, duplicates/concurrency, provider faults, recovery, SQLite persistence, AI schema/timeouts/fallback |
| TypeScript | PASS | `npm run typecheck` |
| Lint | PASS after fixes | `npm run lint`: fixed missing URL import, unused type and explicitly documented intentional sanitization control regex |
| Production build | PASS | Landing, onboarding, dashboard and 11 API routes compiled |
| Local production startup | PASS | Ready and HTTP 200; public landing also opened successfully |
| Production dependencies | PASS at audit time | `npm audit --omit=dev`: 0 vulnerabilities |
| All dependencies including lint toolchain | OPEN | 11 moderate minimatch-related dev findings remain; safe `npm audit fix` did not resolve them. Breaking downgrade was not forced |
| Live Gemini generation | PARTIAL | Key/catalog configured locally; generation unreliable and fallback observed. Public demo uses deterministic stories |

Tests: `tests/e2e/questos.spec.ts`, `tests/execution.test.ts`, `tests/files.test.ts`, `tests/storage.test.ts`, `tests/quest-engine.test.ts`. Public rerun command:

```powershell
$env:QUESTOS_TEST_BASE_URL='https://questos-eight-chi.vercel.app'
npm run test:e2e
```

## UI/UX before and after

| Before | After | Evidence |
|---|---|---|
| Root opened directly into an admin-like dashboard | Separate branded landing with a clear promise, world illustration and immediate 60-second demo CTA | `src/app/page.tsx`; `docs/screenshots/landing-desktop.png` |
| New visitors had to infer which data path to use | `/start` explicitly separates sample mail, real local files and configured Gmail | `src/app/start/page.tsx` |
| Demo mode could be overridden by an existing live cookie | Explicit `?demo=1` keeps the sample journey selected | `src/components/questos.tsx` |
| Setup and dashboard shared one entry route | Dedicated `/dashboard` and integration deep links; OAuth returns to dashboard | Root, start and dashboard pages; auth routes |
| Mobile brand text was hidden by a broad dashboard selector | Scoped the hiding rule to sidebar branding only | `src/app/globals.css` |
| Keyboard users had no shared skip link | Skip-to-content link, semantic headings/controls, existing modal focus containment and Escape | `src/app/layout.tsx`, landing/onboarding and quest UI |
| Outcome and simulated/live distinction required explanation | Landing proof strip, sample-only public Gmail copy, untouched-originals promise and clear integration boundary | Landing and onboarding copy |

Desktop (1440 px) and mobile (390 px) renders were inspected. Local screenshots show the before dashboard and public renders show the new landing. No formal WCAG conformance or Lighthouse score is claimed. Existing loading/empty/error states remain; the wrong-file-category case now has public browser coverage. Phaser remains decorative feedback around the actual React task controls.

## Prioritized security findings

### P1 — hosted live-service readiness remains incomplete

Public credentials and private data are deliberately absent. Live Gmail is disabled publicly, so it cannot silently write to the local developer's account. Before enabling: dedicated durable database, production OAuth, fresh production credentials, retention jobs, host-level rate limits and operational monitoring.

### P2 — development dependency denial-of-service findings

The added ESLint toolchain brings 11 moderate minimatch-related audit findings. The production dependency audit is clean. Keep lint/CI inputs trusted and update the toolchain when compatible fixed versions are available. `npm audit fix --force` proposed a breaking ESLint downgrade and was not applied.

### P2 — rate limiting and reward integrity have bounded scope

Gmail scan throttling is best effort; AI budgets are account-scoped and atomic. Public demo AI calls are deterministic and cannot spend the private Gemini key. File/demo XP is browser-local and editable, not a financial or competitive reward. Add infrastructure limits before public live-service launch.

### P2 — credential-inspection history is not an application guarantee

The application avoids printing provider secrets, and the app/public-source scan found no current credential matches in tracked files, historical commit diffs or `.next/static`. This does not prove every historical browser/tool transcript is secret-free. Use fresh dedicated production credentials and avoid broad snapshots of secret-detail pages. Private local setup/audit screenshots and the SQLite database are ignored by Git.

### Controls checked and retained

- State + S256 PKCE, ten-minute callback state lifetime, constant-time byte comparison, verified Google identity and required granted Gmail scope.
- Tokens in encrypted HttpOnly/SameSite=Lax cookies; Secure in production; no plaintext token response or localStorage token.
- Every Gmail mutation requires configured origin, authenticated owner, non-expired scope approval, exact valid decisions and final explicit approval.
- Atomic plan claim, unique receipt, target deltas persisted before writes, per-message heartbeat, independent verification, no XP for partial/failed results, and verified undo.
- No app operation sends or deletes messages. Archive/label only. Keep decisions do not write. Protected messages are excluded or refused.
- File API reads originals; outputs a separate ZIP; sanitizes paths; verifies output hashes and keeps an all-input manifest. Unknown formats are retained under Other.
- AI receives anonymous counts with no action tools; strict schema rejects extra execution fields. Narrative cannot grant XP or mark an operation verified.

## Presentation and submission outputs

- `submission/QuestOS-Pitch.pptx`: 10-slide light presentation. Every slide rendered and reviewed. Package/layout validation and first-party re-import passed; no claim of native PowerPoint inspection.
- `docs/SUBMISSION-KIT.md`: 90-second pitch, 3-minute demo, backup sample-data demo, architecture, narrow competitor comparison with primary links, unvalidated business/pricing hypothesis and 15 judge answers.
- `README.md`: public URL, setup, features, architecture/security details, demo links, screenshots and known limitations.

No unfinished world, unvalidated revenue/pricing hypothesis, unreliable AI response, or sample mailbox is presented as a verified live capability.
