"use strict";

const express = require("express");
const config = require("./config");
const corsMiddleware = require("./middleware/cors");
const signalRouter = require("./routes/signal");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(corsMiddleware);

// Log every incoming request in dev
if (config.isDev) {
  app.use((req, _res, next) => {
    console.log(`[snoosentry-api] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/v1", signalRouter);

// Health — probed by Devvit HTTP plugin and uptime monitors
app.get("/health", (_req, res) => {
  res.json({ status: "ok", app: "snoosentry-api", env: config.nodeEnv });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[snoosentry-api] unhandled error", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`[snoosentry-api] listening on http://localhost:${config.port}`);
  console.log(`[snoosentry-api] env=${config.nodeEnv}`);
});

module.exports = app;