# Lambda — Session Context

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
├── render.yaml                   # Render IaC (free web service)
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

- **Northflank**: free always-on combined service (build + deploy), Docker runtime, single service
- **Database**: Supabase PostgreSQL, project ref `nxlrcalepiudkhkbsdss`
- **CI/CD**: GitHub Actions — tests + typecheck on PR; on main push triggers Northflank build via REST API
- **No keep-alive needed**: Northflank free tier is always-on (no sleep)
- **Config reference**: `northflank.yaml` (setup docs + service spec)

**GitHub secrets needed (repo → Settings → Secrets → Actions):**
- `NORTHFLANK_API_KEY` — from Northflank account settings → API tokens
- `NORTHFLANK_PROJECT_ID` — shown in Northflank project URL/dashboard
- `NORTHFLANK_SERVICE_ID` — shown in service URL (e.g. `lambda-app`)

**Northflank env vars (set in service dashboard → Environment):**
- `DATABASE_URL` — Supabase direct connection (port 5432)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `SECRET_KEY`
- `ANTHROPIC_API_KEY` (optional)
- `FRONTEND_URL` — `https://<your-service>.code.run` (fill after first deploy)
- `ENV=production`
- `SANDBOX_USE_DOCKER=false`

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
