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
