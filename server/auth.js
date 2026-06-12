"use strict";

const express = require("express");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const { pool } = require("./db");
const { defaultData } = require("./seed");
const { validateCredentials } = require("./validate");

const BCRYPT_COST = 12;

const router = express.Router();

// Slow down brute-force / signup abuse: max 20 attempts per IP per 15 min.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." }
});

/**
 * Middleware that rejects unauthenticated requests with 401.
 * Mounted by callers that need a logged-in user.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: "Not logged in." });
}

// POST /api/auth/signup — create user, seed default budget, start session.
router.post("/signup", authLimiter, async (req, res) => {
  const v = validateCredentials(req.body || {});
  if (!v.ok) return res.status(400).json({ error: v.error });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const exists = await client.query("SELECT 1 FROM users WHERE username = $1", [v.username]);
    if (exists.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "That username is already taken." });
    }

    const hash = await bcrypt.hash(v.password, BCRYPT_COST);
    const inserted = await client.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id",
      [v.username, hash]
    );
    const userId = inserted.rows[0].id;

    await client.query(
      "INSERT INTO budgets (user_id, state) VALUES ($1, $2)",
      [userId, JSON.stringify(defaultData())]
    );

    await client.query("COMMIT");

    req.session.userId = userId;
    req.session.username = v.username;
    return res.status(201).json({ username: v.username });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("signup error:", err);
    return res.status(500).json({ error: "Could not create account." });
  } finally {
    client.release();
  }
});

// POST /api/auth/login — verify password, start session.
router.post("/login", authLimiter, async (req, res) => {
  const v = validateCredentials(req.body || {});
  // Use a generic message so we don't reveal whether the username exists.
  if (!v.ok) return res.status(401).json({ error: "Invalid username or password." });

  try {
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE username = $1",
      [v.username]
    );
    if (result.rowCount === 0) {
      // Run a dummy compare to keep timing roughly constant.
      await bcrypt.compare(v.password, "$2b$12$" + "x".repeat(53));
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(v.password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid username or password." });

    req.session.userId = user.id;
    req.session.username = v.username;
    return res.json({ username: v.username });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// POST /api/auth/logout — destroy session.
router.post("/logout", (req, res) => {
  if (!req.session) return res.json({ ok: true });
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// GET /api/auth/me — who am I (frontend checks this on load).
router.get("/me", (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ username: req.session.username });
  }
  return res.status(401).json({ error: "Not logged in." });
});

module.exports = { router, requireAuth };
