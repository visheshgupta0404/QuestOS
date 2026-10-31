# QuestOS technical audit

**Release update:** A landing page, onboarding, validated pitch deck, submission kit and tested public Vercel demo were subsequently delivered. Historical table entries below describe the technical-audit checkpoint; see [RELEASE-READINESS.md](RELEASE-READINESS.md) for current release status and seven deployed browser tests. Hosted live Gmail and reliable Gemini generation remain incomplete.

Audited on 31 October 2026 in `C:\Projects\QuestOS`. This is a source inspection and execution record, not a roadmap. No secrets, email subjects, message IDs, or email content are included in this public report.

## Overall finding

**The application exists and runs.** It is a Next.js application with working local file organization and a real Google OAuth/Gmail path. During this audit, the authorized live test retrieved 12 real message candidates, archived exactly one old promotional message, verified it through a fresh Gmail API read, restored it, verified restoration, and reversed its XP. Eleven other messages were kept unchanged. The final durable receipt is `undone`, with one recorded target.

The app is **not yet a complete publicly deployed product**. Live Gemini story generation remains unreliable, AI does not classify email/file contents, public hosting with durable live storage is not configured, and a separate landing/onboarding experience and pitch deck are absent.

Comparison sources: the original complete project handoff, the attached Existing Progress & Continuation Brief, and the current audit requirements. A separately named **QuestOS Master Build Directive** file was not found in the checkout or supplied attachments. Requirements from an unseen document cannot be certified. The continuation brief's claim that no local app exists is outdated relative to this checkout.

Status definitions: **Implemented** means source plus the stated executed evidence; **Partial** means a bounded working subset, not the whole requested behavior; **Missing** means absent; **Blocked** identifies an external prerequisite. A mock-provider test is never described as a real Gmail or Gemini success.

## Status table

All evidence paths resolve under `C:\Projects\QuestOS`.

| Feature or requirement | Status | Actual source evidence | Executed test evidence | Required fixes / limits |
|---|---|---|---|---|
| Actual Next.js/TypeScript app | Implemented | [package.json](../package.json), [page.tsx](../src/app/page.tsx), [layout.tsx](../src/app/layout.tsx), [next.config.ts](../next.config.ts) | TypeScript and production build passed; cold production startup printed Ready; `/` returned HTTP 200 | No build blocker found |
| Task selection, dashboard, integration hub | Implemented | [questos.tsx](../src/components/questos.tsx), [globals.css](../src/app/globals.css), [world-art.tsx](../src/components/world-art.tsx) | Desktop/mobile browser tests; inspected screenshots | Large single UI component should be split later for maintainability |
| Separate landing page and onboarding | Missing | Root [page.tsx](../src/app/page.tsx) renders dashboard; setup/help live in [questos.tsx](../src/components/questos.tsx) | Inspected route inventory | Build separate newcomer journey; current setup checklist is not full onboarding |
| Google OAuth callback and identity | Implemented | [auth/google](../src/app/api/auth/google/route.ts), [auth/callback/google](../src/app/api/auth/callback/google/route.ts) | Real account connected and real Gmail metadata retrieved | Uses custom OAuth, not the Auth.js library mentioned in the brief |
| Auth.js-specific implementation | Partial | [session.ts](../src/lib/server/session.ts), [package.json](../package.json) | Custom iron-session path works; Auth.js absent from dependencies | Accept the deliberate library deviation or migrate and retest later; do not claim Auth.js is installed |
| OAuth project, local callback, secret rotation | Implemented | [config.ts](../src/lib/server/config.ts), [callback](../src/app/api/auth/callback/google/route.ts) | Read Google Cloud client for questos-513307. Correct localhost callback. Independently observed old 13:23 secret **Disabled**, replacement 15:02 **Enabled** | Earlier operator attestation was inaccurate; audit initially reset flag false, then restored it only after independent verification. Old disabled secret remains listed, not deleted |
| Gmail scope and test-account authorization | Implemented | [auth/google](../src/app/api/auth/google/route.ts), [callback](../src/app/api/auth/callback/google/route.ts) | Requested openid/email/gmail.modify; callback requires granted modify scope. Existing authorized account signed in and completed actual API operations | Console testing/audience settings came from the earlier brief; successful account authorization independently demonstrated actual access |
| Encrypted tokens and refresh handling | Implemented | [session.ts](../src/lib/server/session.ts), [google.ts](../src/lib/server/google.ts), [gmail/health](../src/app/api/gmail/health/route.ts) | Explicit forced Google token refresh and Gmail profile retrieval succeeded through the UI health check | Seven-day encrypted cookie session; no token storage in localStorage or database. Full adversarial auth review remains outside this audit |
| Real Gmail metadata scan | Implemented | [gmail/plan](../src/app/api/gmail/plan/route.ts), [google.ts](../src/lib/server/google.ts) | Real scan returned 12 candidates; no mutations during scan | Fixed query: inbox promotions older than 30 days, excluding starred/important; no arbitrary search UI |
| Cleanup recommendations | Partial | [recommendations.ts](../src/lib/recommendations.ts) | Unit tests protect starred messages, retain likely receipts via labels, recommend archive for ordinary promotions; real recommendations displayed | Deterministic rules, **not AI email classification**. No body/semantic analysis |
| Pre-game approval and final exact approval | Implemented | [gmail/approve](../src/app/api/gmail/approve/route.ts), [gmail/execute](../src/app/api/gmail/execute/route.ts), [execution-core.ts](../src/lib/server/execution-core.ts), [questos.tsx](../src/components/questos.tsx) | Unit rejects missing pre-game approval. Browser tests require approval before play and before results. Real test reviewed 1 archive + 11 keep decisions | Candidate-scope approval happens before play; exact mutation approval happens afterward as an additional safety step |
| Real Gmail archive, verification, undo | Implemented | [execution-core.ts](../src/lib/server/execution-core.ts), [google.ts](../src/lib/server/google.ts), [receipts/undo](../src/app/api/receipts/undo/route.ts) | Authorized one-message live archive passed read-after-write verification; immediate undo passed Gmail verification; final receipt undone/count 1/target 1 | Proven for one live archive/restore, not every Gmail condition |
| Gmail labeling | Partial | [google.ts](../src/lib/server/google.ts), [execution-core.ts](../src/lib/server/execution-core.ts) | Fixture tests verify label deltas and undo | No separate live labeling test was performed; do not label it externally verified |
| Execution retries, duplicate triggers, interrupted response recovery | Implemented | [execution-core.ts](../src/lib/server/execution-core.ts), [local-store.ts](../src/lib/server/local-store.ts) | Fixtures test concurrent triggers, stale labels, unknown IDs, wrong owner, expiry, first-call failure, response lost after provider commit, verification mismatch, failed/retried undo, protected-folder rejection, fresh-heartbeat recovery blocking | Fault injection is fixture-only. Do not auto-replay failed Gmail mutations; recovery uses recorded target deltas |
| Multiple local file selection and category preview | Implemented | [files.ts](../src/lib/files.ts), [questos.tsx](../src/components/questos.tsx) | Actual browser multi-file upload and full preview tested | Categories are extension-based, not content-aware AI categories |
| Exact duplicates and collision handling | Implemented | [files.ts](../src/lib/files.ts) | Tests cover SHA-256 identical bytes, different content, case-insensitive names, sanitized-name collisions, traversal characters, Windows reserved names | Exact byte duplicates only; not near-duplicate/semantic matching |
| File approval → game → ZIP | Implemented | [questos.tsx](../src/components/questos.tsx), [files.ts](../src/lib/files.ts) | Browser test confirms ZIP action absent before play, sorts fixtures, then downloads and independently reads archive | Up to six representative files are played; remaining files follow the explicitly approved same sorting rules |
| Original preservation, verified ZIP and manifest | Implemented | [files.ts](../src/lib/files.ts), [files.test.ts](../tests/files.test.ts), [questos.spec.ts](../tests/e2e/questos.spec.ts) | Original fixture bytes unchanged; ZIP entry bytes/hashes verified; duplicate inclusion/omission checked; manifest lists every input including omissions | Download receipt means archive generated, verified and offered, not proof the user saved it. Undo means discard ZIP; no originals need restoring |
| Problematic/unknown files and limits | Implemented | [files.ts](../src/lib/files.ts) | Unreadable fixture gives named error; empty/oversized selections rejected; unknown extension retained in Other; ZIP rejects empty plan | 250 files/100 MB. No unsupported bytes silently discarded; directory uploads are not a feature |
| Gemini client, structured schema and Zod validation | Partial | [quest-engine.ts](../src/lib/quest-engine.ts), [quest route](../src/app/api/quest/route.ts) | Mocked valid response passes; extra action fields, malformed JSON, short fields, truncation and network errors fall back | Real key authenticated model catalog previously. Live generation during audit returned 503, timeouts, and one HTTP 200 without an accepted complete story; live engine selected rules. A successful real generated quest is not certified |
| Gemini retries, timeouts, deterministic fallback | Implemented | [quest-engine.ts](../src/lib/quest-engine.ts), [story.ts](../src/lib/story.ts), [quest-engine.test.ts](../tests/quest-engine.test.ts) | Transient HTTP failure retries once; permanent failure falls back; AbortSignal timeout tested; live outage returned usable rules story | Two attempts, 8 seconds each, 250 ms delay. Stories are optional; core chores keep working |
| AI action/completion authority separation | Implemented | [quest-engine.ts](../src/lib/quest-engine.ts), [execution-core.ts](../src/lib/server/execution-core.ts), [questos.tsx](../src/components/questos.tsx) | Model has no tools or operation IDs; strict output rejects extra execute fields; receipt/XP derives from provider verification, not generated text | Natural language remains untrusted flavor; schema cannot prove every sentence truthful. UI result state is controlled by execution receipts |
| Meaningful gameplay controls | Implemented | [questos.tsx](../src/components/questos.tsx), [game-board.tsx](../src/components/game-board.tsx) | 1/2/3 inbox decisions become approved archive/label/keep deltas; real one-message action verified. File choices gate approved ZIP creation | Phaser is a decorative trail renderer; task controls/state live in React. No claim of a full autonomous Phaser game. Server validates approved decisions, not human input timing |
| XP, levels and achievements | Partial | [execution-core.ts](../src/lib/server/execution-core.ts), [questos.tsx](../src/components/questos.tsx) | Fixtures give zero XP on partial/failed/no-op results; browser tests verify persisted demo XP and reversal; live archive/undo reverses XP | Local/demo rewards are browser-editable, not an anti-cheat leaderboard; file rewards do not sync across devices |
| Local durable database | Implemented | [local-store.ts](../src/lib/server/local-store.ts), [db.ts](../src/lib/server/db.ts), [storage.test.ts](../tests/storage.test.ts) | Disk close/reopen persistence, account isolation, atomic claims, receipt updates, account-scoped AI budget tested | Node 24, persistent local disk; SQLite is marked experimental by Node. This is not durable Vercel function storage |
| Supabase alternative | Partial | [migrations](../supabase/migrations/), [db.ts](../src/lib/server/db.ts) | Source/migration review only | No Supabase credentials configured, no live migrations executed. Existing ExamEngine/Syncora projects were untouched |
| Demo mode and history | Implemented | [demo.ts](../src/lib/demo.ts), [questos.tsx](../src/components/questos.tsx) | Browser tests cover separate demo receipts, refresh persistence, undo; clearly labeled simulated Gmail | Demo gameplay is not proof of provider access; real ZIP downloads still occur in demo |
| Public GitHub and CI definition | Implemented | [.github/workflows/ci.yml](../.github/workflows/ci.yml), [.gitignore](../.gitignore), [repository](https://github.com/visheshgupta0404/QuestOS) | Source pushed; public visibility verified through unauthenticated GitHub API; local secret-pattern scan passed | Workflow exists; remote Actions result not asserted without checking it. Secrets/database/private audit screenshots remain ignored |
| Hosted live deployment | Blocked | [db.ts](../src/lib/server/db.ts), [config.ts](../src/lib/server/config.ts), [README](../README.md) | Local production startup verified; local storage explicitly rejected when VERCEL is set | Choose dedicated durable hosted storage, production HTTPS origin, Google callback and secret configuration; no live deployment URL |
| Retention/monitoring/public-launch hardening | Missing | Retention guidance only in [README](../README.md) | No scheduled purge or observability service found | Add retention jobs, operational monitoring, host rate limits, privacy/consent documents and required Google production verification before public launch |
| Demo/pitch materials and business model | Partial | [DEMO.md](DEMO.md) | Script and architecture/pitch narrative inspected | No actual slide deck or validated pricing/business-model artifact |
| Expense Empire / Code Citadel | Missing | Placeholder names in [questos.tsx](../src/components/questos.tsx) | Confirmed labeled future worlds | Future scope, not implemented chores |

## Actual verification record

| Check | Outcome | Scope |
|---|---|---|
| `npm run typecheck` | Passed | Actual current TypeScript source |
| `npm test` | 20 passed, 0 failed | Files, SQLite, execution/recovery fixtures, recommendations, AI client/schema/fallback |
| `npm run test:e2e` | 5 passed, 0 failed | Real browser against production server; demo inbox; actual uploaded-file ZIP; mobile sorting; API guards; desktop |
| `npm run build` | Passed | Root page plus 11 API endpoints compiled |
| `npm start` and `GET /` | Ready; HTTP 200 | Local production server, not merely next dev |
| `npm audit --omit=dev` | 0 vulnerabilities | Installed production dependencies at audit time |
| Google client rotation | Independently verified | Old disabled; replacement enabled; no secret values reported |
| Real OAuth and token refresh | Passed | Existing authorized account; forced refresh and profile call |
| Real Gmail scan | Passed: 12 messages | Metadata only; no scan mutations |
| Real action and undo | Passed: 1 archive, 1 restoration | User approved archive/undo and delegated message choice; 11 other candidates kept |
| Real Gmail label creation/application | Not tested live | Covered by fixtures only |
| Live Gemini generation | Not accepted; fallback used | Provider errors/timeouts and rejected incomplete output; no fake Gemini success |

These are bounded observations. Passing fixtures does not certify every real provider failure mode, and a local build does not establish a public deployment.

## Fixes made during this audit

1. Added explicit pre-game scope approval and a server-persisted `play_approved` check. Added `/api/gmail/approve` and migration 003; local schema upgrades automatically. Exact actions still need final approval.
2. Reordered File Forest to preview/approve first, then play, then generate and verify ZIP. Removed the bypass that skipped the sorting game. Duplicate policy freezes after gameplay.
3. Added transparent, conservative rule-based cleanup recommendations and reasons. Important/starred/protected messages stay unchanged; likely useful receipts remain in the inbox with a labeling recommendation.
4. Extracted the execution core for safe fixture testing. Added recovery, ownership, concurrency, expiry, verification-mismatch and no-XP-on-failure tests.
5. Added per-message execution heartbeats so an old but actively progressing receipt is not treated as abandoned. Undo's atomic claim checks the last update, not just creation time.
6. Added a strict Zod-derived Gemini JSON schema, concatenated non-thinking text handling, bounded retry/timeouts, and rejection of truncated/malformed/extra-field output.
7. Added clear file read/pack errors and empty-archive rejection. Unknown file types are retained under Other. Verified collisions and fixture byte preservation.
8. Added `/api/gmail/health` and an integration UI control to test refresh/profile without email mutations.
9. Corrected OAuth state comparison to compare buffer lengths before constant-time comparison, avoiding malformed Unicode state errors.
10. Added modal Escape/focus containment and reduced-motion handling; renderer failure does not break task controls.
11. Corrected stale claims of completed secret rotation after independent inspection; re-enabled live access only after Cloud showed the old secret disabled.

## Execution mapping

```text
Inbox:
Gmail metadata scan → rule recommendations → approve candidate scope (stored)
→ player 1=archive / 2=label / 3=keep → review exact decisions → approve execution
→ persist label deltas → Gmail modify → separate Gmail read verifies labels
→ verified receipt → 25 XP per actual change
→ undo inverts only quest deltas → Gmail read verifies restoration → XP removed

Files:
Local File objects → SHA-256/extension analysis → preview all destinations/omissions
→ approve plan → classify up to six representative files → unlock ZIP action
→ confirm download → JSZip output + all-input manifest → read and hash ZIP entries
→ verified local receipt → 20 XP per included file
```

There is no AI tool that can send, delete, archive, label, or grant XP. The email timer never executes an action. A file ZIP has real output; a decorative Phaser counter alone is not used as completion evidence.

## Dependencies and environment

Observed installed versions: Next 16.4.3; React/React DOM 19.3.1; TypeScript 5.9.3; Tailwind/PostCSS 4.3.3; Phaser 3.90.0; Framer Motion 12.43.0; JSZip 3.10.2; iron-session 8.0.4; Zod 4.6.7; Supabase JS 2.118.0; Playwright 1.64.1; tsx 4.23.15. Two optional platform runtime packages were marked extraneous by npm; no production audit vulnerabilities were reported.

Environment names inspected without revealing values:

- `APP_URL`, `QUESTOS_STORAGE`, `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_PROJECT_VERIFIED`, `GOOGLE_SECRET_ROTATED`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (absent in local mode)
- `GEMINI_API_KEY`, `GEMINI_MODEL`

No secret uses a `NEXT_PUBLIC_` prefix. `.env.local`, `.questos/` and setup screenshots are excluded from Git. Google token values are encrypted in an HttpOnly/SameSite=Lax cookie; Secure is enabled in production. Every modifying application endpoint checks the configured origin and authenticated account ownership.

Local private screenshots of the actual archive/undo are in `.questos/audit-evidence/`; they are deliberately not pushed. Earlier entries in VERIFICATION.md are historical and superseded by this report where outcomes differ.

## Three most important remaining blockers

1. **Reliable live AI output and the AI-analysis requirement.** The provider connection is configured, but a complete accepted live Gemini quest was not demonstrated. Email/file classification is deterministic. Resolve model availability/latency/output compatibility, then validate real structured quests; obtain explicit privacy consent before expanding what data goes to the model.
2. **A durable publicly hosted live deployment.** Local SQLite is suitable for this computer's demo, not Vercel ephemeral functions. A dedicated persistent backend and production OAuth/HTTPS configuration are required. Existing Supabase projects must remain isolated.
3. **Submission/product completeness.** The requested standalone landing/onboarding, actual pitch deck, documented business model and public-launch controls are not delivered. The demo script exists, but should not be presented as those completed artifacts.

## References consulted

- [Google OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Gmail messages.modify](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/modify)
- [Gemini structured output documentation](https://ai.google.dev/gemini-api/docs/structured-output)
- Installed Next.js docs: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` and the cookies/environment-variable guides.
