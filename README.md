# Budget — Finance Command Center

A personal finance web app you can use right away as a **guest**, with optional
**self-signup login** and **per-user storage in MySQL**. Guests use the full app
with no account; their data lives only in the browser. Creating an account saves
that data and keeps it across visits — each logged-in user sees only their own
transactions, budgets, bills, and goals.

**Live:** https://budgettr.com (deployed on Hostinger).

## Stack

- **Frontend:** static files in `frontend/` (vanilla JS, no build step) —
  `index.html` shell, `css/styles.css`, `js/app.js`, and per-language
  dictionaries in `lang/`
- **Backend:** Node.js + Express
- **Auth:** bcrypt-hashed passwords, server-side sessions (stored in MySQL via
  `express-mysql-session`)
- **Database:** MySQL/MariaDB — tables `users`, `budgets` (JSON state per
  user), `sessions`

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create your config from the template and fill in your values:
   ```
   copy .env.example .env
   ```
   Edit `.env` and set `DATABASE_URL` (a `mysql://` URI) and a
   `SESSION_SECRET`. The MySQL database must already exist.

## Run

```
npm start
```

Then open **http://localhost:3000**. The app opens straight into a usable
**guest** session — no login required. A popup invites you to create an account
if you want to keep your data. Once you sign up or log in, your data is saved to
MySQL automatically as you use the app. Tables are created on first start.

## Guest mode

Visitors can use the whole app without an account:

- The app loads directly into a guest session (no login wall).
- Guest data lives **in memory only** — nothing is sent to the server, so it
  disappears on refresh or close.
- A dismissible popup on entry offers to create an account to save the data.
- **Creating an account carries the guest's in-progress data into the new
  account.** Logging into an *existing* account loads that account's saved data
  (guest data is discarded — existing data is never overwritten).
- The top-bar button shows **Sign in** for guests and **Log out** when logged
  in; the sidebar shows "Guest" vs. the signed-in username.

## Test

End-to-end API tests (needs a running MySQL with `.env` configured):

```
npm test
```

Covers signup, login, save/reload, **user data isolation**, and the auth
failure cases (401 unauthenticated, 409 duplicate username, weak password).

## Project layout

```
frontend/
  index.html        the app shell (guest mode + login overlay + finance UI)
  css/styles.css    all styles
  js/app.js         all app logic
  lang/en.js        English strings (window.LANG_EN)
  lang/ar.js        Arabic strings (window.LANG_AR)
backend/
  index.js          startup: listen, then init schema
  app.js            Express app factory (routes, sessions, static)
  db.js             mysql2 pool + table bootstrap
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
