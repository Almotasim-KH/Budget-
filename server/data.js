"use strict";

const express = require("express");
const { pool } = require("./db");
const { requireAuth } = require("./auth");
const { defaultData } = require("./seed");

const router = express.Router();

// Every route here requires a logged-in user.
router.use(requireAuth);

// GET /api/data — return the logged-in user's finance state.
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT state FROM budgets WHERE user_id = $1",
      [req.session.userId]
    );
    if (result.rowCount === 0) {
      // Self-heal: a user with no budget row gets fresh defaults.
      const state = defaultData();
      await pool.query(
        "INSERT INTO budgets (user_id, state) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING",
        [req.session.userId, JSON.stringify(state)]
      );
      return res.json(state);
    }
    return res.json(result.rows[0].state);
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
    await pool.query(
      `INSERT INTO budgets (user_id, state, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id)
       DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
      [req.session.userId, JSON.stringify(state)]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/data error:", err);
    return res.status(500).json({ error: "Could not save your data." });
  }
});

module.exports = router;
