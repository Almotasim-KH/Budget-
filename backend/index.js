"use strict";

require("dotenv").config();

const { initSchema } = require("./db");
const { buildApp } = require("./app");

const PORT = process.env.PORT || 3000;

async function start() {
  // Listen first so a transient DB hiccup at boot doesn't take the site down.
  const app = buildApp();
  app.listen(PORT, () => {
    console.log(`Budget app listening on port ${PORT}`);
  });

  try {
    await initSchema();
    console.log("Schema ready.");
  } catch (err) {
    console.error("initSchema failed:", err.message);
  }
}

start();
