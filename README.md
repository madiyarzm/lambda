# Lambda — Collaborative Coding Classroom

A full-stack, real-time collaborative platform for teaching and learning Python programming. Lambda enables instructors to create structured classrooms and assignments while students write, execute, and submit code directly in the browser — all within a secure, sandboxed environment with live multi-user editing.

---

## Table of Contents

- [Why Lambda Exists](#why-lambda-exists)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Key Technical Decisions](#key-technical-decisions)
  - [Sandboxed Code Execution](#1-sandboxed-code-execution)
  - [Real-Time Collaboration via CRDT](#2-real-time-collaboration-via-crdt)
  - [Layered Service Architecture](#3-layered-service-architecture)
  - [Role-Based Access Control](#4-role-based-access-control)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Development Milestones](#development-milestones)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Security Model](#security-model)
- [Future Work](#future-work)
- [License](#license)

---

## Why Lambda Exists

Teaching programming in a classroom setting presents a recurring set of friction points:

1. **Environment setup is a barrier.** Students spend time configuring Python, IDEs, and dependencies instead of learning to code. Every machine is different; every setup breaks differently.
2. **Instructors lack visibility.** In traditional setups, teachers cannot see a student's code until it is submitted. Real-time observation and guidance is impossible.
3. **Code execution is a security risk.** Letting students run arbitrary code on shared infrastructure without isolation is dangerous — one `import os; os.system("rm -rf /")` away from disaster.
4. **Collaboration is an afterthought.** Most coding environments are single-user. Pair programming and live mentorship require screen-sharing, which is clunky and one-directional.

Lambda addresses all four problems in a single, cohesive platform. The goal is to make the act of teaching Python as frictionless as opening a Google Doc — but with a real code editor, a real execution engine, and real-time collaboration built in from day one.

---

## Core Features

| Feature | Description |
|---|---|
| **Classroom Management** | Teachers create classrooms; students join via unique invite codes. Each classroom contains its own assignments and enrolled members. |
| **Assignments with Templates** | Teachers define assignments with template/starter code and optional test cases. Students see the skeleton and fill in their solutions. |
| **Sandboxed Code Execution** | Python code runs in an isolated subprocess or Docker container — never in the main application process. Network access is blocked, filesystem is read-only, and execution is time-limited. |
| **Real-Time Collaborative Editing** | Multiple users can edit the same file simultaneously with conflict-free resolution (Yjs CRDT). Cursors and selections of each participant are visible in real time, color-coded by role. |
| **Submission Tracking** | Students submit code, which is executed and graded automatically. Teachers can view all submissions per assignment with status, output, and the submitted code. |
| **Google OAuth Authentication** | Secure sign-in via Google with JWT session tokens. A dev-login mode is available for local development without OAuth credentials. |
| **Role-Based Access** | Teachers can create classrooms and assignments; students can enroll, write code, and submit. Authorization is enforced at the service layer. |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Frontend (React 19 + Vite + TypeScript)           │
│                                                                      │
│  LandingPage ─── MentorApp (Dashboard → Classroom → Assignment)     │
│  CodeEditor (CodeMirror 6 + Yjs CRDT)                               │
│  Presence Bar (live cursors, peer names, role colors)                │
└─────────────────────────┬────────────────────────────────────────────┘
                          │ REST (HTTP) + WebSocket
┌─────────────────────────▼────────────────────────────────────────────┐
│                    Backend (FastAPI + Python 3.12)                    │
│                                                                      │
│  /api/v1/auth/*        — Google OAuth + JWT issuance                 │
│  /api/v1/classrooms/*  — CRUD classrooms, enrollment                 │
│  /api/v1/assignments/* — CRUD assignments                            │
│  /api/v1/submissions/* — Submit code, list results                   │
│  /api/v1/sandbox/run   — Execute code without saving                 │
│  /ws/collab/{room_id}  — WebSocket relay for Yjs binary sync        │
└───────┬──────────────────────┬───────────────────────┬───────────────┘
        │                      │                       │
        ▼                      ▼                       ▼
┌───────────────┐    ┌─────────────────┐    ┌─────────────────────────┐
│  PostgreSQL   │    │  Sandbox        │    │  Collab Room Manager    │
│  (SQLAlchemy  │    │  Executor       │    │  (in-memory WebSocket   │
│   + Alembic)  │    │                 │    │   room registry)        │
│               │    │  ┌───────────┐  │    │                         │
│  5 tables:    │    │  │Subprocess │  │    │  Binary relay: server   │
│  users        │    │  │(default)  │  │    │  does not interpret Yjs │
│  classrooms   │    │  └───────────┘  │    │  updates; conflict      │
│  enrollments  │    │  ┌───────────┐  │    │  resolution happens on  │
│  assignments  │    │  │Docker     │  │    │  the client via CRDT.   │
│  submissions  │    │  │(optional) │  │    │                         │
│               │    │  └───────────┘  │    │                         │
└───────────────┘    └─────────────────┘    └─────────────────────────┘
```

---

## Tech Stack

### Backend

| Component | Technology | Version |
|---|---|---|
| Web Framework | FastAPI | 0.115 |
| ASGI Server | Uvicorn | 0.30 |
| ORM | SQLAlchemy | 2.0 |
| Database | PostgreSQL | — |
| Migrations | Alembic | 1.13 |
| Validation | Pydantic | 2.9 |
| Auth | python-jose (JWT) + Google OAuth | 3.3 |
| HTTP Client | httpx | 0.27 |
| Config | pydantic-settings + python-dotenv | — |

### Frontend

| Component | Technology | Version |
|---|---|---|
| UI Framework | React | 19 |
| Language | TypeScript | 5.9 |
| Build Tool | Vite | 7 |
| Code Editor | CodeMirror 6 (@uiw/react-codemirror) | 4.25 |
| Collaboration | Yjs + y-codemirror.next + y-protocols | 13.6 |
| Routing | React Router | 7 |
| Styling | Tailwind CSS | 3.4 |
| Animation | Framer Motion | 12 |
| Icons | Lucide React | — |

### Infrastructure

| Component | Technology |
|---|---|
| Containerized Sandbox | Docker (Python 3.12-slim) |
| Database | PostgreSQL (psycopg2-binary) |
| Schema Migrations | Alembic |

---

## Key Technical Decisions

### 1. Sandboxed Code Execution

**Problem:** Students submit arbitrary Python code. Running it on the server without isolation is a critical security risk — file access, network abuse, infinite loops, and resource exhaustion are all possible.

**Approach:** Lambda provides two execution backends behind a common `SandboxExecutor` interface:

**Subprocess Executor (default):**
- Spawns a child Python process with a custom runner script.
- Strips dangerous builtins: `open`, `exec`, `eval`, `compile`, `__import__`, `input` are all removed from the execution namespace.
- Replaces `__import__` with a safe version that only allows whitelisted modules: `math`, `random`, `json`, `datetime`, `re`, `collections`, `functools`, `itertools`, `string`, `decimal`, `fractions`, `statistics`, `typing`, `dataclasses`.
- Enforces a wall-clock timeout (default 10 seconds) and output size limit (256 KB).
- No Docker dependency — works on any machine with Python.

**Docker Executor (optional, stronger isolation):**
- Runs code inside a disposable container with:
  - `--network=none` — no internet access.
  - `--read-only` — immutable root filesystem.
  - `--tmpfs /tmp:noexec,nosuid,size=64m` — small writeable temp area.
  - `--pids-limit=50` — prevents fork bombs.
  - `--memory=256m` — caps memory usage.
  - `--user sandbox` — non-root execution.
- Code is mounted read-only from a temp directory and discarded after execution.
- Supports pre-installed packages (numpy, pandas, etc.) via Docker build args.

**Why this matters:** The dual-executor design lets the project run locally without Docker for development, while providing production-grade isolation when Docker is available. The abstract `SandboxExecutor` base class means switching backends is a single config flag (`SANDBOX_USE_DOCKER=true`).

### 2. Real-Time Collaboration via CRDT

**Problem:** Multiple students and a teacher need to edit the same code file simultaneously without conflicts, lost edits, or a central locking mechanism.

**Approach:** Lambda uses **Yjs**, a battle-tested CRDT (Conflict-free Replicated Data Type) library:

- **Client-side:** Each CodeMirror editor instance is backed by a `Y.Doc` with a shared `Y.Text` type. The `y-codemirror.next` binding translates CodeMirror transactions into Yjs operations and vice versa.
- **Server-side:** The FastAPI backend runs a WebSocket relay at `/ws/collab/{room_id}`. It does **not** interpret Yjs updates — it simply broadcasts binary messages between all connected clients in the same room. Conflict resolution is entirely handled by the CRDT logic on the client.
- **Awareness protocol:** Each client broadcasts its cursor position, selection range, display name, and role-based color (green for teachers, a rotating palette for students). This enables a live presence bar showing who is editing and where.
- **Wire protocol:** Messages are tagged with a single byte prefix — `0x00` for Yjs document updates, `0x01` for awareness updates. A heartbeat is sent every 15 seconds to prevent awareness timeouts.

**Why this matters:** CRDT-based collaboration is the same approach used by production tools like Figma and Linear. It enables true real-time co-editing with no central authority, no operational transform server, and no merge conflicts. The server remains stateless (no Yjs state is persisted server-side), which simplifies deployment and scaling.

### 3. Layered Service Architecture

**Problem:** As features grow (auth, classrooms, assignments, submissions, sandbox, collaboration), a monolithic approach becomes unmaintainable and untestable.

**Approach:** Lambda follows a strict layered architecture:

```
Routes (API layer) → Services (business logic) → Models/Schemas (data)
```

- **Routes** handle HTTP validation, extract the current user from JWT, and delegate to services. No business logic lives in route handlers.
- **Services** implement all domain logic: creating classrooms, enforcing enrollment, orchestrating sandbox runs, managing submissions.
- **Models** are SQLAlchemy ORM classes. **Schemas** are Pydantic models for request/response validation.
- **Dependencies** (database sessions, current user) are injected via FastAPI's dependency injection system.

**Why this matters:** This separation makes each layer independently testable, allows swapping implementations (e.g., sandbox backends), and keeps the codebase navigable as it grows. It mirrors how production systems at scale are structured.

### 4. Role-Based Access Control

Teachers and students have distinct capabilities enforced at the service layer:

| Capability | Teacher | Student |
|---|---|---|
| Create classroom | Yes | No |
| Create assignment | Yes (own classroom) | No |
| Enroll in classroom | Yes | Yes |
| Write/run code | Yes | Yes |
| Submit code | Yes | Yes |
| View all submissions | Yes (own classroom) | Own only |

---

## Database Schema

```
users
├── id (UUID, PK)
├── email (unique)
├── name
├── picture_url
├── role (enum: teacher, student)
├── google_id (unique)
├── created_at
└── updated_at

classrooms
├── id (UUID, PK)
├── teacher_id (FK → users)
├── name
├── description
├── invite_code (unique)
├── created_at
└── updated_at

enrollments
├── id (UUID, PK)
├── classroom_id (FK → classrooms)
├── user_id (FK → users)
├── enrolled_at
└── UNIQUE(classroom_id, user_id)

assignments
├── id (UUID, PK)
├── classroom_id (FK → classrooms)
├── title
├── description
├── template_code (text)
├── test_code (text)
├── due_at (nullable)
├── created_at
└── updated_at

submissions
├── id (UUID, PK)
├── assignment_id (FK → assignments)
├── user_id (FK → users)
├── code (text)
├── status (enum: pending, running, success, failed, timeout)
├── result_json (JSONB)
└── submitted_at
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check (returns `{"status": "ok"}`) |
| `GET` | `/api/v1/auth/google` | Initiate Google OAuth flow |
| `GET` | `/api/v1/auth/callback` | OAuth callback, issues JWT |
| `POST` | `/api/v1/auth/dev-login` | Dev-only login (no OAuth required) |
| `GET` | `/api/v1/users/me` | Current user profile |
| `GET` | `/api/v1/classrooms/` | List classrooms (enrolled + owned) |
| `POST` | `/api/v1/classrooms/` | Create a new classroom |
| `POST` | `/api/v1/classrooms/{id}/enroll` | Join a classroom by invite code |
| `GET` | `/api/v1/assignments/?classroom_id=` | List assignments for a classroom |
| `POST` | `/api/v1/assignments/` | Create a new assignment |
| `GET` | `/api/v1/submissions/?assignment_id=` | List submissions for an assignment |
| `POST` | `/api/v1/submissions/` | Submit code (executes and stores result) |
| `GET` | `/api/v1/submissions/{id}` | Get a single submission with details |
| `POST` | `/api/v1/sandbox/run` | Execute code without saving (scratchpad) |
| `WS` | `/ws/collab/{room_id}` | Real-time collaborative editing relay |

---

## Development Milestones

The project was developed iteratively across distinct phases:

### Phase 1 — Architecture & Planning
Documented the full system design before writing any code: database schema, API contract, authentication flow, sandbox security model, and folder structure. This plan lives in [`docs/phase1-architecture.md`](docs/phase1-architecture.md) and served as the blueprint for all subsequent implementation.

### Phase 2 — MVP Backend (`v1 - MVP`)
Implemented the core FastAPI application: project structure, configuration management via pydantic-settings, PostgreSQL integration with SQLAlchemy, Alembic migrations, all five data models, CRUD services, and REST API endpoints. Established the dependency injection pattern and health check.

### Phase 3 — Authentication & Frontend (`v2-frontend`)
Added Google OAuth 2.0 flow with JWT session management. Built the React + Vite frontend with TypeScript: landing page, login view, dashboard, classroom management, and assignment views. Integrated the code editor (CodeMirror 6) with Python syntax highlighting and autocompletion.

### Phase 4 — Sandbox Execution (`v2`)
Implemented both sandbox executors — subprocess (with restricted builtins and whitelisted imports) and Docker (with network isolation, read-only filesystem, memory/PID limits). Connected the frontend Run/Submit buttons to the backend sandbox API. Added submission tracking with status and output display.

### Phase 5 — Real-Time Collaboration (`CRDT`)
Integrated Yjs for conflict-free collaborative editing. Built the WebSocket relay server (`CollabRoomManager`), the client-side `useCollab` hook with awareness protocol support, and the presence bar with role-based cursor colors. Each assignment file in a classroom gets its own collaboration room.

### Phase 6 — UI Polish (`user label added`, `UI fix`)
Refined the IDE-like interface: collapsible sidebar, file tabs, terminal output history, expandable submission detail panel, teacher/student mode indicators, and responsive layout adjustments.

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Docker (optional — only needed for Docker sandbox mode)

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-username/lambda.git
cd lambda

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL, SECRET_KEY, Google OAuth credentials

# Create the database
createdb lambda_db

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend-vite

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API requests to `http://localhost:8000`.

### Docker Sandbox (Optional)

```bash
# Build the sandbox image (with optional pre-installed packages)
docker build -f docker/sandbox.Dockerfile \
  --build-arg ALLOWED_PACKAGES="numpy pandas" \
  -t lambda-sandbox:latest .

# Enable Docker sandbox in .env
# SANDBOX_USE_DOCKER=true
```

---

## Project Structure

```
lambda/
├── app/
│   ├── main.py                    # FastAPI app factory, lifespan, static files
│   ├── config.py                  # Pydantic settings (all env vars)
│   ├── dependencies.py            # DI: get_db, get_current_user
│   ├── api/
│   │   ├── router.py              # Aggregates all versioned routes
│   │   ├── ws_collab.py           # WebSocket relay for Yjs collaboration
│   │   └── v1/
│   │       ├── auth.py            # OAuth + dev-login endpoints
│   │       ├── users.py           # User profile
│   │       ├── classrooms.py      # Classroom CRUD + enrollment
│   │       ├── assignments.py     # Assignment CRUD
│   │       ├── submissions.py     # Submit + list + get
│   │       └── sandbox.py         # Scratchpad code execution
│   ├── core/
│   │   ├── security.py            # JWT encode/decode
│   │   ├── auth_google.py         # Google OAuth token exchange
│   │   └── collab_manager.py      # In-memory WebSocket room registry
│   ├── db/
│   │   ├── session.py             # Engine, SessionLocal, Base
│   │   └── init_db.py             # Auto-create tables (dev only)
│   ├── models/                    # SQLAlchemy ORM: User, Classroom, Enrollment,
│   │   └── ...                    #   Assignment, Submission
│   ├── schemas/                   # Pydantic request/response models
│   │   └── ...
│   ├── services/                  # Business logic layer
│   │   └── ...
│   └── sandbox/
│       ├── base.py                # SandboxExecutor interface + SandboxResult
│       ├── subprocess_executor.py # Restricted-builtins subprocess runner
│       ├── docker_executor.py     # Docker container runner
│       └── limits.py              # Timeout (10s), output (256KB), code (128KB)
├── frontend-vite/
│   ├── src/
│   │   ├── App.tsx                # Router: LandingPage + MentorApp
│   │   ├── LandingPage.tsx        # Marketing/hero page
│   │   ├── MentorApp.tsx          # Main IDE: login, dashboard, classroom, editor
│   │   ├── components/
│   │   │   └── CodeEditor.tsx     # CodeMirror 6 + Yjs + presence bar
│   │   ├── hooks/
│   │   │   └── useCollab.ts       # WebSocket + Yjs + Awareness hook
│   │   └── lib/
│   │       └── api.ts             # HTTP client for backend REST API
│   └── package.json
├── docker/
│   └── sandbox.Dockerfile         # Minimal Python image for sandboxed execution
├── docs/
│   ├── phase1-architecture.md     # Full architecture design document
│   └── sandbox-docker.md          # Docker sandbox setup guide
├── alembic/                       # Database migration scripts
├── tests/
├── .env.example                   # Environment variable template
├── requirements.txt               # Python dependencies
└── alembic.ini                    # Alembic configuration
```

---

## Security Model

| Threat | Mitigation |
|---|---|
| **Arbitrary code execution** | Code never runs in the main process. Subprocess executor strips dangerous builtins; Docker executor adds OS-level isolation (no network, read-only FS, memory caps). |
| **Resource exhaustion** | 10-second timeout, 256 KB output limit, 128 KB code size limit, 50 PID limit (Docker), 256 MB memory limit (Docker). |
| **Authentication bypass** | All mutation endpoints require a valid JWT. Google OAuth with `state` parameter for CSRF protection. |
| **Authorization violations** | Service-layer checks: only classroom owners can create assignments; only enrolled users can submit. |
| **SQL injection** | SQLAlchemy ORM exclusively — no raw SQL with string interpolation. |
| **Secrets in source** | All secrets (DB URL, JWT key, OAuth credentials) loaded from environment variables. `.env` is in `.gitignore`. |
| **CORS abuse** | Configurable allowed origins; restricted to known frontend origins in production. |
| **Data growth** | Automatic cleanup of submissions older than the configured retention period (default: 1 day) on application startup. |

---

## Future Work

### AI-Powered Features
- **Intelligent Code Hints:** Integrate an LLM to analyze student submissions and provide contextual hints, pointing out logical errors or suggesting improvements without giving away the answer.
- **Automated Test Generation:** Allow teachers to describe an assignment in natural language; an AI agent generates test cases and expected outputs automatically.
- **AI Tutor Agent:** A conversational assistant within each assignment that can answer student questions about Python concepts, debug errors in their code, and guide them through problem-solving — an agentic AI workflow embedded directly in the learning experience.
- **Prompt-Engineered Feedback:** Use structured prompts to generate pedagogically sound feedback that adapts to the student's skill level and the specific assignment context.

### Platform Scalability
- **Async Execution Queue:** Replace synchronous sandbox execution with a Redis-backed job queue (e.g., Celery or arq) so code runs are non-blocking and the API stays responsive under load.
- **Persistent Collaboration State:** Add server-side Yjs document persistence (e.g., to PostgreSQL or Redis) so collaboration state survives server restarts.
- **Multi-Language Support:** Extend the sandbox to support JavaScript, Java, C++, and other languages by building language-specific Docker images.
- **Cloud Deployment:** Containerize the full stack with Docker Compose; deploy to AWS (ECS/Fargate for compute, RDS for PostgreSQL, ElastiCache for collaboration state).

### Classroom Experience
- **Live Code Streaming:** Allow teachers to broadcast their editor to all students in read-only mode for live demonstrations.
- **Automated Grading with Test Suites:** Run teacher-defined test cases against submissions and display pass/fail results with detailed diffs.
- **Analytics Dashboard:** Track student progress, submission frequency, common errors, and time-to-completion per assignment.
- **Plagiarism Detection:** Compare submissions within a classroom using code similarity algorithms (e.g., AST-based comparison).

### Developer Experience
- **Comprehensive Test Suite:** Unit tests for services, integration tests for API endpoints, and end-to-end tests for the full user flow.
- **CI/CD Pipeline:** GitHub Actions for linting, testing, building, and deploying on every push.
- **API Documentation:** Auto-generated OpenAPI docs (already available at `/docs` in development mode).

---

## License

This project is developed for educational purposes.
