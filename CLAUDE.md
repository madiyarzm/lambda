# Chalk — Session Context

Collaborative coding classroom platform. Teachers create groups/classrooms/assignments, students submit Python code, earn XP, get AI hints. Goal: demo-ready for a16z talent show.

---

## Repository Layout

```
lambda/
├── app/                          # FastAPI backend
│   ├── main.py                   # App factory, serves frontend static from /frontend/
│   ├── config.py                 # pydantic-settings, reads .env
│   ├── api/v1/                   # Route handlers (users, groups, classrooms, assignments, submissions, sandbox)
│   ├── api/ws_collab.py          # WebSocket relay for Yjs at /ws/collab/{room_id}
│   ├── core/collab_manager.py    # In-memory room→websocket map
│   ├── core/auth_google.py       # Google OAuth token exchange
│   ├── core/security.py          # JWT encode/decode
│   ├── models/                   # SQLAlchemy ORM models
│   ├── schemas/                  # Pydantic request/response schemas
│   ├── services/                 # Business logic layer
│   │   └── hint_service.py       # AI hints via Claude Haiku (falls back without API key)
│   ├── sandbox/                  # Code execution
│   │   ├── subprocess_executor.py  # Default (SANDBOX_USE_DOCKER=false)
│   │   └── docker_executor.py    # Optional Docker isolation
│   └── db/                       # SQLAlchemy session + init_db
├── frontend-vite/                # React 19 + Vite + Tailwind (slate-950 dark theme)
│   └── src/
│       ├── MentorApp.tsx         # Entire app UI (~2300 lines, single file)
│       ├── LandingPage.tsx       # Marketing landing page
│       ├── DrawingPage.tsx       # Standalone collaborative drawing page
│       ├── AuthCallback.tsx      # Handles Google OAuth redirect
│       ├── lib/api.ts            # Typed API client (uses VITE_API_URL, defaults to same-origin)
│       ├── hooks/useCollab.ts    # Yjs collaborative editor hook
│       ├── hooks/useCollabDrawing.ts  # Yjs collaborative drawing hook
│       └── components/
│           ├── CodeEditor.tsx    # CodeMirror wrapper
│           ├── DrawingCanvas.tsx # Canvas with collab drawing
│           ├── Avatar.tsx        # Initials-based avatar
│           ├── AvatarStack.tsx   # Overlapping peer avatars
│           ├── Badge.tsx         # Status badges (success/in-progress/etc)
│           ├── ActivityGraph.tsx # GitHub-style activity heatmap
│           ├── Confetti.tsx      # Canvas-based confetti (no deps)
│           ├── Logo.tsx          # ChalkLogo SVG component
│           └── SimpleInputModal.tsx  # Reusable single-input modal
├── alembic/versions/             # DB migrations (001 groups, 002 feedback, 003 xp+cosmetics)
├── design_handoff_chalk*/        # Design reference files (HTML/JSX mockups)
├── Dockerfile                    # Multi-stage: Node builds Vite → Python, runs alembic+uvicorn
├── northflank.yaml               # Northflank service spec + manual setup steps
└── .github/workflows/deploy.yml  # CI: typecheck + pytest on PR; deploy hook on main push
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, psycopg2-binary |
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 3, CodeMirror, Yjs |
| Database | PostgreSQL (Supabase in prod, local in dev) |
| Auth | Google OAuth 2.0 → JWT in localStorage as `lambda_token` |
| AI | Claude Haiku (`claude-haiku-4-5-20251001`) for hints |
| Sandbox | subprocess default; Docker optional (`SANDBOX_USE_DOCKER=true`) |
| Real-time | WebSocket + Yjs CRDT for collab editing and drawing canvas |

---

## Roles & Auth

- **student** — join groups, submit code, view feedback, earn XP
- **teacher** — create groups/classrooms/assignments, view submissions, add feedback
- **admin** — `madiyar.zmm@gmail.com`; has admin badge; can toggle "View as Teacher/Student" without changing DB role
  - `viewAsRole` state in MentorApp; `effectiveRole = isAdmin && viewAsRole ? viewAsRole : user.role`

---

## DB Schema (key tables)

| Table | Notes |
|-------|-------|
| users | id, email, name, role, google_id, xp, cosmetics (JSONB) |
| groups | teacher_id, invite_code |
| group_memberships | user_id, group_id |
| classrooms | teacher_id, group_id, title |
| assignments | classroom_id, title, description, template_code, test_code, due_at |
| submissions | user_id, assignment_id, code, status, output, feedback |

---

## Features Implemented

**Auth / Core**
- Google OAuth login → JWT, role-based UI split
- Groups with invite codes; classrooms; assignments

**Teacher**
- Create groups/classrooms/assignments (with description, template code, test code toggle, due date)
- View all student submissions per assignment
- Inline feedback: textarea → PATCH `/submissions/{id}/feedback`
- Deadline urgency colors (green/yellow/orange/red/overdue) on assignment cards
- Progress ring (SVG %) on assignment cards showing % students submitted
- First-to-solve crown (👑) on student submissions

**Student**
- Join group via invite code
- CodeMirror multi-file editor with tab support
- stdin bar appears when code contains `input(` — values supplied pre-run
- Submit code → pass/fail test results
- Confetti animation on accepted submission
- XP system: +10 accepted, +2 failed; displayed as level bar
- XP levels: Novice (0) → Apprentice (300) → Coder (700) → Hacker (1500) → Expert (3000) → Master (5500) → Legend (10000)
- Hint system: unlocks after 3 failed attempts, costs -5 XP, powered by Claude Haiku
- Raise hand button (pulsing amber when raised, visible to teacher)
- Read-only teacher feedback in submission detail

**Cosmetics / Profile (student panel)**
- Avatar frame selector (XP_FRAMES: plain, gold, violet, neon)
- Background gradient selector (XP_BGTYPES)
- Achievements grid (hardcoded, some unlocked/locked) with rarity colors
- Activity graph (GitHub-style heatmap)
- "Customize" shop toggle in student profile panel

**Collaboration**
- Yjs CRDT collab editing: `/ws/collab/{room_id}` relay
- Room ID = `classroom:assignment:filename`
- Peer cursors with AvatarStack in editor toolbar
- Collaborative drawing canvas (`DrawingCanvas.tsx`, `useCollabDrawing`)
- Raise hand synced via collab metadata

**Admin**
- Users panel: list all users, toggle teacher/student role
- View-as role toggle in header (resets hint/failedAttempts state on switch)

**AI**
- `app/services/hint_service.py` — calls Claude Haiku with assignment context
- Falls back to 5 generic placeholder hints if no `ANTHROPIC_API_KEY`

---

## API Endpoints (key ones)

```
GET  /health
POST /api/v1/auth/google                  # Exchange Google token → JWT
GET  /api/v1/users/me                     # Current user
GET  /api/v1/users/me/stats               # { xp }
GET  /api/v1/users/                       # Admin: list all users
PATCH /api/v1/users/{id}/role             # Admin: toggle role

GET/POST /api/v1/groups/                  # List / create groups
POST /api/v1/groups/join                  # Join by invite code
GET  /api/v1/groups/{id}/members          # Group member list

GET/POST /api/v1/classrooms/              # List / create
GET  /api/v1/classrooms/{id}/assignments  # Assignments in classroom

GET/POST /api/v1/assignments/             # List / create
POST /api/v1/assignments/{id}/hint        # Generate AI hint
GET  /api/v1/assignments/{id}/submissions # Teacher: all submissions

GET/POST /api/v1/submissions/             # List / create
GET  /api/v1/submissions/{id}             # Submission detail
PATCH /api/v1/submissions/{id}/feedback   # Teacher inline feedback

POST /api/v1/sandbox/run                  # Execute code { code, stdin }
WS   /ws/collab/{room_id}                 # Yjs relay
```

---

## Deployment (Northflank + Supabase)

- **Live URL**: `https://strawie.dev` (custom domain, SSL active)
- **Fallback URL**: `https://http--lambda-app--ksd5wrhcp6zn.code.run`
- **Northflank**: project `lambda`, service `lambda-app` — free always-on combined service, Docker runtime
- **Database**: Supabase PostgreSQL, project ref `nxlrcalepiudkhkbsdss`
- **CI/CD**: GitHub Actions — tests + typecheck on PR; on main push triggers Northflank build via REST API
- **No keep-alive needed**: Northflank free tier is always-on (no sleep)
- **Config reference**: `northflank.yaml`

**GitHub secrets (already set):**
- `NORTHFLANK_API_KEY`, `NORTHFLANK_PROJECT_ID` (`lambda`), `NORTHFLANK_SERVICE_ID` (`lambda-app`)

**Northflank env vars (in secret group `lambda-env`, unrestricted → auto-injected):**
- `DATABASE_URL` — `postgresql://postgres:***@db.nxlrcalepiudkhkbsdss.supabase.co:5432/postgres`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `SECRET_KEY`
- `FRONTEND_URL` — `https://strawie.dev`
- `ENV=production`
- `SANDBOX_USE_DOCKER=false`

**Google OAuth (Google Cloud Console → OAuth client):**
- Authorized JS origin: `https://strawie.dev`
- Authorized redirect URI: `https://strawie.dev/api/v1/auth/google/callback`

**Custom domain setup (strawie.dev on Cloudflare):**
- TXT `verify-imbeuiulu4q56yoz9lhehjk0` → Northflank verification token (already verified)
- CNAME `@` → `strawie.dev.madi-l2kb.dns.northflank.app` (DNS only, no proxy)

**Migrations**: 3 Alembic versions exist. Run via `alembic upgrade head` (Dockerfile does this on startup).

---

## Dev Setup

```bash
# Backend
uvicorn app.main:app --reload   # port 8000

# Frontend
cd frontend-vite && npm run dev  # port 5173, proxies /api to 8000

# Database
# local PostgreSQL; see .env.example
```

**Prod build**: `npm run build` in frontend-vite → dist/ → Docker copies to /app/frontend/ → FastAPI serves StaticFiles.

---

## Known Files / State

- `example.py` — untracked scratch file (space colony CSV generator, unrelated to app)
- `design_handoff_chalk*/` — design mockups / visual spec (HTML + JSX), not part of build
- `cursor/cursor_rules.md` — Cursor IDE rules, not used by Claude Code
- `.mcp.json` — Supabase MCP server config (project root)
- `.claude/settings.local.json` — Claude Code permissions for this project

---

## Session log — 2026-05-11/12

### Gamification rework (implemented this session)

**Backend XP formula** (`app/api/v1/users.py:_calc_xp`) — rewritten:
- Accepted submission, no tests / failing tests → **5 XP**
- Per-test passing count (`result_json.passed: int`) → **+40 XP per test**
- `result_json.test_passed: true` (boolean fallback) → **+40 XP**
- Failed / timeout / errored → **0 XP**

Frontend optimistic update in `handleSubmit` now mirrors this and refetches `/me/stats` after submit to reconcile.

**Cosmetics wired to backend** (`MentorApp.tsx`):
- `cosmetics` lifted to top-level state, loaded on mount via `getMyCosmetics`, saved on selection via `updateMyCosmetics` (`saveCosmetics` helper).
- Selection state shape: `{ frame?: string, background?: string, aura?: string }`.
- Locked items (`cost > xp`) are disabled with "Locked — need X XP" tooltip; old local-only `useState` for cosmetics is gone.

**New XP spendable: Avatar Aura** — animated rings layered behind the avatar.
- Catalog: None (0), Pulse (75), Sparkle (200), Orbit (400), Lightning (800), Cosmic (1500), Galaxy (3000).
- Keyframes added in `frontend-vite/src/index.css`: `auraSpin`, `auraPulse`, `auraFlicker`.
- Frame/Background catalogs unchanged but shop now has 3 columns.

**Submission detail view** — extracted reusable `SubmissionDetailPanel` component (in `MentorApp.tsx`, just above `SubmissionsView`):
- Status pill, exit code, timeout flag, test result, short submission id.
- Sections for code (`<pre>`), stdout, stderr/error, auto-grader output, error_summary fallback.
- Teacher: textarea + Save button calling `PATCH /submissions/{id}/feedback`.
- Student: read-only feedback.
- Used in `SubmissionsView` column 3 AND as a modal overlay in `AssignmentView` (backdrop click closes, content stop-propagates). `onSaveFeedback` is now destructured in `AssignmentView` and passed through.

### Security review (NOT yet fixed — open items)

**Critical:**
1. **Subprocess sandbox is escapable.** Restricted-builtins approach is bypassable via `().__class__.__base__.__subclasses__()`. Child process inherits `SECRET_KEY`, `DATABASE_URL`, `GOOGLE_CLIENT_SECRET`, `ANTHROPIC_API_KEY` (only `PYTHONPATH` filtered). One escape = full server compromise. **Action: require Docker sandbox in prod, or replace with gVisor/firejail.**
2. **Docker sandbox missing `--cpus` cap** (`docker_executor.py:54-63`). Has memory/pids/network/read-only, no CPU limit.
3. **WS rooms have no access control** (`app/api/ws_collab.py`, `app/api/ws_sandbox.py`). JWT validated but `room_id` is not checked against the user's classroom/assignment membership. Any authenticated user can join any room.
4. **`SECRET_KEY` defaults to `"change-me-in-production"`** (`config.py:43`). Pydantic boots with this. Add a startup assert when `app_env == "production"`.

**High:**
5. JWT in `localStorage` + no CSP / X-Frame-Options / Referrer-Policy headers in `main.py`.
6. `email_verified` not checked in `user_service.get_or_create_google_user`.
7. Email-based account merging across providers (dev-login + google_id backfill).
8. Rate-limiting incomplete: `/api/v1/submissions/` runs the sandbox but is not rate-limited; `/ws/sandbox/run` also unlimited. `Limiter(key_func=get_remote_address)` does not honor `X-Forwarded-For` — limits collapse to one global bucket behind Northflank's proxy.
9. `/me/stats` is a GET that mutates and commits the user row (writes XP on every read).

**Medium:**
10. `/health` returns 200 with `{"status": "db_error"}` when DB is down. Should be 503; drop the raw exception string.
11. Admin email hardcoded in two places (`config.py:50`, `MentorApp.tsx:628`).
12. `dev_login` accepts `role` as a query parameter; should be a Pydantic body and pinned to "student".
13. JWT has no `aud`/`iss`, no refresh, no revocation; 60-min lifetime.
14. Subprocess sandbox env filter is denylist-of-one — needs explicit allowlist.
15. No request-size limit middleware.

**Low / hygiene:**
16. `app/__pycache__` and `alembic/versions/__pycache__` present in tree — confirm `.gitignore` covers them.
17. `_calc_xp` `passed: int` branch is effectively dead (submission service only stores `test_passed: bool`). Either populate `passed` count or drop the branch.
18. `error_summary` is computed on the backend (`get_submission_status_display`) and the frontend ignores it most of the time — pick one source.
19. OAuth callback redirects to a single `?error=auth_failed` on every failure — no `reason` distinguishing missing-code vs state-mismatch vs token-exchange. Hard to debug user reports.
20. `_PLACEHOLDER_HINTS` (`hint_service.py:42`) clamps the index, so anyone past attempt 5 always sees the same hint. Either cycle (modulo) or accept the clamp explicitly.

### Code-quality findings (NOT yet fixed)

- **Name drift**: "Chalk" in `main.py`, "Strawie" in frontend (`Logo.tsx`, `api.ts`), "lambda" in dir/Docker, `chalk_ws_` in temp dirs. Pick one.
- **Duplicate sandbox limits**: `config.py` has `sandbox_max_output_bytes` but executors import `MAX_OUTPUT_BYTES` from `app/sandbox/limits.py` directly — config value is dead.
- **`xpLevel()` bug at the cap**: `MentorApp.tsx:304-327` — when `xp >= 10000`, the cap branch sits inside the loop at wrong nesting; for xp=50000 it returns `next=300`. Move cap check before the loop.
- **`MentorApp.tsx` is ~2740 lines** (was ~2300, grew this session). Split into per-view files in `src/views/`.
- **Achievements + streak are hardcoded** (`ACHIEVEMENTS` literals, `"Streak: 7"` constant) — fake stats; either implement or remove per landing-page anti-fake-stats preference.
- **`saveCosmetics` swallows errors silently** — failed PUT shows local change as if it persisted.
- **`ChalkLogo` is `StrawieLogoSvg as ChalkLogo`** — naming inconsistency in `components/Logo.tsx:44`.
- **Frontend admin check** `user?.email === "madiyar.zmm@gmail.com"` duplicates server logic — should come from `/me`.
- **`_calc_xp` reads all submissions per `/me/stats`** — move XP increment to submission write path.
- **Tests directory is sparse** — no coverage on sandbox, OAuth state, or classroom/group authz.

### Suggested next steps (gamification roadmap)

**Cheap wins:**
- Move level thresholds server-side; return `{xp, level, title, next_threshold}` from `/me/stats`.
- Add real streak: `current_streak`, `longest_streak`, `last_active_date` on `User`; update on submission; replace hardcoded "7".

**Medium:**
- Real achievements table (or JSONB `unlocks` on user); server checks rules on submission write; `/me/achievements`.
- Server-owned cosmetics catalog (lock state on server, not just by-cost on client).

**Bigger:**
- Classroom/group leaderboards.
- Daily/weekly quests.
- Level-up modal (currently only confetti on accepted submission).
- Decide: is XP progression-only (Duolingo) or a spendable currency (Khan)? Shop implies the latter but nothing actually deducts.

### Open priority if returning
Full audit (items 1–20 + code-quality list) is recorded above. **Blockers before any non-trusted user touches this: security #1 (sandbox escape), #3 (WS room ACL), #4 (default `SECRET_KEY`).** Tier 2: #5 (CSP/token storage), #8 (rate limiting). Everything else can ship later.
