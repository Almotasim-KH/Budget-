# Simpler Expense Entry & Clearer Overview — Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fast expense-entry surface (Quick-Add Bar on desktop, Tap-a-Category Grid on mobile) and a Budget Snapshot zone on the dashboard, all inside `index.html`.

**Architecture:** Pure additions to the existing vanilla-JS monolith. New render functions return HTML strings; new `data-action` handlers hook into the existing delegated click/submit/change dispatchers; reuse existing helpers (`catSpend`, `monthExpense`, `ratioClass`, `commit`, `.bar/.fill-*`). No backend, data-model, or build changes.

**Tech stack:** Single-file HTML + inline CSS/JS. No test harness exists for the frontend, so verification is by **running the live app** (already running at http://localhost:3000 against the local MySQL container) and exercising each feature in the browser. Backend `node --test` suite must still pass untouched.

---

### Task 1: UI state + shared entry helper

**Files:** Modify `index.html` (state init near line 618; util section near line 666).

- [ ] Add `qaCat:null` to the `ui` object so the Quick-Add Bar remembers its selected category across re-renders.
- [ ] Add a shared helper used by both desktop and mobile entry:

```js
// Append a same-day expense from the quick-entry surfaces. Returns true on success.
function quickAddTx(amount, categoryId){
  if(isNaN(amount)||amount<=0){ toast(t("t_enter_amount")); return false; }
  if(!categoryId){ toast(t("t_pick_category")); return false; }
  state.transactions.push({ id:uid("t"), type:"expense", amount, categoryId, date:todayISO(), note:"" });
  toast(t("t_tx_added")); commit(); return true;
}
// First expense category id, used as the bar's default selection.
function firstExpenseCat(){ const c=state.categories.find(x=>x.type==="expense"); return c?c.id:null; }
```

- [ ] Verify backend tests still pass: `npm test` → all pass.

---

### Task 2: CSS for the entry surfaces and snapshot

**Files:** Modify `index.html` CSS (before the `@media(max-width:760px)` block near line 243).

- [ ] Add styles. Desktop bar visible by default; mobile button hidden until ≤760px:

```css
.qadd{display:flex;gap:8px;align-items:center;background:var(--surface);border:1px solid var(--border);
  border-radius:14px;padding:8px 10px;margin-bottom:16px}
.qadd-cur{color:var(--text-faint);font-weight:700;padding-left:4px}
.qadd-amt{flex:1;min-width:80px}
.qadd-cat{width:auto;max-width:200px}
.qadd-mobile{display:none;width:100%;justify-content:center}
.qgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.qtile{border:none;border-radius:12px;padding:16px 6px;color:#fff;font-weight:600;font-size:13px;
  display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer}
.qtile .qtile-dot{width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,.85)}
.snap-big{font-size:30px;font-weight:800;line-height:1.1}
.snap-row{margin-bottom:12px}
.snap-empty{text-align:center;padding:8px 0}
@media(max-width:760px){
  .qadd-desktop{display:none}
  .qadd-mobile{display:flex}
  .qadd{background:none;border:none;padding:0}
}
```

- [ ] Verify: reload app; no visual regressions (snapshot/bar not added yet, so page looks unchanged).

---

### Task 3: Quick-Add Bar markup (desktop) + mobile trigger

**Files:** Modify `index.html` (add `quickAddBar()` near the dashboard render functions; inject into `viewDashboard()` and `viewTransactions()`).

- [ ] Add render function:

```js
function quickAddBar(){
  const cats=state.categories.filter(c=>c.type==="expense");
  if(!ui.qaCat||!cats.some(c=>c.id===ui.qaCat)) ui.qaCat=firstExpenseCat();
  const opts=cats.map(c=>`<option value="${c.id}"${c.id===ui.qaCat?" selected":""}>${esc(c.name)}</option>`).join("");
  return `<div class="qadd qadd-desktop">
      <span class="qadd-cur">${CONFIG.currency}</span>
      <input id="qa-amount" class="input qadd-amt" type="number" min="0" step="0.01" inputmode="decimal"
        placeholder="0.00" data-action="qa-key" autocomplete="off">
      <select id="qa-cat" class="input qadd-cat" data-action="qa-cat">${opts}</select>
      <button class="btn btn-primary" data-action="qadd">${I.plus} ${t('add')}</button>
    </div>
    <button class="btn btn-primary qadd-mobile" data-action="qadd-mobile">${I.plus} ${t('add_expense')}</button>`;
}
```

- [ ] In `viewTransactions()`, inject `${quickAddBar()}` at the very top of the returned template (before the filter row).
- [ ] In `viewDashboard()`, change the final return to place the bar after the hero:
  `return `${hero}${quickAddBar()}${cards}...`;` (snapshot inserted in Task 5).
- [ ] Verify: on desktop width the bar shows on Dashboard and Transactions; below 760px it collapses to "+ Add expense".

---

### Task 4: Wire entry actions (desktop add, Enter key, category memory, mobile grid)

**Files:** Modify `index.html` click dispatcher (~line 1465), change dispatcher (~line 1592), keydown listener (~line 1673); add two small modal builders.

- [ ] In the **click** dispatcher add:

```js
if(a==="qadd"){
  const amt=getNum("qa-amount");
  if(quickAddTx(amt, val("qa-cat"))){ const i=document.getElementById("qa-amount"); if(i) i.focus(); }
  return;
}
if(a==="qadd-mobile"){ quickGridModal(); return; }
if(a==="qgrid-pick"){ quickAmountModal(id); return; }
```

- [ ] In the **change** dispatcher add (so the bar remembers the category across re-render):

```js
else if(a==="qa-cat"){ ui.qaCat=el.value; }
```

- [ ] In the **keydown** listener, add Enter-to-add for the amount field:

```js
document.addEventListener("keydown",e=>{
  if(e.key==="Escape") closeModal();
  if(e.key==="Enter" && e.target && e.target.id==="qa-amount"){
    e.preventDefault();
    const amt=getNum("qa-amount");
    if(quickAddTx(amt, val("qa-cat"))){ const i=document.getElementById("qa-amount"); if(i) i.focus(); }
  }
});
```
(Replace the existing single-line keydown listener at ~1673 with this expanded version.)

- [ ] Add the two mobile modals near `txModal()`:

```js
function quickGridModal(){
  const tiles=state.categories.filter(c=>c.type==="expense").map(c=>
    `<button type="button" class="qtile" style="background:${c.color}" data-action="qgrid-pick" data-id="${c.id}">
       <span class="qtile-dot"></span>${esc(c.name)}</button>`).join("");
  showModal(`<div class="modal">
    <div class="modal-head"><h2>${t('add_expense')}</h2><button class="icon-btn" data-action="close">${I.x}</button></div>
    <div class="modal-body"><div class="qgrid">${tiles}</div></div></div>`);
}
function quickAmountModal(catId){
  const c=catById(catId)||{name:t('uncategorized'),color:"#637385"};
  showModal(`<form class="modal" data-action="save-qadd" data-id="${catId}">
    <div class="modal-head"><h2><span class="dot" style="background:${c.color}"></span> ${esc(c.name)}</h2>
      <button type="button" class="icon-btn" data-action="close">${I.x}</button></div>
    <div class="modal-body">
      <div class="field"><label>${t('amount_cur',{c:CONFIG.currency})}</label>
        <input id="qa-m-amount" class="input" type="number" min="0" step="0.01" inputmode="decimal" required autofocus></div>
    </div>
    <div class="modal-foot">
      <button type="button" class="btn" data-action="qadd-mobile">${t('back')}</button>
      <button type="submit" class="btn btn-primary">${I.plus} ${t('add')}</button>
    </div></form>`);
}
```

- [ ] In the **submit** dispatcher (~line 1531) add:

```js
if(a==="save-qadd"){
  const amount=getNum("qa-m-amount");
  if(isNaN(amount)||amount<=0){ toast(t("t_enter_amount")); return; }
  state.transactions.push({ id:uid("t"), type:"expense", amount, categoryId:id, date:todayISO(), note:"" });
  closeModal(); commit(); toast(t("t_tx_added")); return;
}
```

- [ ] Verify (desktop): type amount, press Enter and click Add → transaction appears in Transactions; category selection sticks. Verify (≤760px): "+ Add expense" → tile grid → tile → amount → Add creates the expense; "Back" returns to the grid.

---

### Task 5: Budget Snapshot card

**Files:** Modify `index.html` (add `budgetSnapshot(mk)`; inject into `viewDashboard()`).

- [ ] Add render function:

```js
function budgetSnapshot(mk){
  const budget=state.settings.monthlyBudget||0;
  const cb=state.settings.categoryBudgets||{};
  const rows=state.categories.filter(c=>c.type==="expense"&&cb[c.id]>0).map(c=>{
    const spent=catSpend(c.id,mk), b=cb[c.id], r=b>0?spent/b:0, cls=ratioClass(r);
    return {c,spent,b,r,cls};
  }).sort((a,b)=>b.r-a.r);

  if(!budget && rows.length===0){
    return `<div class="card mt16"><div class="card-title">${t('budget_snapshot')}</div>
      <div class="snap-empty"><p class="muted">${t('snap_empty')}</p>
      <button class="btn btn-primary mt8" data-action="edit-budgets">${t('set_budgets')}</button></div></div>`;
  }
  const spentTotal=monthExpense(mk), left=budget-spentTotal;
  const big = budget
    ? `<div class="snap-big ${left<0?'txt-r':'txt-g'}">${fmt(left)}</div>
       <div class="small faint">${t('left_to_spend',{x:fmt(budget)})}</div>`
    : `<div class="snap-big faint">${fmtShort(spentTotal)}</div><div class="small faint">${t('spent_this_month')}</div>`;
  const bars = rows.length ? rows.map(r=>`<div class="snap-row">
      <div class="between small"><span class="fw7"><span class="dot" style="background:${r.c.color}"></span> ${esc(r.c.name)}</span>
        <span class="tnum muted">${fmt(r.spent)} / ${fmt(r.b)}</span></div>
      <div class="bar mt8"><div class="bar-fill fill-${r.cls}" style="width:${(Math.min(r.r,1)*100).toFixed(1)}%"></div></div>
    </div>`).join("")
    : `<div class="snap-empty"><p class="muted">${t('snap_no_cats')}</p>
       <button class="btn btn-sm btn-primary mt8" data-action="edit-budgets">${t('set_budgets')}</button></div>`;
  return `<div class="card mt16"><div class="card-title">${t('budget_snapshot')}
      <span class="faint" style="text-transform:none;font-weight:600">${monthLabel(mk)}</span></div>
      <div class="mb16">${big}</div>${bars}</div>`;
}
```

- [ ] Inject into `viewDashboard()` return: `return `${hero}${quickAddBar()}${cards}${budgetSnapshot(mk)}${alerts}${dash}${savings}`;`
- [ ] Verify: with no category budgets, the empty-state card + "Set budgets" button shows and opens the budget editor. After setting a category budget, that category's bar appears, colors green→yellow→red as spend approaches/exceeds it, sorted most-used first; the big number reflects monthlyBudget − month expenses.

---

### Task 6: i18n keys (EN + AR)

**Files:** Modify `index.html` `STR.en` and `STR.ar` tables (~lines 400–490).

- [ ] Add to **both** `en` and `ar` (Arabic translations in parentheses):
  - `add_expense` — "Add expense" / "إضافة مصروف"
  - `back` — "Back" / "رجوع"
  - `t_pick_category` — "Pick a category." / "اختر فئة."
  - `budget_snapshot` — "Budget Snapshot" / "نظرة على الميزانية"
  - `left_to_spend` — "left of {x}" / "متبقٍ من {x}"
  - `spent_this_month` — "spent this month" / "أُنفق هذا الشهر"
  - `set_budgets` — "Set budgets" / "تحديد الميزانيات"
  - `snap_empty` — "Set budgets to see your spending at a glance." / "حدّد الميزانيات لرؤية إنفاقك بلمحة."
  - `snap_no_cats` — "No category budgets set yet." / "لم يتم تحديد ميزانيات للفئات بعد."
- [ ] Verify: switch language to AR — all new strings translate and lay out RTL; no `[key]` fallbacks appear.

---

### Task 7: Full verification + commit

- [ ] Backend tests: `npm test` → pass.
- [ ] Desktop manual pass: Quick-Add Bar (Enter + click), category memory, Budget Snapshot states, existing modal/charts/theme/month-picker all still work.
- [ ] Mobile manual pass (≤760px): tile grid entry flow.
- [ ] AR pass: translations + RTL.
- [ ] Commit:

```bash
git add index.html docs/superpowers/plans/2026-06-13-simpler-entry-and-overview.md
git commit -m "feat: quick-add expense bar/grid + budget snapshot dashboard"
```

---

## Self-review

- **Spec coverage:** Quick-Add Bar (T3/T4) ✓, Tap-a-Category Grid mobile (T2/T4) ✓, modal-augment-not-replace ✓ (existing `txModal` untouched, "More/Back" paths), Budget Snapshot budgeted-only + empty-state CTA (T5) ✓, Cashflow/bills/goals (already exist; unchanged) ✓, i18n EN/AR (T6) ✓, no backend/data-model change ✓.
- **Placeholders:** none — all code is concrete.
- **Type consistency:** `quickAddTx(amount, categoryId)`, `ui.qaCat`, `data-action` names (`qadd`, `qadd-mobile`, `qa-cat`, `qa-key`/Enter, `qgrid-pick`, `save-qadd`), and `firstExpenseCat()` are used consistently across tasks. Transaction shape matches the existing `save-tx` shape (`{id,type,amount,categoryId,date,note}`).
