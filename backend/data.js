"use strict";

const express = require("express");
const { pool } = require("./db");
const { requireAuth } = require("./auth");
const { defaultData } = require("./seed");

const router = express.Router();

// The category IDs a brand-new account is seeded with. Used to recognize an
// untouched "fresh defaults" payload so we never let it clobber real data.
const SEED_CATEGORY_IDS = defaultData().categories.map((c) => c.id).sort();

// True when `state` looks exactly like the untouched seed: no transactions,
// no bills, no goals, and the default category set. The frontend starts every
// page load with this shape (defaultData()), so if such a payload ever reaches
// the server it almost certainly means the user's real data had not loaded yet
// — saving it would wipe a real account. We refuse that overwrite below.
function looksLikeFreshSeed(state) {
  const txEmpty = Array.isArray(state.transactions) && state.transactions.length === 0;
  const billsEmpty = !Array.isArray(state.bills) || state.bills.length === 0;
  const goalsEmpty = !Array.isArray(state.goals) || state.goals.length === 0;
  if (!txEmpty || !billsEmpty || !goalsEmpty) return false;
  const ids = (state.categories || []).map((c) => c.id).sort();
  return ids.length === SEED_CATEGORY_IDS.length &&
    ids.every((id, i) => id === SEED_CATEGORY_IDS[i]);
}

// True when the stored row already holds real user data worth protecting.
function hasRealData(state) {
  if (!state || typeof state !== "object") return false;
  return (Array.isArray(state.transactions) && state.transactions.length > 0) ||
    (Array.isArray(state.bills) && state.bills.length > 0) ||
    (Array.isArray(state.goals) && state.goals.length > 0);
}

// Every route here requires a logged-in user.
router.use(requireAuth);

// GET /api/data — return the logged-in user's finance state.
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT state FROM budgets WHERE user_id = ?",
      [req.session.userId]
    );
    if (rows.length === 0) {
      // Self-heal: a user with no budget row gets fresh defaults.
      const state = defaultData();
      await pool.query(
        "INSERT IGNORE INTO budgets (user_id, state) VALUES (?, ?)",
        [req.session.userId, JSON.stringify(state)]
      );
      return res.json(state);
    }
    // MySQL returns JSON columns as objects; MariaDB returns them as strings.
    const raw = rows[0].state;
    return res.json(typeof raw === "string" ? JSON.parse(raw) : raw);
  } catch (err) {
    console.error("GET /api/data error:", err);
    return res.status(500).json({ error: "Could not load your data." });
  }
});

// PUT /api/data — overwrite the logged-in user's finance state.
router.put("/", async (req, res) => {
  const state = req.body;
  // Basic shape check: must be the app state object, not an array or primitive.
  if (!state || typeof state !== "object" || Array.isArray(state) ||
      !Array.isArray(state.categories) || !Array.isArray(state.transactions)) {
    return res.status(400).json({ error: "Invalid data shape." });
  }

  try {
    // Safety net: never let an untouched "fresh defaults" payload overwrite an
    // account that already holds real data. This blocks the only way a save
    // could ever wipe a user (e.g. a save firing before their data finished
    // loading). Deploys never reach here — this guards the data itself.
    if (looksLikeFreshSeed(state)) {
      const [rows] = await pool.query(
        "SELECT state FROM budgets WHERE user_id = ?",
        [req.session.userId]
      );
      if (rows.length > 0) {
        const raw = rows[0].state;
        const existing = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (hasRealData(existing)) {
          console.warn(
            "PUT /api/data: refused to overwrite existing data with fresh defaults for user",
            req.session.userId
          );
          // Return the real stored data so the client re-syncs instead of wiping.
          return res.status(200).json(existing);
        }
      }
    }

    await pool.query(
      `INSERT INTO budgets (user_id, state, updated_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE state = VALUES(state), updated_at = NOW()`,
      [req.session.userId, JSON.stringify(state)]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/data error:", err);
    return res.status(500).json({ error: "Could not save your data." });
  }
});

module.exports = router;
