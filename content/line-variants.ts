/**
 * Catalst v8 — Path-specific dialogue variants.
 *
 * Keyed by dotted line path ("s04.pip.intro"). Each entry may hold:
 *   - directed: Path B variant (user came in with an idea)
 *   - shortcut: Path C variant (LLM shortcut — mostly placeholder for now)
 *
 * Missing keys / missing variants fall back to the default in
 * content/lines.ts via the pathLine() helper in lib/speakPath.ts.
 *
 * Editing rule: these strings are safe to change at any time.
 * Renaming a KEY here requires the matching change at the call site.
 *
 * ──────────────────────────────────────────────────────────────
 * Voice bible, short form:
 *   Pip    → excited, vulnerable, says the private doubt out loud
 *   Cedric → dry, deadpan, one clipped sentence undercuts Pip
 *   Path B = the user is secretly anxious about the idea they brought;
 *            tease the idea-bringing gently, then Cedric lands the
 *            straight-faced "process still matters" beat.
 * ──────────────────────────────────────────────────────────────
 */

export interface LineVariant {
  directed?: string;
  shortcut?: string;
}

export const LINE_VARIANTS: Record<string, LineVariant> = {
  // ── S01 — The Fork ─────────────────────────────────────────
  's01.pip.entrance': {
    directed: "A brave one. You brought homework. I'd have just shown up.",
  },
  's01.pip.pathB_submitReaction': {
    // Default is already the directed-tone line — no override needed
  },
  's01.cedric.pathB.submitReply': {
    // Default is already the directed-tone reply — no override needed
  },

  // ── S02 — Rorschach Blot ───────────────────────────────────
  's02.pip.entrance': {
    directed: "Yes, you have an idea. Yes, we're looking at shapes. Cedric says there's a reason.",
  },
  's02.cedric.entrance_reply': {
    directed: "There is a reason.",
  },

  // ── S03 — Word Association ─────────────────────────────────
  's03.pip.entrance': {
    directed: "You could describe your idea in four words. I dare you.",
  },
  's03.cedric.entrance_reply': {
    directed: "He is not daring you. Four words.",
  },

  // ── S04 — Industry Swipe ───────────────────────────────────
  's04.pip.intro': {
    directed: "Swiping industries even though you brought an idea. Bold. I respect the pattern hunt.",
  },
  's04.pip.afterFirstKeep': {
    directed: "Oh? Thought we were married to your idea.",
  },
  's04.pip.atThreshold': {
    directed: "Wider net than you let on. Your idea has cousins.",
  },
  's04.pip.afterFirstEdge': {
    // keep default — "edged" reactions read the same regardless of path
  },

  // ── S09 — Ideas Reveal ─────────────────────────────────────
  's09.pip.reveal': {
    directed: "Your idea's on the left. Three more on the right. One is what you said. Two are what you meant.",
  },

  // ── S10 — Challenge / Founder Card ─────────────────────────
  's10.pip.nudge': {
    directed: "Your idea made it this far. Hand it a card. It earned one.",
  },
  's10.cedric.nudge_reply': {
    // default "It was not up to you, Pip." works for both paths
  },

  // ── S11 — Closing ──────────────────────────────────────────
  's11.pip.farewell': {
    directed: "You came in with one idea. You leave with four cousins. Good trade.",
  },
  's11.cedric.farewell_reply': {
    // default "Goodbye, traveler." works for both paths
  },
};
