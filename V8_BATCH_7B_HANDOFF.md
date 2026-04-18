# Catalst v8 — Batch 7B handoff

One file ships with this handoff:

```
archetypes.json    ← 16-entry founder archetype lookup for S11
```

Everything else is code edits you make directly in the repo.

## Scope

Five workstreams. In order. One commit per step with the exact messages shown.
Push to `batch-1-fixes` at the end. Do not merge to main. No new npm deps
unless explicitly called out.

1. **Crystal polish (focused, not rework)** — the existing `Crystal.tsx`
   octahedral from Batch 6 gets opacity + proportions + transition choreography
   tightened. S06 instruction overlap fixed. S08 forge evolution verified.
2. **S09 cleanup** — verify footer + tag row survive the v8 rename, no
   cramping on 375px.
3. **S11 Founder Card + Catalst Challenge** — archetype lookup, radar
   chart, trading-card treatment, #CatalstChallenge viral-loop section.
4. **Background compression** — three backgrounds are 8–10 MB and hurt
   first-paint on mobile. Compress, no code change beyond image files.
5. **Mobile audit S00 → S11** — systematic pass at 375 / 390 / 768 / 1440.
   Many small commits. Anish will do the visual audit himself.

Not in this batch (reserved for Batch 7C): new ideas, new industries,
industry sub-taxonomy, any scoring-engine changes.

---

## STEP 1 — Install archetypes

```bash
mv archetypes.json content/archetypes.json
```

Verify it loads as JSON (no commit yet — used in Step 4 for S11).

---

## STEP 2 — Crystal polish (focused, NOT a rework)

**Before any edits, read `components/ui/Crystal.tsx` start to finish and confirm
it's the Batch 6 octahedral-bipyramid build with counter-rotating specular.
If the file is something else (previous Asscher step-cut, diamond, etc.),
STOP and report in chat — the polish below assumes the Batch 6 structure.**

Fixes inside `components/ui/Crystal.tsx`:

**(a) Proportions — squatter, cuter.** The current octahedral is too tall/dagger-like.
In the facet vertex constants near the top of the component, change:

```
top:           (0, -90)   →  (0, -70)
bottom:        (0,  90)   →  (0,  70)
left:          (-55, 0)   →  (-62, 0)
right:         ( 55, 0)   →  ( 62, 0)
inner-top:     (±38, -22) unchanged
inner-bottom:  (±38,  22) unchanged
```

**(b) Opacity — gem should read solid, not translucent ghost.**
- Facet polygon `fill` opacity stays via gradient stops. Do NOT apply `opacity={0.xx}` to polygons themselves.
- Back facets (first rendered, for depth): set `opacity={0.6}` (was 0.35 → reads too ghosted).
- Add a base-layer polygon covering the full silhouette BEHIND the gradients, `opacity={0.92}`, fill = the gem's base color. This prevents see-through.

**(c) Edge strokes — bolder.**
- Top-half edges: `strokeWidth={2.25}` (was 1.5), `strokeLinejoin="round"`.
- Bottom-half edges: `strokeWidth={2.25}`.
- Girdle band stroke: `strokeWidth={1.25}`, opacity unchanged.

**(d) Count-transition burst choreography.** Each count-change gets a one-shot
animation to feel like progress, not just a static re-render. Use a
`useEffect` on `count` to set a transient `justAdded` flag, then conditionally
render burst particles via `AnimatePresence`. Specifically:

- `count 0 → 1`: 4 sparkle particles radial-burst from center (circle r:0→120,
  opacity 0.9→0 over 700ms). Scale pop on the halo: 1 → 1.18 → 1 (450ms,
  easeOvershoot).
- `count 1 → 2`: 6 sparkle particles from the spine. Scale pop on full group:
  1 → 1.15 → 1 (500ms).
- `count 2 → 3`: keep the existing staggered facet materialization. ADD:
  10 sparkle particles radial burst, shockwave ring (circle r:40→180,
  opacity 0.8→0, 1000ms), one-time full-gem scale pop 0.92→1.22→1 (700ms
  easeOvershoot, delay 200ms so facets form first).

All burst elements must unmount cleanly after their animation — don't leak
into steady-state render. Gate on a `justAdded` boolean that clears via
`setTimeout` after the longest animation duration.

**(e) Counter-rotating specular — verify.** The small white polygon (~14×18px
at ≈(-28, -55), opacity 0.7, blurred) must counter-rotate — its `rotateY`
animates `[0, -360]` over the same 14s period that the gem rotates `[0, 360]`.
If the sign is wrong the whole 3D illusion collapses. Confirm this is correct
in the current file; if not, flip the sign.

Fix inside `components/screens/S06Crystal.tsx`:

**(f) Instruction overlap.** The "Tap an essence to begin" text currently
sits at the same y-position as the central glow orb at `count === 0`.
Render it as a pill ABOVE the 8-essence ring instead, ~40px above the
crystal viewport top edge. Fade out once `count >= 1` (forming crystal
becomes its own signal):

```tsx
<motion.div
  className="text-xs tracking-[0.25em] text-white/60 font-serif italic text-center"
  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}
  animate={{ opacity: count === 0 ? 1 : 0 }}
  transition={{ duration: 0.4 }}
>
  Tap an essence to begin
</motion.div>
```

Column order: Cedric bubble → 16px gap → instruction pill → 20px gap →
crystal viewport → 8-essence ring.

Fix inside `components/screens/S08Forge.tsx`:

**(g) Forge evolution — no spec changes, just verify.** Confirm it renders
the updated `Crystal.tsx` (same component, different props). The existing
Pokemon-evolution timing (idle → burst at 1500ms → settle at 4800ms →
navigate at 6800ms) is unchanged. It should feel dramatically better simply
because the underlying gem is cuter and more opaque now.

Acceptance (Anish will audit manually):
- Gem reads as a solid, opaque game asset — not a translucent ghost.
- Each count-change produces a visible burst: sparkle + scale pop +
  (at count=3) shockwave ring.
- S06 count=0: instruction pill above the orb, no overlap.
- S08 forge evolution inherits all polish.

Commit: `crystal(v8): opacity, cuter proportions, count-transition burst choreography, fix s06 instruction overlap`

---

## STEP 3 — S09 footer cleanup

Open `components/screens/S09Ideas.tsx`. This is a sanity pass, not a rebuild.
The rename from Batch 7A changed some tile titles — verify:

**(a)** No tile renders "PromptCraft" twice. (Fixed structurally by the
data patch, but worth an eyeball.)

**(b)** The tag row and "Read the deep read →" CTA are separated by a
thin divider, tag row above, CTA as full-width bar below. If the border-top
divider looks harsh, soften to `border-white/8` (currently `border-white/10`).

**(c)** On mobile (`<640px`), the 4-card Path B layout stacks vertically.
The 3-card Path A/C layout also stacks vertically on mobile, grid on ≥640.
Currently uses `flex flex-col sm:flex-row` — this is correct, don't change.

**(d)** Pip top-right airspace: `pt-14` on the scroll container reserves
space so the Pip bubble doesn't clash with the first idea card's header.
Verify this is intact. On 375px viewports, confirm the first card's
"match%" number doesn't collide with Pip's body.

If everything is clean: no code change, no commit. Skip to Step 4 and
report in chat that S09 needed no edits.

If any of the above fails: commit only the minimal fix required.
Commit message (only if a fix is needed): `s09(v8): footer tag/CTA spacing sanity`

---

## STEP 4 — S11 Founder Card + Catalst Challenge

Biggest workstream. Three new files, one rewrite.

### 4.1 — Helper: archetype lookup

Create `lib/archetypes.ts`:

```ts
/**
 * Founder archetype lookup. Maps (house, dominant motive) to a shareable
 * founder identity with celebrity twins + signature move + kryptonite.
 *
 * Dominant motive is derived from the nAch/nAff/nPow vector in
 * extractPersonality() — pick the highest. Fallback uses -any suffix.
 */

import archetypesRaw from '@/content/archetypes.json';

export interface FounderTwin {
  name: string;
  company: string;
  initials: string;
  whyQuote: string;
}

export interface Archetype {
  name: string;
  pullQuote: string;
  twinGlobal: FounderTwin;
  twinIndian: FounderTwin;
  signatureMove: string;
  kryptonite: string;
  rarity: string;
}

type ArchetypeMap = Record<string, Archetype>;
const MAP = archetypesRaw as unknown as ArchetypeMap;

export type HouseSlug = 'architects' | 'vanguards' | 'alchemists' | 'pathfinders';
export type MotiveSlug = 'achievement' | 'affiliation' | 'power' | 'any';

export function getArchetype(house: HouseSlug, motive: MotiveSlug): Archetype {
  return MAP[`${house}-${motive}`] ?? MAP[`${house}-any`] ?? MAP['architects-any'];
}

/** Pick dominant motive from McClelland vector (from extractPersonality). */
export function pickDominantMotive(mc: { nAch: number; nAff: number; nPow: number }): MotiveSlug {
  const { nAch, nAff, nPow } = mc;
  const max = Math.max(nAch, nAff, nPow);
  if (max === 0) return 'any';
  if (nAch === max) return 'achievement';
  if (nAff === max) return 'affiliation';
  return 'power';
}
```

### 4.2 — Component: RadarChart

Create `components/ui/RadarChart.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';

/**
 * 6-axis radar chart for the founder card. Axes: SCALE, IMPACT, CRAFT,
 * EMPATHY, VISION, GRIT. All scores 0-100.
 *
 * The polygon draws in via pathLength 0→1 over 900ms on mount. Data dots
 * appear at each vertex. Three concentric hexagonal guides at 33/66/100%.
 */

export interface RadarScores {
  scale: number;
  impact: number;
  craft: number;
  empathy: number;
  vision: number;
  grit: number;
}

export function RadarChart({ scores, color, size = 200 }: {
  scores: RadarScores;
  color: string;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  // 6 axes, starting from top, going clockwise
  const axes = ['scale', 'impact', 'craft', 'empathy', 'vision', 'grit'] as const;
  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / 6;

  // Guide hexagons at 33/66/100
  const ring = (pct: number) =>
    axes.map((_, i) => {
      const a = angleFor(i);
      return `${cx + Math.cos(a) * r * pct},${cy + Math.sin(a) * r * pct}`;
    }).join(' ');

  // Data polygon
  const dataPoints = axes.map((k, i) => {
    const v = Math.max(0, Math.min(100, scores[k])) / 100;
    const a = angleFor(i);
    return { x: cx + Math.cos(a) * r * v, y: cy + Math.sin(a) * r * v };
  });
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const labelFor = (i: number, label: string) => {
    const a = angleFor(i);
    const lr = r + 14;
    return {
      x: cx + Math.cos(a) * lr,
      y: cy + Math.sin(a) * lr,
      label,
    };
  };
  const labels = ['SCALE', 'IMPACT', 'CRAFT', 'EMPATHY', 'VISION', 'GRIT'].map((l, i) => labelFor(i, l));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {/* Guide rings */}
      {[0.33, 0.66, 1].map((pct) => (
        <polygon
          key={pct}
          points={ring(pct)}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
        />
      ))}

      {/* Axes */}
      {axes.map((_, i) => {
        const a = angleFor(i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(a) * r}
            y2={cy + Math.sin(a) * r}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon — draws in */}
      <motion.polygon
        points={dataPath}
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={1.75}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />

      {/* Vertex dots */}
      {dataPoints.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.9 + i * 0.05, type: 'spring', stiffness: 300 }}
        />
      ))}

      {/* Labels */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fill="rgba(255,255,255,0.65)"
          style={{ letterSpacing: '0.12em', fontWeight: 600 }}
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}
```

### 4.3 — Component: ChallengeSection

Create `components/ui/ChallengeSection.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * #CatalstChallenge viral-loop section for S11. Renders below the founder
 * card. Three share actions:
 *   - WhatsApp: opens wa.me with a pre-filled message
 *   - Instagram Story: copies caption to clipboard + prompts user to paste
 *   - Download card: triggers card capture (future batch — for now just copies)
 */

export function ChallengeSection({
  houseColor,
  firstName,
  archetypeName,
  matchPct,
  twinName,
}: {
  houseColor: string;
  firstName: string;
  archetypeName: string;
  matchPct: number;
  twinName: string;
}) {
  const [copied, setCopied] = useState<'ig' | 'wa' | null>(null);

  const waText = `just found out I'm ${archetypeName} on Catalst 👀 ${matchPct}% match with ${twinName}. you should try — I'm challenging you to find yours before next week: catalst.app`;
  const igCaption = `I'm ${archetypeName.toLowerCase()} on @catalst 🌱 founder twin: ${twinName}. Tag 3 friends who should start an AI business. #CatalstChallenge`;

  async function copyToClipboard(text: string, which: 'ig' | 'wa') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(which);
      setTimeout(() => setCopied(null), 1800);
    }
  }

  function openWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="rounded-3xl border p-5 sm:p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 70%)',
        borderColor: 'rgba(255,255,255,0.12)',
      }}
    >
      <div className="text-center">
        <div className="text-[10px] tracking-[0.3em] opacity-70 mb-2">#CATALSTCHALLENGE</div>
        <h3 className="font-serif text-xl sm:text-2xl mb-3">Think you know three founders?</h3>
        <p className="text-[13px] opacity-80 leading-relaxed mb-5 max-w-sm mx-auto">
          Tag 3 friends who should start an AI business. First to ship earns bragging rights —
          and we'll be watching.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={openWhatsApp}
            className="min-h-[48px] rounded-xl bg-white/10 hover:bg-white/15 transition text-[13px] font-medium flex items-center justify-center gap-2"
            data-testid="challenge-whatsapp"
          >
            <span aria-hidden>💬</span> WhatsApp
          </button>
          <button
            onClick={() => copyToClipboard(igCaption, 'ig')}
            className="min-h-[48px] rounded-xl bg-white/10 hover:bg-white/15 transition text-[13px] font-medium flex items-center justify-center gap-2"
            data-testid="challenge-instagram"
          >
            <span aria-hidden>📸</span> {copied === 'ig' ? 'Caption copied' : 'Story caption'}
          </button>
        </div>

        <button
          onClick={() => copyToClipboard(`${firstName} · ${archetypeName} · ${matchPct}% · Twin: ${twinName} · catalst.app`, 'wa')}
          className="w-full min-h-[48px] rounded-xl font-semibold text-[13px] text-dark flex items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${houseColor}, ${houseColor}cc)`,
          }}
          data-testid="challenge-download"
        >
          <span aria-hidden>⬇️</span>
          {copied === 'wa' ? 'Summary copied' : 'Save + Challenge 3 Friends'}
        </button>

        <p className="text-[10px] opacity-50 mt-3">
          Challenge message auto-fills. Edit before posting.
        </p>
      </div>
    </motion.div>
  );
}
```

### 4.4 — S11Profile.tsx rewrite

Open `components/screens/S11Profile.tsx`. Replace the body with a trading-card
layout. Assumes the existing imports (Zustand store, houses.json, lines, motion).

Structure (top to bottom):

```
<PageBackdrop />                                    // readability gradient overlay
<div max-w-md mx-auto px-4 py-6 space-y-5>
  <FounderTradingCard />                            // the shareable artifact
  <QuickShareRow />                                 // 4 circular buttons
  <TopMatchedIdeas />                               // 3 compact idea cards
  <ChallengeSection />                              // the viral loop (4.3)
  <MysticVaultCard variant="full" />                // existing component, keep
  <SkipCTA />                                       // "Maybe later — continue"
</div>
```

Key code bits to include:

```tsx
import { RadarChart, type RadarScores } from '@/components/ui/RadarChart';
import { ChallengeSection } from '@/components/ui/ChallengeSection';
import { getArchetype, pickDominantMotive, type HouseSlug } from '@/lib/archetypes';
import { extractPersonality } from '@/lib/scoring/engine';
import { buildForgeProfile } from '@/lib/scoring/buildProfile';
```

Compute archetype at the top of the component:

```ts
const journeyState = useJourneyStore();
const profile = buildForgeProfile(journeyState);
const personality = extractPersonality(profile);
const motive = pickDominantMotive(personality.mcClelland);
const archetype = getArchetype((houseId ?? 'architects') as HouseSlug, motive);
const houseColor = house?.hex ?? '#D4A843';
```

Compute radar scores from the ForgeProfile's existing signals. Map:

```ts
// Map internal signals to the 6 display axes. Values 0-100.
const radarScores: RadarScores = {
  scale:   Math.round(personality.mcClelland.nPow * 100),
  impact:  Math.round(personality.mcClelland.nAff * 100 * 0.6 + personality.mcClelland.nPow * 100 * 0.4),
  craft:   Math.round(personality.bigFive.C * 100),
  empathy: Math.round(personality.bigFive.A * 100),
  vision:  Math.round(personality.bigFive.O * 100),
  grit:    Math.round((1 - personality.bigFive.N) * 100 * 0.5 + personality.boldness * 100 * 0.5),
};
```

**Founder trading card JSX** (inside the founder-card block):

```tsx
<motion.div
  className="rounded-3xl p-[2px]"
  style={{
    background: `conic-gradient(from 0deg, ${houseColor}, ${houseColor}aa, #ffffff22, ${houseColor}, ${houseColor})`,
  }}
  animate={{ rotate: [0, 360] }}
  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
>
  <div className="rounded-[22px] bg-black/75 backdrop-blur-md p-4 sm:p-5 aspect-[9/16] relative overflow-hidden">
    {/* Row 1: house crest + rarity */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* existing HouseCrest SVG or similar */}
        <span className="text-[10px] tracking-[0.25em] opacity-75">{house?.name?.toUpperCase() ?? 'FOUNDER'}</span>
      </div>
      <span
        className="text-[10px] tracking-[0.25em] px-2 py-1 rounded-full border"
        style={{ borderColor: `${houseColor}60`, color: houseColor }}
      >
        {archetype.rarity.toUpperCase()}
      </span>
    </div>

    {/* Row 2: name + archetype */}
    <div className="mt-5">
      <h1 className="font-serif text-3xl leading-none">{displayName}</h1>
      <h2 className="font-serif italic text-lg mt-1" style={{ color: houseColor }}>
        {archetype.name}
      </h2>
    </div>

    {/* Row 3: pull quote */}
    <blockquote
      className="mt-4 text-[13px] leading-relaxed italic opacity-90 border-l-2 pl-3"
      style={{ borderColor: houseColor }}
    >
      {archetype.pullQuote}
    </blockquote>

    {/* Row 4: radar */}
    <div className="my-5 flex justify-center">
      <RadarChart scores={radarScores} color={houseColor} size={200} />
    </div>

    {/* Row 5: 3-stat pill row */}
    <div className="grid grid-cols-3 gap-2 text-center">
      <StatPill label="RARITY" value={archetype.rarity} color={houseColor} />
      <StatPill label="SEALED IN" value={sealedTime} color={houseColor} />
      <StatPill label="MATCH" value={`${crowned?.scored.displayScore ?? 85}%`} color={houseColor} />
    </div>

    {/* Row 6: founder twin */}
    <div className="mt-5">
      <div className="text-[10px] tracking-[0.25em] opacity-65 mb-2">YOUR FOUNDER TWIN</div>
      <FounderTwinInline twin={archetype.twinGlobal} color={houseColor} />
      <div className="text-[10px] opacity-55 mt-2 text-center">
        · and {archetype.twinIndian.name.split(' ').slice(-1)[0]} in India
      </div>
    </div>

    {/* Row 7: signature + kryptonite */}
    <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
      <div>
        <div className="text-[9px] tracking-widest opacity-60 mb-1">SIGNATURE MOVE</div>
        <div className="opacity-85 italic">{archetype.signatureMove}</div>
      </div>
      <div>
        <div className="text-[9px] tracking-widest opacity-60 mb-1">KRYPTONITE</div>
        <div className="opacity-85 italic">{archetype.kryptonite}</div>
      </div>
    </div>

    {/* Row 8: crowned idea */}
    {crowned && (
      <div className="mt-5 rounded-xl border border-white/10 p-3">
        <div className="text-[9px] tracking-widest opacity-60">CROWNED IDEA</div>
        <div className="font-semibold text-base mt-1">{crowned.scored.idea.idea_name}</div>
        <div className="text-xs opacity-70">in {crowned.scored.idea.domain_primary.replace(/_/g, ' ')}</div>
      </div>
    )}

    {/* Row 9: url + challenge badge */}
    <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[10px]">
      <span className="tracking-widest opacity-50">#CATALSTCHALLENGE</span>
      <span className="font-mono opacity-60">catalst.app/{houseId}/{displayName.toLowerCase()}</span>
    </div>
  </div>
</motion.div>
```

Helper components (put them at the bottom of the same file):

```tsx
function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 py-2">
      <div className="text-[9px] tracking-widest opacity-60">{label}</div>
      <div className="text-sm font-bold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

function FounderTwinInline({ twin, color }: { twin: FounderTwin; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
      <div
        className="w-12 h-12 rounded-full grid place-items-center font-serif text-lg font-bold shrink-0"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
      >
        {twin.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{twin.name}</div>
        <div className="text-xs opacity-70 truncate">{twin.company}</div>
        <div className="text-xs italic opacity-60 mt-1 line-clamp-2">"{twin.whyQuote}"</div>
      </div>
    </div>
  );
}
```

Compute `sealedTime`:

```ts
// Time elapsed since first screen — stored as screenHistory length × estimated avg.
// Cheap approximation: we don't track real wall time, so use completed-screens
// count × 40 seconds as a baseline. Replace with real timestamp tracking later.
const sealedMinutes = Math.max(3, Math.round(completedScreens.length * 0.8));
const sealedTime = `${sealedMinutes}m`;
```

**Quick share row** (4 circular buttons, below founder card, above ideas list):

```tsx
<div className="flex justify-center gap-3">
  {[
    { icon: '📸', label: 'Instagram', onClick: () => copyToClipboard(igCaption, 'ig') },
    { icon: '🐦', label: 'Twitter',   onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(igCaption)}`, '_blank') },
    { icon: '💬', label: 'WhatsApp',  onClick: openWhatsApp },
    { icon: '⬇️', label: 'Download',  onClick: () => { /* future: html2canvas */ } },
  ].map((b) => (
    <button
      key={b.label}
      onClick={b.onClick}
      aria-label={b.label}
      className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center transition"
    >
      <span aria-hidden className="text-base">{b.icon}</span>
    </button>
  ))}
</div>
```

Acceptance (Anish's manual audit will verify):
- Founder card reads as a collectible trading card, not a plain info panel.
- Holographic border subtly rotates; reduce `#ffffff22` stop if too loud.
- Radar chart draws in, data polygon shows six axes labeled.
- Archetype name + pull quote reflect the user's house × motive combo.
- #CatalstChallenge section is visually prominent, CTAs work
  (WhatsApp opens wa.me, IG caption copies to clipboard with confirmation).
- MysticVaultCard still renders at the bottom.
- Skip CTA ("Maybe later — continue to my house →") stays at the very bottom.

Commit: `s11(v8): founder trading-card, 16-archetype lookup, radar chart, #CatalstChallenge viral loop`

---

## STEP 5 — Background compression

Three background PNGs are 8–10 MB. Target: under 800 KB each, no visible
quality loss at viewing resolution.

**Option A (recommended, no new deps):** Use `sharp` if already installed
(check `package.json`). If not, install it as a dev dep:

```bash
npm install -D sharp
```

Then create `scripts/compress-backgrounds.ts`:

```ts
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'public/backgrounds';
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.png'));

(async () => {
  for (const f of files) {
    const fp = path.join(DIR, f);
    const beforeSize = fs.statSync(fp).size;
    if (beforeSize < 1_000_000) {
      console.log(`  ✓ ${f} already ${(beforeSize / 1024).toFixed(0)} KB — skip`);
      continue;
    }
    const buf = await sharp(fp)
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .png({ quality: 82, compressionLevel: 9, palette: true })
      .toBuffer();
    fs.writeFileSync(fp, buf);
    const afterSize = fs.statSync(fp).size;
    console.log(`  ✏️  ${f}: ${(beforeSize / 1024 / 1024).toFixed(1)} MB → ${(afterSize / 1024).toFixed(0)} KB`);
  }
  console.log('\n✅ done');
})();
```

Run once:

```bash
npx tsx scripts/compress-backgrounds.ts
```

**If `sharp` install fails on Windows** (it occasionally does with Node 20+),
skip this step and report back. Anish can use an online tool
(squoosh.app / tinypng) manually — not a blocker for this batch.

**Option B (zero deps):** Anish manually runs the PNGs through squoosh.app
or tinypng.com, drops the compressed versions back into `public/backgrounds/`.
No code change.

Acceptance:
- Each bg-s*.png file is under 1 MB.
- Visual quality unchanged at full desktop resolution (compare before/after).
- `npm run dev` loads backgrounds without 404 or blur.

Commit (if done via sharp script): `perf(v8): compress backgrounds from 8-10MB to <1MB for mobile first-paint`

---

## STEP 6 — Mobile audit pass (structural fixes only)

Don't do a visual audit — Anish will do that manually. This step is a
structural sweep for the mobile-first guarantees:

**Apply these rules across every screen S00–S11. Fix any violation.**

1. **CTAs full-width on `<640px`.** Any `Continue` / `Crown` / `Submit` button
   that's narrower than the viewport on mobile must span full-width. Check
   S00, S01 paths, S04 Continue, S06 Continue, S07 Continue, S09 Crown CTA,
   S11 share row.

2. **Tap targets minimum 44×44 px.** Circular action buttons, close icons,
   pill filters. S04 category filter chips are 32px wide — that's too
   narrow on mobile. Set a `min-height: 44px` on the filter strip at
   `<640px` via a media query or a `sm:` prefix.

3. **No horizontal scroll at 375px.** Suspect screens: S04 (bento card),
   S09 (trading-card-style ideas), S11 (founder card). Add `overflow-x: hidden`
   on the JourneyShell at mobile breakpoint if needed, or tighten inner
   widths.

4. **Cedric bubble max-width 90vw.** Verify the dialogue strip doesn't
   push past viewport on narrow screens.

5. **Pip never overlaps CTA.** S04 Pip is top-right at 52px; S09 Pip is
   top-right at 48px. At 375px, verify these don't clash with idea-card
   match% numbers or Continue buttons.

6. **Body text minimum 14px on mobile.** Audit Tailwind classes like
   `text-xs` (12px), `text-[11px]`, `text-[10px]` on non-meta text
   (labels, meta info, stats are allowed small). Narrative text must
   be >= 14px.

7. **Padding minimum 16px from viewport edges** on mobile. Verify no
   screen has `px-1` or `px-2` as its only edge padding.

Each fix is its own commit with message format:
`mobile(v8): <screen> — <specific issue>`

Examples:
`mobile(v8): s04 — filter chips min-height 44px on mobile`
`mobile(v8): s09 — body text bumped from 12px to 14px on mobile`
`mobile(v8): s11 — trading card px-4 to prevent edge clipping at 375px`

Expect 4–10 commits here. Anish will manually audit the visual result
after push.

---

## After all steps

```bash
npm run build      # zero errors, zero warnings if possible
git push origin batch-1-fixes
```

Stop before merge. Report back with:
- The list of every commit from this batch.
- The archetype-assignment logic in plain English (which house × motive combo → which archetype)? Anish will spot-check if any combos feel wrong.
- If `sharp` install failed → flag so Anish can manually compress.
- Any mobile fixes where you weren't sure which direction to go — describe the issue, don't guess.

## Hard do-nots

- Do NOT touch: Crystal (outside Step 2's polish), S02, S03, S04 swipe logic, S07, S10, scoring engine, Zustand store structure, journey flow logic.
- Do NOT add new ideas or industries — reserved for Batch 7C.
- Do NOT enable Zustand `persist`.
- Do NOT add new npm deps beyond `sharp` (if Step 5 uses it).
- Do NOT write new screenshot automation — Anish audits manually.
