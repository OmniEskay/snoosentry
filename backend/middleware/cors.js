"use strict";

const cors = require("cors");
const config = require("../config");

const corsOptions = {
  origin: config.allowedOrigins.length > 0 ? config.allowedOrigins : "*",
  methods: ["GET", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept"],
  // Preflight cache — browser caches OPTIONS response for 10 min
  maxAge: 600,
};

module.exports = cors(corsOptions);