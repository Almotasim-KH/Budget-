"use strict";
/* ============================================================
   Budgettr — Personal Finance, English/Arabic, no deps.
   Data lives in MySQL per logged-in user (via /api/data).
   ============================================================ */

const CONFIG = { currency: "SAR" };

/* ============================================================
   i18n — English / Arabic
   ============================================================ */
const STR = { en: window.LANG_EN, ar: window.LANG_AR };
let currentUser = "";
function curLang(){ return (state && state.settings && state.settings.lang) || "ar"; }
function isRTL(){ return curLang() === "ar"; }
function t(k, p){
  const L = curLang();
  let s = (STR[L] && STR[L][k] != null) ? STR[L][k] : (STR.en[k] != null ? STR.en[k] : k);
  if(p) for(const key in p) s = s.split("{"+key+"}").join(p[key]);
  return s;
}
function dateLocale(){ return isRTL() ? "ar-u-nu-latn" : "en-GB"; }
function applyLang(){
  const L = curLang();
  document.documentElement.lang = L;
  document.documentElement.dir = L === "ar" ? "rtl" : "ltr";
}
function langBtnLabel(){ return isRTL() ? "English" : "العربية"; }
function applyStaticLang(){
  applyLang();
  document.querySelectorAll(".brand-name").forEach(e=>e.textContent=t("brand_name"));
  document.querySelectorAll(".brand-sub").forEach(e=>e.textContent=t("brand_sub"));
  const lt=document.getElementById("lang-btn-top"); if(lt) lt.textContent=langBtnLabel();
  const lo=document.getElementById("logout-btn"); if(lo) lo.textContent = currentUser ? t("log_out") : t("sign_in");
  const gl=document.getElementById("auth-guest-link"); if(gl) gl.textContent=t("continue_guest");
  const rb=document.getElementById("reset-month-btn"); if(rb) rb.textContent=t("reset_month");
  const cm=document.getElementById("contact-label"); if(cm) cm.textContent=t("contact_me");
  renderThemeIcons();
  applyAuthLang();
}
function applyAuthLang(){
  const ul=document.getElementById("auth-username-label"); if(ul) ul.textContent=t("username");
  const pl=document.getElementById("auth-password-label"); if(pl) pl.textContent=t("password");
  const ui_=document.getElementById("auth-username"); if(ui_) ui_.placeholder=t("enter_username");
  const pi=document.getElementById("auth-password"); if(pi) pi.placeholder=t("enter_password");
  const tl=document.getElementById("tab-login"); if(tl) tl.textContent=t("login");
  const ts=document.getElementById("tab-signup"); if(ts) ts.textContent=t("tab_signup");
  if(typeof authMode!=="undefined" && document.getElementById("auth-title")) setAuthMode(authMode);
}
function setLang(l){
  state.settings.lang = l;
  applyStaticLang();
  const loggedIn = document.getElementById("auth-overlay").hasAttribute("hidden");
  if(loggedIn){ render(); save(); }
}

/* ---------- ICONS (inline SVG) ---------- */
const I = {
  dash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  tx:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h12"/></svg>',
  budget:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l3-3 3 2 4-5"/></svg>',
  bills:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  goals:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
  inbox:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/></svg>'
};

const PALETTE = ["#3b82f6","#ef4444","#22c55e","#f0b429","#a855f7","#06b6d4","#ec4899","#f97316","#14b8a6","#8b5cf6","#84cc16","#e11d48"];

/* ---------- DEFAULT DATA ---------- */
function defaultData(){
  return {
    version:1,
    settings:{ theme:"dark", lang:"ar", monthlyBudget:0, categoryBudgets:{} },
    categories:[
      {id:"c_salary",  name:"Salary",        type:"income",  color:"#22c55e"},
      {id:"c_free",    name:"Freelance",     type:"income",  color:"#14b8a6"},
      {id:"c_other_in",name:"Other Income",  type:"income",  color:"#84cc16"},
      {id:"c_rent",    name:"Rent",          type:"expense", color:"#ef4444"},
      {id:"c_groc",    name:"Groceries",     type:"expense", color:"#f97316"},
      {id:"c_trans",   name:"Transport",     type:"expense", color:"#3b82f6"},
      {id:"c_ent",     name:"Entertainment", type:"expense", color:"#a855f7"},
      {id:"c_util",    name:"Utilities",     type:"expense", color:"#06b6d4"},
      {id:"c_dine",    name:"Dining",        type:"expense", color:"#ec4899"},
      {id:"c_health",  name:"Health",        type:"expense", color:"#8b5cf6"},
      {id:"c_shop",    name:"Shopping",      type:"expense", color:"#f0b429"},
      {id:"c_bills",   name:"Bills",         type:"expense", color:"#e11d48"}
    ],
    transactions:[],
    bills:[],
    goals:[]
  };
}

/* ---------- STATE ---------- */
let state = defaultData();
let ui = {
  view:"dashboard",
  dashMonth: monthKey(todayISO()),
  budgetMonth: monthKey(todayISO()),
  txMonth:"all", txCat:"all", txType:"all",
  qaCat:null,
  calY: new Date().getFullYear(), calM: new Date().getMonth()
};

/* Normalize a state object loaded from the server (fill in any missing parts). */
function normalize(d){
  if(!d||!Array.isArray(d.categories)||!Array.isArray(d.transactions)) return defaultData();
  d.settings = Object.assign({theme:"dark",lang:"ar",monthlyBudget:0,categoryBudgets:{}}, d.settings||{});
  d.bills = d.bills||[]; d.goals = d.goals||[];
  return d;
}

/* Debounced save to the server. Rapid edits collapse into one PUT. */
let _saveTimer=null, _savePending=false;
function save(){
  if(!currentUser) return; // guest: data lives in memory only, never persisted
  _savePending=true;
  if(_saveTimer) clearTimeout(_saveTimer);
  _saveTimer=setTimeout(flushSave, 600);
}
async function flushSave(){
  _saveTimer=null;
  if(!_savePending) return;
  _savePending=false;
  try{
    const res=await fetch("/api/data",{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(state)
    });
    if(res.status===401){ showAuth(); }
  }catch(e){
    _savePending=true; // network hiccup — keep dirty, next edit retries
  }
}
// Best-effort flush of any pending save when leaving the page.
window.addEventListener("beforeunload",()=>{
  if(_savePending){
    fetch("/api/data",{method:"PUT",headers:{"Content-Type":"application/json"},
      body:JSON.stringify(state),keepalive:true});
  }
});
function commit(){ save(); render(); }

/* Wipe the current calendar month's entered data: transactions, goal
   contributions, and bill payment history dated in that month. Budgets,
   categories, and the bills/goals themselves are left untouched. */
function resetCurrentMonth(){
  const mk = monthKey(todayISO());
  if(!confirm(t("c_reset_month", {month: monthLabel(mk)}))) return;
  state.transactions = state.transactions.filter(x => monthKey(x.date) !== mk);
  state.goals.forEach(g => {
    if(Array.isArray(g.contributions))
      g.contributions = g.contributions.filter(c => monthKey(c.date) !== mk);
  });
  state.bills.forEach(b => {
    if(Array.isArray(b.history))
      b.history = b.history.filter(h => monthKey(h.paidOn) !== mk);
  });
  commit();
  toast(t("t_month_reset", {month: monthLabel(mk)}));
}

/* ---------- UTIL ---------- */
function uid(p){ return (p||"id")+"_"+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function fmt(n){
  const v = Number(n)||0;
  return CONFIG.currency+" "+v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
}
function fmtShort(n){
  const v=Math.abs(Number(n)||0);
  if(v>=1000000) return CONFIG.currency+" "+(v/1000000).toFixed(1)+"M";
  if(v>=10000) return CONFIG.currency+" "+(v/1000).toFixed(1)+"k";
  return fmt(n);
}
function todayISO(){ return localISO(new Date()); }
function localISO(d){ const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; }
function parseISO(iso){ const [y,m,d]=iso.split("-").map(Number); return new Date(y,m-1,d); }
function monthKey(iso){ return iso.slice(0,7); }
function fmtDate(iso){ return parseISO(iso).toLocaleDateString(dateLocale(),{day:"2-digit",month:"short",year:"numeric"}); }
function monthLabel(mk){ const [y,m]=mk.split("-").map(Number); return new Date(y,m-1).toLocaleDateString(dateLocale(),{month:"long",year:"numeric"}); }
function daysUntil(iso){
  const a=parseISO(todayISO()).getTime(), b=parseISO(iso).getTime();
  return Math.round((b-a)/86400000);
}
function clampDay(y,m,day){ const last=new Date(y,m+1,0).getDate(); return Math.min(day,last); }
function stepDate(d,freq,dir){
  const y=d.getFullYear(),m=d.getMonth(),day=d.getDate();
  if(freq==="weekly") return new Date(y,m,day+7*dir);
  if(freq==="yearly") return new Date(y+dir,m,clampDay(y+dir,m,day));
  // monthly
  const nm=m+dir; return new Date(y,nm,clampDay(y,nm,day));
}
function addPeriod(iso,freq){ return localISO(stepDate(parseISO(iso),freq,1)); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function catById(id){ return state.categories.find(c=>c.id===id); }
// Display name for a category: built-in categories (stable ids) translate with
// the language; custom categories show their stored name as typed.
function catName(c){ if(!c) return ""; const k="cat_"+c.id, tr=t(k); return tr===k ? (c.name||"") : tr; }
function ratioClass(r){ return r<0.75?"g":(r<=1?"y":"r"); }

// Append a same-day expense from the quick-entry surfaces. Returns true on success.
function quickAddTx(amount, categoryId){
  if(isNaN(amount)||amount<=0){ toast(t("t_enter_amount")); return false; }
  if(!categoryId){ toast(t("t_pick_category")); return false; }
  state.transactions.push({ id:uid("t"), type:"expense", amount, categoryId, date:todayISO(), note:"" });
  toast(t("t_tx_added")); commit(); return true;
}
// Read the Quick-Add Bar inputs, add the transaction, and refocus the amount
// field so the user can keep entering. Shared by the click and Enter handlers.
function submitQuickAdd(){
  if(quickAddTx(getNum("qa-amount"), val("qa-cat"))){
    const i=document.getElementById("qa-amount"); if(i) i.focus();
  }
}
// First expense category id, used as the Quick-Add Bar's default selection.
function firstExpenseCat(){ const c=state.categories.find(x=>x.type==="expense"); return c?c.id:null; }

/* ---------- DERIVED ---------- */
function txInMonth(mk){ return state.transactions.filter(t=>monthKey(t.date)===mk); }
function monthIncome(mk){ return txInMonth(mk).filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0); }
function monthExpense(mk){ return txInMonth(mk).filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0); }
function catSpend(catId,mk){ return txInMonth(mk).filter(t=>t.type==="expense"&&t.categoryId===catId).reduce((s,t)=>s+t.amount,0); }
function totalSaved(){ return state.goals.reduce((s,g)=>s+goalSaved(g),0); }
function goalSaved(g){ return (g.contributions||[]).reduce((s,c)=>s+c.amount,0); }

function billStatus(b){
  // returns {state:'paid'|'overdue'|'soon'|'later', days}
  if(b.recurring==="none" && b.paid) return {state:"paid",days:null};
  const d = daysUntil(b.dueDate);
  if(d<0) return {state:"overdue",days:d};
  if(d<=7) return {state:"soon",days:d};
  return {state:"later",days:d};
}
function upcomingBills(){ // overdue + due within 7 days, active
  return state.bills.filter(b=>{ const s=billStatus(b); return s.state==="overdue"||s.state==="soon"; });
}

/* ============================================================
   RENDER
   ============================================================ */
const NAV = [
  {id:"dashboard",label:"Dashboard",icon:I.dash},
  {id:"transactions",label:"Transactions",icon:I.tx},
  {id:"budget",label:"Budget",icon:I.budget},
  {id:"bills",label:"Bills",icon:I.bills},
  {id:"goals",label:"Goals",icon:I.goals}
];

function renderNav(){
  const nBadge = upcomingBills().length;
  document.getElementById("nav").innerHTML = NAV.map(n=>{
    const active = ui.view===n.id?"active":"";
    const badge = (n.id==="bills"&&nBadge)?`<span class="nav-badge">${nBadge}</span>`:"";
    return `<button class="nav-btn ${active}" data-action="nav" data-view="${n.id}">${n.icon}<span class="lbl">${t('nav_'+n.id)}</span>${badge}</button>`;
  }).join("");
}

function renderThemeIcons(){
  const dark = state.settings.theme==="dark";
  const ic = dark?I.sun:I.moon;
  const sideIc = document.getElementById("theme-icon");
  if(sideIc){ sideIc.innerHTML = `<span style="width:16px;height:16px;display:inline-block">${ic}</span>`; }
  const lbl = document.getElementById("theme-label");
  if(lbl) lbl.textContent = dark?t("light_mode"):t("dark_mode");
  const top = document.getElementById("theme-icon-top");
  if(top) top.innerHTML = ic;
}

/* ---------- DASHBOARD FX (count-up + drifting particles) ---------- */
let _dashRAF=null,_dashCleanup=null;
function prefersReduce(){ return !!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
function fmtCount(v,kind){ return kind==="int"?String(Math.round(v)):fmt(v); }
function runCountUps(){
  const reduce=prefersReduce();
  document.querySelectorAll("#view [data-count]").forEach(el=>{
    const target=parseFloat(el.dataset.count), kind=el.dataset.kind||"money";
    if(isNaN(target)) return;
    if(reduce){ el.textContent=fmtCount(target,kind); return; }
    const dur=700,t0=performance.now();
    (function tick(now){
      const t=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-t,3);
      el.textContent=fmtCount(target*e,kind);
      if(t<1) requestAnimationFrame(tick);
    })(t0);
  });
}
function stopDashFX(){
  if(_dashRAF){ cancelAnimationFrame(_dashRAF); _dashRAF=null; }
  if(_dashCleanup){ _dashCleanup(); _dashCleanup=null; }
}
function mountDashFX(){
  stopDashFX();
  runCountUps();
  if(prefersReduce()) return;
  const cv=document.querySelector(".hero-canvas"); if(!cv) return;
  const ctx=cv.getContext("2d"), dpr=Math.min(window.devicePixelRatio||1,2);
  let w=1,h=1;
  function resize(){ const r=cv.getBoundingClientRect(); w=Math.max(1,r.width); h=Math.max(1,r.height); cv.width=w*dpr; cv.height=h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
  resize();
  const onResize=()=>resize(); window.addEventListener("resize",onResize);
  const N=Math.max(16,Math.min(44,Math.round(w/28)));
  const accent=(getComputedStyle(document.documentElement).getPropertyValue("--accent")||"#3b82f6").trim();
  const parts=Array.from({length:N},()=>({x:Math.random()*w,y:Math.random()*h,r:1+Math.random()*2.4,s:.2+Math.random()*.55,sway:Math.random()*Math.PI*2,sw:.4+Math.random()*0.5}));
  function loop(){
    ctx.clearRect(0,0,w,h);
    for(const p of parts){
      p.y+=p.s; p.sway+=0.012; p.x+=Math.sin(p.sway)*p.sw*0.6;
      if(p.y>h+5){ p.y=-5; p.x=Math.random()*w; }
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.2832);
      ctx.fillStyle=accent; ctx.globalAlpha=0.08+(p.r/3.4)*0.16; ctx.fill();
    }
    ctx.globalAlpha=1;
    _dashRAF=requestAnimationFrame(loop);
  }
  loop();
  _dashCleanup=()=>window.removeEventListener("resize",onResize);
}

function render(){
  document.documentElement.setAttribute("data-theme", state.settings.theme);
  applyLang();
  renderNav();
  renderThemeIcons();
  document.getElementById("page-title").textContent = t('nav_'+ui.view);
  const v = document.getElementById("view");
  if(ui.view==="dashboard") v.innerHTML = viewDashboard();
  else if(ui.view==="transactions") v.innerHTML = viewTransactions();
  else if(ui.view==="budget") v.innerHTML = viewBudget();
  else if(ui.view==="bills") v.innerHTML = viewBills();
  else if(ui.view==="goals") v.innerHTML = viewGoals();

  if(ui.view==="dashboard") mountDashFX(); else stopDashFX();
}

/* ---------------- QUICK ADD ---------------- */
function quickAddBar(){
  const cats=state.categories.filter(c=>c.type==="expense");
  if(!ui.qaCat||!cats.some(c=>c.id===ui.qaCat)) ui.qaCat=firstExpenseCat();
  const opts=cats.map(c=>`<option value="${c.id}"${c.id===ui.qaCat?" selected":""}>${esc(catName(c))}</option>`).join("");
  return `<div class="qadd qadd-desktop">
      <span class="qadd-cur">${CONFIG.currency}</span>
      <input id="qa-amount" class="input qadd-amt" type="number" min="0" step="0.01" inputmode="decimal"
        placeholder="0.00" autocomplete="off">
      <select id="qa-cat" class="input qadd-cat" data-action="qa-cat">${opts}</select>
      <button class="btn btn-primary" data-action="qadd">${I.plus} ${t('add')}</button>
    </div>
    <button class="btn btn-primary qadd-mobile" data-action="qadd-mobile">${I.plus} ${t('add_expense')}</button>`;
}
function quickGridModal(){
  const tiles=state.categories.filter(c=>c.type==="expense").map(c=>
    `<button type="button" class="qtile" style="background:${c.color}" data-action="qgrid-pick" data-id="${c.id}">
       <span class="qtile-dot"></span>${esc(catName(c))}</button>`).join("");
  showModal(`<div class="modal">
    <div class="modal-head"><h2>${t('add_expense')}</h2><button class="icon-btn" data-action="close">${I.x}</button></div>
    <div class="modal-body"><div class="qgrid">${tiles}</div></div></div>`);
}
function quickAmountModal(catId){
  const c=catById(catId)||{name:t('uncategorized'),color:"#637385"};
  showModal(`<form class="modal" data-action="save-qadd" data-id="${catId}">
    <div class="modal-head"><h2><span class="dot" style="background:${c.color}"></span> ${esc(catName(c))}</h2>
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

/* ---------------- BUDGET SNAPSHOT ---------------- */
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
      <div class="between small"><span class="fw7"><span class="dot" style="background:${r.c.color}"></span> ${esc(catName(r.c))}</span>
        <span class="tnum muted">${fmt(r.spent)} / ${fmt(r.b)}</span></div>
      <div class="bar mt8"><div class="bar-fill fill-${r.cls}" style="width:${(Math.min(r.r,1)*100).toFixed(1)}%"></div></div>
    </div>`).join("")
    : `<div class="snap-empty"><p class="muted">${t('snap_no_cats')}</p>
       <button class="btn btn-sm btn-primary mt8" data-action="edit-budgets">${t('set_budgets')}</button></div>`;
  return `<div class="card mt16"><div class="card-title">${t('budget_snapshot')}
      <span class="faint" style="text-transform:none;font-weight:600">${monthLabel(mk)}</span></div>
      <div class="mb16">${big}</div>${bars}</div>`;
}

/* ---------------- DASHBOARD ---------------- */
function viewDashboard(){
  const mk = ui.dashMonth;
  const inc = monthIncome(mk), exp = monthExpense(mk);
  const budget = state.settings.monthlyBudget||0;
  const remainingAmt = inc - exp; // money left = income earned minus what was spent
  const up = upcomingBills();
  const overdue = up.filter(b=>billStatus(b).state==="overdue");
  const soon = up.filter(b=>billStatus(b).state==="soon");

  // summary cards
  const cards = `
    <div class="summary-grid grid">
      <div class="stat anim-in" style="animation-delay:.05s"><div class="stat-accent" style="background:var(--green)"></div>
        <div class="stat-label">${t('income')}</div>
        <div class="stat-value txt-g" data-count="${inc}" data-kind="money">${fmt(inc)}</div>
        <div class="stat-sub">${monthLabel(mk)}</div></div>
      <div class="stat anim-in" style="animation-delay:.12s"><div class="stat-accent" style="background:var(--red)"></div>
        <div class="stat-label">${t('expenses')}</div>
        <div class="stat-value txt-r" data-count="${exp}" data-kind="money">${fmt(exp)}</div>
        <div class="stat-sub">${monthLabel(mk)}</div></div>
      <div class="stat anim-in" style="animation-delay:.19s"><div class="stat-accent" style="background:${remainingAmt<0?'var(--red)':'var(--green)'}"></div>
        <div class="stat-label">${t('remaining_amount')}</div>
        <div class="stat-value ${remainingAmt<0?'txt-r':'txt-g'}" data-count="${remainingAmt}" data-kind="money">${fmt(remainingAmt)}</div>
        <div class="stat-sub">${t('inc_minus_exp')}</div></div>
      <div class="stat anim-in" style="animation-delay:.26s"><div class="stat-accent" style="background:${up.length?'var(--yellow)':'var(--border-2)'}"></div>
        <div class="stat-label">${t('upcoming_bills')}</div>
        <div class="stat-value" data-count="${up.length}" data-kind="int">${up.length}</div>
        <div class="stat-sub">${t('due_overdue_7')}</div></div>
    </div>`;

  // alerts
  let alerts="";
  if(up.length){
    const items = [...overdue,...soon].map(b=>{
      const s=billStatus(b);
      const cls = s.state==="overdue"?"pill-r":"pill-y";
      const txt = s.state==="overdue"? t('d_overdue',{n:Math.abs(s.days)}) : (s.days===0?t('due_today'):t('in_nd',{n:s.days}));
      return `<div class="between" style="padding:9px 0;border-bottom:1px solid var(--border)">
        <div class="flex"><span class="pill ${cls}">${txt}</span>
          <div><div class="fw7">${esc(b.name)}</div><div class="small faint">${fmtDate(b.dueDate)}</div></div></div>
        <div class="flex"><span class="tnum fw7">${fmt(b.amount)}</span>
          <button class="btn btn-sm btn-primary" data-action="pay-bill" data-id="${b.id}">${I.check}${t('pay')}</button></div>
      </div>`;
    }).join("");
    alerts = `<div class="card mt16 anim-in" style="animation-delay:.30s"><div class="card-title"><span class="card-title-l">${I.alert} ${t('bill_reminders')}</span></div>${items}</div>`;
  }

  // charts row
  const dash = `
    <div class="dash-grid grid mt16">
      <div class="card anim-in" style="animation-delay:.33s">
        <div class="card-title">${t('spending_by_cat')} <span class="faint" style="text-transform:none;font-weight:600">${monthLabel(mk)}</span></div>
        ${donutChart(mk)}
      </div>
      <div class="card anim-in" style="animation-delay:.40s">
        <div class="card-title">${t('inc_vs_exp')} <span class="faint" style="text-transform:none;font-weight:600">${t('last_6_months')}</span></div>
        ${barChart()}
      </div>
    </div>`;

  // savings overview (goals reflected on dashboard)
  let savings="";
  if(state.goals.length){
    const rows = state.goals.map(g=>{
      const saved=goalSaved(g), pct=g.target>0?Math.min(saved/g.target,1):0;
      return `<div style="margin-bottom:12px">
        <div class="between small"><span class="fw7">${esc(g.name)}</span>
          <span class="tnum muted">${fmt(saved)} / ${fmt(g.target)}</span></div>
        <div class="bar mt8"><div class="bar-fill fill-g" style="width:${(pct*100).toFixed(1)}%"></div></div>
      </div>`;
    }).join("");
    savings = `<div class="card mt16 anim-in" style="animation-delay:.46s"><div class="card-title">${t('savings_goals')}
      <span class="faint" style="text-transform:none;font-weight:600">${t('saved_total',{x:fmt(totalSaved())})}</span></div>${rows}</div>`;
  }

  const net=inc-exp;
  const hh=new Date().getHours();
  const greet=t(hh<12?"good_morning":(hh<18?"good_afternoon":"good_evening"));
  const greetName=currentUser?esc(currentUser):t('guest');
  const todayLong=new Date().toLocaleDateString(dateLocale(),{weekday:"long",day:"numeric",month:"long"});
  const upA='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  const dnA='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
  const WAVE='M0,34 Q75,17 150,34 T300,34 T450,34 T600,34 T750,34 T900,34 T1050,34 T1200,34 V60 H0 Z';
  const hero=`
    <div class="hero anim-in">
      <div class="hero-aurora"></div>
      <canvas class="hero-canvas"></canvas>
      <div class="hero-wave">
        <svg class="wave-b" viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="${WAVE}"/></svg>
        <svg class="wave-a" viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="${WAVE}"/></svg>
      </div>
      <div class="hero-content between wrap" style="gap:16px">
        <div>
          <div class="hero-greet">${greet}, ${greetName} · ${todayLong}</div>
          <div class="hero-title">${t('heres_your_money',{m:monthLabel(mk)})}</div>
          <div class="hero-net ${net>=0?'txt-g':'txt-r'}" data-count="${net}" data-kind="money">${fmt(net)}</div>
          <div class="hero-net-label ${net>=0?'txt-g':'txt-r'}">${net>=0?upA:dnA} ${t('net')}</div>
        </div>
        <div class="flex wrap" style="gap:10px">
          <input type="month" class="input" style="width:auto" value="${mk}" data-action="dash-month">
          <button class="btn btn-primary" data-action="add-income">${I.plus} ${t('add_income')}</button>
        </div>
      </div>
    </div>`;
  return `${hero}${cards}${budgetSnapshot(mk)}${alerts}${dash}${savings}`;
}

/* ---------------- DONUT ---------------- */
function polar(cx,cy,r,deg){ const a=(deg-90)*Math.PI/180; return [cx+r*Math.cos(a),cy+r*Math.sin(a)]; }
function donutSeg(cx,cy,rO,rI,start,end){
  const [x1,y1]=polar(cx,cy,rO,end),[x2,y2]=polar(cx,cy,rO,start);
  const [x3,y3]=polar(cx,cy,rI,start),[x4,y4]=polar(cx,cy,rI,end);
  const large=(end-start)>180?1:0;
  return `M${x1} ${y1} A${rO} ${rO} 0 ${large} 0 ${x2} ${y2} L${x3} ${y3} A${rI} ${rI} 0 ${large} 1 ${x4} ${y4} Z`;
}
function donutChart(mk){
  const data = state.categories
    .filter(c=>c.type==="expense")
    .map(c=>({name:catName(c),color:c.color,val:catSpend(c.id,mk)}))
    .filter(d=>d.val>0)
    .sort((a,b)=>b.val-a.val);
  const total = data.reduce((s,d)=>s+d.val,0);
  if(!total) return `<div class="empty">${I.inbox}<div>${t('no_expenses_month')}</div></div>`;
  const cx=90,cy=90,rO=82,rI=52;
  let segs="";
  if(data.length===1){
    segs = `<circle cx="${cx}" cy="${cy}" r="${(rO+rI)/2}" fill="none" stroke="${data[0].color}" stroke-width="${rO-rI}"/>`;
  } else {
    let ang=0;
    segs = data.map(d=>{
      const sweep=d.val/total*360, end=ang+sweep;
      const p=donutSeg(cx,cy,rO,rI,ang,end-0.6); ang=end;
      return `<path d="${p}" fill="${d.color}"/>`;
    }).join("");
  }
  const legend = data.map(d=>`<div class="legend-row"><span class="dot" style="background:${d.color}"></span>
    <span class="legend-name">${esc(d.name)}</span>
    <span class="legend-val tnum">${fmt(d.val)}</span>
    <span class="faint small tnum" style="width:42px;text-align:right">${(d.val/total*100).toFixed(0)}%</span></div>`).join("");
  return `<div class="flex wrap" style="gap:20px;align-items:center">
    <div style="position:relative;width:180px;height:180px;flex-shrink:0">
      <svg viewBox="0 0 180 180" width="180" height="180">${segs}</svg>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none">
        <div class="faint small">${t('total')}</div><div class="fw7" style="font-size:16px">${fmtShort(total)}</div></div>
    </div>
    <div class="legend" style="flex:1;min-width:200px">${legend}</div>
  </div>`;
}

/* ---------------- BAR CHART ---------------- */
function barChart(){
  const months=[]; const now=new Date();
  for(let i=5;i>=0;i--){ const d=new Date(now.getFullYear(),now.getMonth()-i,1); months.push(localISO(d).slice(0,7)); }
  const rows = months.map(mk=>({mk,inc:monthIncome(mk),exp:monthExpense(mk)}));
  const max = Math.max(1,...rows.map(r=>Math.max(r.inc,r.exp)));
  const W=440,H=190,pad=26,bw=18,gap=6;
  const colW=(W-pad)/6, chartH=H-34;
  let bars="";
  rows.forEach((r,i)=>{
    const x0=pad+i*colW+colW/2;
    const ih=(r.inc/max)*chartH, eh=(r.exp/max)*chartH;
    const yb=H-22;
    bars+=`<rect x="${x0-bw-gap/2}" y="${yb-ih}" width="${bw}" height="${Math.max(0,ih)}" rx="3" fill="var(--green)"/>`;
    bars+=`<rect x="${x0+gap/2}" y="${yb-eh}" width="${bw}" height="${Math.max(0,eh)}" rx="3" fill="var(--red)"/>`;
    const lbl=new Date(r.mk+"-01").toLocaleDateString(dateLocale(),{month:"short"});
    bars+=`<text x="${x0}" y="${H-6}" text-anchor="middle" font-size="11" fill="var(--text-faint)">${lbl}</text>`;
  });
  const anyData = rows.some(r=>r.inc||r.exp);
  if(!anyData) return `<div class="empty">${I.inbox}<div>${t('no_transactions_yet')}</div></div>`;
  return `<div class="scroll-x"><svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:320px;display:block">
    <line x1="${pad}" y1="${H-22}" x2="${W}" y2="${H-22}" stroke="var(--border)"/>
    ${bars}</svg></div>
    <div class="flex" style="gap:18px;justify-content:center;margin-top:6px">
      <span class="legend-row"><span class="dot" style="background:var(--green)"></span><span class="small muted">${t('income')}</span></span>
      <span class="legend-row"><span class="dot" style="background:var(--red)"></span><span class="small muted">${t('expenses')}</span></span>
    </div>`;
}

/* ---------------- TRANSACTIONS ---------------- */
function availableMonths(){
  const set=new Set(state.transactions.map(t=>monthKey(t.date)));
  return [...set].sort().reverse();
}
function viewTransactions(){
  let list=[...state.transactions];
  if(ui.txMonth!=="all") list=list.filter(t=>monthKey(t.date)===ui.txMonth);
  if(ui.txType!=="all") list=list.filter(t=>t.type===ui.txType);
  if(ui.txCat!=="all") list=list.filter(t=>t.categoryId===ui.txCat);
  list.sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));

  const inc=list.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const exp=list.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);

  const monthOpts = `<option value="all"${ui.txMonth==="all"?" selected":""}>${t('all_months')}</option>`+
    availableMonths().map(m=>`<option value="${m}"${ui.txMonth===m?" selected":""}>${monthLabel(m)}</option>`).join("");
  const catOpts = `<option value="all"${ui.txCat==="all"?" selected":""}>${t('all_categories')}</option>`+
    state.categories.map(c=>`<option value="${c.id}"${ui.txCat===c.id?" selected":""}>${esc(catName(c))}</option>`).join("");

  const rows = list.length? list.map(tx=>{
    const c=catById(tx.categoryId)||{name:t('uncategorized'),color:"#637385"};
    const sign=tx.type==="income"?"+":"−";
    const cls=tx.type==="income"?"txt-g":"txt-r";
    return `<div class="tx-row">
      <span class="dot" style="background:${c.color}"></span>
      <div class="tx-main">
        <div class="tx-cat">${esc(catName(c))}</div>
        ${tx.note?`<div class="tx-note">${esc(tx.note)}</div>`:""}
      </div>
      <div class="tx-date">${fmtDate(tx.date)}</div>
      <div class="tx-amt ${cls}">${sign} ${fmt(tx.amount)}</div>
      <div class="row-actions">
        <button class="icon-btn" data-action="edit-tx" data-id="${tx.id}" title="${t('edit')}">${I.edit}</button>
        <button class="icon-btn" data-action="del-tx" data-id="${tx.id}" title="${t('delete')}">${I.trash}</button>
      </div>
    </div>`;
  }).join("") : `<div class="empty">${I.inbox}<div>${t('no_tx_match')}</div></div>`;

  return `
    ${quickAddBar()}
    <div class="between wrap mb16">
      <div class="flex wrap">
        <select class="input" style="width:auto" data-action="tx-month">${monthOpts}</select>
        <select class="input" style="width:auto" data-action="tx-cat">${catOpts}</select>
        <select class="input" style="width:auto" data-action="tx-type">
          <option value="all"${ui.txType==="all"?" selected":""}>${t('all_types')}</option>
          <option value="income"${ui.txType==="income"?" selected":""}>${t('income')}</option>
          <option value="expense"${ui.txType==="expense"?" selected":""}>${t('expense')}</option>
        </select>
      </div>
      <div class="flex">
        <button class="btn btn-sm" data-action="manage-cats">${t('categories')}</button>
      </div>
    </div>
    <div class="flex wrap mb16" style="gap:18px">
      <span class="small muted">${t('income')} <b class="txt-g tnum">${fmt(inc)}</b></span>
      <span class="small muted">${t('expenses')} <b class="txt-r tnum">${fmt(exp)}</b></span>
      <span class="small muted">${t('net')} <b class="tnum ${inc-exp>=0?'txt-g':'txt-r'}">${fmt(inc-exp)}</b></span>
      <span class="small faint">${t('items_count',{n:list.length})}</span>
    </div>
    <div class="card">${rows}</div>`;
}

/* ---------------- BUDGET ---------------- */
function viewBudget(){
  const mk=ui.budgetMonth;
  const budget=state.settings.monthlyBudget||0;
  const exp=monthExpense(mk);
  const ratio=budget>0?exp/budget:0;
  const cls=ratioClass(ratio);
  const oRem=budget-exp;
  const oRemTxt = oRem>=0 ? `<span class="muted">${t('x_left',{x:fmt(oRem)})}</span>` : `<span class="txt-r fw7">${t('x_over',{x:fmt(-oRem)})}</span>`;
  const overallBar = budget>0 ? `
    <div class="between mb8"><span class="muted small fw7">${t('total_budget')}</span>
      <span class="tnum fw7 big">${fmt(budget)}</span></div>
    <div class="bar" style="height:12px"><div class="bar-fill fill-${cls}" style="width:${Math.min(ratio*100,100).toFixed(1)}%"></div></div>
    <div class="between small mt8"><span class="tnum muted">${t('x_spent',{x:fmt(exp)})}</span>
      <span class="tnum">${oRemTxt} · <b class="txt-${cls}">${(ratio*100).toFixed(0)}%</b></span></div>`
    : `<div class="empty" style="padding:18px"><div class="muted">${t('no_overall_budget')}</div></div>`;

  const catRows = state.categories.filter(c=>c.type==="expense").map(c=>{
    const b=state.settings.categoryBudgets[c.id]||0;
    if(!b) return "";
    const s=catSpend(c.id,mk); const r=b>0?s/b:0; const cc=ratioClass(r);
    const rem=b-s;
    const remTxt = rem>=0 ? `<span class="muted">${t('x_left',{x:fmt(rem)})}</span>` : `<span class="txt-r fw7">${t('x_over',{x:fmt(-rem)})}</span>`;
    return `<div style="margin-bottom:18px">
      <div class="between mb8"><span class="flex"><span class="dot" style="background:${c.color}"></span><b>${esc(catName(c))}</b></span>
        <span class="tnum fw7">${fmt(b)}</span></div>
      <div class="bar"><div class="bar-fill fill-${cc}" style="width:${Math.min(r*100,100).toFixed(1)}%"></div></div>
      <div class="between small mt8"><span class="tnum muted">${fmt(s)} spent</span>
        <span class="tnum">${remTxt} · <b class="txt-${cc}">${(r*100).toFixed(0)}%</b></span></div>
    </div>`;
  }).join("");
  const anyCat = state.categories.filter(c=>c.type==="expense").some(c=>state.settings.categoryBudgets[c.id]>0);

  return `
    <div class="between wrap mb16">
      <div class="flex"><label class="small faint fw7">${t('month')}</label>
        <input type="month" class="input" style="width:auto" value="${mk}" data-action="budget-month"></div>
      <button class="btn btn-primary" data-action="edit-budgets">${I.edit} ${t('edit_budgets')}</button>
    </div>
    <div class="card mb16">
      <div class="card-title">${t('overall_budget')} <span class="faint" style="text-transform:none;font-weight:600">${monthLabel(mk)}</span></div>
      ${overallBar}
    </div>
    <div class="card">
      <div class="card-title">${t('per_cat_budgets')}</div>
      ${anyCat?catRows:`<div class="empty" style="padding:18px"><div class="muted">${t('no_per_cat')}</div></div>`}
    </div>`;
}

/* ---------------- BILLS ---------------- */
function occurrencesInMonth(b,y,m){
  const monthStart=new Date(y,m,1), monthEnd=new Date(y,m+1,0);
  const due=parseISO(b.dueDate);
  const res=[];
  if(b.recurring==="none"){
    if(due>=monthStart&&due<=monthEnd) res.push(localISO(due));
    return res;
  }
  let cur=new Date(due),g=0;
  while(cur>monthEnd && g<800){ cur=stepDate(cur,b.recurring,-1); g++; }
  while(cur>=monthStart && g<800){ cur=stepDate(cur,b.recurring,-1); g++; }
  g=0;
  while(cur<=monthEnd && g<800){ if(cur>=monthStart) res.push(localISO(cur)); cur=stepDate(cur,b.recurring,1); g++; }
  return res;
}
function viewBills(){
  const y=ui.calY,m=ui.calM;
  // reminders
  const up=upcomingBills();
  const overdue=up.filter(b=>billStatus(b).state==="overdue");
  const soon=up.filter(b=>billStatus(b).state==="soon");
  let reminders="";
  if(up.length){
    const mkPill=(b)=>{ const s=billStatus(b); const cls=s.state==="overdue"?"pill-r":"pill-y";
      const lbl=s.state==="overdue"?t('d_overdue',{n:Math.abs(s.days)}):(s.days===0?t('today_short'):t('in_nd',{n:s.days}));
      return `<span class="pill ${cls}">${lbl} · ${esc(b.name)} ${fmt(b.amount)}</span>`; };
    reminders=`<div class="card mb16"><div class="card-title"><span class="card-title-l">${I.alert} ${t('reminders')}</span></div>
      <div class="flex wrap" style="gap:8px">${[...overdue,...soon].map(mkPill).join("")}</div></div>`;
  }

  // calendar
  const first=new Date(y,m,1).getDay();
  const days=new Date(y,m+1,0).getDate();
  const todayStr=todayISO();
  const DOW = isRTL()?["أحد","إثن","ثلا","أرب","خمي","جمع","سبت"]:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dow=DOW.map(d=>`<div class="cal-dow">${d}</div>`).join("");
  // map date -> chips
  const dayMap={};
  state.bills.forEach(b=>{
    occurrencesInMonth(b,y,m).forEach(iso=>{
      const dnum=parseISO(iso).getDate();
      (dayMap[dnum]=dayMap[dnum]||[]).push({b,iso});
    });
  });
  let cells="";
  for(let i=0;i<first;i++) cells+=`<div class="cal-cell blank"></div>`;
  for(let d=1;d<=days;d++){
    const iso=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const isToday=iso===todayStr;
    const chips=(dayMap[d]||[]).map(({b,iso})=>{
      const isCurrent = iso===b.dueDate;
      let cls="chip-future", lbl=b.name;
      if(b.recurring==="none"&&b.paid){ cls="chip-paid"; }
      else if(isCurrent){
        const s=billStatus(b);
        cls = s.state==="overdue"?"chip-over":(s.state==="soon"?"chip-soon":"chip-future");
      }
      return `<div class="cal-chip ${cls}" title="${esc(b.name)} · ${fmt(b.amount)}">${esc(b.name)}</div>`;
    }).join("");
    cells+=`<div class="cal-cell ${isToday?'today':''}"><div class="cal-day">${d}</div>${chips}</div>`;
  }

  // full bill list
  const sorted=[...state.bills].sort((a,b)=>{
    const ap=(a.recurring==="none"&&a.paid)?1:0, bp=(b.recurring==="none"&&b.paid)?1:0;
    if(ap!==bp) return ap-bp;
    return a.dueDate.localeCompare(b.dueDate);
  });
  const billRows = sorted.length? sorted.map(b=>{
    const s=billStatus(b); const c=catById(b.categoryId);
    let pill;
    if(s.state==="paid") pill=`<span class="pill pill-g">${t('paid')}</span>`;
    else if(s.state==="overdue") pill=`<span class="pill pill-r">${t('d_overdue',{n:Math.abs(s.days)})}</span>`;
    else if(s.state==="soon") pill=`<span class="pill pill-y">${s.days===0?t('due_today'):t('in_nd',{n:s.days})}</span>`;
    else pill=`<span class="pill pill-n">${t('in_nd',{n:s.days})}</span>`;
    const rec=b.recurring==="none"?t('one_time'):({weekly:t('weekly'),monthly:t('monthly'),yearly:t('yearly')}[b.recurring]);
    const paidCount=(b.history||[]).length;
    return `<div class="tx-row">
      <div class="tx-main">
        <div class="tx-cat">${esc(b.name)} ${pill}</div>
        <div class="tx-note">${rec} · ${fmtDate(b.dueDate)}${c?` · ${esc(catName(c))}`:""}${paidCount?` · ${t('paid_n_times',{n:paidCount})}`:""}</div>
      </div>
      <div class="tx-amt">${fmt(b.amount)}</div>
      <div class="row-actions">
        ${s.state!=="paid"?`<button class="icon-btn" data-action="pay-bill" data-id="${b.id}" title="${t('mark_paid')}">${I.check}</button>`:""}
        <button class="icon-btn" data-action="edit-bill" data-id="${b.id}" title="${t('edit')}">${I.edit}</button>
        <button class="icon-btn" data-action="del-bill" data-id="${b.id}" title="${t('delete')}">${I.trash}</button>
      </div>
    </div>`;
  }).join("") : `<div class="empty">${I.inbox}<div>${t('no_bills_yet')}</div></div>`;

  return `
    <div class="between wrap mb16">
      <div></div>
      <button class="btn btn-primary" data-action="add-bill">${I.plus} ${t('add_bill')}</button>
    </div>
    ${reminders}
    <div class="card mb16">
      <div class="cal-head">
        <button class="icon-btn" data-action="cal-prev">${isRTL()?'›':'‹'}</button>
        <h3>${new Date(y,m).toLocaleDateString(dateLocale(),{month:"long",year:"numeric"})}</h3>
        <button class="icon-btn" data-action="cal-next">${isRTL()?'‹':'›'}</button>
        <button class="btn btn-sm" data-action="cal-today">${t('today_btn')}</button>
      </div>
      <div class="cal-grid">${dow}${cells}</div>
    </div>
    <div class="card"><div class="card-title">${t('all_bills')}</div>${billRows}</div>`;
}

/* ---------------- GOALS ---------------- */
function ring(pct,color){
  const r=36,c=2*Math.PI*r,off=c*(1-pct);
  return `<svg viewBox="0 0 84 84" width="84" height="84">
    <circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="9"/>
    <circle cx="42" cy="42" r="${r}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 42 42)"/>
  </svg>`;
}
function viewGoals(){
  const cards = state.goals.length? state.goals.map((g,i)=>{
    const saved=goalSaved(g), pct=g.target>0?Math.min(saved/g.target,1):0;
    const color=PALETTE[i%PALETTE.length];
    const done=saved>=g.target&&g.target>0;
    const remain=Math.max(0,g.target-saved);
    let deadline="";
    if(g.deadline){
      const du=daysUntil(g.deadline);
      deadline=`<div class="small ${du<0&&!done?'txt-r':'faint'}">${du<0?(done?"":t('past_due')):t('n_days_left',{n:du})} · ${fmtDate(g.deadline)}</div>`;
    }
    return `<div class="card">
      <div class="goal-card">
        <div class="ring-wrap">${ring(pct,done?"var(--green)":color)}<div class="ring-pct">${(pct*100).toFixed(0)}%</div></div>
        <div style="flex:1;min-width:0">
          <div class="between"><div class="big fw7">${esc(g.name)}</div>
            <div class="row-actions">
              <button class="icon-btn" data-action="edit-goal" data-id="${g.id}" title="${t('edit')}">${I.edit}</button>
              <button class="icon-btn" data-action="del-goal" data-id="${g.id}" title="${t('delete')}">${I.trash}</button>
            </div></div>
          <div class="muted small mt8">${t('of_amount',{a:fmt(saved),b:fmt(g.target)})} ${done?'<span class="pill pill-g">'+t('reached')+'</span>':`· ${t('x_to_go',{x:fmt(remain)})}`}</div>
          ${deadline}
          <button class="btn btn-sm btn-primary mt12" data-action="add-contrib" data-id="${g.id}">${I.plus} ${t('add_contribution')}</button>
        </div>
      </div>
      ${(g.contributions&&g.contributions.length)?`<div class="mt16"><div class="small faint fw7 mb8">${t('recent_contributions')}</div>
        ${g.contributions.slice().reverse().slice(0,4).map(c=>`<div class="between small" style="padding:5px 0;border-bottom:1px solid var(--border)">
          <span class="muted">${fmtDate(c.date)}</span><span class="tnum fw7 txt-g">+ ${fmt(c.amount)}</span></div>`).join("")}</div>`:""}
    </div>`;
  }).join("") : `<div class="card"><div class="empty">${I.goals}<div>${t('no_goals_yet')}</div></div></div>`;

  return `
    <div class="between wrap mb16">
      <div class="flex"><span class="muted small">${t('total_saved_goals')}</span>
        <b class="big txt-g tnum">${fmt(totalSaved())}</b></div>
      <button class="btn btn-primary" data-action="add-goal">${I.plus} ${t('new_goal')}</button>
    </div>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">${cards}</div>`;
}

/* ============================================================
   MODALS
   ============================================================ */
function showModal(html){ document.getElementById("modal-root").innerHTML=`<div class="backdrop" data-action="backdrop">${html}</div>`; }
function closeModal(){ document.getElementById("modal-root").innerHTML=""; }
function val(id){ const e=document.getElementById(id); return e?e.value:""; }

/* ---- transaction modal ---- */
function txModal(tx, defType){
  const editing=!!tx;
  const type=tx?tx.type:(defType||"expense");
  const cats=state.categories.filter(c=>c.type===type);
  const catOpts=cats.map(c=>`<option value="${c.id}"${tx&&tx.categoryId===c.id?" selected":""}>${esc(catName(c))}</option>`).join("");
  showModal(`<form class="modal" data-action="save-tx" data-id="${tx?tx.id:""}">
    <div class="modal-head"><h2>${editing?t('edit'):t('add')} ${t('transaction')}</h2><button type="button" class="icon-btn" data-action="close">${I.x}</button></div>
    <div class="modal-body">
      <div class="field"><label>${t('type')}</label>
        <div class="seg ${type}" id="tx-type-seg">
          <button type="button" data-type="expense" class="${type==='expense'?'on':''}" data-action="tx-type-toggle">${t('expense')}</button>
          <button type="button" data-type="income" class="${type==='income'?'on':''}" data-action="tx-type-toggle">${t('income')}</button>
        </div>
        <input type="hidden" id="tx-type" value="${type}">
      </div>
      <div class="row2">
        <div class="field"><label>${t('amount_cur',{c:CONFIG.currency})}</label>
          <input id="tx-amount" class="input" type="number" min="0" step="0.01" inputmode="decimal" value="${tx?tx.amount:""}" required></div>
        <div class="field"><label>${t('date')}</label>
          <input id="tx-date" class="input" type="date" value="${tx?tx.date:todayISO()}" required></div>
      </div>
      <div class="field"><label>${t('category')}</label>
        <select id="tx-cat" class="input">${catOpts}</select></div>
      <div class="field"><label>${t('note_optional')}</label>
        <input id="tx-note" class="input" type="text" maxlength="120" value="${tx?esc(tx.note||''):''}" placeholder="${t('note_ph')}"></div>
    </div>
    <div class="modal-foot">
      <button type="button" class="btn" data-action="close">${t('cancel')}</button>
      <button type="submit" class="btn btn-primary">${editing?t('save'):t('add')}</button>
    </div>
  </form>`);
}
function refreshTxCats(type){
  const sel=document.getElementById("tx-cat"); if(!sel) return;
  const cats=state.categories.filter(c=>c.type===type);
  sel.innerHTML=cats.map(c=>`<option value="${c.id}">${esc(catName(c))}</option>`).join("");
}
// Simplified income entry: amount + date + note only (no type/category).
function incomeModal(){
  showModal(`<form class="modal" data-action="save-income">
    <div class="modal-head"><h2>${t('add_income')}</h2><button type="button" class="icon-btn" data-action="close">${I.x}</button></div>
    <div class="modal-body">
      <div class="row2">
        <div class="field"><label>${t('amount_cur',{c:CONFIG.currency})}</label>
          <input id="inc-amount" class="input" type="number" min="0" step="0.01" inputmode="decimal" required autofocus></div>
        <div class="field"><label>${t('date')}</label>
          <input id="inc-date" class="input" type="date" value="${todayISO()}" required></div>
      </div>
      <div class="field"><label>${t('note_optional')}</label>
        <input id="inc-note" class="input" type="text" maxlength="120" placeholder="${t('note_ph')}"></div>
    </div>
    <div class="modal-foot">
      <button type="button" class="btn" data-action="close">${t('cancel')}</button>
      <button type="submit" class="btn btn-primary">${I.plus} ${t('add')}</button>
    </div>
  </form>`);
}

/* ---- category manager ---- */
function catManagerModal(){
  const rows=state.categories.map(c=>`<div class="tx-row">
    <span class="dot" style="background:${c.color}"></span>
    <div class="tx-main"><div class="tx-cat">${esc(catName(c))}</div>
      <div class="tx-note">${c.type==="income"?t('income'):t('expense')}</div></div>
    <div class="row-actions">
      <button class="icon-btn" data-action="edit-cat" data-id="${c.id}" title="${t('edit')}">${I.edit}</button>
      <button class="icon-btn" data-action="del-cat" data-id="${c.id}" title="${t('delete')}">${I.trash}</button>
    </div></div>`).join("");
  showModal(`<div class="modal modal-wide">
    <div class="modal-head"><h2>${t('manage_categories')}</h2><button class="icon-btn" data-action="close">${I.x}</button></div>
    <div class="modal-body" style="max-height:60vh;overflow:auto">${rows}</div>
    <div class="modal-foot"><button class="btn btn-primary" data-action="add-cat">${I.plus} ${t('new_category')}</button></div>
  </div>`);
}
function catEditModal(cat){
  const editing=!!cat;
  const type=cat?cat.type:"expense";
  const color=cat?cat.color:PALETTE[state.categories.length%PALETTE.length];
  showModal(`<form class="modal" data-action="save-cat" data-id="${cat?cat.id:""}">
    <div class="modal-head"><h2>${editing?t('edit'):t('new_word')} ${t('category_word')}</h2><button type="button" class="icon-btn" data-action="close">${I.x}</button></div>
    <div class="modal-body">
      <div class="field"><label>${t('name')}</label><input id="cat-name" class="input" type="text" maxlength="40" value="${cat?esc(cat.name):''}" required></div>
      <div class="field"><label>${t('type')}</label>
        <div class="seg ${type}" id="cat-type-seg">
          <button type="button" data-type="expense" class="${type==='expense'?'on':''}" data-action="cat-type-toggle">${t('expense')}</button>
          <button type="button" data-type="income" class="${type==='income'?'on':''}" data-action="cat-type-toggle">${t('income')}</button>
        </div><input type="hidden" id="cat-type" value="${type}"></div>
      <div class="field"><label>${t('color')}</label><input id="cat-color" class="input" type="color" value="${color}"></div>
    </div>
    <div class="modal-foot"><button type="button" class="btn" data-action="close">${t('cancel')}</button>
      <button type="submit" class="btn btn-primary">${editing?t('save'):t('add')}</button></div>
  </form>`);
}

/* ---- bill modal ---- */
function billModal(b){
  const editing=!!b;
  const cats=state.categories.filter(c=>c.type==="expense");
  const catOpts=cats.map(c=>`<option value="${c.id}"${b&&b.categoryId===c.id?" selected":(!b&&c.id==='c_bills'?" selected":"")}>${esc(catName(c))}</option>`).join("");
  const rec=b?b.recurring:"monthly";
  const recOpt=(v,l)=>`<option value="${v}"${rec===v?" selected":""}>${l}</option>`;
  showModal(`<form class="modal" data-action="save-bill" data-id="${b?b.id:""}">
    <div class="modal-head"><h2>${editing?t('edit'):t('add')} ${t('bill_word')}</h2><button type="button" class="icon-btn" data-action="close">${I.x}</button></div>
    <div class="modal-body">
      <div class="field"><label>${t('bill_name')}</label><input id="b-name" class="input" type="text" maxlength="60" value="${b?esc(b.name):''}" placeholder="${t('bill_name_ph')}" required></div>
      <div class="row2">
        <div class="field"><label>${t('amount_cur',{c:CONFIG.currency})}</label><input id="b-amount" class="input" type="number" min="0" step="0.01" value="${b?b.amount:''}" required></div>
        <div class="field"><label>${editing?t('next_due_date'):t('due_date')}</label><input id="b-due" class="input" type="date" value="${b?b.dueDate:todayISO()}" required></div>
      </div>
      <div class="row2">
        <div class="field"><label>${t('recurrence')}</label><select id="b-rec" class="input">
          ${recOpt("none",t('one_time'))}${recOpt("weekly",t('weekly'))}${recOpt("monthly",t('monthly'))}${recOpt("yearly",t('yearly'))}</select></div>
        <div class="field"><label>${t('expense_category')}</label><select id="b-cat" class="input">${catOpts}</select></div>
      </div>
      <div class="small faint">${t('bill_paid_note')}${editing?"":t('bill_paid_note_recur')}.</div>
    </div>
    <div class="modal-foot"><button type="button" class="btn" data-action="close">${t('cancel')}</button>
      <button type="submit" class="btn btn-primary">${editing?t('save'):t('add')}</button></div>
  </form>`);
}

/* ---- goal & contribution modals ---- */
function goalModal(g){
  const editing=!!g;
  showModal(`<form class="modal" data-action="save-goal" data-id="${g?g.id:""}">
    <div class="modal-head"><h2>${editing?t('edit'):t('new_word')} ${t('goal_word')}</h2><button type="button" class="icon-btn" data-action="close">${I.x}</button></div>
    <div class="modal-body">
      <div class="field"><label>${t('goal_name')}</label><input id="g-name" class="input" type="text" maxlength="60" value="${g?esc(g.name):''}" placeholder="${t('goal_name_ph')}" required></div>
      <div class="row2">
        <div class="field"><label>${t('target_amount_cur',{c:CONFIG.currency})}</label><input id="g-target" class="input" type="number" min="0" step="0.01" value="${g?g.target:''}" required></div>
        <div class="field"><label>${t('deadline_optional')}</label><input id="g-deadline" class="input" type="date" value="${g&&g.deadline?g.deadline:''}"></div>
      </div>
    </div>
    <div class="modal-foot"><button type="button" class="btn" data-action="close">${t('cancel')}</button>
      <button type="submit" class="btn btn-primary">${editing?t('save'):t('create')}</button></div>
  </form>`);
}
function contribModal(g){
  showModal(`<form class="modal" data-action="save-contrib" data-id="${g.id}">
    <div class="modal-head"><h2>${t('add_to_goal',{n:esc(g.name)})}</h2><button type="button" class="icon-btn" data-action="close">${I.x}</button></div>
    <div class="modal-body">
      <div class="muted small mb12">${t('saved_so_far',{a:fmt(goalSaved(g)),b:fmt(g.target)})}</div>
      <div class="row2">
        <div class="field"><label>${t('amount_cur',{c:CONFIG.currency})}</label><input id="ct-amount" class="input" type="number" min="0" step="0.01" required autofocus></div>
        <div class="field"><label>${t('date')}</label><input id="ct-date" class="input" type="date" value="${todayISO()}" required></div>
      </div>
    </div>
    <div class="modal-foot"><button type="button" class="btn" data-action="close">${t('cancel')}</button>
      <button type="submit" class="btn btn-primary">${t('add')}</button></div>
  </form>`);
}

/* ---- budget editor ---- */
function budgetModal(){
  const b=state.settings.monthlyBudget||0;
  const catRows=state.categories.filter(c=>c.type==="expense").map(c=>{
    const v=state.settings.categoryBudgets[c.id]||"";
    return `<div class="field"><label><span class="dot" style="background:${c.color};display:inline-block;margin-right:6px"></span>${esc(catName(c))}</label>
      <input class="input" type="number" min="0" step="0.01" data-cat-budget="${c.id}" value="${v}" placeholder="0.00"></div>`;
  }).join("");
  showModal(`<form class="modal modal-wide" data-action="save-budgets">
    <div class="modal-head"><h2>${t('edit_budgets_title')}</h2><button type="button" class="icon-btn" data-action="close">${I.x}</button></div>
    <div class="modal-body" style="max-height:62vh;overflow:auto">
      <div class="field"><label>${t('overall_monthly_budget_cur',{c:CONFIG.currency})}</label>
        <input id="ov-budget" class="input" type="number" min="0" step="0.01" value="${b||''}" placeholder="0.00"></div>
      <div class="small faint mb12">${t('per_cat_hint')}</div>
      ${catRows}
    </div>
    <div class="modal-foot"><button type="button" class="btn" data-action="close">${t('cancel')}</button>
      <button type="submit" class="btn btn-primary">${t('save_budgets')}</button></div>
  </form>`);
}

/* ---- data menu / import / reset ---- */
/* ---- toast ---- */
function toast(msg){
  const t=document.createElement("div"); t.className="toast"; t.textContent=msg;
  document.getElementById("toast-root").appendChild(t);
  setTimeout(()=>{ t.style.opacity="0"; t.style.transition="opacity .3s"; setTimeout(()=>t.remove(),300); },2200);
}

/* ============================================================
   ACTIONS
   ============================================================ */
function getNum(id){ const v=parseFloat(val(id)); return isNaN(v)?NaN:v; }

document.addEventListener("click",e=>{
  const el=e.target.closest("[data-action]"); if(!el) return;
  const a=el.dataset.action, id=el.dataset.id;

  // backdrop / close
  if(a==="backdrop"&&e.target===el){ closeModal(); return; }
  if(a==="close"){ closeModal(); return; }
  if(a==="account"){ if(currentUser) logout(); else { setAuthMode("login"); showAuth(); } return; }
  if(a==="dismiss-auth"){ hideAuth(); return; }
  if(a==="nudge-create"){ closeModal(); setAuthMode("signup"); showAuth(); return; }
  if(a==="nudge-guest"){ closeModal(); return; }

  // nav & theme
  if(a==="nav"){ ui.view=el.dataset.view; render(); window.scrollTo(0,0); document.querySelectorAll(".sidebar,.topbar").forEach(b=>b.classList.remove("nav-hidden")); return; }
  if(a==="theme"){ state.settings.theme=state.settings.theme==="dark"?"light":"dark"; commit(); return; }
  if(a==="lang"){ setLang(curLang()==="ar"?"en":"ar"); return; }
  if(a==="reset-month"){ resetCurrentMonth(); return; }
  if(a==="auth-mode"){ setAuthMode(el.dataset.mode); return; }

  // quick add
  if(a==="qadd"){ submitQuickAdd(); return; }
  if(a==="qadd-mobile"){ quickGridModal(); return; }
  if(a==="qgrid-pick"){ quickAmountModal(id); return; }

  // dashboard / generic add
  if(a==="add-tx"){ txModal(null); return; }
  if(a==="add-income"){ incomeModal(); return; }
  if(a==="edit-tx"){ txModal(state.transactions.find(t=>t.id===id)); return; }
  if(a==="del-tx"){ if(confirm(t("c_del_tx"))){ state.transactions=state.transactions.filter(x=>x.id!==id); commit(); toast(t("t_tx_deleted")); } return; }

  // tx type toggle in modal
  if(a==="tx-type-toggle"){
    const type=el.dataset.type;
    document.getElementById("tx-type").value=type;
    document.querySelectorAll("#tx-type-seg button").forEach(b=>b.classList.toggle("on",b.dataset.type===type));
    const seg=document.getElementById("tx-type-seg"); seg.className="seg "+type;
    refreshTxCats(type); return;
  }

  // categories
  if(a==="manage-cats"){ catManagerModal(); return; }
  if(a==="add-cat"){ catEditModal(null); return; }
  if(a==="edit-cat"){ catEditModal(catById(id)); return; }
  if(a==="del-cat"){ deleteCategory(id); return; }
  if(a==="cat-type-toggle"){
    const type=el.dataset.type; document.getElementById("cat-type").value=type;
    document.querySelectorAll("#cat-type-seg button").forEach(b=>b.classList.toggle("on",b.dataset.type===type));
    document.getElementById("cat-type-seg").className="seg "+type; return;
  }

  // budget
  if(a==="edit-budgets"){ budgetModal(); return; }

  // bills
  if(a==="add-bill"){ billModal(null); return; }
  if(a==="edit-bill"){ billModal(state.bills.find(b=>b.id===id)); return; }
  if(a==="del-bill"){ if(confirm(t("c_del_bill"))){ state.bills=state.bills.filter(b=>b.id!==id); commit(); toast(t("t_bill_deleted")); } return; }
  if(a==="pay-bill"){ payBill(id); return; }
  if(a==="cal-prev"){ ui.calM--; if(ui.calM<0){ui.calM=11;ui.calY--;} render(); return; }
  if(a==="cal-next"){ ui.calM++; if(ui.calM>11){ui.calM=0;ui.calY++;} render(); return; }
  if(a==="cal-today"){ const d=new Date(); ui.calY=d.getFullYear(); ui.calM=d.getMonth(); render(); return; }

  // goals
  if(a==="add-goal"){ goalModal(null); return; }
  if(a==="edit-goal"){ goalModal(state.goals.find(g=>g.id===id)); return; }
  if(a==="del-goal"){ if(confirm(t("c_del_goal"))){ state.goals=state.goals.filter(g=>g.id!==id); commit(); toast(t("t_goal_deleted")); } return; }
  if(a==="add-contrib"){ contribModal(state.goals.find(g=>g.id===id)); return; }
});

/* form submits */
document.addEventListener("submit",e=>{
  const form=e.target.closest("[data-action]"); if(!form) return;
  const a=form.dataset.action, id=form.dataset.id;
  e.preventDefault();

  if(a==="save-qadd"){
    const amount=getNum("qa-m-amount");
    if(isNaN(amount)||amount<=0){ toast(t("t_enter_amount")); return; }
    state.transactions.push({ id:uid("t"), type:"expense", amount, categoryId:id, date:todayISO(), note:"" });
    closeModal(); commit(); toast(t("t_tx_added")); return;
  }

  if(a==="save-income"){
    const amount=getNum("inc-amount");
    if(isNaN(amount)||amount<=0){ toast(t("t_enter_amount")); return; }
    const incCat=state.categories.find(c=>c.type==="income"); // default income bucket
    state.transactions.push({ id:uid("t"), type:"income", amount, categoryId:incCat?incCat.id:"",
      date:val("inc-date")||todayISO(), note:val("inc-note").trim() });
    closeModal(); commit(); toast(t("t_tx_added")); return;
  }

  if(a==="save-tx"){
    const amount=getNum("tx-amount");
    if(isNaN(amount)||amount<=0){ toast(t("t_enter_amount")); return; }
    const obj={ type:val("tx-type"), amount, categoryId:val("tx-cat"), date:val("tx-date"), note:val("tx-note").trim() };
    if(id){ const txn=state.transactions.find(x=>x.id===id); Object.assign(txn,obj); toast(t("t_tx_updated")); }
    else { obj.id=uid("t"); state.transactions.push(obj); toast(t("t_tx_added")); }
    closeModal(); commit(); return;
  }

  if(a==="save-cat"){
    const name=val("cat-name").trim(); if(!name){ toast(t("t_enter_name")); return; }
    const obj={ name, type:val("cat-type"), color:val("cat-color") };
    if(id){ Object.assign(catById(id),obj); toast(t("t_cat_updated")); reopenCatManager(); }
    else { obj.id=uid("c"); state.categories.push(obj); toast(t("t_cat_added")); reopenCatManager(); }
    save(); render(); return;
  }

  if(a==="save-bill"){
    const amount=getNum("b-amount");
    if(isNaN(amount)||amount<=0){ toast(t("t_enter_amount")); return; }
    const obj={ name:val("b-name").trim(), amount, dueDate:val("b-due"), recurring:val("b-rec"), categoryId:val("b-cat") };
    if(id){ const b=state.bills.find(b=>b.id===id); Object.assign(b,obj); toast(t("t_bill_updated")); }
    else { obj.id=uid("b"); obj.history=[]; obj.paid=false; state.bills.push(obj); toast(t("t_bill_added")); }
    closeModal(); commit(); return;
  }

  if(a==="save-goal"){
    const target=getNum("g-target");
    if(isNaN(target)||target<=0){ toast(t("t_enter_target")); return; }
    const obj={ name:val("g-name").trim(), target, deadline:val("g-deadline")||null };
    if(id){ const g=state.goals.find(g=>g.id===id); Object.assign(g,obj); toast(t("t_goal_updated")); }
    else { obj.id=uid("g"); obj.contributions=[]; state.goals.push(obj); toast(t("t_goal_created")); }
    closeModal(); commit(); return;
  }

  if(a==="save-contrib"){
    const amount=getNum("ct-amount");
    if(isNaN(amount)||amount<=0){ toast(t("t_enter_amount")); return; }
    const g=state.goals.find(g=>g.id===id);
    g.contributions=g.contributions||[];
    g.contributions.push({ id:uid("ct"), amount, date:val("ct-date") });
    closeModal(); commit(); toast(t("t_contrib_added")); return;
  }

  if(a==="save-budgets"){
    const ov=getNum("ov-budget"); state.settings.monthlyBudget=isNaN(ov)?0:ov;
    const cb={};
    document.querySelectorAll("[data-cat-budget]").forEach(inp=>{
      const v=parseFloat(inp.value); if(!isNaN(v)&&v>0) cb[inp.dataset.catBudget]=v;
    });
    state.settings.categoryBudgets=cb;
    closeModal(); commit(); toast(t("t_budgets_saved")); return;
  }
});

/* change handlers (filters, month pickers, file import) */
document.addEventListener("change",e=>{
  const el=e.target.closest("[data-action]"); if(!el) return;
  const a=el.dataset.action;
  if(a==="dash-month"){ ui.dashMonth=el.value||ui.dashMonth; render(); }
  else if(a==="budget-month"){ ui.budgetMonth=el.value||ui.budgetMonth; render(); }
  else if(a==="tx-month"){ ui.txMonth=el.value; render(); }
  else if(a==="tx-cat"){ ui.txCat=el.value; render(); }
  else if(a==="tx-type"){ ui.txType=el.value; render(); }
  else if(a==="qa-cat"){ ui.qaCat=el.value; } // remember selection; no re-render needed
});

/* ---------- complex action helpers ---------- */
function reopenCatManager(){ /* after add/edit, return to manager list */ catManagerModal(); }

function deleteCategory(id){
  const used=state.transactions.filter(t=>t.categoryId===id).length
            + state.bills.filter(b=>b.categoryId===id).length;
  const cat=catById(id);
  const msg = used? t('c_cat_used',{name:cat.name,n:used})
                  : t('c_del_cat',{name:cat.name});
  if(!confirm(msg)) return;
  if(used){
    const unc=ensureUncategorized(cat.type);
    state.transactions.forEach(t=>{ if(t.categoryId===id) t.categoryId=unc.id; });
    state.bills.forEach(b=>{ if(b.categoryId===id) b.categoryId=ensureUncategorized("expense").id; });
  }
  // clean budget
  delete state.settings.categoryBudgets[id];
  state.categories=state.categories.filter(c=>c.id!==id);
  save(); render(); catManagerModal(); toast(t("t_cat_deleted"));
}
function ensureUncategorized(type){
  let u=state.categories.find(c=>c.name==="Uncategorized"&&c.type===type);
  if(!u){ u={id:uid("c"),name:"Uncategorized",type:type,color:"#637385"}; state.categories.push(u); }
  return u;
}

function payBill(id){
  const b=state.bills.find(b=>b.id===id); if(!b) return;
  const cat=catById(b.categoryId)||ensureUncategorized("expense");
  // log expense dated on the due date being paid
  state.transactions.push({ id:uid("t"), type:"expense", amount:b.amount, categoryId:cat.id, date:b.dueDate, note:t("bill_prefix")+b.name });
  b.history=b.history||[];
  b.history.push({ due:b.dueDate, paidOn:todayISO(), amount:b.amount });
  if(b.recurring==="none"){ b.paid=true; }
  else { b.dueDate=addPeriod(b.dueDate,b.recurring); }
  commit(); toast(b.recurring==="none"?t("t_bill_paid_logged"):t("t_paid_rolled",{d:fmtDate(b.dueDate)}));
}

/* ---------- keyboard ---------- */
document.addEventListener("keydown",e=>{
  if(e.key==="Escape") closeModal();
  if(e.key==="Enter" && e.target && e.target.id==="qa-amount"){
    e.preventDefault();
    submitQuickAdd();
  }
});

/* ---------- AUTH ---------- */
let authMode="login"; // "login" | "signup"

const $auth = {
  overlay:()=>document.getElementById("auth-overlay"),
  form:()=>document.getElementById("auth-form"),
  user:()=>document.getElementById("auth-username"),
  pass:()=>document.getElementById("auth-password"),
  err:()=>document.getElementById("auth-error"),
  submit:()=>document.getElementById("auth-submit"),
  title:()=>document.getElementById("auth-title"),
  subtitle:()=>document.getElementById("auth-subtitle")
};

function showAuth(){
  $auth.overlay().removeAttribute("hidden");
  $auth.pass().value="";
  authError("");
  slideAuthTabs(document.querySelector(".auth-tab.on"), false);
  $auth.user().focus();
}
function hideAuth(){ $auth.overlay().setAttribute("hidden",""); }
function authError(msg){
  const el=$auth.err();
  if(!msg){ el.hidden=true; el.textContent=""; return; }
  el.hidden=false; el.textContent=msg;
}
function setAuthMode(mode){
  authMode=mode;
  const login = mode==="login";
  $auth.title().textContent   = login ? t("auth_welcome") : t("auth_create");
  $auth.subtitle().textContent= login ? t("auth_login_sub") : t("auth_signup_sub");
  $auth.submit().textContent  = login ? t("login") : t("signup");
  const tl=document.getElementById("tab-login"), ts=document.getElementById("tab-signup");
  if(tl) tl.classList.toggle("on", login);
  if(ts) ts.classList.toggle("on", !login);
  $auth.pass().setAttribute("autocomplete", login ? "current-password" : "new-password");
  slideAuthTabs(login ? tl : ts, true);
  authError("");
}
// Slide the tab indicator onto the active tab, and (optionally) swipe the
// heading in from the active tab's side so switching feels like a swipe.
function slideAuthTabs(active, animateHeading){
  const ind=document.getElementById("auth-tab-indicator"), tabs=document.querySelector(".auth-tabs");
  if(!ind||!tabs||!active||!active.offsetWidth) return; // overlay hidden -> 0 width, skip
  ind.style.width=active.offsetWidth+"px";
  ind.style.transform="translateX("+active.offsetLeft+"px)";
  if(animateHeading && !prefersReduce()){
    const dir=(active.offsetLeft+active.offsetWidth/2 > tabs.clientWidth/2) ? 1 : -1;
    ["auth-title","auth-subtitle"].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.animate([{opacity:0,transform:"translateX("+(dir*18)+"px)"},{opacity:1,transform:"none"}],
        {duration:280,easing:"cubic-bezier(.2,.75,.25,1)"});
    });
  }
}

async function submitAuth(e){
  if(e) e.preventDefault();
  const username=$auth.user().value.trim();
  const password=$auth.pass().value;
  if(!username||!password){ authError(t("enter_user_pass")); return; }
  $auth.submit().disabled=true;
  try{
    const res=await fetch("/api/auth/"+authMode,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({username,password})
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok){ authError(data.error||t("something_wrong")); return; }
    if(authMode==="signup"){ await enterAfterSignup(data.username); }
    else { await enterApp(data.username); }
  }catch(err){
    authError(t("cannot_reach"));
  }finally{
    $auth.submit().disabled=false;
  }
}

async function enterApp(username){
  const res=await fetch("/api/data");
  if(res.status===401){ showAuth(); return; }
  if(!res.ok){ authError(t("could_not_load")); return; }
  state=normalize(await res.json());
  currentUser=username;
  hideAuth();
  applyStaticLang();
  render();
}

// Land a brand-new account on the data the user built up as a guest. The
// in-memory `state` is kept (not reloaded from the server) and pushed up so the
// freshly-seeded default budget is replaced with their actual work.
async function enterAfterSignup(username){
  currentUser=username;
  hideAuth();
  applyStaticLang();
  render();
  save();            // now enabled (currentUser set) — marks the guest state dirty
  await flushSave(); // persist it to the new account immediately
}

// Use the app without an account: data lives only in memory and is gone on
// refresh. Pass showNudge=true to invite the visitor to create an account.
function enterGuest(showNudge){
  state=normalize(defaultData());
  currentUser="";
  hideAuth();
  applyStaticLang();
  render();
  if(showNudge) showSignupNudge();
}

function showSignupNudge(){
  showModal(`<div class="modal">
    <div class="modal-head"><h2>${t('nudge_title')}</h2><button type="button" class="icon-btn" data-action="nudge-guest">${I.x}</button></div>
    <div class="modal-body"><p>${t('nudge_body')}</p></div>
    <div class="modal-foot">
      <button type="button" class="btn" data-action="nudge-guest">${t('nudge_guest')}</button>
      <button type="button" class="btn btn-primary" data-action="nudge-create">${t('nudge_create')}</button>
    </div></div>`);
}

async function logout(){
  if(_savePending) await flushSave();
  try{ await fetch("/api/auth/logout",{method:"POST"}); }catch(e){}
  enterGuest(false); // drop back to a fresh guest session (no nag popup)
}

/* ---------- chrome: hide top bar + bottom nav on scroll down, reveal on up ---------- */
(function(){
  const bars=[document.querySelector(".sidebar"),document.querySelector(".topbar")].filter(Boolean);
  if(!bars.length) return;
  let lastY=window.scrollY||0, ticking=false;
  function setHidden(on){ bars.forEach(b=>b.classList.toggle("nav-hidden",on)); }
  function update(){
    const y=window.scrollY||0, dy=y-lastY;
    if(Math.abs(dy)>6){
      // Hide only while scrolling down past the top; any up-scroll brings it back.
      setHidden(dy>0 && y>64);
      lastY=y;
    }
    ticking=false;
  }
  window.addEventListener("scroll",()=>{
    if(!ticking){ requestAnimationFrame(update); ticking=true; }
  },{passive:true});
})();

/* ---------- boot ---------- */
(async function init(){
  $auth.form().addEventListener("submit", submitAuth);
  setAuthMode("login");
  applyStaticLang();
  // Lock the tab indicator in place once fonts/layout have settled.
  requestAnimationFrame(()=>slideAuthTabs(document.querySelector(".auth-tab.on"), false));
  window.addEventListener("resize",()=>slideAuthTabs(document.querySelector(".auth-tab.on"), false));
  try{
    const me=await fetch("/api/auth/me");
    if(me.ok){ const u=await me.json(); await enterApp(u.username); }
    else { enterGuest(true); }
  }catch(e){
    enterGuest(true); // server unreachable — still let them use the app as a guest
  }
})();
