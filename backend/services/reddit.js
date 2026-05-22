"use strict";

const config = require("../config");

const REDDIT_API = "https://oauth.reddit.com";
const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";


let _tokenCache = {
  access_token: null,
  expires_at: 0,
};

async function getAccessToken() {
  const now = Date.now();

  if (_tokenCache.access_token && _tokenCache.expires_at - now > 60_000) {
    return _tokenCache.access_token;
  }

  const credentials = Buffer.from(
    `${config.reddit.clientId}:${config.reddit.clientSecret}`
  ).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": config.reddit.userAgent,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Reddit OAuth failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  _tokenCache = {
    access_token: data.access_token,
    expires_at: now + data.expires_in * 1000,
  };

  console.log("[reddit] fetched fresh OAuth token");
  return _tokenCache.access_token;
}

/**
 * Generic authenticated GET to the Reddit API.
 * @param {string} path  e.g. "/user/spez/about"
 * @returns {Promise<object>}
 */
async function redditGet(path) {
  const token = await getAccessToken();

  const res = await fetch(`${REDDIT_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": config.reddit.userAgent,
      Accept: "application/json",
    },
  });

  if (res.status === 404) {
    return null; // user not found / suspended / deleted
  }

  if (!res.ok) {
    throw new Error(`Reddit API error: ${res.status} ${res.statusText} (${path})`);
  }

  return res.json();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch public account info for a Reddit username.
 *
 * Returns null if the account doesn't exist or is suspended.
 *
 * @param {string} username
 * @returns {Promise<object|null>}
 *
 * Relevant fields on the returned `data` object:
 *   - created_utc      {number}  Unix timestamp of account creation
 *   - link_karma       {number}
 *   - comment_karma    {number}
 *   - is_suspended     {boolean}
 *   - name             {string}
 */
async function getUserInfo(username) {
  const body = await redditGet(`/user/${encodeURIComponent(username)}/about`);
  return body?.data ?? null;
}

/**
 * Fetch the 100 most recent posts and comments for a user.
 * Used to detect spam patterns (high post rate, link farming, etc.)
 *
 * @param {string} username
 * @returns {Promise<Array>}
 */
async function getUserOverview(username) {
  const body = await redditGet(
    `/user/${encodeURIComponent(username)}/overview?limit=100&sort=new`
  );
  return body?.data?.children?.map((c) => c.data) ?? [];
}

module.exports = { getUserInfo, getUserOverview };