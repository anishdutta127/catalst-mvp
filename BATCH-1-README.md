# Catalst v7 — Batch 1 Fixes

**What's in this package:** every non-creative bug fix and polish item you and I caught in the video review. After you apply this, the journey no longer crashes on inkblot timeout, em-dashes render correctly across every screen, the message strip breathes, the white line on the S00→S01 transition is gone, the crystal grows instead of shrinks, the crown CTA is gold and above the sell zone, and Pip is a cute seed-spirit with six emotion states instead of a green dot with two eyes.

**What's NOT in this package:** the Hinge industry cards (Batch 2), the Crystal Constellation redesign (Batch 2), the full-screen idea dossier (Batch 3), the Mystic Vault sapphire premium card (Batch 3), the Trading Card founder card (Batch 4), and the full Cedric/Pip dialogue rewrite across every screen to Conspirator voice (Batch 4). S01 openers are already rewritten — every other screen still uses the current copy.

---

## Step 1 — Extract the zip into your repo root

Download `catalst-batch-1.zip`, move it to the root of your `catalst-mvp` repo, then:

```bash
cd path/to/catalst-mvp
git checkout -b batch-1-fixes
unzip -o catalst-batch-1.zip
rm catalst-batch-1.zip
```

The zip preserves the repo's folder structure — extracting it overwrites the right files in `components/`, `content/`, `lib/`, `public/`, and `scripts/`. Your existing files outside these paths are untouched.

Verify the files landed in the right places:

```bash
git status
```

You should see ~16 modified files and ~4 new files (PipSprite.tsx, PipText.tsx, the 3 transparent PNGs, the remove-blot-bg script). If anything looks wrong, `git checkout .` and try again.

---

## Step 2 — Open Claude Code and paste this prompt

Claude Code can't apply the zip itself (you already did that in Step 1), but it can run a sanity check, start the dev server, and walk you through the QA. Paste this entire block into Claude Code at the repo root:

```
I just applied Batch 1 of the Catalst v7 fixes. Please do the following in order:

1. Run `npm install` if needed, then start the dev server with `npm run dev`.

2. Do a TypeScript check with `npx tsc --noEmit` and report any errors.
   The only new imports introduced are:
     - CedricBubble.tsx (rewritten, same import surface)
     - PipSprite.tsx (new, imported by ChatZone)
     - PipText.tsx (new, imported by ChatZone)
   Nothing else should change at the import level.

3. Run `npm run lint` and report any errors or warnings that look fresh.

4. When I confirm the dev server is up, tell me the test URL and walk me
   through the manual QA checklist at the bottom of this README, one item
   at a time. For each item, ask me to confirm pass/fail before moving on.

5. If TypeScript, lint, or dev server fail with errors that look like they
   came from my patches, diagnose and fix them before proceeding.

Batch 1 fixes every crash I was hitting plus the em-dash corruption across
every dialogue line. Full fix list is in BATCH-1-README.md. Let me know
when you're ready for the manual QA.
```

---

## Step 3 — Manual QA checklist

Walk the journey end-to-end once after Claude Code confirms the build is clean. For each item below, you're checking the specific fix that Batch 1 shipped.

### S00 Gateway
- [ ] The CATALST title, subtitle, name input, caption, and CTA appear with a single smooth cascade — no "white line" between elements, no hesitation.
- [ ] CTA text reads **"Begin Your Journey →"** (previously was "Enter Verdania →").
- [ ] Type your name in lowercase ("anish"). Hit the CTA.

### S01 Fork
- [ ] Cedric's first bubble says: **"Anish. Good. Sit close — this won't take long."** (proper capitalization + new Conspirator voice + real em-dash instead of a period).
- [ ] Cedric's second line uses em-dash before "just react". No stray periods where dashes should be.
- [ ] Pip's "That's his way of saying welcome! I think." appears fully, no truncation ending in "…".
- [ ] Pip is visibly a cute seed-spirit sprite (teardrop body, two leaf ears, big eyes), not a green circle with two dots.
- [ ] Reading order: Cedric types first, character-by-character. Pip's text doesn't start rendering until Cedric finishes.
- [ ] Messages stay visible until new ones replace them — no fade-out jitter while you're reading.

### S02 Inkblots
- [ ] **The crash fix.** On blot 3 (the third and final inkblot), do nothing. Let the ActivityTimer run all the way down. No runtime error — the timer should auto-select the first option and advance to S03.
- [ ] The inkblot itself sits cleanly inside the circle with NO visible cream/white paper background around it — just dark space with the ink mirrored in the middle.
- [ ] The four option pills show proper em-dashes: "Two people — hands touching", "A butterfly mid-transformation", "A rocket launch — pure thrust", "Something wounded — but still alive". No " . " separators.

### S03 Words
- [ ] The two option pills (e.g., "Control" / "Freedom" for POWER) are now large, clearly tappable buttons with borders — not tiny text.
- [ ] Tapping any part of a pill registers the selection, not just the text itself.

### S04 Industries
- [ ] Tap any industry row. The detail sheet now slides up from within the activity zone — it does NOT cover the header or the chat strip at the top.
- [ ] Closing the sheet (tap outside or swipe down) returns you to the list cleanly.
- [ ] (The full Hinge-swipe redesign ships in Batch 2 — for now you just want the scoping to work.)

### S07 Chronicle
- [ ] Pick a headline, then move to the Practical Constraints section. The old "Fast-forward ten years..." Cedric message should be REPLACED by "Last ones. Quick." — the stale message no longer persists.
- [ ] Select time budget + resource level. The CTA at the bottom reads **"Generate my 3 ideas →"** (previously was "Seal My Path →").
- [ ] All text on the headline cards uses proper em-dashes. "From zero to centaur in 6 years —" not " . ".

### S08 Forge
- [ ] No horizontal progress bar at the bottom of the screen (the old "white line").
- [ ] No "GATHERING INSTINCTS / FORMING CONNECTIONS / ALMOST READY" label text at the bottom.
- [ ] The crystal GROWS through the animation — starts normal, scales up as it pulses, scales bigger during bloom. It does NOT shrink.
- [ ] Total Forge duration feels short (~4 seconds on the AB path) — no long dead air.

### S09 Ideas
- [ ] After crowning (tapping) an idea, the deep-dive accordion appears below the cards.
- [ ] The GOLD **"👑 This is my idea →"** CTA now appears ABOVE the sell zone (previously was below).
- [ ] The sell zone ("Your idea. Built. Shipped. In 7 days.") is visually toned down to a neutral card with a muted WhatsApp CTA — the loud gold ribbon treatment is gone. (Batch 3 replaces this entire block with the Mystic Vault sapphire card.)
- [ ] Grammar in the "Why You" accordion section reads correctly — e.g. "As an Architect" (with proper article), not "As a architects".

### S11 Founder Card (unchanged in Batch 1 — still needs Batch 4 redesign)
- [ ] The founder card still renders. No layout regression from the ChatZone / JourneyShell changes.
- [ ] Pip in the chat strip is the new seed-spirit sprite with the "glow" emotion state.
- [ ] Display name throughout reads "Anish" (capitalized), not "anish".

### Global
- [ ] Scroll back through a few screens. The right edge of every screen is flush with the background — no vertical white hairline running down the right side.
- [ ] The header top-right milestone icons have more vertical breathing room from the chat strip below.
- [ ] On every screen where both speak: Cedric streams first (character-by-character), Pip streams after Cedric finishes.

---

## What each file does, at a glance

| File | What changed |
|---|---|
| `content/lines.ts` | All 36 `\ .` corruptions replaced with real `—`. S01 Cedric openers rewritten to Conspirator voice. |
| `components/ui/ActivityTimer.tsx` | RAF leak killed (`cancelled` flag, `onExpire` ref). This fixes the inkblot timeout crash. |
| `components/screens/S02Inkblots.tsx` | `if (!blot) return null` guard added. Regex hack removed (em-dashes real now). Image paths swapped to `.png`. |
| `components/characters/PipSprite.tsx` | NEW. Inline SVG seed-spirit with 6 emotion states: idle, happy, wideeye, tilt, shy, glow. Color-prop'd, sparkle particles. |
| `components/characters/PipText.tsx` | NEW. Raw green italic typewriter, character-by-character, no bubble, right-aligned. |
| `components/characters/CedricBubble.tsx` | Rewritten to character-by-character streaming (was word-by-word). Top-left aligned, full-width in its column. |
| `components/layout/ChatZone.tsx` | Pip column flex-[2], no 100px cap, no line-clamp. Messages persist. Reading order: Cedric → Pip via `cedricDone` state. Emotion derived from screen + text. |
| `components/layout/JourneyShell.tsx` | Chat backdrop moved from inside 720px column to full-viewport strip (kills the white line). AnimatePresence unified to `mode="wait"`. |
| `components/layout/Header.tsx` | 56px with vertical padding, gradient backdrop, quieter milestone opacities. |
| `components/screens/S00Gateway.tsx` | Single parent `staggerChildren: 0.09` orchestrator with spring. CTA copy updated. |
| `components/screens/S03Words.tsx` | Pills h-12 → h-16, min-width 180px, text-[17px], full-pill hit area, tighter spring. |
| `components/screens/S04Industries.tsx` | Sheet positioning `fixed` → `absolute`, parent `relative`. Scopes sheet to activity zone. |
| `components/screens/S07Chronicle.tsx` | Regex hacks removed. CTA: "Seal My Path" → "Generate my 3 ideas". `clearAllMessages()` on section transition. |
| `components/screens/S08Forge.tsx` | Crystal grows through phases (1.0 → 1.6). Progress bar + phase label deleted. minMs 8000 → 4000 (ab) / 2000 (c). 20-particle bloom burst. |
| `components/screens/S09Ideas.tsx` | Crown CTA gold (was purple), now above sell zone. Sell zone toned down (Batch 3 replaces). `houseAsLabel()` helper fixes grammar. |
| `lib/store/journeyStore.ts` | `setDisplayName` capitalizes: "anish" → "Anish". |
| `public/blots/blot-{1,2,3}.png` | NEW. Transparent PNG versions, cream paper background removed with soft-edge alpha fade. |
| `scripts/remove-blot-bg.py` | NEW. Pillow script to regenerate transparent PNGs if source JPGs ever change. |

---

## If something breaks

**TypeScript error about `PipSprite` or `PipText`:** the component files live at `components/characters/PipSprite.tsx` and `components/characters/PipText.tsx`. Confirm both exist in that folder.

**"can't access property 'options', blot is undefined" at S02:** shouldn't happen with the new code, but if it does, verify `components/screens/S02Inkblots.tsx` contains the `if (!blot) return null;` guard near line 70.

**Blot images show broken/missing:** confirm `public/blots/blot-1.png`, `-2.png`, `-3.png` exist. The old `.jpg` files can stay — `S02Inkblots.tsx` now points to `.png`.

**"As a architects" grammar still wrong:** this only shows up when the `/api/narrative` fallback fires. If your API is down, the fallback now uses `houseAsLabel(houseId)` which produces "As an Architect" / "As a Vanguard" etc. If your API succeeds, it uses whatever the API returned — check the Claude prompt in `app/api/narrative/route.ts` if that copy feels off.

**White line still on right side:** confirm `components/layout/JourneyShell.tsx` is the new file. The key change is the chat backdrop wrapper now wraps the full-width strip, not just the inner 720px column.

---

Ready for Batch 2 when you've confirmed this works. Batch 2 = Crystal Constellation redesign (S06) + Industry Hinge swipe cards (S04) with persistent greyed Continue CTA + category tags on top + enriched industry JSON I'll generate (sub-category CAGR, AI disruption vector, India leaders, cultural trend, recent headline for all 15).
