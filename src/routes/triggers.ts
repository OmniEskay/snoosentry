import { Devvit } from "@devvit/public-api";
import { getSignalFromAPI } from "./api.js";

export function registerTriggers(): void {
  Devvit.addTrigger({
    event: "PostSubmit",

    onEvent: async (event, context) => {
      const username = event.author?.name;
      const postId = event.post?.id;

      if (!username || !postId) return;

      let signal;
      try {
        signal = await getSignalFromAPI(username);
      } catch (err) {
        console.error(`[snoosentry][PostSubmit] signal fetch failed for u/${username}`, err);
        return;
      }

      console.log(`[snoosentry][PostSubmit] u/${username} tier=${signal.tier}`);

      if (signal.tier === "red") {
        const thingId = `t3_${postId}`;

        try {
          const post = await context.reddit.getPostById(thingId);
          await post.remove(false);
          await context.reddit.report(post, {
            reason: `SnoSentry auto-flag: red tier (${Object.keys(signal.reasons).join(", ")})`,
          });
          console.log(`[snoosentry][PostSubmit] removed + reported post ${thingId} by u/${username}`);
        } catch (err) {
          console.error(`[snoosentry][PostSubmit] remove/report failed for ${thingId}`, err);
        }
      }
    },
  });

  Devvit.addTrigger({
    event: "ModMail",

    onEvent: async (event, context) => {
      const username = event.messageAuthor?.name;
      const conversationId = event.conversationId;

      if (!username || !conversationId) return;

      let signal;
      try {
        signal = await getSignalFromAPI(username);
      } catch (err) {
        console.error(`[snoosentry][ModMail] signal fetch failed for u/${username}`, err);
        return;
      }

      console.log(`[snoosentry][ModMail] u/${username} tier=${signal.tier}`);
      if (signal.tier === "green") return;

      const tierEmoji: Record<string, string> = {
        yellow: "⚠️",
        orange: "🟠",
        red: "🚨",
      };

      const note = [
        `${tierEmoji[signal.tier] ?? "🚦"} **SnoSentry Signal — u/${username}**`,
        `Tier: ${signal.tier.toUpperCase()}`,
        `Account age: ${signal.account_age}  |  Karma: ${signal.karma}`,
        `Bans: ${signal.ban_count} in ${signal.window_days}d`,
        `Reasons: ${Object.entries(signal.reasons).map(([k, v]) => `${k} ×${v}`).join(", ") || "none"}`,
      ].join("\n");

      try {
        await context.reddit.modMail.reply({
          conversationId,
          body: note,
          isInternal: true,   // only visible to mods, not the sender
          isAuthorHidden: true,
        });
      } catch (err) {
        console.error(`[snoosentry][ModMail] reply failed for ${conversationId}`, err);
      }
    },
  });
}