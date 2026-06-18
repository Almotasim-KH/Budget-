# Sidebar: "Reset this month" button + "Contact me" line

**Date:** 2026-06-18
**Status:** approved & implemented

## Goal

Add two items to the bottom of the sidebar (`.sidebar-foot`, the right-side nav
in Arabic/RTL):
1. A **Reset this month** button that wipes the current calendar month's entered data.
2. A **Contact me** line linking to the owner's email.

## Reset button

- Placement: first child of `.sidebar-foot`, styled `btn btn-sm btn-danger`.
  Desktop sidebar only (the foot is hidden on mobile, which uses the tab nav).
- Target month: always the **current calendar month** (`monthKey(todayISO())`).
- On click → native `confirm()` (same pattern as existing delete actions) with a
  localized month name, then for that month:
  - `state.transactions` — drop where `monthKey(date)` matches
  - each `goal.contributions` — drop where `monthKey(date)` matches (goals kept)
  - each `bill.history` — drop where `monthKey(paidOn)` matches
  - Recurring due dates and `paid` flags are left as-is (records only).
- `commit()` (save + render) then a success toast.
- Budgets, categories, and the bills/goals themselves are untouched.

## Contact line

- `<a class="app-credit sidebar-contact" href="mailto:asomy1630@gmail.com">`
  showing "Contact me: asomy1630@gmail.com", placed above the © credit.
- "Contact me:" label is localized (`contact_me`); email is literal/lowercase.

## Code touch points

- `frontend/index.html` — button + contact link in `.sidebar-foot`.
- `frontend/js/app.js` — `resetCurrentMonth()`, `reset-month` dispatcher case,
  label updates in `applyStaticLang()`.
- `frontend/css/styles.css` — `.sidebar-contact` link styling (`.btn-danger`
  already existed).
- `frontend/lang/en.js` & `ar.js` — keys: `reset_month`, `contact_me`,
  `c_reset_month` (`{month}`), `t_month_reset` (`{month}`).

## Out of scope

- No mobile entry point for reset (sidebar-only, per request).
- No month picker (always current month).
