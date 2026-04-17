# Catalst v7 — Batch 3 Fixes

**What's in this batch:** the full-screen idea dossier at S09 (the heart of the product), the Mystic Vault sapphire premium card that replaces the old "Your idea. Built. Shipped." sell zone at S09 and the old "Want expert help?" toggle at S11. All 260 ideas in your `ideas.json` already have rich `deep_content` — this batch builds the dossier UI that actually does that data justice, and derives the 7Ps Marketing Mix dynamically per idea from existing fields (no per-idea pre-enrichment needed, no new data files to merge).

**What's NOT in this batch:** the Trading Card founder redesign at S11 (Batch 4), S10 sorting ceremony polish (Batch 4), full Conspirator voice rewrite across every remaining Cedric/Pip line (Batch 4).

---

## Order of operations

1. Batch 1 applied, QA passed, committed.
2. Batch 2 applied, QA passed, committed.
3. Apply Batch 3 (below).
4. QA.
5. Commit.

---

## Step 1 — Extract the zip into your repo root

**Windows PowerShell:**
```powershell
cd C:\path\to\catalst-mvp
git checkout -b batch-3-dossier-vault
Expand-Archive "$env:USERPROFILE\Downloads\catalst-batch-3.zip" -DestinationPath $env:TEMP -Force
Copy-Item "$env:TEMP\catalst-batch-3\*" -Destination . -Recurse -Force
Remove-Item "$env:TEMP\catalst-batch-3" -Recurse -Force
```

**macOS / Linux / WSL:**
```bash
cd path/to/catalst-mvp
git checkout -b batch-3-dossier-vault
unzip -o ~/Downloads/catalst-batch-3.zip -d /tmp/
cp -rf /tmp/catalst-batch-3/. ./
rm -rf /tmp/catalst-batch-3
```

Verify:
```bash
git status
```

You should see:
```
modified:   components/screens/S09Ideas.tsx
modified:   components/screens/S11Profile.tsx

Untracked files:
  components/ui/IdeaDossier.tsx
  components/ui/MysticVaultCard.tsx
```

2 modified, 2 new. No data file changes this batch.

---

## Step 2 — Claude Code sanity check

Paste this into Claude Code at the repo root:

```
I just applied Batch 3 of the Catalst v7 fixes.

Please do the following IN ORDER and stop at each checkpoint:

1. Run `npx tsc --noEmit` and report TypeScript errors.
   Expected: zero. New imports introduced:
     - IdeaDossier.tsx (consumed by S09Ideas)
     - MysticVaultCard.tsx (consumed by both S09Ideas and S11Profile)
   Both are self-contained.

   If you see type errors about `deep_content` shape on the Idea type:
   the IdeaDossier reads it as `idea.deep_content` via a cast to
   `{ deep_content?: Record<string, unknown> }` — this is intentional
   since the existing Idea type doesn't declare deep_content. Verify
   the cast is in place before editing the type system.

2. Run `npm run lint` and report fresh warnings only.

3. If either step surfaces issues from my patches, diagnose from the
   actual file contents before editing. Don't touch the data-derivation
   logic in derive7Ps() or derivePersona() — that's intentional.

4. Start `npm run dev`.

5. Walk me through the Batch 3 QA checklist (below), one screen at
   a time. For S09 dossier mode, I want to verify every one of the
   10 sections renders correctly with real data from a crowned idea.
```

---

## Step 3 — Manual QA checklist

### S09 — Grid mode (before tapping a card)

- [ ] 3 idea cards visible side-by-side: Nest · Spark · Wildvine (or 4 if user submitted an idea via Path B).
- [ ] Each card shows: tier emoji + label, idea name in painterly serif, 2-line description, domain chip, and "read the deep dive →" hint in the bottom-right that changes color on hover.
- [ ] The subtle italic caption beneath the cards reads: "Tap any idea to read its full dossier. Crown the one that fits."
- [ ] No sell zone / "Your idea. Built. Shipped." block visible before crowning.

### S09 — Dossier mode (tap any card)

- [ ] Tapping a card opens the dossier filling the activity zone.
- [ ] Top bar: "← Back to all three" link on the left. If crowned elsewhere, "Continue to your house →" link on the right.
- [ ] Horizontal tab row below: 3 tabs for each idea with emoji + tier label + match%. Tapping a tab switches the dossier content without closing.
- [ ] Dossier scrolls vertically through **10 sections** with clear section dividers:

  **01 — The Fit.** Radar chart on the right showing 5 axes (Skill · Market · Capital · Execution · Passion). Prose on the left with "why the garden chose this" — uses the `whyYou` text from the narrative API if available, falls back to a reasonable default citing the user's house.

  **02 — Underlying Need.** Three side-by-side level cards: L1 surface want (grey), L2 deeper need (pink), L3 core desire (gold). Below: a highlighted orange card showing the motivational_conflict as an italic quote. Below that: a white card with jobs_to_be_done.

  **03 — Your ICP.** Big persona avatar on the left with a 👤 emoji in a sky-blue circle. On the right: persona headline (bold), archetype description, then **top 3 motivations** rendered as mini horizontal progress bars with percentages (pulled from the idea's `motive_*` fields). Below: a stacked card showing 💰 budget signal, ⏱ buying moment (italic quote pulled from jobs_to_be_done), 🚧 objection you'll hear.

  **04 — Market Shape.** Three animated bars for TAM/SAM/SOM with dollar values. Growth chart below (Area chart, 5 years including projected). Revenue model card at the bottom with primary + secondary + unit economics (green text for unit economics line).

  **05 — Positioning.** Gold-highlighted positioning statement in italic quotes. Below: each of the 3 competitors as a row with name + market share bar + "Their gap:" weakness text.

  **06 — Marketing Mix.** 7 cards in a 2-column grid: Product, Price, Place, Promotion, People, Process, Physical Evidence. Each card shows violet label + icon + derived text. Place/Promotion/Process text should be archetype-specific — e.g. for a SaaS productivity idea it should say "Web + Slack/Notion/Teams integrations" and "Developer-led content + free-tier viral loop", not generic fallbacks.

  **07 — AI Moat.** Numbered indigo chips listing the idea's `ai_layers` (usually 2-3 items from deep_content).

  **08 — First 30 Days.** Numbered emerald circles with action text + timeline chip (Week 1 / Week 2-4 / Month 2).

  **09 — Context (PESTLE).** "Why now" bar with teal accent at the top. Below: 2×3 grid of Political / Economic / Social / Technological / Legal / Environmental cards — each with a tiny icon + short snippet.

  **10 — The Risk.** Red-tinted card showing honest_risk with a ⚠️ icon.

- [ ] Sticky bottom button when not crowned: **"👑 Crown this idea — make it yours"** in gold. Tapping it crowns the idea without leaving dossier mode.
- [ ] Once crowned, the crown button disappears. The Mystic Vault card appears below the dossier content.

### S09 — Mystic Vault card (sapphire)

- [ ] Visible only after crowning. Appears below the dossier (or below the cards in grid mode).
- [ ] Animated sapphire-to-violet gradient background with a slow shimmer sweep (every ~5 seconds).
- [ ] Tiny "🔷 Mystic Vault" label at top with "optional · 30 min · ₹500" meta line.
- [ ] Avatar on the left: "AD" monogram in a circle with a rotating conic-gradient glow ring around it (blue to indigo, 14-second rotation).
- [ ] Headline: "Build this idea with us in 7 days."
- [ ] Subline: "Anish Dutta · PM · AI Builder · Mumbai"
- [ ] Trust chips row: Masters' Union · Merit Scholar, IIT Bombay · Agentic AI, GSL · Product Mgr, RVCE · CS Eng.
- [ ] 3 value-prop cards: ⚡ 7-day MVP, 🎯 ₹500 · 30 min, 💬 Direct access.
- [ ] Primary CTA: big pill labeled "💬 Message Anish on WhatsApp →" with its own inner shimmer. Clicking opens WhatsApp with a pre-populated message that includes the crowned idea name, match %, and house name.
- [ ] Small LinkedIn link below with the [in] badge and the URL `linkedin.com/in/anish-dutta`.
- [ ] Bottom caption: "30 min · ₹500 · No commitment · Real builder talk".

### S09 — After crown

- [ ] Big gold CTA at the very bottom of grid mode: **"👑 This is my idea → continue to your house"** — tapping advances to S10.
- [ ] In dossier mode, crown is expressed via the "Continue to your house →" link at the top-right (instead of the crown-this CTA at the bottom, which disappears).

### S11 — Founder Profile

- [ ] Old collapsible "Want expert help building this?" link is GONE.
- [ ] Old consultation block with "About the builder" toggle is GONE.
- [ ] New **MysticVaultCard variant="full"** renders at the bottom of the page, after the share row and downloads.
- [ ] The "full" variant adds a "What you get in 30 min" section (4 bullets about the call) that the "teaser" variant at S09 doesn't have.
- [ ] Founder card (the 9:16 portrait with house crest + crystal triangle + lineage) is UNCHANGED — Batch 4 will redesign it as the Trading Card.
- [ ] Share row (📸 Instagram / 𝕏 Twitter / 💬 WhatsApp) and downloads (🖼 Save Card / 📄 Idea Pack) still work exactly as before.

### Cross-checks

- [ ] No double sell — only one Mystic Vault card per screen.
- [ ] WhatsApp CTA from either location produces a message that includes: "I'm a {House} founder. My crowned idea: {Idea Name} ({Match%} match). I want to explore building it with your team — can we set up the ₹500 strategy call?"
- [ ] LinkedIn link opens `https://in.linkedin.com/in/anish-dutta-4ba701282` in a new tab.
- [ ] No TypeScript errors in the console when you navigate S09 or S11.

---

## Step 4 — Commit

```bash
git add -A
git commit -m "Batch 3: full-screen idea dossier + Mystic Vault sapphire card

- New IdeaDossier component: 10-section deep read (The Fit, Underlying
  Need, ICP, Market, Positioning, 7Ps Marketing Mix, AI Moat, First 30
  Days, PESTLE Context, The Risk) with tab-switching between the 3
  crowned ideas
- 7Ps Marketing Mix derived dynamically per idea (no pre-enrichment):
  Place/Promotion/People/Process/Physical Evidence specialize by domain
  (SaaS/creator/fintech/edtech/healthtech/enterprise/regulated archetypes)
- Persona card built from motive_* fields + customer_archetype +
  budget_floor_inr (surfaces top 3 motivations as bar chart)
- Radar chart visualizes 5-axis Founder Fit, growth chart shows market
  projection, TAM/SAM/SOM animated bars
- Consumer psychology L1/L2/L3 rendered as progressive gradient cards,
  motivational_conflict as italic highlight quote
- Competitors rendered with market-share bars and 'their gap' callouts
- New MysticVaultCard (sapphire/violet animated gradient, shimmer sweep,
  rotating avatar glow ring, WhatsApp pre-typed CTA with house+idea+match%,
  LinkedIn link) replaces the old gold sell zone at S09 and the old
  'Want expert help?' toggle at S11
- S09 flow: cards grid → tap card opens full-screen dossier → crown from
  dossier OR from grid → Mystic Vault appears → advance to S10
- S11: MysticVaultCard variant='full' at bottom with 'What you get in 30 min'
  bullet list"
```

---

## What each file does

| File | What changed |
|---|---|
| `components/ui/IdeaDossier.tsx` | NEW. Full-screen dossier component, 10 sections, dynamic 7Ps + persona derivation from existing idea fields. |
| `components/ui/MysticVaultCard.tsx` | NEW. Sapphire shimmering premium card with variant teaser/full. |
| `components/screens/S09Ideas.tsx` | Full rewrite. Grid mode + dossier mode, crown from either, Mystic Vault post-crown. |
| `components/screens/S11Profile.tsx` | Stripped old consultation toggle + about expander. Added MysticVaultCard variant="full" at bottom. |

No data file changes this batch. All dossier content is derived from existing `deep_content` fields that were already present on every one of your 260 ideas.

---

## If something breaks

**TypeScript error about `deep_content` not being on `Idea` type:** the dossier reads it via a cast — `(idea as unknown as { deep_content?: Record<string, unknown> }).deep_content` — in the IdeaDossier. This is intentional because adding `deep_content` to the core `Idea` type would cascade through scoring code. Confirm the cast line exists near the top of `IdeaDossier.tsx`.

**Radar chart shows only empty grid:** fit_scores might be missing. The component falls back to synthetic values based on `displayScore` if `market_data.fit_scores` isn't present. Confirm by opening an idea in the dossier and checking the radar shows values.

**7Ps cards all show generic defaults ("Web app, cross-platform"):** the derive7Ps function needs `idea.domain_primary`. Verify the crowned idea's `domain_primary` field matches one of the branches in `derive7Ps()` — `creator_tools`, `ai_automation`, `saas_productivity`, `community_social`, `fintech`, `health_wellness`, `education`, `ecommerce_d2c`. If not, it falls back to the generic text (intended behaviour).

**Mystic Vault shimmer doesn't animate:** the `@keyframes mysticShimmer` is defined inline in the component via a `<style>` tag. If your build config strips style tags from React, move the keyframes to your global CSS: add `@keyframes mysticShimmer { 0% { background-position: -150% 0; } 100% { background-position: 150% 0; } }` to `app/globals.css`.

**WhatsApp CTA opens with no message:** the message is URL-encoded. If your WhatsApp on mobile strips newlines, that's a platform behaviour — the message will still arrive, just without line breaks. Swap `\n` for `. ` in the MysticVaultCard if you want to force sentence-separated format.

**"Back to all three" takes me out of dossier but the Vault disappears:** that's intentional — the Vault appears in grid mode too once crowned, just below the cards. If the user hasn't crowned yet, no Vault.

**Dossier scrolls but feels cramped:** the activity zone height depends on JourneyShell's flex layout. If your screen is tall enough, the dossier should breathe. On very short viewports, consider collapsing sections 09 (PESTLE) by default — that's a Batch 4 polish item.

---

## What's next (Batch 4 — the finale)

- **Trading Card founder redesign** at S11 — 9:16 portrait, holographic house-colored border, hero match %, trait triangle infographic, rarity stat ("1 of 287 Architects this month"), founder slug (`catalst.app/architect/anish`), share row directly below card (Instagram Story, WhatsApp, X, Download)
- **S10 Sorting Ceremony polish** — crest recentering transform-origin fix, house radar chart, house rules presented in carved-stone style, impact numbers for each lineage figure, ambient house-color particle drift
- **Full Conspirator voice rewrite** — every remaining Cedric and Pip line across S02, S03, S04 (secondary lines), S05 scenarios, S07, S08, S09, S10, S11 rewritten to the Conspirator tone
- **S08 Forge finesse** — the crystal the user actually built (their exact 3 orbs) spinning with intensifying glow into S09
- **Smart stats for the founder card** — Response speed ranking, rarity calculation, idea novelty decile, industry fit ranking

Reply with Batch 3 QA results once you've applied it and we roll Batch 4 immediately.
