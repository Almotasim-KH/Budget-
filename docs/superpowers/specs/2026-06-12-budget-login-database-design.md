# Budget App — Login + PostgreSQL Storage

**Date:** 2026-06-12
**Status:** Approved for implementation planning

## Summary

The project currently is a single `index.html` — a complete, working personal
finance app ("Finance Command Center") that stores all data in the browser's
`localStorage` (key `pfcc_v1`). This work adds a backend that provides:

- **Self-signup login** (username + password) for multiple users.
- **Per-user persistence in PostgreSQL** (database `Budgets`), so each user logs
  in and sees only their own finance data.

The polished frontend stays almost entirely intact. The only frontend changes
are: a login/signup overlay, swapping the two `localStorage` functions for
server calls, and a logout button.

## Goals

- Multiple users can register their own account (self-signup).
- A user logs in with username + password and immediately sees their own data.
- All finance data (`settings`, `categories`, `transactions`, `bills`, `goals`)
  is stored server-side in PostgreSQL, scoped per user.
- Built hosting-ready: passwords hashed, sessions secure, basic abuse protection.

## Non-Goals (YAGNI)

- No admin panel, password reset, or email verification (can come later).
- No cross-user reporting / analytics (the reason a normalized schema is
  deferred).
- No multi-currency or any new finance features — storage + auth only.

## Architecture

```
Browser (index.html)
   │  fetch() with httpOnly session cookie
   ▼
Node.js + Express server  ──►  PostgreSQL "Budgets"
   • serves index.html              • users    table
   • /api/auth/*                     • budgets  table (JSONB per user)
   • /api/data                       • session  table (connect-pg-simple)
```

### Storage approach (decided: Approach A — JSONB blob per user)

Each user has one `budgets` row holding their entire app state as a single
JSONB column. This keeps the working frontend almost unchanged and still gives a
real, queryable Postgres database. Normalizing into per-entity tables is
explicitly deferred until cross-user reporting is needed.

## Database Schema (database `Budgets`)

```sql
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,            -- bcrypt, cost 12
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state      JSONB NOT NULL,              -- the whole pfcc_v1 state object
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- session table is created/managed by connect-pg-simple (sid, sess, expire)
```

On signup, the new user's `budgets.state` is seeded with the frontend's existing
`defaultData()` value (default categories, empty transactions/bills/goals,
default settings).

## Auth & Security

- **Password hashing:** bcrypt, cost factor 12. Plaintext never stored or logged.
- **Sessions:** `express-session` + `connect-pg-simple`, stored in the `Budgets`
  DB so they survive server restarts. Cookie is `httpOnly`, `sameSite=lax`, and
  `secure` when `NODE_ENV=production` (HTTPS-ready).
- **Validation (server-side):** username 3–32 chars `[a-zA-Z0-9_]`; password
  minimum 8 chars. Enforced on the server, not just the browser.
- **Rate limiting:** `express-rate-limit` on `/api/auth/login` and
  `/api/auth/signup` to slow brute-force.
- **Secrets:** `DATABASE_URL` and `SESSION_SECRET` come from `.env` (gitignored).
  Never hardcoded. `.env.example` documents the shape.
- **Isolation:** every `/api/data` handler operates only on
  `req.session.userId`'s own row; a user can never read or write another's data.

## API Endpoints

| Method | Route               | Auth | Purpose                                            |
|--------|---------------------|------|----------------------------------------------------|
| POST   | `/api/auth/signup`  | no   | create user, seed default budget, start session    |
| POST   | `/api/auth/login`   | no   | verify password, start session                     |
| POST   | `/api/auth/logout`  | yes  | destroy session                                    |
| GET    | `/api/auth/me`      | no   | returns `{username}` if logged in, else 401        |
| GET    | `/api/data`         | yes  | return the logged-in user's `state` JSONB          |
| PUT    | `/api/data`         | yes  | overwrite the logged-in user's `state`             |

Error responses are JSON `{ error: "message" }` with appropriate status codes
(400 validation, 401 unauthenticated, 409 username taken, 429 rate-limited).

## Frontend Changes (kept minimal)

- **Login/signup overlay:** shown on load until `GET /api/auth/me` confirms a
  session. Toggles between "Log in" and "Sign up" forms; shows server errors.
- **`load()`** → `GET /api/data` (async; app boots after data arrives).
- **`save()`** → debounced `PUT /api/data` (debounce ~600ms so rapid edits don't
  spam the server). On 401, the overlay reappears.
- **Logout button** in the sidebar footer → `POST /api/auth/logout`, then show
  the overlay.
- Export/Import JSON stays as-is (useful manual backup).

## Project Structure

```
Budget/
  index.html          ← app (lightly modified: overlay, async load/save, logout)
  server/
    index.js          ← Express app, session setup, static serving, route mounts
    db.js             ← pg Pool + schema bootstrap on startup
    auth.js           ← signup / login / logout / me routes
    data.js           ← GET/PUT /api/data routes
    validate.js       ← username/password validation helpers
  test/
    api.test.js       ← end-to-end API check (see Testing)
  .env                ← DATABASE_URL, SESSION_SECRET   (gitignored)
  .env.example
  .gitignore
  package.json
```

## Configuration

`.env` (filled in by the user; password never enters chat):

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/Budgets
SESSION_SECRET=<long-random-string>
NODE_ENV=development
PORT=3000
```

`.env.example` ships with placeholder values.

## Testing

**Automated** (`test/api.test.js`, run with `node --test` against a running
server or a throwaway connection):

1. Sign up user A → 200, session cookie set.
2. `GET /api/data` as A → returns seeded default state.
3. `PUT /api/data` as A with a sample transaction → 200; reload returns it.
4. Sign up user B, `GET /api/data` → returns B's *default* state, **not** A's
   data (isolation check).
5. `GET /api/data` with no session → 401.
6. Duplicate signup of username A → 409.
7. Wrong password on login → 401.

**Manual:** open in browser → sign up → add a transaction → refresh (persists) →
log out → log back in (data still there) → confirm a second account sees a clean
slate.

## Rollout / Migration

- Existing browser `localStorage` data is personal and local; no migration is
  built. (Optional future nicety: a one-time "import my old browser data" button
  that PUTs the `pfcc_v1` blob after first login. Out of scope for now.)