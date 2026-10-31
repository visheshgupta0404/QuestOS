# The 3-minute QuestOS demo

## Before the room

Run the production build locally (`npm run build`, then `npm start`). Demo mode works offline after assets load, except the first load still needs the local server. Keep the server running. Use a fresh browser profile for clean demo progress. Preflight the flow and ZIP download. Keep real Gmail content off the projector unless deliberately prepared and consented. Demo labels visibly state that Gmail is simulated.

## 0:00–0:25 — The problem

“We don’t avoid digital chores because they’re hard. We avoid them because they never feel done. QuestOS turns those tiny tasks into fast, satisfying adventures—with real results you can inspect.”

Open the dashboard. Point out two playable realms and the separation between approval and execution.

## 0:25–1:20 — Inbox Kingdom

Open Inbox Kingdom, Scan & start quest. Review the rule-based recommendations and approve the candidate scope before playing. Press 1 to archive an old promotion, 2 to label something useful, and 3 to keep a message. Make all six choices. Pause on Review: “The game proposes. You approve.” Change one decision to show control. Approve demo cleanup. Show XP, then open the receipt. Be explicit: this is simulated Gmail data. If live OAuth was preflighted, use a separate prepared real account and show the corresponding Gmail labels after execution. Do not claim live functionality was tested if it was not.

## 1:20–2:10 — File Forest

Try the six sample files or upload a prepared small batch. The sample brief and its copy have exactly identical bytes. Review destinations and the duplicate first, approve the plan, then play the sorting challenge and review the final output. Approve & download ZIP. Open it and inspect Documents/, Spreadsheets/, Code/, and questos-manifest.json. “These files were actually organized. Every original is untouched.”

## 2:10–2:40 — Trust and rewards

Open Activity & receipts. Undo the inbox quest. Show XP reversal. For File Forest explain: discard the ZIP; no original needs restoring. Open Achievements. “A satisfying loop: play, approve, execute, verify, reward—and undo.”

## 2:40–3:00 — Why this wins

“Gamification usually puts points on top of work. QuestOS makes the interaction itself produce the work: every inbox choice maps to a real, reversible label delta; every file decision maps to a verified output. Two realms today. Expense Empire and Code Citadel next.”

## One-line pitch

**QuestOS is the playable operating layer for your digital chores: clear the quest, clear the chaos.**

## Architecture in one breath

Next.js and TypeScript coordinate the UI and server routes. Google OAuth connects Gmail. Supabase stores account-scoped plans and receipts. Gemini writes optional quest flavor from anonymous counts. Phaser animates the trail; Framer Motion animates the interface. Browser File API, SHA-256 and JSZip organize files entirely on device. Vercel hosts the Next.js app.

## Honest answers for judges

- AI does not decide what to delete or execute. It creates narrative; deterministic code owns action validation.
- File duplicates mean byte-identical SHA-256 hashes, not semantic similarity. File categories use extensions, not content classification.
- The timer never authorizes changes. A separate approval screen does.
- Gmail actions are archive and label only. We do not delete or send emails.
- A network failure is not success. Partial executions receive receipts and no XP; undo reconciles the recorded targets.
- Demo is clearly marked; real provider verification requires configured credentials and consent.
- Competitive leaderboards, expense processing, code execution, production Google verification, and full cross-device file rewards are outside this MVP.

## Competition release

Public demo deployed at https://questos-eight-chi.vercel.app and opened in Chrome. Seven browser acceptance tests passed against that actual URL. Local lint, TypeScript, 20 unit tests and production build passed. Light 10-slide pitch deck rendered/reviewed; package, geometry and first-party re-import validation passed. See docs/RELEASE-READINESS.md and docs/SUBMISSION-KIT.md. Public Gmail is simulated, real files stay browser-local, and hosted live Gmail remains disabled. Production npm audit is clean; 11 moderate dev-tool findings remain.
