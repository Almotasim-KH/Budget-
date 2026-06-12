"use strict";

const path = require("path");
const express = require("express");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);

const { pool } = require("./db");
const { router: authRouter } = require("./auth");
const dataRouter = require("./data");

/**
 * Build the Express app (without starting a listener). Used by index.js for
 * the real server and by tests for an ephemeral-port instance.
 */
function buildApp() {
  const isProd = process.env.NODE_ENV === "production";
  const app = express();

  if (isProd) app.set("trust proxy", 1);

  app.use(express.json({ limit: "5mb" }));

  app.use(
    session({
      store: new PgSession({ pool, tableName: "session", createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
      }
    })
  );

  app.use("/api/auth", authRouter);
  app.use("/api/data", dataRouter);

  // Serve ONLY index.html (not the whole folder) so .env/server/docs stay private.
  const INDEX_HTML = path.join(__dirname, "..", "index.html");
  app.get("/", (req, res) => res.sendFile(INDEX_HTML));

  return app;
}

module.exports = { buildApp };
