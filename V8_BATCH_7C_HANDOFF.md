# Catalst v8 — Batch 7C Handoff

**Goal:** ship content breadth (+100 ideas, ~260 → 360), introduce a `tags` field, ship a tag-hierarchy filter on S04 without adding vertical space, update S09 card pill to surface tags, and lock the nest/spark/wildvine/yourIdea dedup contract with a fuzz test.

This is the last planned batch before **manual audit → beta launch.**

---

## Files in this handoff

All files sit in the folder you downloaded. When you see "drop at `<path>`," that means move/copy from this folder into the repo at the path shown.

| File | Destination in repo |
|---|---|
| `tags.ts` | `lib/tags.ts` |
| `ideas-v8-expansion.json` | `content/ideas-v8-expansion.json` |
| `backfill-tags.ts` | `scripts/backfill-tags.ts` |
| `merge-ideas-v8.ts` | `scripts/merge-ideas-v8.ts` |
| `test-matching-fuzz.ts` | `scripts/test-matching-fuzz.ts` |

The two `.ts` scripts run via `npx tsx`. The `tsx` package is already a dev dependency (used in prior batches) — no new npm installs.

---

## Hard do-nots (applies to EVERY step)

1. **Do not touch the crystal ceremony code.** No changes to `components/screens/S06Crystal.tsx`, `components/crystal/*`, `lib/crystal/*`, or any Cedric/Pip crystal-related dialogue files.
2. **Do not touch the scoring formula.** `lib/scoring/engine.ts`, `lib/scoring/orchestrator.ts`, `lib/scoring/weights.ts` — read-only for this batch. The fuzz test asserts the existing contract; fixing a bug it uncovers is a separate follow-up batch.
3. **Do not add new npm dependencies.** Everything compiles with what's already in `package.json`. If you think you need a new dep, you're off-track — stop and flag it.
4. **Do not enable Zustand persist middleware.** Hydration issues we already debugged are not worth re-opening.
5. **Do not write new background images, SVGs, or audio assets.** Pure code + content batch.
6. **Do not rename any existing idea_id.** Batch 7A already renamed the 7 dupes. The existing 260 IDs (CAT-0001 to CAT-0260) are frozen.

If a step asks you to edit a file and the current state of that file looks materially different from what this doc describes, **stop and report what you see** before editing.

---

## Step 1 — Schema update in `lib/scoring/types.ts`

Open `lib/scoring/types.ts`. Find the `Idea` interface (around line where it declares `idea_id: string`).

Add a single line to the interface, placed right before the `analytics:` block:

```ts
  tags: string[];
```

**Commit:**

```
feat(schema): add tags field to Idea interface

Introduces lib/tags.ts vocabulary on the content side. Every idea will
carry 2-4 tags from a fixed 70-tag vocabulary across 8 categories.

Schema-only change; no runtime behaviour yet.
```

**Acceptance:** `tsc --noEmit` passes. (It will complain about idea objects missing `tags` — that's the next step.)

---

## Step 2 — Drop `lib/tags.ts`

Copy the handoff's `tags.ts` to `lib/tags.ts`. Do not modify it.

This file exports:
- `TAGS` — the 70-tag vocabulary
- `CATEGORIES` — the 8 category ids (`tech | creative | health | finance | social | build | play | other`)
- `TAG_BY_ID` — lookup map, used in S09 pill render
- `TAGS_BY_CATEGORY` — grouping, used in S04 subtag row
- `isValidTag(id)` — guard
- `categoryForTags(tags)` — reverse lookup from tags → category

**Commit:**

```
feat(tags): introduce 70-tag vocabulary in lib/tags.ts

Categories: tech / creative / health / finance / social / build / play / other.
Each category carries 6-13 tags. S04 and S09 will consume these; scoring
engine remains untouched.
```

---

## Step 3 — Run `scripts/backfill-tags.ts`

Copy the handoff's `backfill-tags.ts` to `scripts/backfill-tags.ts`. Do not modify it.

Then run:

```bash
npx tsx scripts/backfill-tags.ts
```

**Expected output:**

```
Loaded 260 ideas from content/ideas.json
📦 Backup written to content/ideas.json.pre-v8c.bak
✅ Tagged 260 / 260 ideas
```

**What it did:** added `tags: string[]` to every existing idea based on a rule engine that matched domain_primary, sub_domain keywords, and name/one_liner regexes. Every idea now has 2-4 tags.

**If `missing` is non-zero:** stop, report output, do not proceed.

**Commit:**

```
chore(content): backfill tags on 260 existing ideas

Rule-engine-derived tag map embedded in the script. Every idea now
carries 2-4 tags. Full backup at content/ideas.json.pre-v8c.bak.
```

---

## Step 4 — Drop `content/ideas-v8-expansion.json`

Copy the handoff's `ideas-v8-expansion.json` to `content/ideas-v8-expansion.json`. Do not modify it.

This file holds **100 new ideas, CAT-0261 to CAT-0360, already in full Idea schema with tags populated.** Distribution:

- **10 thin industries × 5 ideas each** (biotech, cybersecurity, legaltech, manufacturing, ev_mobility, construction_infra, govtech_civic, spiritual_religious, retail_tech, logistics_supply_chain)
- **5 broadening groups** (ai_automation +18, fintech +8, health_wellness +8, sustainability +8, education +6, plus space_tech and hardware_robotics threaded under `manufacturing`)

All 11 previously-unused tags are now populated (ai-video, chronic-care, diagnostics, embedded, fantasy, femtech, pharmacy, prediction, quick-commerce, robotics, sme-finance).

**No commit on this step alone** — the merge happens in Step 5.

---

## Step 5 — Run `scripts/merge-ideas-v8.ts`

Copy the handoff's `merge-ideas-v8.ts` to `scripts/merge-ideas-v8.ts`. Do not modify it.

Then run:

```bash
npx tsx scripts/merge-ideas-v8.ts
```

**Expected output:**

```
Existing: 260 ideas
Incoming: 100 ideas (from ideas-v8-expansion.json)
📦 Backup written to content/ideas.json.pre-v8c-merge.bak

✅ Merged. content/ideas.json now has 360 ideas.
   (added 100, previous was 260)

Top 10 tags across full corpus:
  <snapshot of distribution>
```

**Validation the script runs (fail → exit 1, no writes):**
- No duplicate idea_id against existing 260
- No internal duplicates in incoming 100
- All motive / fit fields are numbers in [0, 1]
- All 8 is_* flags are booleans
- tags is a 2-4 length array
- Required scalars + nested blocks (analytics / proof / quickStart) all present

If the script aborts, **stop, paste the output, do not proceed.**

**After success, delete the now-merged expansion file:**

```bash
rm content/ideas-v8-expansion.json
```

**Commit:**

```
feat(content): merge 100 new ideas (CAT-0261 to CAT-0360)

+5 in each of 10 previously-thin industries (biotech, cybersecurity,
legaltech, manufacturing, ev_mobility, construction_infra, govtech_civic,
spiritual_religious, retail_tech, logistics_supply_chain).

+50 broadening existing fat domains with unused-tag variants
(ai-video, diagnostics, quick-commerce, robotics, pharmacy, sme-finance,
embedded, chronic-care, prediction, femtech, fantasy).

content/ideas.json: 260 → 360 ideas.
```

---

## Step 6 — Edit `components/screens/S04Industries.tsx` — tag hierarchy

**This is the biggest edit in the batch. Read the whole step before touching code.**

### What we're adding

Right now the top of S04 is a 9-chip horizontal bar (CATEGORIES: All, Tech, Creative, Health, Finance, Social, Build, Play, Other). Tapping a category **re-sorts** the deck to put in-category industries first (it doesn't filter).

We want to add a second level: tap Build → same chip row transforms into Robotics / Hardware / Space / Agritech / etc., with the first chip being `◂ Build` to pop back. Tapping a subtag **filters** the deck to industries whose cards contain at least one idea with that tag.

No new vertical space. No extra bar. Same 36px strip, transforms in place.

### State additions

Near the top of the `S04Industries` component, next to the existing `useState` calls, add:

```tsx
const [tagMode, setTagMode] = useState<'category' | 'subtag'>('category');
const [activeSubtag, setActiveSubtag] = useState<string | null>(null);
```

`activeCategory` stays. When `tagMode === 'subtag'`, the chip row shows tags for `activeCategory`. When `activeCategory` is `null`, `tagMode` must be `category` (don't allow subtag mode without a parent).

### Reverse lookup — industry → tags

Add this `useMemo` somewhere above the `deck` memo (it only depends on IDEAS, so it's stable):

```tsx
import { IDEAS } from '@/content/ideas'; // if not already imported
// TAG_BY_ID unused here but imported for below

const tagsByIndustry = useMemo(() => {
  // For each industry id, collect the union of tags across its ideas
  const map = new Map<string, Set<string>>();
  for (const idea of IDEAS) {
    const industry = DOMAIN_TO_INDUSTRY[idea.domain_primary];
    if (!industry) continue;
    if (!map.has(industry)) map.set(industry, new Set());
    for (const t of idea.tags ?? []) map.get(industry)!.add(t);
  }
  return map;
}, []);
```

Import `DOMAIN_TO_INDUSTRY` from `@/lib/scoring/engine` if it isn't already.

### Deck filter update

Find the existing `deck` useMemo:

```tsx
const deck = useMemo(() => {
  const unseen = INDUSTRIES.filter((i) => !seenIds.has(i.id));
  if (!activeCategory) return unseen;
  const inCat = unseen.filter((i) => i.category === activeCategory);
  const outCat = unseen.filter((i) => i.category !== activeCategory);
  return [...inCat, ...outCat];
}, [seenIds, activeCategory]);
```

Replace it with:

```tsx
const deck = useMemo(() => {
  const unseen = INDUSTRIES.filter((i) => !seenIds.has(i.id));
  // Subtag mode — hard filter to industries that carry this tag
  if (activeSubtag) {
    const matches = unseen.filter((i) => tagsByIndustry.get(i.id)?.has(activeSubtag));
    const rest = unseen.filter((i) => !matches.includes(i));
    return [...matches, ...rest];
  }
  // Category mode — soft sort, in-category first
  if (!activeCategory) return unseen;
  const inCat = unseen.filter((i) => i.category === activeCategory);
  const outCat = unseen.filter((i) => i.category !== activeCategory);
  return [...inCat, ...outCat];
}, [seenIds, activeCategory, activeSubtag, tagsByIndustry]);
```

Note: subtag stays a soft-pref (`matches first, rest after`) not a hard cut. This way a user who tapped "AI Video" still sees other cards after the matches run out, instead of hitting an empty deck.

### Chip row render

Find the `CATEGORIES.map((c, i) => { ... })` block (around line 54887 of the dump / wherever it is now). The whole JSX block inside the `<div className="shrink-0 h-9 flex overflow-x-auto scrollbar-none rounded-lg border border-white/5 bg-white/[0.02]">` wrapper gets replaced with a branch:

```tsx
{tagMode === 'category' ? (
  CATEGORIES.map((c, i) => {
    const active = activeCategory === c.id;
    return (
      <button
        key={c.label}
        onClick={() => {
          if (active && c.id) {
            // Re-tap active category → drill into subtags
            setTagMode('subtag');
          } else {
            setActiveCategory(c.id);
            setActiveSubtag(null);
          }
        }}
        data-testid={`category-${c.label.toLowerCase()}`}
        className={`relative flex-1 min-w-[56px] flex items-center justify-center transition-colors ${
          i > 0 ? 'border-l border-white/5' : ''
        }`}
        style={{ background: active ? `${c.tint}18` : `${c.tint}06` }}
      >
        <span
          className={`text-[10px] font-medium tracking-[0.1em] uppercase transition-colors ${
            active ? 'text-gold' : 'text-ivory/45'
          }`}
        >
          {c.label}
        </span>
        {active && (
          <motion.div
            layoutId="s04-cat-underline"
            className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
            style={{ background: '#D4A843', boxShadow: '0 0 8px rgba(212,168,67,0.7)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          />
        )}
      </button>
    );
  })
) : (
  // ──── Subtag mode ────────────────────────────────────────
  <>
    {/* Back chip — always first, always visible */}
    <button
      key="back"
      onClick={() => {
        setTagMode('category');
        setActiveSubtag(null);
      }}
      data-testid="subtag-back"
      className="relative flex-none min-w-[64px] px-2 flex items-center justify-center transition-colors border-r border-white/5"
      style={{ background: 'rgba(212,168,67,0.08)' }}
    >
      <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-gold">
        ◂ {CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'Back'}
      </span>
    </button>

    {/* Subtag chips from TAGS_BY_CATEGORY */}
    {(activeCategory ? TAGS_BY_CATEGORY[activeCategory as Category] : []).map((tag) => {
      const active = activeSubtag === tag.id;
      return (
        <button
          key={tag.id}
          onClick={() => setActiveSubtag(active ? null : tag.id)}
          data-testid={`subtag-${tag.id}`}
          className={`relative flex-1 min-w-[72px] flex items-center justify-center transition-colors border-l border-white/5`}
          style={{ background: active ? 'rgba(212,168,67,0.16)' : 'rgba(255,255,255,0.02)' }}
        >
          <span
            className={`text-[10px] font-medium tracking-[0.1em] uppercase transition-colors whitespace-nowrap px-1 ${
              active ? 'text-gold' : 'text-ivory/55'
            }`}
          >
            {tag.label}
          </span>
          {active && (
            <motion.div
              layoutId="s04-subtag-underline"
              className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
              style={{ background: '#D4A843', boxShadow: '0 0 8px rgba(212,168,67,0.7)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            />
          )}
        </button>
      );
    })}
  </>
)}
```

### Imports to add at the top of the file

```tsx
import { TAGS_BY_CATEGORY, type Category } from '@/lib/tags';
import { DOMAIN_TO_INDUSTRY } from '@/lib/scoring/engine';
```

(if `IDEAS` isn't already imported, also add it from the content module matching your codebase's existing pattern — grep for another screen that imports IDEAS.)

### Interaction rules

- **First tap on a category chip** → `activeCategory = c.id`, `tagMode = 'category'`. Deck sorts in-category first (unchanged behaviour from today).
- **Re-tap on already-active category** → `tagMode = 'subtag'`. The chip row transforms in place. No new vertical space.
- **Tap the ◂ back chip** → `tagMode = 'category'`, `activeSubtag = null`. Back to the 9-category row.
- **Tap a subtag chip** → `activeSubtag = tag.id`. Deck filters to industries containing that tag (soft cut — matches first, rest after).
- **Re-tap active subtag** → clears it (stays in subtag mode).

### Edge cases to verify

1. No ideas in the user's kept list yet → subtag filter still works.
2. Tapping `All` (id === null) should never enter subtag mode (the `if (active && c.id)` guard handles this — the `&& c.id` prevents All from drilling).
3. Switching category while in subtag mode: the `setActiveCategory` in the category-branch click handler resets `activeSubtag` to null, so subtag state from a previous category doesn't leak.
4. Undo/pass/keep flows should still work identically — none of that touches tag state.

**Commit:**

```
feat(s04): tag hierarchy filter in chip row

Tap-once on a category = soft-sort (existing behaviour). Tap-again on the
active category = chip row transforms into sub-tag chips from lib/tags.ts,
with first chip becoming ◂ back. Sub-tag selection filters deck to
industries containing that tag (soft cut: matches first, rest after).

No new vertical space — same 36px strip transforms in place.
```

---

## Step 7 — Edit `components/screens/S09Ideas.tsx` — pill update

Today the idea card's tag pill shows `idea.domain_primary.replace(/_/g, ' ')` — e.g. "ai automation". We're replacing that with up to 3 proper tags from the vocabulary.

### Find the current pill

Grep in `components/screens/S09Ideas.tsx` for `domain_primary`. There's a small render block that renders the domain string with a tier-coloured background (nest/spark/wildvine tier determines the tint). Typical shape:

```tsx
<span className="... tier-colour classes ...">
  {idea.domain_primary.replace(/_/g, ' ')}
</span>
```

### Replace with tag pills

```tsx
import { TAG_BY_ID } from '@/lib/tags';

// ... inside the render ...

<div className="flex flex-wrap gap-1">
  {(idea.tags ?? []).slice(0, 3).map((tagId) => {
    const def = TAG_BY_ID[tagId];
    if (!def) return null; // guard against stale tag ids
    return (
      <span
        key={tagId}
        className={`
          /* preserve the existing tier-coloured background classes here —
             copy them off the old single pill so nest/spark/wildvine tints
             still work */
          text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded
        `}
      >
        {def.label}
      </span>
    );
  })}
</div>
```

**Keep the tier-colour conditional styling you already have.** The only change is: one pill rendering `domain_primary` → up to three pills rendering `TAG_BY_ID[tagId].label`, same tint per pill.

If an idea has fewer than 3 tags, render what it has. If a tag id isn't in the vocabulary (shouldn't happen post-backfill, but be defensive), `return null` skips it.

**Commit:**

```
feat(s09): show up to 3 tag pills per idea card

Replaces the single domain_primary pill with tag-vocabulary labels from
lib/tags.ts. Tier (nest/spark/wildvine) tinting preserved. Falls back
gracefully if an idea has missing or stale tags.
```

---

## Step 8 — Run `scripts/test-matching-fuzz.ts`

Copy the handoff's `test-matching-fuzz.ts` to `scripts/test-matching-fuzz.ts`. Do not modify it.

Then run:

```bash
npx tsx scripts/test-matching-fuzz.ts
```

**Expected output:**

```
Running 50 fuzz profiles against runMatchingPipeline...

··················································

✅ All 50 profiles returned distinct idea_ids across nest / spark / wildvine / yourIdea
```

The test cycles through all 3 idea modes (open / directed / shortcut), varies every downstream input (8 orb ids, 8 headlines, 4 resource levels, 4 time budgets, all 25 industries, all blot + word combinations), and asserts that no collision ever shows up in the output portfolio.

**If it fails:**
- `·` means pass, `✗` means collision, `!` means runtime error.
- The script prints the first 10 failing profile indices, their mode, and which pair collided (e.g. `nest == yourIdea`).
- **Do not "fix" the scoring engine to make this pass.** File the bug, include the failing profile indices, and stop. Fixing scoring is a separate batch — Anish decides next steps.

**Commit (on pass):**

```
test(scoring): fuzz test for nest/spark/wildvine/yourIdea dedup

50 synthetic ForgeProfiles across all 3 idea modes, varied across orb,
headline, resource, time, and industry inputs. Asserts all output
idea_ids are distinct. Deterministic seed so failures are reproducible.
```

---

## Post-batch checklist

After all 8 steps:

- [ ] `tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npx tsx scripts/test-matching-fuzz.ts` exits 0
- [ ] S04: 9 category chips render → tap Build twice → chip row transforms to Robotics/Hardware/Space/Agritech/Logistics/Manufacturing/Drones/EV & Mobility/Q-Commerce/Sustainability/Energy/Construction with a ◂ Build back chip
- [ ] S04: tapping a subtag visibly re-orders the deck to matching industries first
- [ ] S04: tapping ◂ Build returns to the 9-category row, no subtag state leaks
- [ ] S09: idea cards now show up to 3 small pills using tag labels (e.g. "AI Agents · SaaS · Productivity") instead of the single "ai automation" string
- [ ] `content/ideas.json` has 360 ideas
- [ ] `content/ideas.json.pre-v8c.bak` and `content/ideas.json.pre-v8c-merge.bak` both exist (rollback path)

If all boxes tick, push to `batch-1-fixes` and notify Anish. He'll run a manual audit next.

---

## Rollback

If anything goes sideways:

```bash
cp content/ideas.json.pre-v8c.bak content/ideas.json
git checkout -- lib/scoring/types.ts components/screens/S04Industries.tsx components/screens/S09Ideas.tsx
rm lib/tags.ts scripts/backfill-tags.ts scripts/merge-ideas-v8.ts scripts/test-matching-fuzz.ts
```

That returns the repo to pre-7C state.
