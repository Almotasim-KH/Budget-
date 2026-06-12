# Budget — Finance Command Center

A personal finance web app with **self-signup login** and **per-user storage in
PostgreSQL**. Each user logs in with a username + password and sees only their
own transactions, budgets, bills, and goals.

## Stack

- **Frontend:** single `index.html` (vanilla JS, no build step)
- **Backend:** Node.js + Express
- **Auth:** bcrypt-hashed passwords, server-side sessions (stored in Postgres)
- **Database:** PostgreSQL `Budgets` — tables `users`, `budgets` (JSONB per
  user), `session`

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create your config from the template and fill in your values:
   ```
   copy .env.example .env
   ```
   Edit `.env` and set `DATABASE_URL` (your Postgres password) and a
   `SESSION_SECRET`. The `Budgets` database must already exist.

## Run

```
npm start
```

Then open **http://localhost:3000**, click *Create an account*, and sign up.
Your data is saved to PostgreSQL automatically as you use the app. Tables are
created on first start.

## Test

End-to-end API tests (needs a running PostgreSQL with `.env` configured):

```
npm test
```

Covers signup, login, save/reload, **user data isolation**, and the auth
failure cases (401 unauthenticated, 409 duplicate username, weak password).

## Project layout

```
index.html          the app (login overlay + finance UI)
server/
  index.js          startup: init schema, listen
  app.js            Express app factory (routes, sessions, static)
  db.js             pg pool + table bootstrap
  auth.js           signup / login / logout / me
  data.js           GET/PUT the logged-in user's data
  validate.js       username/password rules
  seed.js           default data for new users
test/api.test.js    end-to-end tests
.env                secrets (gitignored) — never commit this
```

## Notes

- `.env` is gitignored; your password is never committed.
- For production hosting, set `NODE_ENV=production` (enables secure cookies —
  serve over HTTPS) and use a strong `SESSION_SECRET`.
- Export/Import JSON (in the app's Data menu) still works as a manual backup.
