"use strict";

require("dotenv").config();

const { initSchema } = require("./db");
const { buildApp } = require("./app");

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initSchema();
    const app = buildApp();
    app.listen(PORT, () => {
      console.log(`Budget app running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start — is PostgreSQL running and DATABASE_URL correct?");
    console.error(err.message);
    process.exit(1);
  }
}

start();
