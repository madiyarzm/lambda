# Lambda – Development Rules for Cursor

Lambda is a collaborative coding classroom platform.

Primary goals:
1. Learn deeply while building.
2. Write clean, understandable code.
3. Build something releasable, not just a toy.
4. Maintain strong security practices from the start.

Cursor must follow these rules strictly.

---

## 1. Code Quality Standard

This project is intended to be production-capable.

- Clean architecture is encouraged.
- Proper separation of concerns is required.
- Nested logic is allowed if it improves clarity.
- Use appropriate abstractions when they make sense.
- Avoid premature optimization, but do not oversimplify core systems.

Do not:
- Add unnecessary complexity for style.
- Add advanced patterns unless they solve a real problem.
- Introduce architecture that cannot be clearly explained.

---

## 2. Mandatory Docstrings and Comments

Every function must include a clear docstring:

- What the function does
- What inputs it expects
- What it returns
- Any important side effects

Docstrings should be concise and easy to understand.

Example:

```python
def hash_password(password: str) -> str:
    """
    Hashes a plain text password using a secure algorithm.

    Args:
        password: The user's plain text password.

    Returns:
        A securely hashed password string.
    """
````

Inline comments must:

* Explain intent, not syntax.
* Clarify non-obvious decisions.
* Briefly explain security-sensitive logic.
* Explain why something exists, not just what it does.

Avoid obvious comments like:

# increment i by 1

Focus on reasoning.

---

## 3. Security is Non-Negotiable

The platform must be reasonably secure for real usage.

Required practices:

* Passwords must be hashed (never stored in plain text).
* Use environment variables for secrets.
* Validate and sanitize all user inputs.
* Prevent SQL injection (ORM or parameterized queries).
* Protect routes with proper authentication and authorization.
* Do not expose internal stack traces to users.
* Add rate limiting on authentication endpoints.
* Validate file uploads carefully.
* Ensure proper CORS configuration.

If something affects security:

* Add a short comment explaining the risk.
* Explain why the chosen approach is safer.

---

## 4. Sandbox Execution Rules (Critical Area)

User code execution must be isolated.

Rules:

* Never execute user code in the main application process.
* Add execution time limits.
* Restrict memory usage where possible.
* Disable file system access.
* Disable network access.
* Restrict dangerous built-ins.
* Log execution errors safely.

Add short explanatory comments about:

* Why isolation is necessary.
* What risks are being mitigated.

Security over convenience.

---

## 5. Architecture Guidelines

Backend:

* FastAPI
* SQL database (Postgres preferred, SQLite acceptable for development)
* SQLAlchemy or equivalent ORM

Structure:

* Separate routes, services, models, and schemas.
* Keep business logic outside route handlers.
* Use dependency injection properly.
* Organize modules clearly.

If introducing:

* async/await
* WebSockets
* background tasks
* middleware
* caching
* permission systems

Add short comments explaining:

* What it is
* Why it’s needed

---

## 6. Code Clarity Principles

* Use descriptive variable names.
* Keep functions focused.
* Extract complex logic into helper functions.
* Avoid hidden side effects.
* Avoid global mutable state.
* Define constants clearly.

Code should be readable by an intermediate CS student.

---

## 7. Dependency Discipline

* Do not add libraries without justification.
* If adding a dependency, briefly explain why.
* Prefer well-maintained, widely used libraries.

---

## 8. Error Handling

* Handle errors gracefully.
* Do not leak internal details to users.
* Use proper HTTP status codes.
* Log errors internally.
* Provide clean error messages externally.

Add short comments where error handling is important.

---

## 9. Long-Term Maintainability

This is not an MVP-only project.

Design decisions should:

* Allow future scaling.
* Allow adding features like:

  * Real-time collaboration
  * Role-based permissions
  * Classroom analytics
  * Code version history

But avoid overbuilding systems that are not yet required.

---

## 10. Teaching Mindset

This project is also a learning environment.

Whenever implementing something moderately complex:

* Add a brief comment explaining the concept.
* Keep explanations simple.
* Focus on clarity over formality.

The goal is:
Clean, secure, understandable, production-ready code.

```
