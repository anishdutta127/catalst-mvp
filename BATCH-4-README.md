# Catalst v7 — Batch 4 (the finale)

**What's in this batch:** the Founder Trading Card (9:16 holographic, house-colored border, hero match %, trait triangle, rarity stat, smart stats grid, founder slug), S10 Sorting Ceremony polish (crest recentering fix + house radar + carved-stone rules + quantified lineage impact + ambient house-color particles), the **full Conspirator voice rewrite** across every remaining Cedric and Pip line on every screen, plus a `founder-stats.ts` helper that computes rarity / response speed rank / idea novelty / industry fit rank from journey data deterministically.

**What's NOT in this batch:** nothing. This is the last one. After this you've got the full Catalst v7 vision shipped.

---

## Order of operations

1. Batches 1, 2, 3 applied and committed in that order.
2. Apply Batch 4 (below).
3. QA.
4. Commit.

---

## Step 1 — Extract the zip into your repo root

**Windows PowerShell:**
```powershell
cd C:\path\to\catalst-mvp
git checkout -b batch-4-finale
Expand-Archive "$env:USERPROFILE\Downloads\catalst-batch-4.zip" -DestinationPath $env:TEMP -Force
Copy-Item "$env:TEMP\catalst-batch-4\*" -Destination . -Recurse -Force
Remove-Item "$env:TEMP\catalst-batch-4" -Recurse -Force
```

**macOS / Linux / WSL:**
```bash
cd path/to/catalst-mvp
git checkout -b batch-4-finale
unzip -o ~/Downloads/catalst-batch-4.zip -d /tmp/
cp -rf /tmp/catalst-batch-4/. ./
rm -rf /tmp/catalst-batch-4
```

Verify:
```bash
git status
```

Should show:
```
modified:   components/screens/S10Sorting.tsx
modified:   components/screens/S11Profile.tsx
modified:   content/lines.ts

Untracked files:
  components/ui/FounderTradingCard.tsx
  lib/founder-stats.ts
```

3 modified, 2 new.

---

## Step 2 — Claude Code sanity

Paste into Claude Code:

```
I just applied Batch 4 — the finale.

Run IN ORDER and stop at each checkpoint:

1. npx tsc --noEmit — report all TypeScript errors.
   New files: lib/founder-stats.ts, components/ui/FounderTradingCard.tsx.
   Neither exports anything that existing code currently imports from
   elsewhere, so no ripple effects are expected.

2. npm run lint — report fresh warnings only.

3. npm run dev — start the server.

4. Walk me through the Batch 4 QA checklist below, screen by screen.
   Key checks:
   - S10: crest stays centered through the scale-up (not offset).
     House radar visible. House rules in italic house-color serif.
     Ambient particles drifting up, house-colored.
   - S11: trading card renders as a 9:16 portrait with holographic
     border animation, smart stats grid 2x2, founder slug at bottom.
     Share row is DIRECTLY below the card.
   - Every screen's dialogue uses the new Conspirator voice.
```

---

## Step 3 — Manual QA checklist

### S10 — Sorting Ceremony

- [ ] The 4 crests initialize in a 2x2 or row layout.
- [ ] After ~2 seconds, 3 non-winning crests fade out (one at a time with 550ms stagger), the winning crest grows to 1.6x scale and **stays centered**. This is the bug fix — before, the crest would visibly jump off-center during scale-up.
- [ ] Winning crest shows the house color glow (radial shadow) around it.
- [ ] "House of Architects" (or your house) title appears in house color with a soft text-shadow glow.
- [ ] **New:** Below the title, a radar chart shows "Your house strengths" with two overlays: bright (you, filled with house color) and dim (average founder, ghost outline). Strengths pulled from the house JSON (e.g. for Architects: Systems thinking, Long-term vision, Technical depth, First-principles design).
- [ ] **New:** Below the radar, "House rules" carved-stone panel — 3 italic rules in house color with subtle text-shadow. For Architects: "Build for decades, not quarters" / "The blueprint is never complete. Ship anyway." / "Depth is a moat. Surface is a trap." For Vanguards: "Move first. Apologise never." / etc.
- [ ] **New:** Lineage cards now include the `quantified_impact` line in house color (e.g. Leonardo da Vinci: "Designed flying machines 400 years before aviation. 13,000+ pages of notebooks still referenced in engineering today.") and the `epithet` top-right in italic (e.g. "The Original Systems Thinker").
- [ ] **New:** Ambient particles drift upward from bottom to top in the house color, with house-color glow. 18 particles total, spread across the viewport, slightly different sizes and delays.
- [ ] Collective impact line appears at the bottom once everything lands (e.g. "Built systems that outlasted empires. Their work still runs the world.").
- [ ] Auto-advances to S11 after the lineage reveal completes.

### S11 — Founder Trading Card

- [ ] Page opens with the **FounderTradingCard at top** — 9:16 portrait aspect, centered.
- [ ] Card has an animated holographic border — house color + iridescent white/pink accents shifting around the perimeter every 6 seconds. The inner content stays static.
- [ ] Background shows a massive watermarked house initial letter (A for Architects, V for Vanguards, etc.) at about 4% opacity — visible but doesn't compete.
- [ ] Top-left of the card: small **tier badge** ("RARE" / "EPIC" / etc.) in a colored pill. Below it: house name in small caps.
- [ ] Top-right: a 40px circular house sigil with the house letter, glowing.
- [ ] Center hero: huge **match %** in house color with a strong text-shadow glow (e.g. "95" at 96px, with a small "%" beside it). Caption "MATCH" beneath in mono caps.
- [ ] Below hero: **trait triangle SVG** — the 3 crystal orbs as colored dots (their actual orb colors) with connecting lines and the house letter faintly in the geometric center.
- [ ] Below triangle: **trait signature** as a 3-letter code separated by dashes (e.g. "VI-CR-AN" for Vision-Craft-Analysis). Centered with horizontal hairlines on either side.
- [ ] **Smart stats grid (2×2)**:
  - Rarity — "1/{pool size}" (e.g. "1/287")
  - Speed — "Top X%" (derived from the user's instinct-test response times)
  - Novelty — derived from idea.novelty_score
  - Fit — derived from match percentage
- [ ] Below stats grid: **crowned idea strip** — small "CROWNED IDEA" label, idea name in bold serif, domain underneath.
- [ ] Bottom of card: **display name** in big serif + **founder slug** in mono (e.g. "catalst.app/architect/anish").
- [ ] **Share row directly below the card** — 4 buttons in a row: 📸 Story / 💬 WhatsApp / 𝕏 Post / ⬇ Save PNG. Each button triggers the expected share flow with the specific share text including house, match, idea name.
- [ ] Save PNG button saves the trading card at pixelRatio 3 — check that the downloaded image is at least ~1020×1812px (sharp on Instagram Stories which wants 1080×1920).
- [ ] Below share row: "📄 Download full idea pack (.md)" secondary button.
- [ ] **New section**: "Stats on your card" — a breakdown explaining the numbers on the card in plain English:
  - 🎖 Rarity — "{TIER} — 1 of {N} {House} this month"
  - ⚡ Instinct speed — "Faster than X% of founders"
  - 💡 Idea novelty — "Top X% for novelty"
  - 🎯 Industry fit — "Top X% match for {industry}"
  - 🧬 Trait signature — the 3-letter code
- [ ] Below stats: house identity section (unchanged from Batch 3).
- [ ] Top 3 ideas list (unchanged).
- [ ] **MysticVaultCard variant="full"** at the bottom (same as Batch 3 — reconfirm it still renders here).
- [ ] "Ideation Journey Complete · House of {X}" caption at the very bottom.

### Every screen — Conspirator voice

- [ ] S01 Cedric: "{name}. Good. Sit close — this won't take long." then "Most founders spend years circling what they're meant to build. We'll find yours in five minutes. Don't think — just react. Your instincts are faster than your reasoning."
- [ ] S01 Pip entrance: "Don't mind the face. He says that to everyone — means he likes you."
- [ ] S02 Cedric intro: "Three shapes. I'm not testing you — I'm reading you. First thing you see. Don't clean it up."
- [ ] S02 Pip intro: "Okay these shapes are freaking me out — do NOT tell me what yours looks like, I'll overthink it for days."
- [ ] S03 Cedric intro: "Four words. First thought wins. Don't overthink — your second answer is always fear talking."
- [ ] S04 Cedric intro: "Fifteen worlds. Some will pull at you. Some won't. Keep the ones that pull — star the ones that obsess you. Trust the pull, not the logic."
- [ ] S06 Cedric intro: "Every instinct so far was you reacting. This one is you choosing. Eight essences. You carry three. Pick what defines you — not what sounds impressive. The crystal will grow with the ones you pick and dim with the ones you leave behind."
- [ ] S07 Cedric: "Fast-forward ten years. Four futures. Pick the one that actually makes your chest feel something — not the one that sounds responsible."
- [ ] S08 Cedric: "Hold on. Let me put it all together." → "Alright. Here's what fits."
- [ ] S09 Cedric: "Three ideas. Matched to your actual instincts — not what you said you wanted. Read slowly."
- [ ] S09 Pip: "WAIT. These are... these are actually good?? Like GOOD good??"
- [ ] S10 Cedric claim: "There. That's you."
- [ ] S11 Cedric: "One last thing. Made this for you while you weren't looking." → eventually "I don't give you answers, {name}. I give you a mirror. What you build with what you see — that part is entirely yours."
- [ ] S11 Pip: "Go build it. Seriously. And come back and tell us when you ship — I genuinely want to know."

### Smart stats sanity

- [ ] Rarity pool size scales with house distribution — Architects (~21% of users) will have a smaller pool than Alchemists (~31%).
- [ ] Response speed rank feels truthy — if you rushed through the inkblots + words, you should land in "Top 10-20%". If you took your time, "Top 40-60%".
- [ ] Idea novelty rank matches what you'd expect — rare/unusual domains (biotech, spiritual, manufacturing) push toward top 5-15%, common domains (saas_productivity, health_wellness) sit around top 30-50%.
- [ ] Industry fit equals your displayed match percentage, so a 95% match shows "Top 5% match for {industry}".

---

## Step 4 — Commit

```bash
git add -A
git commit -m "Batch 4: Trading Card + S10 polish + full Conspirator voice

- New FounderTradingCard: 9:16 holographic portrait, house-colored
  animated foil border, hero match %, trait triangle with orb colors,
  smart stats grid (rarity/speed/novelty/fit), trait signature code,
  crowned idea strip, display name + founder slug
- New founder-stats.ts: deterministic derivation of rarity / response
  speed rank / novelty decile / industry fit rank from journey data
  (blotResponseTimes + wordResponseTimes + crystalSelectionTimes +
  idea.novelty_score + house distribution)
- S11 rewrite: Trading Card hero + share row DIRECTLY below +
  smart stats explainer + house identity + top 3 ideas + MysticVault
- S10 polish: crest recentering via transform-origin: center (fixes
  the off-center jump on winner scale-up), house radar chart showing
  strengths vs average founder, carved-stone house rules (3 per house,
  house-colored italic serif), quantified_impact line on each lineage
  figure + epithet, 18 ambient house-color particles drifting upward
- Full Conspirator voice rewrite across S01-S11 for Cedric and Pip:
  ~49 lines rewritten, replaces mystical-wizard tone with close,
  low-voice, insider energy throughout"
```

Create a master commit on main once you've merged the 4 batches:
```bash
git checkout main
git merge batch-1-fixes batch-2-hinge-crystal batch-3-dossier-vault batch-4-finale
```
(Or merge each branch one at a time for cleaner history.)

---

## What each file does

| File | What it does |
|---|---|
| `lib/founder-stats.ts` | NEW. Pure function `computeFounderStats()` — reads journey state, returns rarity / speed / novelty / fit / trait signature. Deterministic per user (seeded on house + name + match %). |
| `components/ui/FounderTradingCard.tsx` | NEW. The 9:16 holographic card. `forwardRef` so `html-to-image` can capture it for Save PNG. |
| `components/screens/S10Sorting.tsx` | Full polish. Adds radar, house rules, quantified lineage impact, ambient particles, fixes crest recentering. |
| `components/screens/S11Profile.tsx` | Replaces the old founder card visual with the new Trading Card. Share row lifted up to directly below card. Mystic Vault still at bottom. |
| `content/lines.ts` | 49 Conspirator-voice rewrites across every Cedric and Pip line on every screen. |

---

## If something breaks

**Trading Card border animation doesn't animate:** the `holographicSweep` keyframe is inline in the component via `<style>{}` at the bottom. If your build strips style tags from React, move the keyframe to `app/globals.css`:
```css
@keyframes holographicSweep {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

**Trading Card looks pixelated when saved:** the default `pixelRatio` is 3 in S11Profile's `handleSaveCard`. If you need higher fidelity for print, bump to 4. Warning: memory usage scales quadratically.

**Rarity stats feel too high / too low:** the simulated monthly user count is `SIMULATED_MONTHLY_USERS = 1450` in `founder-stats.ts`. Adjust to match your actual user base. Same for `HOUSE_DISTRIBUTION`.

**Response speed rank always shows "Top 30%":** check that `blotResponseTimes`, `wordResponseTimes`, and `crystalSelectionTimes` are populated in the store. If empty, the function falls back to a synthetic 4500ms average (middle of the distribution). Timing is recorded via `ActivityTimer.tsx` and the `createTimer()` utility — should already be wired from Batch 1.

**Crest still jumps off-center at S10:** confirm the new `style={{ transformOrigin: 'center center' }}` is set on the `motion.div` wrapping each crest. Without it, Framer Motion uses the default `transformOrigin: '50% 50%'` which can behave unpredictably when combined with `display: grid` layout. Explicit `'center center'` is the fix.

**Conspirator voice — some lines weren't rewritten:** open `content/lines.ts` and grep for remaining "garden" references. A few "garden" mentions are intentional (Verdania lore) but any feel-generic wizard-speak should be sharpened. If you spot something I missed, the pattern is: replace external/oracle tone ("the garden will remember") with insider/conspirator tone ("I'll remember that") — Cedric is a person, not a mystical force.

**TypeScript error on `novelty_score`:** the Idea type does declare `novelty_score?: number` so this should just work. If it doesn't, confirm the import path for `ScoredIdea` in `FounderTradingCard.tsx` resolves to `@/lib/scoring/types`.

---

## You made it

When all four batches are committed and QA passes, this represents: the full user's 13-point brief delivered, my discovered bugs fixed, ~50 rewritten dialogue lines in Conspirator voice, two new data payloads (enriched industries + all 260 ideas displaying their existing `deep_content` through a dossier UI), four new reusable components (PipSprite, IndustrySwipeCard, CrystalViewport, IdeaDossier, MysticVaultCard, FounderTradingCard), and a finished shareable founder identity layer.

Ship it. Tweet it. Tag me when someone crowns a ridiculous idea.
