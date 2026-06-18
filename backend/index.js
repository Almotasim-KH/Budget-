"use strict";

require("dotenv").config();

// `npm run dev` passes --dev to run locally without MySQL, even when the
// committed .env sets NODE_ENV=production for the live server.
if (process.argv.includes("--dev")) process.env.NODE_ENV = "development";

const { initSchema } = require("./db");
const { buildApp } = require("./app");

const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

async function start() {
  // Listen first so a transient DB hiccup at boot doesn't take the site down.
  const app = buildApp();
  app.listen(PORT, () => {
    console.log(`Budget app listening on port ${PORT}`);
  });

  if (!isProd) {
    console.log("Dev mode: in-memory sessions, MySQL not required (guest mode only).");
    return;
  }

  try {
    await initSchema();
    console.log("Schema ready.");
  } catch (err) {
    console.error("initSchema failed:", err.message);
  }
}

start();
