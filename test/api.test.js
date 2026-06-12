"use strict";

/**
 * End-to-end API tests. Requires a running PostgreSQL with DATABASE_URL set
 * (see .env). Creates two throwaway users with unique names, so it can be run
 * repeatedly without cleanup.
 *
 * Run:  node --test
 */

const { test, before, after } = require("node:test");
const assert = require("node:assert");

require("dotenv").config();

const http = require("node:http");

let server, base;
const stamp = Date.now().toString(36);
const userA = "test_a_" + stamp;
const userB = "test_b_" + stamp;
const pass = "supersecret123";

// Minimal cookie-aware fetch wrapper.
function jar() {
  let cookie = "";
  return async function (path, opts = {}) {
    const headers = Object.assign({}, opts.headers);
    if (cookie) headers["Cookie"] = cookie;
    if (opts.body) headers["Content-Type"] = "application/json";
    const res = await fetch(base + path, { ...opts, headers, redirect: "manual" });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    let body = null;
    try { body = await res.json(); } catch (e) { body = null; }
    return { status: res.status, body };
  };
}

before(async () => {
  const { initSchema } = require("../server/db");
  const { buildApp } = require("../server/app");
  await initSchema();
  const app = buildApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = "http://127.0.0.1:" + server.address().port;
      resolve();
    });
  });
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  const { pool } = require("../server/db");
  // Clean up the throwaway users (cascade removes their budgets).
  await pool.query("DELETE FROM users WHERE username = ANY($1)", [[userA, userB]]);
  await pool.end();
});

test("signup creates user A and seeds default data", async () => {
  const f = jar();
  const r = await f("/api/auth/signup", { method: "POST", body: JSON.stringify({ username: userA, password: pass }) });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.body.username, userA);

  const data = await f("/api/data", { method: "GET" });
  assert.strictEqual(data.status, 200);
  assert.ok(Array.isArray(data.body.categories), "has categories");
  assert.ok(data.body.categories.length > 0, "seeded with default categories");
  assert.deepStrictEqual(data.body.transactions, [], "no transactions yet");
});

test("save then reload returns the saved state", async () => {
  const f = jar();
  await f("/api/auth/login", { method: "POST", body: JSON.stringify({ username: userA, password: pass }) });

  const current = (await f("/api/data", { method: "GET" })).body;
  current.transactions.push({ id: "t_test", type: "expense", amount: 42, categoryId: "c_groc", date: "2026-06-12", note: "test" });
  const put = await f("/api/data", { method: "PUT", body: JSON.stringify(current) });
  assert.strictEqual(put.status, 200);

  const reloaded = (await f("/api/data", { method: "GET" })).body;
  assert.strictEqual(reloaded.transactions.length, 1);
  assert.strictEqual(reloaded.transactions[0].amount, 42);
});

test("user B cannot see user A's data (isolation)", async () => {
  const f = jar();
  const r = await f("/api/auth/signup", { method: "POST", body: JSON.stringify({ username: userB, password: pass }) });
  assert.strictEqual(r.status, 201);

  const data = (await f("/api/data", { method: "GET" })).body;
  assert.deepStrictEqual(data.transactions, [], "B sees its own clean slate, not A's transaction");
});

test("unauthenticated request to /api/data is rejected", async () => {
  const f = jar(); // no login
  const r = await f("/api/data", { method: "GET" });
  assert.strictEqual(r.status, 401);
});

test("duplicate username is rejected with 409", async () => {
  const f = jar();
  const r = await f("/api/auth/signup", { method: "POST", body: JSON.stringify({ username: userA, password: pass }) });
  assert.strictEqual(r.status, 409);
});

test("wrong password is rejected with 401", async () => {
  const f = jar();
  const r = await f("/api/auth/login", { method: "POST", body: JSON.stringify({ username: userA, password: "wrongpassword" }) });
  assert.strictEqual(r.status, 401);
});

test("short password is rejected on signup", async () => {
  const f = jar();
  const r = await f("/api/auth/signup", { method: "POST", body: JSON.stringify({ username: "shorty_" + stamp, password: "abc" }) });
  assert.strictEqual(r.status, 400);
});
