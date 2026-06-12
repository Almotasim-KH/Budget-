"use strict";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;

/**
 * Validate credentials from a signup/login request body.
 * Returns { ok: true, username } or { ok: false, error }.
 */
function validateCredentials(body) {
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error: "Username must be 3–32 characters: letters, numbers, or underscore."
    };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (password.length > 200) {
    return { ok: false, error: "Password is too long." };
  }
  return { ok: true, username, password };
}

module.exports = { validateCredentials };
