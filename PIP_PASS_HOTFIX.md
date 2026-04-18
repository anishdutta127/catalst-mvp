# Catalst v8 — Pip Pass + S01 Back Button Hotfix

**Two fixes from manual testing:**
1. Clicking "I have an idea" on S01 traps the user — no back button to return to the 3-path fork.
2. Pip says the same lines regardless of path (A/B/C) and disappears for entire screens. Users get bored. Pip's whole point is character — he's barely showing up.

**This is orthogonal to Batch 7C.** You can apply it before 7C, after 7C, or instead of 7C. No conflicts.

---

## Character voice bible — READ THIS FIRST

This is the creative direction for every new line below. **Do not paraphrase these two characters into generic "helpful AI" voice** — the whole product personality rides on their dynamic.

### Pip (plant-spirit, young, eager)
- **Says the vulnerable thing out loud** for comedy. Voices the doubt the user is silently having.
- **Occasionally breaks the fourth wall** about the journey itself ("yes I know we're doing inkblots, trust me").
- **Sets Cedric up** without realising it.
- Short sentences. Em-dashes. Starts with "Oh" or "Wait" a lot. Uses "I think." when he's unsure.
- Never explains mechanics — that's Cedric's job.

### Cedric (wizard guide, older, deadpan)
- **Dry wit.** Undercuts Pip with a single clipped line.
- Rarely more than one sentence when he's reacting. Longer when he's instructing.
- Calls Pip by name. Addresses the user directly when he's teaching.
- The wisest thing he says lands because the line before it was Pip being ridiculous.

### The dynamic — the canonical example
> **Pip:** "I had an idea once. Cedric said it was 'adorable'."
> **Cedric:** "That wasn't a compliment."

Pip vulnerable → Cedric dry. Every new pair below follows this shape or its inverse (Cedric sets something up earnestly → Pip undercuts him with a side comment).

### Path-awareness
A user on **Path A (open)** is exploring — they don't know what they want. Pip's job there is to reassure.
A user on **Path B (directed)** has an idea and is secretly anxious it'll get shot down. Pip's job there is to gently tease the idea-bringing, so Cedric can be straight-faced about the process. The punchline is that the process still matters *even if they already have an idea*.

---

## Files in this handoff

| File | Destination in repo | What it is |
|---|---|---|
| `speakPath.ts` | `lib/speakPath.ts` | Tiny helper — picks path variant or falls back to default |
| `line-variants.ts` | `content/line-variants.ts` | New file holding path B (directed) + path C (shortcut) overrides, keyed by dotted line path |
| `PIP_PASS_HOTFIX.md` | repo root (or wherever) | This doc |

New lines for `content/lines.ts` are embedded below — Claude Code adds them as keys alongside what's already there. No source file for that one.

---

## Hard do-nots

Same list as Batch 7C. Adding here so nothing drifts.

1. **Do not touch the crystal ceremony code.** `components/screens/S06Crystal.tsx`, `components/crystal/*`, anything crystal-related — off-limits.
2. **Do not touch the scoring formula.** `lib/scoring/engine.ts`, `lib/scoring/orchestrator.ts`, `lib/scoring/weights.ts` — read-only.
3. **Do not add new npm dependencies.**
4. **Do not enable Zustand persist middleware.**
5. **Do not rewrite existing lines.** Only ADD new keys + path variants. If a current line is bad, flag it — don't rewrite it silently.
6. **Do not change the speaker routing** (Pip vs Cedric dispatcher in `uiStore`). These lines assume the existing `enqueueMessage({ speaker: 'pip' | 'cedric', ... })` works.

---

## Step 1 — S01Fork Path B back button

Open `components/screens/S01Fork.tsx`. Find the `showIdeaInput` branch — the `<motion.div key="input" ...>` block that renders the textarea + Continue button.

Right **above** the `<p className="text-xs text-ivory/40 uppercase tracking-wider">Describe your idea</p>` line, insert this block:

```tsx
<div className="w-full max-w-md flex items-center justify-start">
  <button
    onClick={() => {
      setShowIdeaInput(false);
      setIdeaText('');
    }}
    data-testid="path-b-back"
    className="flex items-center gap-1 text-[11px] text-ivory/50 hover:text-gold transition-colors uppercase tracking-wider"
  >
    <span>◂</span>
    <span>Back</span>
  </button>
</div>
```

**Acceptance:**
- Click "I have an idea" → textarea view appears.
- ◂ Back chip sits above the "Describe your idea" heading, left-aligned.
- Click back → returns to the 3-card view with idea text cleared.
- No effect on the happy path (click continue after typing) — unchanged.

**Commit:**

```
fix(s01): back button on Path B idea-input view

Clicking "I have an idea" previously trapped the user — only escape was
typing 5+ chars and hitting Continue. Now a small ◂ Back chip sits above
the textarea, returns to the 3-card fork, and clears any half-typed text.
```

---

## Step 2 — Drop `lib/speakPath.ts`

Copy the handoff's `speakPath.ts` to `lib/speakPath.ts`. Do not modify it.

This file exports a single helper:

```ts
export function pathLine(
  key: string,              // dotted key, e.g. "s04.pip.intro"
  defaultText: string,      // existing line from content/lines.ts
  mode: IdeaMode | null,    // from useJourneyStore((s) => s.ideaMode)
): string
```

If a path variant exists for `key` in `LINE_VARIANTS` (from `content/line-variants.ts`) matching the current mode, it returns that variant. Otherwise returns `defaultText`. Zero runtime cost for unmigrated lines — they pass through unchanged.

---

## Step 3 — Drop `content/line-variants.ts`

Copy the handoff's `line-variants.ts` to `content/line-variants.ts`. This is the file Anish will edit over time to add path-specific copy.

On delivery it contains the **Path B variants for the screens listed below**. Empty object entries are fine — any key not in the map falls back to default.

---

## Step 4 — Migrate call sites to use `pathLine()`

Find every place Pip lines are enqueued or set. Grep for patterns: `lines.s01.pip`, `lines.s02.pip`, `lines.s03.pip`, `lines.s04.pip`, `lines.s07.pip`, `lines.s09.pip`, `lines.s10.pip`, `lines.s11.pip`. Also do the same for `cedric` where we're adding banter pairs (see Step 5).

For each call site, wrap with `pathLine()`. You'll need to pull `ideaMode` from the store first.

**Before:**

```tsx
const advanceScreen = useJourneyStore((s) => s.advanceScreen);
// ...
enqueueMessage({ speaker: 'pip', text: lines.s01.pip.entrance, type: 'dialogue' });
```

**After:**

```tsx
import { pathLine } from '@/lib/speakPath';

const advanceScreen = useJourneyStore((s) => s.advanceScreen);
const ideaMode = useJourneyStore((s) => s.ideaMode);
// ...
enqueueMessage({
  speaker: 'pip',
  text: pathLine('s01.pip.entrance', lines.s01.pip.entrance, ideaMode),
  type: 'dialogue',
});
```

**Do this for every Pip call site** in:
- `components/screens/S01Fork.tsx`
- `components/screens/S02*.tsx` (whatever the Blot file is named)
- `components/screens/S03*.tsx` (word association)
- `components/screens/S04Industries.tsx`
- `components/screens/S07*.tsx` (chronicle)
- `components/screens/S09Ideas.tsx`
- `components/screens/S10*.tsx` and `S11*.tsx` if Pip speaks there

**Also wrap the Cedric call sites listed in Step 5** — some Cedric lines have directed variants (the dry reactions after Pip's setup).

**Don't touch any Pip call site in S06Crystal.tsx.** Crystal is off-limits per hard do-nots.

**Acceptance:** every `lines.sXX.pip.Y` (and the specific Cedric ones from Step 5) flows through `pathLine()`. No new behaviour yet — variants file is populated in Step 6.

**Commit:**

```
refactor(dialogue): route Pip + banter-paired Cedric lines through pathLine()

Wraps existing call sites with a helper that looks up a path-specific
variant from content/line-variants.ts, falls back to the default. Pure
mechanical refactor — no user-visible change until variants are filled in.
```

---

## Step 5 — Add missing Pip beats + Cedric banter pairs

Pip currently vanishes on S02, S03, S07, S10, S11. This step adds him back. For several beats Cedric gets a new reactive line too so the double-act lands.

**Pattern for every new Pip → Cedric banter beat:**

```tsx
enqueueMessage({
  speaker: 'pip',
  text: pathLine('sXX.pip.Ykey', lines.sXX.pip.Ykey, ideaMode),
  type: 'dialogue',
});
// Cedric replies ~1.6s later so Pip's line reads first
const PIP_LINE_MS = lines.sXX.pip.Ykey.length * 35; // pip's wpm
setTimeout(() => {
  enqueueMessage({
    speaker: 'cedric',
    text: pathLine('sXX.cedric.Ykey_reply', lines.sXX.cedric.Ykey_reply, ideaMode),
    type: 'dialogue',
  });
}, PIP_LINE_MS + 400);
```

`35ms/word` mirrors the existing Pip stream rate; adjust if your codebase uses a different `pipWordDelay`. The `+ 400` buffer is the beat between Pip landing and Cedric's clipped reaction.

### New beats to insert

| Screen | Where to insert | New keys added |
|---|---|---|
| **S02 Blot** | After Cedric's intro line fires on mount | `s02.pip.entrance`, `s02.cedric.entrance_reply` |
| **S03 Words** | After Cedric's instruction line fires on mount | `s03.pip.entrance`, `s03.cedric.entrance_reply` |
| **S07 Chronicle** | After scene loads | `s07.pip.reaction` |
| **S10 Challenge** | After the Challenge card renders | `s10.pip.nudge`, `s10.cedric.nudge_reply` |
| **S11 Closing** | After the closing animation begins | `s11.pip.farewell`, `s11.cedric.farewell_reply` |
| **S01 Fork, Path B flow** | Inside `handleIdeaSubmit()`, BEFORE the existing `cedric.pathB.afterSubmit` line | `s01.pip.pathB_submitReaction`, `s01.cedric.pathB_submitReply` |

**If a screen file doesn't exist** (e.g. there's no S10 yet), skip that row and move on. Don't stub a screen.

**Acceptance:** each of the six screens above now has Pip speaking at least once, and the banter-paired ones have Cedric replying. No Pip line runs simultaneously with another — always sequential via timed `enqueueMessage`.

**Commit:**

```
feat(dialogue): add Pip beats on S02, S03, S07, S10, S11 + Path B submit

Pip was silent on half the screens. Adds a single entrance/reaction Pip
line per screen where he was absent, and a dry Cedric reply where the
double-act lands. Lines are path-aware via line-variants.ts.
```

---

## Step 6 — Fill in `content/lines.ts`

Open `content/lines.ts`. Add the new keys alongside the existing ones. **Do not rename or delete any existing key** — only ADD.

The defaults below are what plays for Path A (open) users. The Path B (directed) variants live in `content/line-variants.ts` (already populated in Step 3).

```ts
// ── S01 additions ─────────────────────────────────────────
s01: {
  // ... existing keys stay ...
  pip: {
    entrance: /* existing */,
    // NEW
    pathB_submitReaction: "Ooh you wrote it down. Bold. I'd have just vibed.",
  },
  cedric: {
    // ... existing keys stay ...
    pathB: {
      prompt: /* existing */,
      afterSubmit: /* existing */,
      // NEW
      submitReply: "Pip. \"Vibed\" is not a methodology.",
    },
  },
},

// ── S02 additions — Pip was absent here ───────────────────
s02: {
  // ... existing keys stay ...
  pip: {
    // ... existing keys stay ...
    // NEW
    entrance: "Okay, shapes. Just point at what your gut says. No wrong answer. I think.",
  },
  cedric: {
    // ... existing keys stay ...
    // NEW
    entrance_reply: "There is no wrong answer.",
  },
},

// ── S03 additions — Pip was absent here ───────────────────
s03: {
  // ... existing keys stay ...
  pip: {
    // ... existing keys stay ...
    // NEW
    entrance: "Four words. Not four essays. I know you want to explain.",
  },
  cedric: {
    // ... existing keys stay ...
    // NEW
    entrance_reply: "The first word is the honest one.",
  },
},

// ── S07 additions — Pip was absent here ───────────────────
s07: {
  // ... existing keys stay ...
  pip: {
    // ... existing keys stay ...
    // NEW
    reaction: "Oh we're doing a memory. Stay with it. He's about to say something profound.",
  },
},

// ── S10 additions — Pip was absent here ───────────────────
s10: {
  // ... existing keys stay ...
  pip: {
    // ... existing keys stay ...
    // NEW
    nudge: "Share it. Don't share it. Up to you. I say share it.",
  },
  cedric: {
    // ... existing keys stay ...
    // NEW
    nudge_reply: "It was not up to you, Pip.",
  },
},

// ── S11 additions — Pip was absent here ───────────────────
s11: {
  // ... existing keys stay ...
  pip: {
    // ... existing keys stay ...
    // NEW
    farewell: "We were here. You were here. Thank you for being here.",
  },
  cedric: {
    // ... existing keys stay ...
    // NEW
    farewell_reply: "Goodbye, traveler.",
  },
},
```

**These are drafts.** Anish will edit them. Keep them in the same shape and Claude Code's wiring will still work.

**Commit:**

```
content: add Pip beats + Cedric banter replies in lines.ts

Drafts for S01 Path B reaction, S02 entrance, S03 entrance, S07 reaction,
S10 nudge, S11 farewell. Each is the Path A / open default; Path B
variants live in line-variants.ts.
```

---

## Step 7 — Fill in `content/line-variants.ts` (already shipped in Step 3)

The file you copied in Step 3 already has the Path B variants below. Listing here for review — if a line reads wrong to Anish, editing `content/line-variants.ts` is a one-line change with no wiring side-effects.

### Path B (directed) variants

**S01 — user just typed their idea:**
- `s01.pip.entrance` → `"A brave one. You brought homework. I'd have just shown up."`
- `s01.pip.pathB_submitReaction` → (same default line)
- `s01.cedric.pathB.submitReply` → `"Pip. \"Homework\" is also not a methodology."`

**S02 — user with an idea doing inkblots:**
- `s02.pip.entrance` → `"Yes, you have an idea. Yes, we're looking at shapes. Cedric says there's a reason."`
- `s02.cedric.entrance_reply` → `"There is a reason."`

**S03 — user with an idea doing word association:**
- `s03.pip.entrance` → `"You could describe your idea in four words. I dare you."`
- `s03.cedric.entrance_reply` → `"He is not daring you. Four words."`

**S04 — the existing chatty screen:**
- `s04.pip.intro` → `"Swiping industries even though you brought an idea. Bold. I respect the pattern hunt."`
- `s04.pip.afterFirstKeep` → `"Oh? Thought we were married to your idea."`
- `s04.pip.atThreshold` → `"Wider net than you let on. Your idea has cousins."`

**S09 — the ideas reveal:**
- `s09.pip.reveal` → `"Your idea's on the left. Three more on the right. One is what you said. Two are what you meant."`

**S10 — Challenge / founder card:**
- `s10.pip.nudge` → `"Your idea made it this far. Hand it a card. It earned one."`

**S11 — closing:**
- `s11.pip.farewell` → `"You came in with one idea. You leave with four cousins. Good trade."`

**Commit** (same as Step 3 if split, or fold into Step 3's commit):

```
content: Path B variants for Pip + Cedric across S01-S11

Directed-path user has different emotional context than open-path user
(anxious about their idea, not exploring). These variants tease the
idea-bringing gently while keeping Cedric's straight-faced process-matters
line intact.
```

---

## Step 8 — Smoke test

No automated test for this; it's a content + character pass. Run the app locally and click through:

1. **Back button:** click "I have an idea" on S01 → ◂ Back appears → click back → 3-card view returns. Type "xyz" in the textarea, click back, click "I have an idea" again → textarea is empty.
2. **Path A walkthrough:** click "Just explore" on S01. Every screen Pip used to speak on, he still speaks. S02/S03/S07/S10/S11 — Pip now speaks at least once with his default voice.
3. **Path B walkthrough:** click "I have an idea" → type something → Continue. S01 shows Pip's "bold, I'd have just vibed" line, Cedric undercuts. S02/S03/S04/S09 — Pip's lines are the **B variants** (teasing, idea-aware), Cedric's reply lines fire where paired.
4. **No duplicate Pip voice** — if you heard the same Pip line on Path A and Path B on any screen except the ones deliberately left default, the `pathLine()` wrapper isn't wired on that site.

**If any of the above breaks**, fix the call site — don't fix the helper or the variants file.

---

## Post-hotfix checklist

- [ ] `tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] Back button works on S01 Path B, clears idea text on back
- [ ] Pip speaks at least once on S02, S03, S07, S10, S11 (Path A)
- [ ] Pip's lines differ between Path A and Path B on at least S01, S02, S03, S04, S09
- [ ] Cedric has a dry reply following Pip's setup on S01 submit, S02, S03, S10, S11
- [ ] No Pip line fires on S06 (crystal — untouched)
- [ ] `content/lines.ts` has new keys, none existing renamed or deleted

---

## Rollback

```bash
rm lib/speakPath.ts content/line-variants.ts
git checkout -- components/screens/S01Fork.tsx content/lines.ts
git checkout -- components/screens/S02*.tsx components/screens/S03*.tsx
git checkout -- components/screens/S04Industries.tsx components/screens/S07*.tsx
git checkout -- components/screens/S09Ideas.tsx components/screens/S10*.tsx
git checkout -- components/screens/S11*.tsx
```

Returns repo to pre-Pip-Pass state. No data migrations to reverse.
