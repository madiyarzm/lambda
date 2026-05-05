# Tech Debt Backlog

Issues identified in the May 2026 security/quality audit that were not fixed immediately.
Items here are low-priority or require design decisions before implementation.

---

## Low Priority

### L1 — JWT stored in localStorage (XSS exposure)
**File:** `frontend-vite/src/lib/api.ts:13`
**Detail:** `localStorage` is accessible to any JavaScript on the page. A successful XSS attack anywhere on the page (or in any npm dependency) can exfiltrate all user tokens. The proper fix is HttpOnly cookies with a server-side refresh token flow, but that requires significant auth plumbing changes.
**Trade-off:** Requires reworking the entire auth token delivery and storage model. Not trivial. Lower risk in practice because there are no inline scripts or obvious XSS vectors currently.

---

### L2 — Admin identified by email string, not a DB role
**File:** `app/dependencies.py:72`, `app/config.py:50`
**Detail:** Admin access is granted by comparing `current_user.email` to `settings.admin_email`. This is intentional (admin is a single owner account, not a DB role), but it's fragile if the admin email ever changes — it requires updating an env var and redeploying.
**Trade-off:** Adding a proper `admin` role to the DB schema would require a migration and UI changes. Acceptable as-is for a single-owner app.

---

### L3 — `submission_retention_days` defaults to 1 day
**File:** `app/config.py:74`
**Detail:** The default retention period is 1 day, which is very aggressive and could surprise developers in local environments. Consider raising the default to 30 or 90 days. Production env already overrides this via env var, so no immediate risk.

---

### L4 — Inefficient `list_groups_for_user` union query
**File:** `app/services/group_service.py:88`
**Detail:** Uses SQLAlchemy `.union()` and deduplicates in Python via a dict. Could be rewritten as a single `OR` query. Low impact because groups per user is expected to be small (< 20).

---

### L5 — Sequential user lookup in `get_or_create_google_user`
**File:** `app/services/user_service.py`
**Detail:** First queries by `google_id`, then falls back to email — two separate queries. Could be combined into a single `WHERE google_id = ? OR email = ?` query. Minor performance impact.

---

### L6 — Sandbox limits not configurable per-request
**File:** `app/sandbox/limits.py`
**Detail:** `MAX_OUTPUT_BYTES` and `MAX_CODE_BYTES` are module-level constants, not pulled from `Settings`. Changing them requires a code deploy, not just an env var change. Low risk — current limits (256 KB output, 128 KB code) are sensible.

---

### L7 — No structured audit logging for security events
**Detail:** There is no audit log for: login attempts, permission denials, or sandbox executions. In production this makes it impossible to investigate suspicious activity.
**Suggested fix:** Add a `security_audit` log handler that writes structured JSON lines for: login success/failure, 403 responses, and sandbox runs (user, assignment, timestamp). Could use Python's standard logging with a JSON formatter.

---

### L8 — Missing type hint on `_submission_to_read` (resolved partially)
**File:** `app/api/v1/submissions.py`
**Status:** Fixed — `submission: Submission` type hint added.

---

## Resolved in Audit Cleanup (2026-05-05)

| # | Issue | Fix |
|---|-------|-----|
| C1 | CORS `allow_origins=["*"]` | Restricted to `settings.frontend_url` + localhost in dev |
| C2 | JWT delivered via URL query string | Moved to URL hash fragment (`#<token>`) |
| C3 | WebSocket has no authentication | JWT validated from `?token=` query param before accepting |
| C4 | OAuth state cookie not HttpOnly | Set `httponly=True`, `secure=True` in production |
| H1 | Broad `except Exception` with no logging | Replaced with specific `JWTError` catch + `logger.exception` for unexpected errors |
| H2 | No rate limiting on sandbox/auth | Added `slowapi` — 30/min on `/sandbox/run`, 20/min on auth endpoints |
| H3 | Internal error details leaked to client | `detail=str(exc)` replaced with generic messages |
| M1 | N+1 query in submissions listing | `joinedload(Submission.user)` in `list_submissions_for_assignment` |
| M2 | N+1 query in group members | `joinedload(GroupMembership.user)` in `list_group_members` |
| M3 | Missing index on `submissions.submitted_at` | Alembic migration `004` adds `ix_submissions_submitted_at` |
| M4 | WebSocket errors swallowed silently | Added `logger.warning` in both `ws_collab.py` and `collab_manager.py` |
| — | Stale files | Deleted `example.py`, `design_handoff_chalk/`, `design_handoff_chalk 2/`, `cursor/` |
