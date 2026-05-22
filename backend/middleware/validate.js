"use strict";

const USERNAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{1,18}[A-Za-z0-9]$|^[A-Za-z0-9]{3}$/;

function validateUsername(req, res, next) {
  const { u } = req.query;

  if (!u || typeof u !== "string" || u.trim() === "") {
    return res.status(400).json({
      error: "Missing required query parameter: u (Reddit username)",
    });
  }

  const username = u.trim();

  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({
      error: `Invalid username "${username}". Must be 3–20 chars, alphanumeric, underscores and hyphens only.`,
    });
  }

  // Attach clean value so route handler doesn't re-trim
  res.locals.username = username;
  return next();
}

module.exports = { validateUsername };