# Guest Mode + Signup Nudge — Design

**Date:** 2026-06-17
**Status:** Approved (pending spec review)

## Background

The user asked to "apply JWT" so visitors can log in and save their info.
Investigation showed the app **already has complete authentication**: cookie
sessions (`express-session` + MySQL store), bcrypt-hashed passwords, and
per-user budget storage in MySQL (`server/auth.js`, `server/app.js`,
`server/data.js`). Login, signup, logout, "remember me" (30-day cookie), and
per-user save/load all already work.

The real requirement is different from JWT and does not need it:

> A visitor should be able to use the website immediately without logging in.
> Their data lives only in the browser and disappears on refresh/close. A popup
> on entry invites them to create an account if they want to save. Saving
> requires an account.

**Decision: JWT is dropped from scope.** The existing session auth is kept
unchanged. This is purely a frontend behavior change to add a **guest mode** and
a **signup nudge**.

## Goals

1. Visitors land directly in a usable app (no login wall).
2. Guest data is in-memory only — it disappears on refresh/close.
3. A dismissible popup on entry invites guests to create an account to save.
4. Creating an account **carries the guest's in-progress data into the new account**.
5. Logging into an existing account loads that account's saved data (never
   clobbered by guest data).

## Non-Goals

- JWT / token-based auth.
- Any backend/API change. `server/` is untouched.
- Persisting guest data to `localStorage` (explicitly not wanted — data must
  disappear on refresh).

## Architecture

All changes are in `index.html`. No server changes.

### Guest state model

- `currentUser === ""` already means "not logged in". This is the **guest**
  flag. No new global is required.
- A guest's `state` is `defaultData()` held in memory only.

### Boot flow (replaces current `init()` behavior)

Current behavior: `GET /api/auth/me` → if ok, `enterApp()`; else `showAuth()`
(a hard full-screen login wall).

New behavior:

```
init():
  GET /api/auth/me
    ok           -> enterApp(username)        // unchanged: load saved data, render
    401 / error  -> enterGuest()              // new
```

`enterGuest()`:
- `state = defaultData()`
- `currentUser = ""`
- `hideAuth()` (ensure the login overlay is not blocking)
- `applyStaticLang(); render();`
- Show the **signup nudge** popup (once per page load).

On a network error reaching `/api/auth/me`, still enter guest mode so the app is
usable offline-ish; the nudge/login simply won't succeed until the server is
reachable.

### Save behavior

`save()` gains an early guest check:

```
function save(){
  if(!currentUser) return;   // guest: in-memory only, nothing persisted
  _savePending = true;
  ...schedule flushSave...
}
```

Consequences:
- Guests never write to the server; their data is never persisted; refresh =
  fresh defaults. ✓
- The `beforeunload` flush only fires when `_savePending` is true, which can only
  happen for logged-in users, so no extra guard is needed there. (Belt-and-braces:
  it's gated by `_savePending` already.)

### Signup nudge popup

- A dismissible modal (reusing the app's existing modal styling/pattern).
- Copy (EN): "Want to save your budget? Create a free account so your data is
  here next time." (AR translation added to the existing i18n tables.)
- Buttons:
  - **Create account** → opens the auth overlay in **signup** mode
    (`setAuthMode("signup"); showAuth();`).
  - **Continue as guest** → closes the popup; user keeps using guest mode.
- Shown once per page load on guest entry (not on every render).

### Auth overlay becomes dismissible

The login/signup overlay is no longer a hard wall:
- Add a way to dismiss it back to guest mode (a close control / "Continue as
  guest" link inside the overlay).
- `showAuth()` is still used to open it; dismissing calls `hideAuth()` and leaves
  the user in guest mode.

### Topbar / sidebar account UI

- Topbar button (`#logout-btn`, currently always "Log out"):
  - Guest → label "Sign in", action opens the auth overlay.
  - Logged in → label "Log out", action = existing `logout()`.
  - Implemented by branching on `currentUser` when rendering the button label/action.
- Sidebar `#who`: show "Guest" when `currentUser === ""`, else "Signed in as
  <username>" (existing behavior).

### Carry-over on account creation

The guest's in-progress in-memory `state` should become the new account's data.

Approach (frontend-only, uses existing endpoints):
- In `submitAuth()`, after a successful **signup** response:
  - Set `currentUser = data.username`, `hideAuth()`.
  - `PUT /api/data` with the **current guest `state`** (the in-memory data),
    instead of fetching server defaults. This overwrites the freshly-seeded
    default budget the signup created with the guest's actual data.
  - Then `render()`.
- After a successful **login** response (existing account):
  - Use the existing `enterApp(username)` path, which does `GET /api/data` and
    loads the account's **saved** data. Guest data is discarded — the real
    account data wins. This avoids clobbering existing data.

Note on the server's fresh-seed guard (`server/data.js` `looksLikeFreshSeed`):
the carried-over guest data is only PUT when the guest actually has data; if a
guest with *no* data signs up, the PUT would look like fresh defaults and the
guard simply keeps the seeded defaults — harmless and correct. No server change
needed.

## Error Handling

- `/api/auth/me` unreachable → enter guest mode (app still usable).
- Carry-over `PUT /api/data` after signup fails (network) → existing
  `_savePending` retry logic already handles re-saving on the next edit; we set
  `currentUser` first so saves are enabled. Worst case the new account briefly
  holds default data until the next successful save.
- Login/signup validation errors → existing `authError()` display, unchanged.

## Testing

- Backend: existing `test/api.test.js` must still pass (no server changes).
- Manual / behavioral checks:
  1. Load site logged-out → app is usable immediately, nudge popup appears.
  2. As guest, add a transaction → it shows; refresh → data is gone (in-memory only).
  3. Guest dismisses nudge → can keep using the app; "Sign in" button visible.
  4. Guest enters data, clicks Create account, signs up → lands in account with
     the guest data present; refresh → data persists (saved server-side).
  5. Guest enters data, logs into an existing account with saved data → sees the
     account's saved data (guest data discarded, existing data intact).
  6. Logged-in user → "Log out" works and returns to a guest session.

## Files Touched

- `index.html` — boot flow, `save()` guard, nudge popup + markup/i18n,
  dismissible auth overlay, topbar button branching, carry-over in `submitAuth()`.
- `server/` — **no changes.**
