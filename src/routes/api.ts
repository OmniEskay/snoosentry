import type { Signal } from "../core/nuke.js";
import { FAKE_SIGNAL } from "../core/nuke.js";

// Set this to your deployed Express backend URL.
// e.g. https://snoosentry-api.fly.dev
const API_URL = "https://your-api.example.com";

export async function getSignalFromAPI(username: string): Promise<Signal> {
  if (API_URL === "https://your-api.example.com") {
    // Not yet deployed — return fake signal so Devvit menu still works
    console.warn("[snoosentry] API_URL not configured — using fake signal");
    return { username, ...FAKE_SIGNAL, fetched_at: new Date().toISOString() };
  }

  const url = `${API_URL}/v1/signal?u=${encodeURIComponent(username)}`;
  console.log(`[snoosentry] fetching ${url}`);

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Signal API error: ${res.status} for u/${username}`);
  }

  return (await res.json()) as Signal;
}