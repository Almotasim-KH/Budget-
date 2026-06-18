"use strict";

const path = require("path");
const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const { sessionPool } = require("./db");
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
      store: new MySQLStore({ createDatabaseTable: true }, sessionPool),
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

  // Serve the frontend folder (index.html, css/, js/, lang/). backend/, .env and
  // test/ live outside it, so they stay private.
  app.use(express.static(path.join(__dirname, "..", "frontend")));

  return app;
}

module.exports = { buildApp };
