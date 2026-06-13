# Simpler Expense Entry & Clearer Overview — Design

**Date:** 2026-06-13
**Scope:** Frontend only (`index.html` + EN/AR translation keys). No backend, data-model, auth, or API changes.

## Goal

Make two things easier for the user:

1. **Adding an expense** — fewer steps than today's "button → 5-field modal."
2. **Seeing the whole picture** — a dashboard that answers "am I on track and where am I overspending?" at a glance.

## Background (current behavior)

- **Entry today:** an `Add Transaction` button opens `txModal()` — a modal with type toggle, amount, date, category dropdown, and optional note.
- **Dashboard today:** `viewDashboard()` renders income / expenses / budget-remaining cards for a selected month, plus upcoming bills, with count-up animations and a particle canvas.
- **Data model (unchanged):** `state = { settings: { theme, monthlyBudget, categoryBudgets }, categories[], transactions[], bills[], goals[] }`. Categories have `{ id, name, type, color }`. `categoryBudgets` maps `categoryId → amount` and is optional.

These existing functions and the data shape are reused as-is. The new UI is a faster front door to the same `addTransaction` logic and a restructured render of the same state.

## Part 1 — Faster expense entry

Two entry surfaces are **added alongside** the existing full modal. The modal is never removed — it remains the path for editing and for anything non-default (past date, note, income).

### Desktop — Quick-Add Bar

- A persistent single-row bar at the top of the **Dashboard** and **Transactions** views:
  `[ amount ] [ category chip ▾ ] [ Add ]`
- Defaults: type = **expense**, date = **today**.
- The category chip opens a small popover listing the user's **expense** categories (colored dots + names). Selecting one sets the chip.
- Commit via the **Add** button or the **Enter** key. On commit: append a transaction `{ id, type:"expense", amount, date: today, categoryId, note:"" }`, persist, re-render, and clear the amount field (category persists for fast repeat entry).
- A **"More…"** affordance opens the existing `txModal()` pre-filled with the bar's current amount/category, for setting date, note, or switching to income.
- Validation mirrors the modal: amount must be a positive number; otherwise the bar shows an inline hint and does not commit.

### Mobile — Tap-a-Category Grid

- On narrow viewports (reuse the existing responsive breakpoint already in the CSS), the bar collapses to a single full-width **"+ Add expense"** button.
- Tapping it opens a full-width grid of **expense** category tiles (color background, icon/emoji or colored dot, name).
- Tapping a tile reveals an amount field / number entry (slides up). Confirm commits the same transaction shape as above (date = today).
- An **edit / more** link opens the full `txModal()` pre-filled, for date/note/income.

Both surfaces share one internal helper that builds and saves the transaction, so behavior stays identical to the modal path.

## Part 2 — Dashboard "whole view"

`viewDashboard()` is restructured top-to-bottom into two stacked zones. The month selector stays at the top and drives both zones (unchanged behavior).

### Zone 1 — Budget Snapshot (hero)

- A large **"Left to spend this month"** value = `monthlyBudget − monthExpense(month)`. Green when ≥ 0, red when negative. Existing income/expense count-up figures remain as a compact strip near it.
- A **per-category progress list**, showing **only categories that have a budget set** in `categoryBudgets`:
  - Each row: `colored dot · name · $spent / $budget` + a progress bar.
  - `spent` = sum of this month's expense transactions in that category. `budget` = `categoryBudgets[categoryId]`.
  - Bar fill = `min(spent/budget, 1)`; bar turns red when `spent > budget`.
  - Rows sorted by **% of budget used, descending** (closest-to-over first).
- **Empty state** (no entries in `categoryBudgets`): instead of a blank panel, show a card — *"Set budgets to track your spending"* — with a button that opens the budget editor (the existing budget view / category-budget inputs). This guarantees a new user always has a clear next step rather than an empty hero.

### Zone 2 — Cashflow & What's Next (below)

- **Money in vs out** for the month: `In <income> · Out <expense> · = <net>` (net green/red).
- **Upcoming bills** — reuse `upcomingBills()`; overdue rendered red, due-soon highlighted (matches existing `billStatus()` states).
- **Goal progress** — each goal as a slim progress bar = `saved / target`, with the percentage.

## Internationalization

Every new user-facing string gets an EN and AR translation key in the existing translation tables (mirroring current `nav_*` / field-label pattern). RTL layout for AR must be respected for the bar, grid, and progress rows.

## What is explicitly NOT changing

- Data model and persisted JSON shape (categories, transactions, bills, goals, settings, `categoryBudgets`).
- Backend, `/api/*` routes, auth, sessions, DB schema.
- Theming (dark/light) and the existing dashboard count-up / particle effects.

## Testing / verification

- Entry: add an expense via the Quick-Add Bar (desktop width) and via the Tap Grid (mobile width); confirm the transaction appears in Transactions and the dashboard totals update, identical to a modal-added one.
- Snapshot: with no `categoryBudgets`, the empty-state CTA shows; after setting one budget, that category's bar appears, turns red when spend exceeds budget, and sorts correctly.
- Cashflow: in/out/net match the month; upcoming bills and goal bars render with correct states.
- i18n: switch to AR — all new strings translate and lay out RTL.
- Regression: the existing full modal still opens and saves; theme toggle and month selector still work.

## Open follow-ups (out of scope for this spec)

- Smart text-input entry (parse "4.50 coffee") — deferred.
- Analytics dashboard (category donut + multi-month trend) — deferred; could become a third zone or a separate view later.
