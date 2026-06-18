# Split index.html into frontend/, move server into backend/

**Date:** 2026-06-18
**Status:** approved

## Goal

Decompose the single self-contained `index.html` into a `frontend/` folder
(separate CSS, JS, and per-language files) and move the Express server from
`server/` into a `backend/` folder. No build step; no runtime behavior change.

## Target structure

```
frontend/
  index.html        thin shell: <head> (favicon + stylesheet link), body markup, <script> tags
  css/styles.css    the former inline <style> contents
  js/app.js         the former inline <script> contents, minus the language dicts
  lang/en.js        window.LANG_EN = { ... }
  lang/ar.js        window.LANG_AR = { ... }
backend/
  app.js auth.js data.js db.js index.js seed.js validate.js   (moved verbatim from server/)
package.json  package-lock.json  .env  test/  README.md  "Start Budget.bat"
```

## How the pieces connect (classic scripts, no build)

- `index.html` head keeps the base64 favicon links; adds
  `<link rel="stylesheet" href="css/styles.css">`.
- Before `</body>`, in order: `lang/en.js`, `lang/ar.js`, then `js/app.js`.
- `en.js`/`ar.js` assign globals `window.LANG_EN` / `window.LANG_AR`.
- In `app.js` the former `const STR = { en:{...}, ar:{...} }` becomes
  `const STR = { en: window.LANG_EN, ar: window.LANG_AR };`. Everything else in
  `app.js` stays top-level/global, so behavior is identical.
- The two inline `<img class="brand-logo" src="data:image/png;base64…">` and the
  favicon data URIs remain in `index.html`.

## Backend

- Internal `./` requires are unaffected by the folder move.
- Update cross-references only:
  - `package.json`: `main`, `start`, `dev` → `backend/index.js`
  - `test/api.test.js`: `../server/db`, `../server/app` → `../backend/...`
  - `Start Budget.bat`: `node backend/index.js`
  - `README.md`: structure notes

## Server serves the frontend folder

`backend/app.js` currently serves only `index.html`. Replace with
`express.static(path.join(__dirname, "..", "frontend"))`. Because `backend/`,
`.env`, and `test/` live outside `frontend/`, they remain unserved — a cleaner
privacy boundary than the current single-file hack.

## Deploy + verify

- Archive bundles `frontend/ + backend/ + package.json + package-lock.json + .env`
  as a zip with files at the root (the proven Hostinger method).
- Risk: Hostinger must re-detect the entry as `backend/index.js`; verify via
  deploy logs and the live site.
- Pre-deploy checks: `npm test`; run the server locally and confirm the page
  loads (CSS, JS, both languages switch, favicon/logo).

## Out of scope

- No framework, bundler, or TypeScript.
- No change to API routes, DB schema, or auth.
