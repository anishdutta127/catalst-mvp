# Catalst v7 — Batch 2 Fixes

**What's in this batch:** the two biggest UX rebuilds from your brief — S04 Industry Hinge-swipe cards (with persistent Continue CTA, category tags, edge limit, deck peek) and S06 Crystal Constellation (dedicated viewport, orbital ring, triangle formation, no more overlap). Plus the enriched industry data that powers the Hinge cards — 15 core industries with 8 Hinge prompts each, sub-category CAGRs, AI disruption angle, India leaders, cultural trend, recent headline, investor sentiment — merged into the existing `industries.json` via a one-time script. Plus Cedric's S04 and S06 dialogue rewritten in Conspirator voice.

**What's NOT in this batch:** the full-screen idea dossier (Batch 3), the Mystic Vault sapphire premium card (Batch 3), the Trading Card founder card (Batch 4), the S10 sorting polish (Batch 4), and the full Conspirator voice sweep across every screen (Batch 4). Batch 1 fixes still apply — don't skip Batch 1.

---

## Order of operations

1. Apply Batch 1 first. Confirm the journey runs end-to-end.
2. Commit Batch 1.
3. Apply Batch 2 (below).
4. Run the one-time merge script.
5. QA Batch 2.
6. Commit Batch 2.

---

## Step 1 — Extract the zip into your repo root

**Windows PowerShell:**
```powershell
cd C:\path\to\catalst-mvp
git checkout -b batch-2-hinge-crystal
Expand-Archive "$env:USERPROFILE\Downloads\catalst-batch-2.zip" -DestinationPath $env:TEMP -Force
Copy-Item "$env:TEMP\catalst-batch-2\*" -Destination . -Recurse -Force
Remove-Item "$env:TEMP\catalst-batch-2" -Recurse -Force
```

**macOS / Linux / WSL:**
```bash
cd path/to/catalst-mvp
git checkout -b batch-2-hinge-crystal
unzip -o ~/Downloads/catalst-batch-2.zip -d /tmp/
cp -rf /tmp/catalst-batch-2/. ./
rm -rf /tmp/catalst-batch-2
```

Verify:
```bash
git status
```

You should see:

```
modified:   components/screens/S04Industries.tsx
modified:   components/screens/S06Crystal.tsx
modified:   content/lines.ts

Untracked files:
  components/ui/IndustrySwipeCard.tsx
  components/ui/CrystalViewport.tsx
  content/industries-hinge-data.json
  scripts/merge-hinge-data.js
```

3 modified, 4 new.

---

## Step 2 — Run the one-time merge script

This adds the Hinge-card fields (Hinge prompts, sub-CAGRs, cultural trends, etc.) to your existing `industries.json`. It does NOT touch existing fields — deep-dive and backward-compat keep working.

```bash
node scripts/merge-hinge-data.js
```

Expected output:
```
Merged.  Enriched: 15  Defaulted: 15  Total: 30
```

`git status` should now additionally show:
```
modified:   content/industries.json
```

Open `content/industries.json` and spot-check: the `ai_ml` entry should have ~37 keys including `hinge_prompts` (array of 8), `sub_category_cagrs`, `cultural_trend`, `ai_disruption_angle`, `recent_headline`, `investor_sentiment_short`, `category: "tech"`, `color_primary: "#7C3AED"`, `color_secondary: "#4C1D95"`, `tagline`, `india_leaders`, `trending_global`.

---

## Step 3 — Open Claude Code and sanity-check

Paste this into Claude Code from the repo root:

```
I just applied Batch 2 of the Catalst v7 fixes and ran the merge script.

Please do the following in order:

1. Run `npx tsc --noEmit` and report all TypeScript errors.
   Expected: zero errors. New files introduced:
     - components/ui/IndustrySwipeCard.tsx (consumed by S04Industries)
     - components/ui/CrystalViewport.tsx (consumed by S06Crystal)
   Both are self-contained with their own types.

2. Run `npm run lint` and report any NEW warnings/errors (ignore pre-existing).

3. If either step surfaces issues from my patches, diagnose from the actual
   file contents before editing.

4. Once clean, start `npm run dev`.

5. Walk me through the Batch 2 QA checklist (below), one screen at a time.
   Confirm each item before moving on.

The critical checks are:
- S04: swipe mechanics work (drag or buttons), Continue CTA greyed until
  2 kept, category tags at top filter upcoming deck, deck "peek" behind
  current card, tap to flip card front/back.
- S06: crystal visible in a dedicated upper viewport, orb dock below with
  no overlap, orbs animate to triangle vertices as you select, sensible
  separation between the forming crystal and the selection dock.
- Dialogue at S04 and S06 reads in Cedric's new Conspirator voice.
```

---

## Step 4 — Manual QA checklist

### S04 Industries (Hinge rebuild)

- [ ] Top bar shows category tags: **All · Tech · Creative · Health · Finance · Social · Build · Play · Other**. Active tag highlights gold.
- [ ] Counter row shows `0 of 30 · 0 kept` initially.
- [ ] One card is visible, taking most of the activity zone. Behind it, a smaller, slightly dimmed card "peeks" (deck feel).
- [ ] Card front shows: big emoji hero, industry name in painterly serif, italic tagline, TAM/CAGR chips, and THREE Hinge prompts (each with a small label like "MY BIGGEST FLEX" and a one-line text).
- [ ] Refreshing the page picks different 3-of-8 Hinge prompts (prompts rotate per card mount).
- [ ] **Swipe left** on the card → Pass overlay appears in red, card flies left, next card appears. `industriesPassed` in state advances.
- [ ] **Swipe right** → Keep overlay appears in green, card flies right, next card appears. `industriesKept` advances.
- [ ] **Swipe up** → Edge overlay in gold, card flies up. Only works if edges used < 2. After 2, swipe-up does nothing (and the Edge button shows disabled).
- [ ] **Tap card** (no swipe) → card flips to back, revealing: Why Now, ⚡ AI disruption angle, sub-category CAGRs with mini bars, cultural trend (italic quote), 🇮🇳 India leaders chips, 🌎 Trending globally chips, 📰 Recent headline, Investor sentiment.
- [ ] Tap flipped card → flips back to front.
- [ ] Bottom action bar: big **Pass · Edge (0/2) · Keep** buttons, each triggers the same action as the corresponding swipe.
- [ ] `↺ undo last` link appears after the first action. Tapping it restores the previous card state.
- [ ] **Persistent Continue CTA** at the bottom:
  - With 0 or 1 keeps: **greyed**, text reads "Keep at least 2 to continue". Tapping does nothing visible (no transition).
  - With 2+ keeps: **gold and active**, text reads "Continue with N kept →". Tapping advances to S06.
- [ ] Tapping the **Tech** category tag doesn't change the current card, but makes the NEXT cards in the deck prefer tech industries. Switching to **Creative** re-prioritizes. The current card doesn't disappear.
- [ ] After seeing all 30 cards: empty state renders with a sprout emoji and "All fifteen worlds seen." message.
- [ ] The detail view (card back) does NOT pull the sheet from the full viewport anymore — the deep read lives inside the card itself.

### S06 Crystal Constellation

- [ ] Clear vertical separation: **Crystal Viewport** takes the upper ~60% of the activity zone, **orb dock** takes the lower portion. No overlap.
- [ ] Crystal Viewport: dark radial vignette visible, 8 orbs arranged in an orbital ring around a clearly empty center. Starfield-like faint glow in the center circle.
- [ ] With 0 selected: center shows small text "choose three essences". No crystal visible.
- [ ] Tap an orb in the dock below → orb gets selected (gold-tinted border, numeric 1 badge), light trail fades in from the orbital ring position to center, a glowing vertex circle appears at center.
- [ ] Tap a 2nd orb → 2 vertices visible with a connecting edge between them. Light trails visible from both orbital ring positions.
- [ ] Tap a 3rd orb → full triangle forms with internal facet lines, three corner dots in the orb colors, slow 3D rotation begins, pulsing white core at the geometric center.
- [ ] All 8 orb positions in the orbital ring pulse subtly (breathing animation).
- [ ] Behind the crystal: subtle 8-axis polygon showing weight toward selected orbs. Very low opacity, doesn't compete.
- [ ] Counter text between viewport and dock reads "0 of 3 chosen" / "1 of 3 chosen" etc.
- [ ] **Forge Your Crystal →** CTA appears when 3 are selected (gold, full width), with a satisfying spring-in animation.
- [ ] Tapping a selected orb in the dock deselects it — light trail retracts, vertex disappears, counter decrements.
- [ ] Tapping any non-selected orb when 3 are already chosen does nothing (button disabled / faded).

### Dialogue (Conspirator voice check)

- [ ] S04 Cedric opener: "Fifteen worlds. Some will pull at you. Some won't. Keep the ones that pull — star the ones that obsess you. Trust the pull, not the logic."
- [ ] S04 Pip: "Ooh this is the fun part — swipe like your taste is the whole personality."
- [ ] S06 Cedric opener: "Every instinct so far was you reacting. This one is you choosing. Eight essences. You carry three. Pick what defines you — not what sounds impressive. The crystal will grow with the ones you pick and dim with the ones you leave behind."
- [ ] S06 Cedric after selecting 3: "[Name]'s crystal is set. The shape won't change. But the light will."

---

## Step 5 — Commit

```bash
git add -A
git commit -m "Batch 2: Hinge industry cards + Crystal Constellation

- S04 rebuilt as Hinge swipe deck with edge limit, category tags,
  persistent Continue CTA greyed until 2 keeps
- New IndustrySwipeCard component with drag gestures (left/right/up),
  tap-to-flip front/back, Pass/Keep/Edge action bar
- Enriched industries.json: 15 core industries get 8 Hinge prompts,
  sub-category CAGRs, AI disruption angle, India leaders, trending
  global, cultural trend, recent headline, investor sentiment;
  15 non-core industries get sensible category + color defaults
- S06 rebuilt as Crystal Constellation: dedicated viewport (top ~60%)
  with orbital ring, light trails, triangle formation; orb dock (bottom)
  with clear separation, numeric badges, selection-order preserved
- New CrystalViewport + IndustrySwipeCard components
- Cedric S04 + S06 dialogue rewritten in Conspirator voice
- merge-hinge-data.js one-time script for enrichment merge"
```

---

## What each file does

| File | What it does |
|---|---|
| `content/industries-hinge-data.json` | NEW. Rich data source for 15 core industries. Read by merge script. |
| `scripts/merge-hinge-data.js` | NEW. One-time merge into `industries.json`. Idempotent — safe to rerun. |
| `content/industries.json` | MODIFIED by merge script. Adds ~12 new fields per industry. Existing fields untouched. |
| `content/lines.ts` | S04 + S06 Cedric/Pip dialogue rewritten to Conspirator voice. |
| `components/ui/IndustrySwipeCard.tsx` | NEW. Hinge card with flip, drag, Pass/Keep/Edge overlays. |
| `components/screens/S04Industries.tsx` | Full rebuild. Hinge swipe deck, category tags top, persistent CTA bottom. |
| `components/ui/CrystalViewport.tsx` | NEW. Crystal formation zone: orbital ring, triangle materialisation, radar backdrop. |
| `components/screens/S06Crystal.tsx` | Full rebuild. Split layout: viewport top, orb dock bottom, no overlap. |

---

## If something breaks

**"Cannot find module '@/components/ui/IndustrySwipeCard'":** check the file exists at `components/ui/IndustrySwipeCard.tsx`. No subdirectory like `components/ui/industry-swipe-card`.

**Hinge card shows no prompts / blank fields:** the merge script didn't run, or it ran but didn't find `industries.json`. Verify by opening `content/industries.json` and confirming the first entry has a `hinge_prompts` array. Rerun `node scripts/merge-hinge-data.js` from repo root.

**Drag on the card snaps back even after a big swipe:** threshold is 100px. If your screen is small enough that 100px is a huge fraction of width, adjust `SWIPE_THRESHOLD` in `IndustrySwipeCard.tsx` (around line 80).

**Crystal Viewport orbs overflow outside their circle:** the viewport is fixed size 340px. If your parent container is narrower, reduce the `size={340}` prop passed from S06Crystal.

**Orb dock buttons too small on mobile:** the grid is 4 columns — on very narrow screens, drop to 3 columns by changing `grid-cols-4` to `grid-cols-4 sm:grid-cols-4` and styling. Current defaults should work at 360px+.

**"industries.json is enormous now":** expected — ~30 industries × ~37 keys. Before it was ~30 industries × ~25 keys. File went from 91KB to ~160KB. This doesn't affect runtime meaningfully.

---

## What's next

**Batch 3 (next):** the full-screen idea dossier for S09 (9 sections — Need, Motivational Conflict, ICP, Positioning, Market, 7Ps, L2/L3 Psych, AI Moat, First 30 Days), enriched idea payload generation for all 260 ideas (or at least the most common types), Mystic Vault sapphire premium card (below crown CTA at S09, repeated at S11 per your point 13).

**Batch 4 (last):** Founder Trading Card (S11 full redesign — 9:16 portrait, holographic border, rarity stat, trait triangle infographic, founder slug, share row directly below), S10 Sorting Ceremony polish (crest recentering fix, house radar, house rules, impact numbers), full Conspirator voice rewrite for every remaining Cedric/Pip line across every screen.

Reply with Batch 2 QA results once you've run through it and we roll Batch 3 immediately.
