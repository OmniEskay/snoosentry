import { Devvit } from "@devvit/public-api";
import { getSignalFromAPI } from "./api.js";
import { SignalForm } from "./forms.js";

export function registerMenuItems(): void {
  Devvit.addMenuItem({
    label: "🚦 Check Signal",
    location: "post",
    forUserType: "moderator",

    onPress: async (event, context) => {
      const post = await context.reddit.getPostById(event.targetId);
      const username = post.authorName ?? "unknown";

      context.ui.showToast(`Fetching signal for u/${username}…`);

      try {
        const signal = await getSignalFromAPI(username);
        // Ensure the signal is a plain JSON value for the form
        context.ui.showForm(SignalForm, { signal: JSON.parse(JSON.stringify(signal)) });
      } catch (err) {
        console.error("[snoosentry] menu post error", err);
        context.ui.showToast("⚠️  Could not fetch signal — check API connection.");
      }
    },
  });

  Devvit.addMenuItem({
    label: "🚦 Check Signal",
    location: "comment",
    forUserType: "moderator",

    onPress: async (event, context) => {
      const comment = await context.reddit.getCommentById(event.targetId);
      const username = comment.authorName ?? "unknown";

      context.ui.showToast(`Fetching signal for u/${username}…`);

      try {
        const signal = await getSignalFromAPI(username);
        // Ensure the signal is a plain JSON value for the form
        context.ui.showForm(SignalForm, { signal: JSON.parse(JSON.stringify(signal)) });
      } catch (err) {
        console.error("[snoosentry] menu comment error", err);
        context.ui.showToast("⚠️  Could not fetch signal — check API connection.");
      }
    },
  });
}