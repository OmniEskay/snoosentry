
import type { Signal } from "./signal.js";
export type DevvitFormData = { [key: string]: any };

export interface SignalFormData {
  signal: Signal;
}

export interface DevvitFormSubmitEvent<T = { [key: string]: unknown }> {
  values: T;
}

export type SignalFormSubmitEvent = DevvitFormSubmitEvent<{
  action?: string[];
}>;

export type ModAction = "none" | "remove" | "ban" | "escalate";

export const MOD_ACTION_LABEL: Record<ModAction, string> = {
  none:     "No action — just reviewing",
  remove:   "Remove post / comment",
  ban:      "Ban user from subreddit",
  escalate: "Escalate to senior mod",
};

export const MOD_ACTION_TOAST: Record<ModAction, string> = {
  none:     "Signal reviewed — no action taken.",
  remove:   "🗑️  Remove queued (Day 3 implementation)",
  ban:      "🔨  Ban queued (Day 3 implementation)",
  escalate: "📨  Escalated to senior mod (Day 3 implementation)",
};

export const TIER_EMOJI: Record<string, string> = {
  green:  "✅",
  yellow: "⚠️",
  orange: "🟠",
  red:    "🚨",
};