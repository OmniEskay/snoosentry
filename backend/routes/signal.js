"use strict";

const { Router } = require("express");
const { validateUsername } = require("../middleware/validate");
const { signalLimiter } = require("../middleware/rateLimit");
const { getSignal } = require("../services/signal");
const config = require("../config");

const router = Router();

/**
 * GET /v1/signal?u=<username>
 *
 * Returns a risk signal object for the given Reddit username.
 *
 * Query params:
 *   u  {string}  Reddit username (required, 3–20 chars)
 *
 * Response 200:
 *   {
 *     username:    string,
 *     tier:        "green" | "yellow" | "orange" | "red",
 *     ban_count:   number,
 *     team_count:  number,
 *     window_days: number,
 *     reasons:     { [reason: string]: number },
 *     account_age: "new" | "young" | "established",
 *     karma:       "negative" | "low" | "normal" | "high",
 *     fetched_at:  string (ISO 8601)
 *   }
 *
 * Response 400: invalid / missing username
 * Response 429: rate limit exceeded
 * Response 500: Reddit API unreachable
 */
router.get("/signal", signalLimiter, validateUsername, async (req, res) => {
  const { username } = res.locals;

  console.log(`[snoosentry-api] GET /v1/signal u=${username}`);

  // If Reddit credentials are absent, return fake data regardless of
  // NODE_ENV — covers the case where .env hasn't been filled in yet.
  const missingCreds =
    !config.reddit.clientId || !config.reddit.clientSecret;

  if (missingCreds) {
    console.warn(
      "[snoosentry-api] REDDIT_CLIENT_ID/SECRET not set — returning fake signal"
    );
    return res.json({
      username,
      tier: "orange",
      ban_count: 5,
      team_count: 4,
      window_days: 30,
      reasons: { spam: 2, harassment: 1 },
      account_age: "new",
      karma: "low",
      fetched_at: new Date().toISOString(),
      _fake: true,
    });
  }

  try {
    const signal = await getSignal(username);
    return res.json(signal);
  } catch (err) {
    console.error(`[snoosentry-api] signal error for u=${username}`, err.message);
    return res.status(500).json({
      error: "Failed to fetch signal from Reddit API",
      detail: config.isDev ? err.message : undefined,
    });
  }
});

module.exports = router;