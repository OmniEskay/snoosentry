"use strict";

require("dotenv").config();

const config = {
  // ── Server ────────────────────────────────────────────────────────────────
  port: parseInt(process.env.PORT ?? "3001", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isDev: (process.env.NODE_ENV ?? "development") === "development",

  // ── CORS ──────────────────────────────────────────────────────────────────
  // In dev, ALLOWED_ORIGINS is blank → allowedOrigins is empty array → we
  // fall back to "*" in the cors middleware.
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : [],

  // ── Rate limiting ─────────────────────────────────────────────────────────
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? "60", 10),
  },

  // ── Reddit API (Day 2) ────────────────────────────────────────────────────
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID ?? "",
    clientSecret: process.env.REDDIT_CLIENT_SECRET ?? "",
    userAgent: process.env.REDDIT_USER_AGENT ?? "SnoSentry/1.0",
  },
};

module.exports = config;