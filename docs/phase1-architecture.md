# Lambda — Phase 1: Architecture Plan

This document defines the backend architecture before implementation. No code is written in this phase.

---

## 1. Backend Folder Structure

```
lambda/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app, lifespan, global config
│   ├── config.py               # Settings from env (Pydantic BaseSettings)
│   ├── dependencies.py         # DI: get_db, get_current_user, get_current_user_optional
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py           # Aggregates all route modules
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # OAuth callback, token, logout
│   │   │   ├── users.py        # Profile, me
│   │   │   ├── classrooms.py   # CRUD classrooms, enrollments
│   │   │   ├── assignments.py  # CRUD assignments
│   │   │   ├── submissions.py  # Create submission, list, get result
│   │   │   └── sandbox.py      # Execute code (or under submissions)
│   │   └── deps.py             # API-level deps if needed
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py         # JWT encode/decode, password hashing (if any)
│   │   └── auth_google.py      # Google OAuth client, token exchange, user info
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── session.py          # Engine, SessionLocal, Base
│   │   └── init_db.py          # Create tables, optional seed
│   │
│   ├── models/
│   │   ├── __init__.py         # Re-export all models
│   │   ├── user.py
│   │   ├── classroom.py
│   │   ├── assignment.py
│   │   ├── submission.py
│   │   └── enrollment.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── classroom.py
│   │   ├── assignment.py
│   │   ├── submission.py
│   │   └── common.py           # Pagination, error response
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── classroom_service.py
│   │   ├── assignment_service.py
│   │   ├── submission_service.py
│   │   └── sandbox_service.py  # Orchestrates isolated execution
│   │
│   └── sandbox/
│       ├── __init__.py
│       ├── base.py             # Abstract executor interface
│       ├── docker_executor.py  # Docker-based runner (Phase 6)
│       └── limits.py           # Timeouts, memory limits constants
│
├── tests/
│   ├── conftest.py             # Fixtures, test client
│   ├── api/
│   └── services/
│
├── docs/
│   └── phase1-architecture.md  # This file
│
├── .env.example
├── requirements.txt
├── alembic.ini                 # Migrations (Phase 2)
└── README.md
```

**Principles:** Routes only validate input and call services. Services contain business logic and use models/repos. No global state; config and DB session come from dependencies.

---

## 2. Database Schema Design

### 2.1 Entity Relationship Overview

- **User** — from Google OAuth; has role (teacher/student).
- **Classroom** — belongs to a teacher; has many enrollments and assignments.
- **Enrollment** — links Student to Classroom (many-to-many).
- **Assignment** — belongs to one Classroom; has title, description, skeleton/template code, tests (or expected output), due date.
- **Submission** — one per (User, Assignment); code, status, result (e.g. test pass/fail, stdout), timestamps.

### 2.2 Tables

| Table         | Purpose |
|---------------|--------|
| `users`       | id (PK), email (unique), name, picture_url, role (enum: teacher, student), google_id (unique), created_at, updated_at |
| `classrooms`  | id (PK), teacher_id (FK → users), name, description, invite_code (unique, optional), created_at, updated_at |
| `enrollments` | id (PK), classroom_id (FK), user_id (FK), role in class (e.g. student), enrolled_at; unique (classroom_id, user_id) |
| `assignments` | id (PK), classroom_id (FK), title, description, template_code (text), test_code or expected_behavior (text), due_at (nullable), created_at, updated_at |
| `submissions` | id (PK), assignment_id (FK), user_id (FK), code (text), status (enum: pending, running, success, failed, timeout), result_json (e.g. stdout, stderr, test results), submitted_at; index on (assignment_id, user_id) for “latest submission” |

### 2.3 Design Notes

- **Invite code:** Optional short code for classroom join; stored hashed or plain depending on risk (if low entropy, hashing adds little; can be rate-limited).
- **Submissions:** One “active” or “latest” per user per assignment; can add `is_latest` boolean or resolve via `ORDER BY submitted_at DESC LIMIT 1`.
- **Indexes:** FK columns, (classroom_id, user_id) on enrollments, (assignment_id, user_id) on submissions, unique on (email), (google_id).
- **Soft delete:** Not in Phase 1; can add `deleted_at` later for classrooms/assignments if needed.

---

## 3. Core Entities (Summary)

| Entity      | Key attributes | Responsibility |
|------------|----------------|----------------|
| **User**   | id, email, name, picture_url, role, google_id | Identity; teacher can create classrooms; student can enroll and submit. |
| **Classroom** | id, teacher_id, name, description, invite_code | Container for assignments and enrollments. |
| **Enrollment** | classroom_id, user_id | Links student to classroom; required to access assignments and submit. |
| **Assignment** | classroom_id, title, description, template_code, test_code, due_at | Defines a homework task and how it is validated. |
| **Submission** | assignment_id, user_id, code, status, result_json, submitted_at | One run of student code; status and result come from sandbox. |

---

## 4. Authentication Flow

### 4.1 Google OAuth Only (Phase 1)

1. **Login:** Frontend redirects to backend endpoint that redirects to Google OAuth (e.g. `/api/v1/auth/google`).
2. **Callback:** Google redirects to `/api/v1/auth/callback` with `code`. Backend exchanges `code` for tokens, fetches user profile (email, name, picture).
3. **User resolution:** Look up user by `google_id` (or email). If missing, create user with role `student` (default); optionally allow first user or specific emails to be `teacher`.
4. **Session:** Backend issues a **JWT** (or opaque session token) containing at least: `sub` (user id), `email`, `role`, `exp`. Store in cookie (HttpOnly, Secure) or return to frontend for Authorization header.
5. **Protected routes:** Middleware or dependency reads JWT, validates signature and exp, loads user, injects `current_user`. Authorization checks (e.g. “only teacher of this classroom”) in service or route layer.

### 4.2 Flow Diagram (Conceptual)

```
[Client] --> GET /auth/google --> [Backend] --> 302 Google
[Client] <-- 302 Google <-- [Backend]
[Client] --> Google login --> Google redirect to /auth/callback?code=...
[Backend] --> exchange code --> Google
[Backend] <-- id_token / access_token <-- Google
[Backend] --> get user info, create/find User --> DB
[Backend] --> issue JWT --> [Client]
[Client] --> later requests with Bearer JWT
[Backend] --> validate JWT, load User --> 200 + resource
```

### 4.3 Security

- **Secrets:** Client ID and Client Secret from env; never in code.
- **State:** Use OAuth `state` parameter to mitigate CSRF on callback.
- **Tokens:** JWT signed with secret from env; short expiry (e.g. 1h) and refresh strategy later if needed.
- **Rate limiting:** On login/callback to prevent abuse.

---

## 5. Sandbox Execution Architecture (Safe by Design)

### 5.1 Principles

- **Never run user code in the main process.** One bug could compromise the whole app.
- **Isolation:** Use a separate execution environment (container or subprocess with strict limits).
- **Timeouts and limits:** CPU time and wall-clock timeout; cap memory.
- **No filesystem:** Execution environment is read-only or ephemeral; no write to host.
- **No network:** Block outbound (and inbound) for the run.
- **Deterministic logging:** Log run id, user id, assignment id, timestamp, duration, status; avoid logging full code or large outputs in plain text at high volume (PII/size).

### 5.2 Recommended Approach: Docker-Based Runner

- **Executor service:** A dedicated module (e.g. `sandbox/docker_executor.py`) that:
  - Accepts: code (string), timeout (seconds), memory limit.
  - Builds or uses a pre-built image (e.g. Python 3.x, no network, read-only filesystem).
  - Injects code into container (e.g. via bind mount of a temp file or stdin).
  - Runs container with: `--network=none`, `--read-only`, `--memory=...`, `--pids-limit=...`.
  - Captures stdout, stderr, exit code; enforces wall-clock timeout (e.g. `docker run` with timeout or kill after T seconds).
  - Returns: success/failure, stdout, stderr, exit code, timed_out flag.

- **Orchestration:** `sandbox_service` in app receives request (assignment_id, user_id, code), checks enrollment and assignment existence, calls executor, maps result to submission status and result_json, saves Submission and returns.

- **Queue (optional later):** For scale, a small queue (e.g. Redis + worker) can sit between API and executor so that execution is async and the main app stays responsive. Phase 1 can be synchronous with a strict request timeout.

### 5.3 What We Do Not Do

- No `eval()` or `exec()` of user code in the app process.
- No subprocess without isolation (e.g. plain `subprocess.run(["python", "-c", user_code])` on the host).
- No disabling of timeouts or memory limits for “convenience”.

---

## 6. Security Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| **Code execution on server** | Run code only in isolated container/process; no execution in main app. |
| **Resource exhaustion** | Timeouts, memory limits, optional rate limit per user on run endpoint. |
| **Data leakage** | Do not log full code or large stdout in logs; restrict who can see others’ submissions (e.g. only own and teacher). |
| **Auth bypass** | All mutation and sensitive read endpoints require valid JWT; authorization checks (teacher vs student, enrollment) in service layer. |
| **Injection (SQL)** | Use ORM/SQLAlchemy; no raw SQL with string formatting. |
| **Injection (OAuth)** | Validate `state`; use official Google client library; verify token. |
| **Secrets in repo** | All secrets in env; `.env` in `.gitignore`; `.env.example` without values. |
| **CORS** | Configure allowed origins; no wildcard in production. |
| **Sensitive errors** | Catch exceptions; return generic messages to client; log details server-side. |
| **Invite code abuse** | Rate limit join-by-code; optional captcha or invite-only links later. |

---

## 7. Phase 1 Summary

- **Backend structure:** Clear separation of api, core, db, models, schemas, services, sandbox.
- **Database:** Five main tables (users, classrooms, enrollments, assignments, submissions) with FKs and indexes.
- **Auth:** Google OAuth → JWT; state for CSRF; secrets from env; rate limiting on auth.
- **Sandbox:** Docker-based executor, no in-process execution; timeouts, no filesystem/network; logging without PII/code.
- **Security:** Addressed from the start (isolation, validation, authz, no secrets in code, CORS, error handling).

---

## 8. Suggested Next Steps (After Your Confirmation)

- **Phase 2:** Project setup — FastAPI app, config (env), SQLAlchemy + PostgreSQL/SQLite, Alembic, folder structure, health check. No auth or business logic yet.

Once you confirm this architecture, we proceed to Phase 2.
