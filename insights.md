# Insights — Lambda Learning Log

A running log of concepts, patterns, and "why this matters" notes from working on Lambda. Updated whenever Claude explains something educational. Newest entries on top.

---

## 2026-05-12 — How big platforms gate elevated roles ("becoming a teacher")

**Context:** Lambda needs a way to grant teacher rights. Anyone signing up is a student by default; only an admin (you) can promote.

**The spectrum of approaches, from simplest to most sophisticated:**

| Approach | Who uses it | How |
|---|---|---|
| Manual admin approval | Early-stage startups | Request → admin reviews → admin promotes |
| Domain whitelist | Slack, Google Classroom | `@school.edu` auto-grants teacher |
| Invite-only / referral | Replit Teams, GitHub Classroom | Existing teachers invite colleagues |
| Document verification | Coursera, Udemy | Upload credentials; ops reviews |
| Self-attestation + monitoring | LinkedIn, Twitter Pro | User claims role; platform flags abuse |
| Third-party identity services | Banks, telehealth | Stripe Identity / Persona / Onfido scan ID |
| Paid tier | Khan Academy Districts, Canvas | Schools pay → accounts |

**Concept underneath:** every system balances **friction vs trust**. More friction = fewer fakes but fewer real users. Mature platforms layer many cheap signals (verified email + phone + behavior) rather than one expensive one.

**Roadmap for Lambda:**
1. Now: manual approval via admin panel (already built — admin can flip role).
2. Soon: domain whitelist for `.edu` emails.
3. Later: existing teachers invite colleagues (network effect — scales without you).
4. Much later: document verification, only if monetizing schools.

---

## 2026-05-12 — Security audit walkthrough

A plain-English breakdown of the open items in CLAUDE.md's audit. Concepts named so they generalize beyond Lambda.

### #12 — Privilege escalation via dev_login role parameter

- **What:** `POST /api/v1/auth/dev-login` takes `role` as a query parameter, so caller picks their own role.
- **Concept:** **Privilege escalation** — when a low-permission user finds a way to gain higher permissions. Universal rule: clients send *what they want to do*; servers decide *who they are and what they're allowed*.
- **Fix pattern:** never trust identity-shaping inputs from the client. Server hardcodes the role.

### #5 — JWT in localStorage + missing security headers

- **What:** Login token lives in browser `localStorage`. No CSP, X-Frame-Options, or Referrer-Policy headers set.
- **Concept:** **XSS (Cross-Site Scripting)** = attacker gets JS to run on your page. **localStorage is JS-readable**, so an XSS bug = stolen token = full account takeover.
- **Concept: defense in depth.** Assume one layer will fail; stack multiple.
- **Header glossary:**
  - **CSP (Content Security Policy)** — tells the browser *which sources of scripts/styles/etc are allowed*. The single best XSS defense.
  - **X-Frame-Options** — prevents your site being put in a hidden iframe by another site (defeats **clickjacking**: tricking users into clicking things they didn't mean to).
  - **Referrer-Policy** — controls what URL info leaks when users click external links.
  - **X-Content-Type-Options: nosniff** — stops browsers from guessing file types (a guess can turn a `.txt` upload into a `.js` execution).
- **Fix pattern:** move JWT to an `httpOnly` cookie (JS literally cannot read it), and add the headers above as **middleware** (code that runs on every response).

### #15 — No request body size limit

- **What:** A client can POST a 5GB body; the server tries to read it all.
- **Concept:** **Denial of Service (DoS)** through resource exhaustion. Doesn't require any vulnerability — just unbounded input.
- **Concept: validate at the boundary.** Reject bad input at the system edge before anything else looks at it.
- **Fix pattern:** ASGI middleware that reads `Content-Length` and bails early.

### #6 — Not checking `email_verified` from Google

- **What:** Google's userinfo response includes `email_verified: true|false`. Lambda doesn't check it.
- **Concept:** **Identity binding fallacy.** Just because Google said the email is "X" doesn't mean the user owns "X" — only `email_verified: true` does.
- **Real exploit:** create a Google account claiming `madiyar.zmm@gmail.com` (admin email) without owning it. Log into Lambda. Admin email mapping promotes you to teacher. Game over.
- **Fix pattern:** trust only the claims your IdP explicitly verified.

### #7 — Cross-provider account merge by email

- **What:** dev_login and Google login both look up by email and silently merge into one account.
- **Concept:** Identity provider linking should be **explicit, not implicit**. Big platforms (Google, Apple) make you confirm when linking a new login method to an existing account — never silent.
- **Real exploit:** chain with #6 — attacker creates dev account at admin email, later Google login merges and inherits admin row.
- **Fix pattern:** match by provider-specific id (`google_id`) only, not by email.

### #9 — Writing data on a GET endpoint

- **What:** `GET /me/stats` recalculates XP by scanning every submission, then writes the result to the user row. Every page refresh.
- **Concept: REST semantics.** `GET` is supposed to be **safe** (no state change) and **idempotent** (calling 100 times = same as calling once). Writing on GET breaks both.
- **Concept: race condition.** Two requests at the same time can read-modify-write and clobber each other. Last writer wins; earlier write is silently lost.
- **Concept: write-time vs read-time computation.** Compute expensive things when the underlying data *changes* (write path), cache the result, read it cheap. Sometimes called **CQRS-lite** (Command Query Responsibility Segregation) when you go bigger.
- **Fix pattern:** on submission grading, increment XP atomically (`UPDATE users SET xp = xp + X`). GET only reads.

---

## How this file gets updated

When Claude explains a concept, pattern, or "here's how big platforms do it" — append it here under a new dated heading. Keep entries:
- Concept-first (name the pattern: "this is called X")
- Architecture-vs-project-specific labeled
- Concrete: include a "what could actually go wrong" line
