export type SignalTier = "green" | "yellow" | "orange" | "red";

export interface SignalReasons {
  spam?: number;
  harassment?: number;
  hate?: number;
  ban_evasion?: number;
}

export interface Signal {
  username: string;
  tier: SignalTier;
  ban_count: number;
  team_count: number;        // how many mod teams have acted on this user
  window_days: number;       // lookback window used to compute the signal
  reasons: SignalReasons;
  account_age: "new" | "young" | "established";
  karma: "negative" | "low" | "normal" | "high";
  fetched_at: string;        // ISO timestamp
}

export const TIER_LABEL: Record<SignalTier, string> = {
  green: "✅  Clean",
  yellow: "⚠️  Watch",
  orange: "🟠  Suspicious",
  red: "🚨  High Risk",
};

export const TIER_COLOUR: Record<SignalTier, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
};

export const FAKE_SIGNAL: Omit<Signal, "username" | "fetched_at"> = {
  tier: "orange",
  ban_count: 5,
  team_count: 4,
  window_days: 12,
  reasons: {
    spam: 2,
    harassment: 1,
  },
  account_age: "new",
  karma: "low",
};

export async function fetchSignal(username: string): Promise<Signal> {
  // TODO (Day 2): replace with real HTTP fetch to Express backend
  return {
    username,
    ...FAKE_SIGNAL,
    fetched_at: new Date().toISOString(),
  };
}