"use strict";

const rateLimit = require("express-rate-limit");
const config = require("../config");

const signalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,   // Return RateLimit-* headers
  legacyHeaders: false,
  message: {
    error: "Too many requests — please slow down.",
    retryAfterMs: config.rateLimit.windowMs,
  },
  // Skip rate limiting in tests
  skip: () => process.env.NODE_ENV === "test",
});

module.exports = { signalLimiter };