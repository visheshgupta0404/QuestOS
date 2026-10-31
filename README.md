# QuestOS

**Play the Game. Clear the Chaos.** A Next.js application for the PromptWars × OUTLIER ’26 hackathon.

## Run

Requires Node.js 24 and npm.

```powershell
npm ci
npm run setup
npm run dev
```

Open http://localhost:3000. Demo mode and browser-local file organization work without external credentials. `npm run setup` creates `.env.local` with a random session secret only if the file does not exist.

## Deadline demo storage

QuestOS now defaults to isolated local SQLite (`QUESTOS_STORAGE=local`). It creates `.questos/questos.sqlite` automatically and never connects to your existing Supabase projects. Plans, receipts, undo state, and AI budgets survive server restarts. The database directory is ignored by Git. Google and Gemini secrets remain in ignored `.env.local`.

This mode needs a persistent local disk and Node 24. It deliberately refuses local storage on Vercel; use a dedicated Supabase database for hosted live Gmail. Vercel can still serve demo mode and browser-local File Forest without live credentials. To return to Supabase, set `QUESTOS_STORAGE=supabase`, configure its URL/service key, and apply the migrations. Local mode does not require Supabase credentials or migrations.

## What works

- **Inbox Kingdom:** old promotional message scan, 60-second choice sprint, editable approval plan, Gmail archive/label execution, independent read-after-write verification, durable receipts, retry-safe plan claiming, and verified undo. Starred/important messages are excluded. No message sending, trashing, or deletion.
- **File Forest:** user-selected files, SHA-256 exact duplicate detection, file-extension categorization, collision-safe filenames, a brief sorting game, full review, organized ZIP, SHA-256 manifest, and byte/hash verification of archive entries. Files are processed locally and originals never change. Limit: 250 files/100 MB.
- **Dashboard and rewards:** XP from verified results, levels, achievements, activity history, and separate demo/live progress. Demo and local file receipts persist in this browser; Gmail receipts persist in Supabase.
- **Quest engine:** deterministic stories always work; optional Gemini flavor text uses anonymous module/count data only. Model output has no authority to select or execute actions. Ten live generations per account per hour through an atomic SQL budget.
- **Visual game:** Phaser 3 trail progress with animated quest markers, Framer Motion cards, keyboard choices, responsive light interface. Time running out never triggers a real action.

## Google OAuth setup — do this before live use

1. Verify you can open project **questos-513307** at https://console.cloud.google.com/apis/credentials?project=questos-513307.
2. Rotate the previously exposed OAuth web-client secret. Use Add secret/create replacement if available, migrate the value, then disable/delete the compromised secret. If only Reset secret is available, use it. Never put secrets in chat or Git.
3. Keep Gmail API enabled. Set the authorized redirect URI to exactly `http://localhost:3000/api/auth/callback/google`.
4. Configure OAuth consent with `openid`, `email`, and `https://www.googleapis.com/auth/gmail.modify`. In testing, add `visheshg990@gmail.com` as a test user. Testing refresh tokens for Gmail scopes may expire after seven days; reconnect when needed.
5. Fill `.env.local` using the template. Set `GOOGLE_PROJECT_VERIFIED=true` and `GOOGLE_SECRET_ROTATED=true` only after doing those steps. These flags are operator attestations, not automated Google IAM checks.
6. Create/open your Supabase project and set `SUPABASE_URL` and its server-only `SUPABASE_SERVICE_ROLE_KEY` locally. Run all three SQL files in `supabase/migrations/` in order using the Supabase SQL Editor.
7. Restart the dev server, open Integrations, and select Connect Gmail. Grant permission. Switching to Live workspace alone does not connect Google.
8. Scan, inspect the candidate batch, play, review the exact actions, approve a small test batch, compare with Gmail, and test Undo. Live OAuth and mutation verification require your credentials and interactive consent; automated local tests do not prove live access.

## Gemini (optional)

Set `GEMINI_API_KEY` and an available `GEMINI_MODEL` from your Google AI Studio project. Use the current model catalog rather than a hardcoded assumed model. Gemini is used only for authenticated live quests. Demo stories are deterministic and labeled accordingly. If generation fails or the budget is exhausted, built-in stories take over. No email headers, email bodies, file names, or file contents reach the model.

## Security and data model

- Google OAuth authorization-code flow uses state, a 10-minute flow expiry, and S256 PKCE. Google verifies the account profile and requested scope after exchanging the code. The app requests offline access.
- Tokens live in an authenticated encrypted iron-session HttpOnly/SameSite=Lax cookie, Secure in production. They are never exposed in API responses, localStorage, or Supabase. Session lifetime is seven days. Disconnect attempts Google revocation, clears the session, and reports if manual revocation is needed.
- Every mutation requires an exact `Origin` match to `APP_URL`. In production `APP_URL` must use HTTPS. Use the configured origin when browsing locally; `127.0.0.1` and `localhost` are distinct origins.
- Supabase tables have RLS enabled and no anon/authenticated grants. The server alone uses the service role; EVERY query is scoped to the sealed session's immutable Google subject. This MVP uses Google OAuth identity, not Supabase Auth.
- Plans expire after 15 minutes. An atomic claim plus a unique receipt prevents concurrent duplicate execution. Fresh labels are checked against scanned labels before execution. All target label deltas are persisted before Gmail changes, enabling recovery if a request fails after Gmail commits.
- Execution is per-message and may partially complete. Partial receipts receive no XP. Undo reconciles all recorded targets, removing only labels this quest added and restoring only inbox labels it removed. It preserves unrelated labels. Undo is intentionally blocked for messages moved to Trash/Spam until the user resolves them. An interrupted execution/undo can be recovered after two minutes.
- **Tradeoff:** Undo restores the original targeted label state even if you later intentionally changed that same label in Gmail. Review the receipt first. The QuestOS/Cleared label definition may remain after undo; its message associations are reversed.
- Google label creation can succeed even if a subsequent action fails. The label itself is harmless and retained.
- Plans contain email headers for review. Receipts contain message IDs and label deltas. Apply a documented retention policy before public use; suggested 24 hours for expired unclaimed plans and 30 days for receipts/plans. No scheduled purge is provisioned by this repository.
- Local file XP is device-local, for personal motivation. Rewards are not a tamper-proof competitive leaderboard. Demo/local progress does not sync between devices. ZIP receipt means generated, verified and offered for download, not proof of the user saving the file.
- Live scanning is limited to 12 messages per quest, one scan per account per minute (best effort). Add infrastructure-level rate limits, operational monitoring, retention jobs, privacy-policy review, and Google restricted-scope verification as appropriate before a public launch.

## Verify

```powershell
npm test
npm run typecheck
npx playwright install chromium
npm run test:e2e
npm run build
```

Unit tests verify exact duplicate detection, archive contents and hashes, unsafe names, collisions, limits, and preservation of originals. Browser tests verify the demo approval boundary, persisted rewards, undo, actual file upload/download, ZIP contents, mobile layout and sorting gameplay, configuration screens, and API rejection of unauthorized/cross-origin requests. External Gmail/Supabase/Gemini paths require live credential testing separately.

## GitHub and Vercel

The repository includes a CI workflow and a Vercel-ready Next.js configuration. To publish, create/select a GitHub repository you own, push this checkout, and import it into Vercel. Configure all secret variables in Vercel's project settings as server-only sensitive values. Set production `APP_URL` to the exact HTTPS origin and add `${APP_URL}/api/auth/callback/google` to the Google web client. Use separate preview credentials/databases or keep live mode disabled in previews. Never copy `.env.local`, cookies, or service keys into an issue, commit, or build artifact. Deployment still requires your selected GitHub/Vercel account and verified target.

See `docs/DEMO.md` for the presentation walkthrough and pitch, and `docs/VERIFICATION.md` for the execution record.

## Official references

- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/gmail/api/reference/rest/v1/users.messages/modify
- https://nextjs.org/docs/app/api-reference/functions/cookies
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://ai.google.dev/gemini-api/docs/structured-output
