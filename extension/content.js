const API_BASE = "http://localhost:3001";

// ── Tier → badge style ────────────────────────────────────────────────────────
const TIER_STYLE = {
  green:  { bg: "#22c55e", color: "#fff", label: "✓ Clean"      },
  yellow: { bg: "#eab308", color: "#fff", label: "⚠ Watch"      },
  orange: { bg: "#f97316", color: "#fff", label: "● Suspicious"  },
  red:    { bg: "#ef4444", color: "#fff", label: "✕ High Risk"   },
};

// Track injected usernames so we don't double-badge
const injected = new Set();

// ── Badge rendering ───────────────────────────────────────────────────────────

/**
 * Creates and returns a badge element for the given signal.
 * @param {object} signal
 * @returns {HTMLElement}
 */
function createBadge(signal) {
  const style = TIER_STYLE[signal.tier] ?? TIER_STYLE.yellow;
  const badge = document.createElement("span");

  badge.setAttribute("data-snoosentry", signal.tier);
  badge.title = [
    `SnoSentry — u/${signal.username}`,
    `Tier: ${signal.tier.toUpperCase()}`,
    `Account age: ${signal.account_age}`,
    `Karma: ${signal.karma}`,
    `Bans: ${signal.ban_count} in ${signal.window_days}d`,
    `Reasons: ${Object.entries(signal.reasons ?? {}).map(([k,v]) => `${k}×${v}`).join(", ") || "none"}`,
  ].join("\n");

  Object.assign(badge.style, {
    display:       "inline-flex",
    alignItems:    "center",
    background:    style.bg,
    color:         style.color,
    borderRadius:  "4px",
    fontSize:      "11px",
    fontWeight:    "600",
    padding:       "1px 6px",
    marginLeft:    "6px",
    verticalAlign: "middle",
    cursor:        "default",
    fontFamily:    "system-ui, sans-serif",
    lineHeight:    "18px",
    whiteSpace:    "nowrap",
    userSelect:    "none",
  });

  badge.textContent = style.label;
  return badge;
}

/**
 * Injects a badge after the first element matching `selector`.
 * @param {string}   username
 * @param {string}   selector   CSS selector for the anchor element
 * @param {object}   signal
 */
function injectBadge(username, selector, signal) {
  const el = document.querySelector(selector);
  if (!el) return;

  // Remove any existing badge for this element
  const existing = el.parentNode?.querySelector(`[data-snoosentry]`);
  if (existing) existing.remove();

  el.insertAdjacentElement("afterend", createBadge(signal));
  injected.add(username);
}

// ── Page detection ────────────────────────────────────────────────────────────

function detectPageType() {
  const path = window.location.pathname;
  if (/^\/user\/[^/]+/.test(path)) return "profile";
  if (/\/about\/(modqueue|reports|spam)/.test(path)) return "modqueue";
  return null;
}

// ── Username extraction ───────────────────────────────────────────────────────

function getUsernameFromProfilePage() {
  const match = window.location.pathname.match(/^\/user\/([^/]+)/);
  if (match) return match[1];
  const h1 = document.querySelector("h1.redditname a");
  return h1 ? h1.textContent.trim() : null;
}

function getModQueueUsers() {
  const seen = new Set();
  document.querySelectorAll('a[href^="/user/"]').forEach((a) => {
    const m = a.getAttribute("href").match(/^\/user\/([^/]+)/);
    if (m && !injected.has(m[1])) seen.add(m[1]);
  });
  return [...seen];
}

// ── API ───────────────────────────────────────────────────────────────────────

async function fetchSignal(username) {
  const res = await fetch(
    `${API_BASE}/v1/signal?u=${encodeURIComponent(username)}`
  );
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ── Profile page handler ──────────────────────────────────────────────────────

async function handleProfilePage(username) {
  try {
    const signal = await fetchSignal(username);
    console.log(`[SnoSentry] signal for u/${username}`, signal);

    // New Reddit: username heading
    // Try multiple selectors across Reddit's changing DOM
    const selectors = [
      `h1[id*="profile-title"]`,
      `[data-testid="profile_page"] h1`,
      `h1`,
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent?.includes(username)) {
        injectBadge(username, sel, signal);
        break;
      }
    }
  } catch (err) {
    console.error(`[SnoSentry] profile badge failed for u/${username}`, err);
  }
}

// ── Mod queue handler ─────────────────────────────────────────────────────────

async function handleModQueueUsers(usernames) {
  for (const username of usernames) {
    try {
      const signal = await fetchSignal(username);
      console.log(`[SnoSentry] signal for u/${username}`, signal);

      // Find the user link in the mod queue and badge after it
      const links = document.querySelectorAll(`a[href^="/user/${username}"]`);
      if (links.length > 0) {
        const target = links[0];
        // Don't badge nav items — only mod queue author links
        if (!target.closest("[data-snoosentry]")) {
          const badge = createBadge(signal);
          target.insertAdjacentElement("afterend", badge);
          injected.add(username);
        }
      }
    } catch (err) {
      console.error(`[SnoSentry] mod queue badge failed for u/${username}`, err);
    }
  }
}

// ── Entry ─────────────────────────────────────────────────────────────────────

(function main() {
  const pageType = detectPageType();
  if (!pageType) return;

  console.log(`[SnoSentry] page=${pageType}`);

  if (pageType === "profile") {
    const username = getUsernameFromProfilePage();
    if (!username) return;

    // New Reddit renders asynchronously — wait for the h1 to appear
    const waitForHeading = new MutationObserver(() => {
      const h1 = document.querySelector("h1");
      if (h1) {
        waitForHeading.disconnect();
        handleProfilePage(username);
      }
    });
    waitForHeading.observe(document.body, { childList: true, subtree: true });

    // Also try immediately in case the page is already rendered (old Reddit)
    handleProfilePage(username);
    return;
  }

  if (pageType === "modqueue") {
    const users = getModQueueUsers();
    if (users.length > 0) {
      handleModQueueUsers(users);
    }

    // Watch for new items loaded as mod scrolls
    const observer = new MutationObserver(() => {
      const fresh = getModQueueUsers();
      if (fresh.length > 0) handleModQueueUsers(fresh);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();