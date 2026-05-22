import { Devvit } from "@devvit/public-api";
import { registerMenuItems } from "./menu.js";
import { registerTriggers } from "./triggers.js";

Devvit.configure({
  redditAPI: true,
  http: true,      // ← enabled Day 2: outbound fetch to signal API
  // kvStore: true  ← enable Day 3 for caching
});

registerMenuItems();
registerTriggers();

export default Devvit;