# Catalst v8 — Batch 7A handoff

Three files were dropped into the project root by Anish:

```
v8-data-patch.ts                ← one-shot node script (run once, then commit the JSON changes)
S01LLMShortcut.tsx              ← finished Path 3 screen, production-ready
V8_BATCH_7A_HANDOFF.md          ← this file
```

## What this batch does

Fixes five concrete bugs plus ships Path 3. **No crystal edits, no mobile audit, no content expansion** — those are later batches.

1. **Data rename:** 7 duplicate `idea_name`s renamed so no two cards ever show the same title (root cause of the "PromptCraft appears 3 times" bug)
2. **Category rebalance:** Play tab gains gaming + sports, "Other" shrinks from 7 → 1 (fixes "Play tab barely shows anything")
3. **`INDUSTRY_ORDER` extension:** from 25 → 30 so dwell-tracking covers every industry in the swipe deck
4. **`handlePathB` fix:** nest tile no longer a reference-duplicate of yourIdea (fixes "two PromptCraft tiles next to each other" on Path B)
5. **Path switch hygiene:** when user clicks Path A or Path C on S01, any prior Path B text is cleared so state doesn't bleed
6. **S00 reset guard:** landing on `/journey` cold starts fresh if any stale flags exist
7. **Path 3 LLM Shortcut:** fully built screen replaces the "coming in a later gate" placeholder

## Execution order

Do these in sequence. Stop after each and verify before moving on.

---

### STEP 1 — data patch (zero-risk, pure data)

```bash
mv v8-data-patch.ts scripts/v8-data-patch.ts
npx tsx scripts/v8-data-patch.ts
```

Expected output includes lines like `✏️  CAT-0014: "PromptCraft" → …` **no, wait — CAT-0014 keeps its name.** The renames are on CAT-0231, CAT-0066, CAT-0072, CAT-0091, CAT-0215, CAT-0162, CAT-0170. Confirm the script's final line: `✅ done`.

Verify:
- `content/ideas.json` — 7 names changed, 260 ideas total unchanged
- `content/industries.json` — categories updated
- `content/ideas.json.pre-v8.bak` and `content/industries.json.pre-v8.bak` exist (keep them, don't commit the `.bak` files — add to `.gitignore` if needed)

Commit: `data(v8): rename 7 duplicate idea names, re-categorise industries for Play tab`

---

### STEP 2 — `INDUSTRY_ORDER` extension in `lib/scoring/engine.ts`

Find the `INDUSTRY_ORDER` array (has 25 entries today). Append the five missing ids **at the end** so existing dwell-time indices stay stable for users mid-session:

```ts
export const INDUSTRY_ORDER = [
  'ai_ml',
  'health_wellness',
  // … keep existing 25 in exact current order …
  'web3',
  // NEW in v8 — append only, do not reorder:
  'saas_productivity',
  'ecommerce_retail',
  'govtech_civic',
  'mental_health',
  'hrtech_future_work',
] as const;
```

Verify `npm run build` still passes. Commit: `engine(v8): extend INDUSTRY_ORDER to all 30 industries`

---

### STEP 3 — fix `handlePathB` nest duplication in `lib/scoring/engine.ts`

Current code (around line 665-680):

```ts
return {
  nest: yourIdea,                      // ← BUG: identical object to yourIdea, renders twice
  spark: { … },
  wildvine: { … },
  yourIdea,
  …
};
```

Change to: pick a distinct `nest` from `remaining` before `sparkItem` is picked. New logic:

```ts
// yourIdea is the user-brought idea (always shown). nest / spark / wildvine
// must all be DIFFERENT ideas from yourIdea and from each other.
const remaining = scored
  .filter((s) => s.idea.idea_id !== closest.idea_id)
  .sort((a, b) => b.rawScore - a.rawScore);

if (remaining.length === 0) {
  return { nest: yourIdea, spark: yourIdea, wildvine: yourIdea, yourIdea, confidence: 50, conflicts };
}

// NEST: highest-scoring idea in a DIFFERENT domain from the user's idea
// (if possible). If no cross-domain match, fall back to highest remaining.
const nestItem =
  remaining.find((s) => s.idea.domain_primary !== closest.domain_primary)
  ?? remaining[0];

// SPARK: next highest, different domain from BOTH yourIdea and nest
const usedDomainsAfterNest = new Set([closest.domain_primary, nestItem.idea.domain_primary]);
const sparkItem =
  remaining.find((s) => s !== nestItem && !usedDomainsAfterNest.has(s.idea.domain_primary))
  ?? remaining.find((s) => s !== nestItem)
  ?? nestItem;

// WILDVINE: highest novelty, different domain from all three
const usedDomains = new Set([closest.domain_primary, nestItem.idea.domain_primary, sparkItem.idea.domain_primary]);
const wildItem =
  remaining
    .filter((s) => s !== nestItem && s !== sparkItem && !usedDomains.has(s.idea.domain_primary))
    .sort((a, b) => b.idea.novelty_score - a.idea.novelty_score)[0]
  ?? remaining.find((s) => s !== nestItem && s !== sparkItem)
  ?? sparkItem;

return {
  nest:     { idea: nestItem.idea,  rawScore: nestItem.rawScore,  displayScore: calibrateScore(nestItem.rawScore, 'nest'),     matchTier: 'nest' },
  spark:    { idea: sparkItem.idea, rawScore: sparkItem.rawScore, displayScore: calibrateScore(sparkItem.rawScore, 'spark'),    matchTier: 'spark' },
  wildvine: { idea: wildItem.idea,  rawScore: wildItem.rawScore,  displayScore: calibrateScore(wildItem.rawScore, 'wildvine'), matchTier: 'wildvine' },
  yourIdea,
  confidence: computeConfidence(scored) + confBonus,
  conflicts,
};
```

Acceptance: on Path B, S09 renders 4 visually-distinct cards (yourIdea + nest + spark + wildvine), zero repeats. Commit: `engine(v8): handlePathB — nest, spark, wildvine must be distinct from yourIdea`

---

### STEP 4 — path-switch hygiene in `components/screens/S01Fork.tsx`

Two targeted fixes:

**(a)** When the user clicks Path A, clear any leftover Path B idea text:

```ts
function handlePathA() {
  setIdeaMode('open');
  setUserIdeaText('');                // ← ADD: prevent Path B leak
  setProcessing(true);
  …
}
```

**(b)** When the user clicks Path C, same thing:

```ts
function handlePathC() {
  setIdeaMode('shortcut');
  setUserIdeaText('');                // ← ADD
  goToScreen('s01_llm');
}
```

**(c)** When the user is on the idea input form (Path B) and hits the back arrow or leaves without submitting, do not leave `userIdeaText` set in store. Since the current `handleIdeaSubmit` only sets it on submit, that's already correct — nothing to do here. Keep.

Acceptance: if a user clicks Path B → types → goes back (browser back) → clicks Path A, the subsequent flow does NOT include a yourIdea tile on S09. Commit: `s01(v8): clear userIdeaText on path switch to prevent Path B state leak`

---

### STEP 5 — S00 cold-start guard in `components/screens/S00Gateway.tsx`

On mount, if the store has any Path B residue AND the current screen is s00 (true cold start), clear it:

```tsx
import { useEffect } from 'react';
import { useJourneyStore } from '@/lib/store/journeyStore';

export function S00Gateway() {
  // …existing body…

  useEffect(() => {
    // Cold-start guard: a fresh /journey landing on S00 should never
    // carry residual Path B text from a previous session's close-without-
    // reset. Zustand has no `persist` middleware but hot-reload and
    // browser tab reuse can still produce stale in-memory state.
    const s = useJourneyStore.getState();
    if (s.currentScreen === 's00' && (s.userIdeaText || s.ideaMode === 'directed')) {
      useJourneyStore.setState({ userIdeaText: '', ideaMode: null });
    }
  }, []);

  // …rest of component…
}
```

If `S00Gateway.tsx` already has a `useEffect` block, add these 5 lines inside it rather than adding a second effect. Commit: `s00(v8): cold-start guard against Path B residue`

---

### STEP 6 — install Path 3 screen

```bash
mv S01LLMShortcut.tsx components/screens/S01LLMShortcut.tsx
```

Then in `app/journey/page.tsx`, replace the placeholder wiring for `s01_llm`:

```tsx
// ADD this import near the other screen imports:
import { S01LLMShortcut } from '@/components/screens/S01LLMShortcut';

// ADD a wrapper alongside the other wrappers:
function S01LLMWrapper() { return <S01LLMShortcut />; }

// In SCREEN_COMPONENTS, CHANGE this line:
//   s01_llm: PlaceholderScreen,
// TO:
   s01_llm: S01LLMWrapper,

// In SELF_MANAGED_SCREENS, ADD 's01_llm':
const SELF_MANAGED_SCREENS = new Set<ScreenId>([
  's00', 's01', 's01_llm',           // ← ADD 's01_llm'
  's02', 's03', 's04', 's06', 's07',
  's08', 's09', 's10', 's11',
]);
```

The screen component is self-contained and uses only existing deps (framer-motion, Zustand store, CRYSTAL_ORBS from constants, ProcessingSwirl). No new packages required.

**One thing to verify in the existing codebase before shipping Step 6:** the screen assumes `lib/screenFlow.ts`'s `getNextScreen` + `getCompletedScreens` handle `idea_mode='shortcut'` correctly. The `buildProfile.ts` handoff dump confirms the store field `ideaMode` can be `'shortcut'`, and `scenarioSource` is set to `'parsed'` when `ideaMode === 'shortcut'`. If `screenFlow.ts` currently routes `shortcut` users through S02-S07 anyway, the shortcut screen goes around it by calling `goToScreen('s08')` directly, which bypasses screenFlow entirely. That's intentional — but if there are any guards in S08 that require specific prior screens to be "completed", verify they're satisfied by the `completedScreens` array we set. The Path 3 component pre-fills `completedScreens: ['s00', 's01', 's01_llm', 's02', 's03', 's04', 's06', 's07']`.

Acceptance:
- Clicking Path C on S01 lands on S01LLMShortcut (teal accent, not placeholder)
- Copy button copies the master prompt to clipboard
- Pasting a well-formed JSON, clicking "Forge my profile" → lands on S09 with 3 matched ideas
- Pasting malformed JSON shows a clear inline error
- Pasting JSON with invalid field values lists which fields are wrong
- `npm run build` passes

Commit: `s01c(v8): build LLM Shortcut path — master prompt, JSON parser, skip to S09`

---

## After all 6 steps

```bash
npm run build       # must pass, zero errors
git push origin batch-1-fixes
```

**Stop before merge.** Report back in chat:
- Any step that failed or needed adaptation
- Screenshots of: S01 paths visible, Path B on S09 (verify 4 distinct cards, no PromptCraft twice), Path C LLM screen, a successful Path C end-to-end run showing 3 matched ideas on S09
- Output of the data patch run (so Anish can see the category redistribution)

Next batch after this lands: mobile audit S00→S11, crystal screenshots for direction, content expansion (new ideas + industries in correct schema).

## Hard do-nots this batch

- Do NOT touch the crystal — separate batch
- Do NOT modify any other screen (S02-S11) — only S00, S01, S01_LLM
- Do NOT add new ideas — schema needs to be nailed first
- Do NOT change the scoring formula — only fix the `handlePathB` tile-assignment bug
- Do NOT enable Zustand `persist` middleware — the cold-start guard is enough
