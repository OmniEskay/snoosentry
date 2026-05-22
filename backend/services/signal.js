"use strict";

const { getUserInfo, getUserOverview } = require("./reddit");


const WINDOW_DAYS = 30; // lookback window for activity scoring

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Age of an account in days from created_utc. */
function accountAgeDays(createdUtc) {
  return (Date.now() / 1000 - createdUtc) / 86400;
}

/** Bucket account age into a label. */
function ageLabel(days) {
  if (days < 30) return "new";
  if (days < 180) return "young";
  return "established";
}

/** Bucket karma into a label. */
function karmaLabel(total) {
  if (total < 0) return "negative";
  if (total <= 100) return "low";
  if (total <= 5000) return "normal";
  return "high";
}

/** Map accumulated score to a tier string. */
function scoreToTier(score) {
  if (score >= 7) return "red";
  if (score >= 4) return "orange";
  if (score >= 2) return "yellow";
  return "green";
}

// ── Core computation ──────────────────────────────────────────────────────────

/**
 * Computes a signal object from raw Reddit user data.
 *
 * @param {object} userInfo     - from getUserInfo()
 * @param {Array}  overview     - from getUserOverview()
 * @returns {object}            - Signal (without username/fetched_at)
 */
function computeSignal(userInfo, overview) {
  const reasons = {};
  let score = 0;

  // ── Account age ────────────────────────────────────────────────────────
  const ageDays = accountAgeDays(userInfo.created_utc);
  if (ageDays < 30) {
    score += 2;
    reasons.new_account = 1;
  } else if (ageDays < 180) {
    score += 1;
  }

  // ── Karma ──────────────────────────────────────────────────────────────
  const totalKarma = (userInfo.link_karma ?? 0) + (userInfo.comment_karma ?? 0);
  if (totalKarma < 0) {
    score += 2;
    reasons.negative_karma = 1;
  } else if (totalKarma <= 100) {
    score += 1;
  }

  // ── Suspended ─────────────────────────────────────────────────────────
  if (userInfo.is_suspended) {
    score += 3;
    reasons.suspended = 1;
  }

  // ── Activity pattern analysis ──────────────────────────────────────────
  if (overview.length > 0) {
    const posts = overview.filter((item) => item.title !== undefined); // posts have titles
    const comments = overview.length - posts.length;
    const postRatio = posts.length / overview.length;

    // High post-to-comment ratio = spammer signal
    if (postRatio > 0.8) {
      score += 2;
      reasons.spam = (reasons.spam ?? 0) + 1;
    } else if (postRatio > 0.6) {
      score += 1;
      reasons.spam = (reasons.spam ?? 0) + 1;
    }

    // Link spam: posts where url doesn't point to reddit
    const linkPosts = posts.filter(
      (p) => p.url && !p.url.includes("reddit.com") && !p.is_self
    );
    const linkRatio = posts.length > 0 ? linkPosts.length / posts.length : 0;

    if (linkRatio > 0.5) {
      score += 2;
      reasons.spam = (reasons.spam ?? 0) + 1;
    } else if (linkRatio > 0.3) {
      score += 1;
    }
  }

  return {
    tier: scoreToTier(score),
    // ban_count and team_count: Day 3 — requires mod log DB
    // For now, 0 until we have cross-sub ban data
    ban_count: 0,
    team_count: 0,
    window_days: WINDOW_DAYS,
    reasons,
    account_age: ageLabel(ageDays),
    karma: karmaLabel(totalKarma),
  };
}

async function getSignal(username) {
  const [userInfo, overview] = await Promise.all([
    getUserInfo(username),
    getUserOverview(username),
  ]);

  if (!userInfo) {
    // Account doesn't exist or is shadowbanned / deleted
    return {
      username,
      tier: "red",
      ban_count: 0,
      team_count: 0,
      window_days: WINDOW_DAYS,
      reasons: { account_not_found: 1 },
      account_age: "unknown",
      karma: "unknown",
      fetched_at: new Date().toISOString(),
    };
  }

  const signal = computeSignal(userInfo, overview);

  return {
    username,
    ...signal,
    fetched_at: new Date().toISOString(),
  };
}

module.exports = { getSignal };