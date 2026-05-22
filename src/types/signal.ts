export type SignalTier = "green" | "yellow" | "orange" | "red";

export const TIER_LABEL: Record<SignalTier, string> = {
  green:  "✅  Clean",
  yellow: "⚠️  Watch",
  orange: "🟠  Suspicious",
  red:    "🚨  High Risk",
};

export const TIER_COLOUR: Record<SignalTier, string> = {
  green:  "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red:    "#ef4444",
};

export interface SignalReasons {
  spam?:             number;
  harassment?:       number;
  hate?:             number;
  ban_evasion?:      number;
  new_account?:      number;
  negative_karma?:   number;
  suspended?:        number;
  account_not_found?: number;
  [key: string]:     number | undefined; // allow future reason keys
}

export type AccountAge = "new" | "young" | "established" | "unknown";

export type KarmaLevel = "negative" | "low" | "normal" | "high" | "unknown";

export interface Signal {
  username:    string;
  tier:        SignalTier;
  ban_count:   number;
  team_count:  number;
  window_days: number;
  reasons:     SignalReasons;
  account_age: AccountAge;
  karma:       KarmaLevel;
  fetched_at:  string;
  [key: string]: unknown;
}

export const FAKE_SIGNAL: Omit<Signal, "username" | "fetched_at"> = {
  tier:        "orange",
  ban_count:   5,
  team_count:  4,
  window_days: 12,
  reasons: {
    spam:       2,
    harassment: 1,
  },
  account_age: "new",
  karma:       "low",
};