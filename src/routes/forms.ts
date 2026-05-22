import { Devvit } from "@devvit/public-api";
import type { Signal } from "../types/index.js";
import type { DevvitFormData } from "../types/index.js";
import { TIER_LABEL, MOD_ACTION_LABEL, MOD_ACTION_TOAST } from "../types/index.js";

function formatReasons(reasons: Signal["reasons"]): string {
  const entries = Object.entries(reasons).filter(
    (e): e is [string, number] => typeof e[1] === "number"
  );
  if (entries.length === 0) return "None detected";
  return entries.map(([k, v]) => `${k} ×${v}`).join(", ");
}

export const SignalForm = Devvit.createForm(
  (data: DevvitFormData) => {
    const s = data.signal as Signal;
    const tierLine = TIER_LABEL[s.tier];
    const banLine =
      s.ban_count > 0
        ? `${s.ban_count} ban(s) across ${s.team_count} team(s) in ${s.window_days}d`
        : `No bans recorded in last ${s.window_days}d`;

    return {
      title: `🚦 Signal — u/${s.username}`,
      description: [
        `Tier:         ${tierLine}`,
        `Bans:         ${banLine}`,
        `Account age:  ${s.account_age}`,
        `Karma:        ${s.karma}`,
        `Reasons:      ${formatReasons(s.reasons)}`,
        `Checked:      ${new Date(s.fetched_at as string).toUTCString()}`,
      ].join("\n"),
      fields: [
        {
          name: "action",
          label: "Take action",
          type: "select" as const,
          options: [
            { label: MOD_ACTION_LABEL.none,     value: "none"     },
            { label: MOD_ACTION_LABEL.remove,   value: "remove"   },
            { label: MOD_ACTION_LABEL.ban,      value: "ban"      },
            { label: MOD_ACTION_LABEL.escalate, value: "escalate" },
          ],
          defaultValue: ["none"],
        },
      ],
      acceptLabel: "Confirm",
      cancelLabel: "Close",
    };
  },

  async (event: { values: DevvitFormData }, context) => {
    const action = (event.values.action as string[] | undefined)?.[0] ?? "none";
    context.ui.showToast(MOD_ACTION_TOAST[action as keyof typeof MOD_ACTION_TOAST] ?? "Done.");
  }
);