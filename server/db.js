"use strict";

const mysql = require("mysql2");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

// Raw (callback-style) pool — express-mysql-session needs this form.
// We expose a promise wrapper for our own async/await queries.
const sessionPool = mysql.createPool(process.env.DATABASE_URL);
const pool = sessionPool.promise();

/**
 * Create the application tables if they don't already exist.
 * The session table is created separately by express-mysql-session.
 */
async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      username      VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      user_id    INT PRIMARY KEY,
      state      JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_budgets_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

module.exports = { pool, sessionPool, initSchema };
