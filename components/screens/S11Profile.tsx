'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { analytics } from '@/lib/analytics';
import housesRaw from '@/content/houses.json';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { MysticVaultCard } from '@/components/ui/MysticVaultCard';
import {
  FounderTradingCard,
  type CardRarityTier,
} from '@/components/ui/FounderTradingCard';
import { ChallengeSection } from '@/components/ui/ChallengeSection';
import type { RadarScores } from '@/components/ui/RadarChart';
import { computeFounderStats } from '@/lib/founder-stats';
import { getArchetype } from '@/lib/archetypes';
import { staggerContainer, fadeSlideUp, easeOvershoot } from '@/lib/motion';

interface LineageFigure { name: string; sharedTraitLine: string; quantified_impact?: string }
interface House {
  id: string; name: string; hex: string; tagline: string;
  description: string; strengths: string[]; lineage: LineageFigure[];
  collective_impact?: string;
}
const HOUSES = housesRaw as unknown as House[];

/**
 * S11 — Founder Profile (Batch 6 — share-artifact version).
 *
 * This screen exists to make the user *want* to share. Every element is in
 * service of the post-to-story loop:
 *
 *   1. FounderTradingCard — the 9:16 hero (archetype, twin, radar, stats)
 *   2. Quick share row — 4 × 44×44 circular buttons, frictionless
 *   3. Top 3 matched ideas — compact so they stay below the fold
 *   4. ChallengeSection — the viral #CatalstChallenge loop
 *   5. MysticVaultCard (full) — locked-feature tease
 *   6. Skip CTA — "Maybe later, continue to my house"
 *
 * Motion: page-wide staggerContainer (delayChildren 300ms, stagger 120ms).
 * Inner rows use fadeSlideUp. The card gets an extra spring entrance so it
 * "lands" instead of fading.
 */
export function S11Profile() {
  const state = useJourneyStore();
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [downloadError, setDownloadError] = useState('');
  const [cardSaving, setCardSaving] = useState(false);
  const dialogueSent = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const house = HOUSES.find((h) => h.id === state.houseId) || HOUSES[0];
  const crowned = state.matchedIdeas
    ? [state.matchedIdeas.nest, state.matchedIdeas.spark, state.matchedIdeas.wildvine]
        .find((s) => s.idea.idea_id === state.crownedIdeaId) || state.matchedIdeas.nest
    : null;
  const allIdeas = state.matchedIdeas
    ? [state.matchedIdeas.nest, state.matchedIdeas.spark, state.matchedIdeas.wildvine]
    : [];
  const displayName = state.displayName || 'Founder';

  // ── Archetype resolution ──────────────────────────────────────────────
  // crystalOrbs stores capitalized IDs like 'Vision'. Archetype keys are
  // lowercase. Dominant orb = index 0 (first pick).
  const dominantEssence = (state.crystalOrbs[0] || '').toLowerCase();
  const archetype = useMemo(
    () => getArchetype(state.houseId, dominantEssence),
    [state.houseId, dominantEssence],
  );

  // ── Trait scores (radar) ──────────────────────────────────────────────
  // We don't have a first-class trait score pipeline, so derive 0–100 values
  // from the user's 3 crystal orbs + a small house bias + deterministic
  // jitter. Dominant = +30, supporting = +20, balancing = +15, base 42.
  const traitScores: RadarScores = useMemo(() => {
    return deriveTraitScores(state.crystalOrbs, state.houseId);
  }, [state.crystalOrbs, state.houseId]);

  const stats = useMemo(() => computeFounderStats({
    houseId: state.houseId,
    displayName,
    matchPercent: crowned?.displayScore || 0,
    noveltyScore: crowned?.idea.novelty_score,
    crystalOrbs: state.crystalOrbs,
    blotResponseTimes: state.blotResponseTimes,
    wordResponseTimes: state.wordResponseTimes,
    crystalSelectionTimes: state.crystalSelectionTimes,
    industryName: crowned?.idea.domain_primary?.replace(/_/g, ' ') || 'your industry',
  }), [state.houseId, displayName, crowned, state.crystalOrbs, state.blotResponseTimes, state.wordResponseTimes, state.crystalSelectionTimes]);

  // Collapse EPIC → RARE for the card tier display per Batch 6 spec.
  const cardTier: CardRarityTier = useMemo(() => {
    const t = stats.rarity.tier;
    if (t === 'EPIC') return 'RARE';
    return t as CardRarityTier;
  }, [stats.rarity.tier]);

  // Percentage of users this archetype represents (the "Top X%" stat on
  // the card). Lower pool = rarer = smaller top-X number.
  const rarityPct = useMemo(() => {
    const pool = stats.rarity.pool;
    if (pool < 120) return 2;
    if (pool < 200) return 5;
    if (pool < 320) return 10;
    if (pool < 460) return 18;
    return 28;
  }, [stats.rarity.pool]);

  // "Sealed in" time — sum of response times across all instinct games +
  // scenarios + crystal picks. Formatted as m:ss. Honest about what it
  // measures: "time engaged with the decisions", not wall-clock time.
  const journeyTime = useMemo(() => {
    const total =
      sumMs(state.blotResponseTimes) +
      sumMs(state.wordResponseTimes) +
      sumMs(state.scenarioResponseTimes) +
      sumMs(state.crystalSelectionTimes);
    return formatMs(total);
  }, [
    state.blotResponseTimes,
    state.wordResponseTimes,
    state.scenarioResponseTimes,
    state.crystalSelectionTimes,
  ]);

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    analytics.complete(state.houseId || 'unknown', crowned?.idea.idea_name || 'unknown');
    enqueueMessage({ speaker: 'cedric', text: lines.s11.cedric.intro, type: 'dialogue' });
    setTimeout(() => enqueueMessage({ speaker: 'cedric', text: lines.s11.cedric.final(displayName), type: 'dialogue' }), 3000);
    setTimeout(() => enqueueMessage({ speaker: 'pip', text: lines.s11.pip.final, type: 'dialogue' }), 5000);
  }, [enqueueMessage, displayName, state.houseId, crowned]);

  const generateMarkdown = useCallback(() => {
    const whyYou = crowned ? (state.whyYouTexts[crowned.idea.idea_id] || 'Trust the match.') : '';
    const qs = crowned?.idea.quickStart;
    return `# ${crowned?.idea.idea_name || 'Your Idea'} — Your Catalst Founder Profile

**House:** ${house.name}
**Archetype:** ${archetype.name}
**Founder twin:** ${archetype.twinGlobal.name} (${archetype.twinGlobal.company}) · and ${archetype.twinIndian.name} in India
**Match:** ${crowned?.displayScore || 0}% in ${crowned?.idea.domain_primary?.replace(/_/g, ' ') || 'unknown'}
**Rarity:** Top ${rarityPct}% — ${cardTier}
**Sealed in:** ${journeyTime}

> "${archetype.pullQuote}"

## Your Top Idea
${crowned?.idea.idea_name || ''} — ${crowned?.idea.one_liner || ''}

${crowned?.idea.pain_to_promise || ''}

## Why This Fits You
${whyYou.replace('__loading__', 'Trust the match.')}

## First Steps
- Week 1: ${qs?.week1 || 'Validate the core assumption'}
- MVP: ${qs?.mvp || 'Build the simplest version'}
- First customers: ${qs?.firstCustomers || 'Talk to 10 people in the space'}

## Signature Move
${archetype.signatureMove}

## Kryptonite
${archetype.kryptonite}

---
Generated by Catalst · catalst.app
`;
  }, [crowned, house, archetype, state.whyYouTexts, cardTier, rarityPct, journeyTime]);

  function handleDownloadMd() {
    try {
      const md = generateMarkdown();
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalst-${house.id}-${displayName.toLowerCase().replace(/\s+/g, '-')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      analytics.cta('download');
    } catch { setDownloadError('Download failed, try again'); }
  }

  async function handleSaveCard() {
    if (!cardRef.current) return;
    setCardSaving(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `catalst-${house.id}-${displayName.toLowerCase().replace(/\s+/g, '-')}.png`;
      a.click();
      analytics.cta('download');
    } catch { setDownloadError('Card save failed, try again'); }
    setCardSaving(false);
  }

  const shareCaption = useMemo(
    () =>
      `I'm ${archetype.name.toLowerCase()} on @catalst 🌱 ${house.name.replace('House of ', '')} house · founder twin: ${archetype.twinGlobal.name}. Tag 3 friends who should start an AI business. #CatalstChallenge`,
    [archetype, house],
  );

  async function handleQuickShare(kind: 'instagram' | 'twitter' | 'whatsapp' | 'download') {
    switch (kind) {
      case 'instagram': {
        try {
          await navigator.clipboard.writeText(shareCaption);
          setDownloadError('');
        } catch { /* clipboard blocked — user can fall back to challenge section */ }
        await handleSaveCard();
        break;
      }
      case 'twitter': {
        const t = encodeURIComponent(shareCaption);
        window.open(`https://twitter.com/intent/tweet?text=${t}`, '_blank', 'noopener');
        break;
      }
      case 'whatsapp': {
        analytics.cta('whatsapp');
        const msg = `just found out I'm ${archetype.name} on Catalst 👀 ${crowned?.displayScore || 0}% match with ${archetype.twinGlobal.name}. catalst.app`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
        break;
      }
      case 'download': {
        await handleSaveCard();
        break;
      }
    }
  }

  return (
    <>
      {/* Fixed vault backdrop — keeps the S11 frame distinct from the S10
          particles that were fading out as this mounts. */}
      <div
        className="fixed inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/65 pointer-events-none z-0"
        aria-hidden
      />

      <motion.div
        variants={staggerContainer(0.3, 0.12)}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-md mx-auto px-4 py-6 space-y-5 overflow-y-auto"
      >
        {/* Founder trading card — spring entrance, it's the hero. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: easeOvershoot }}
          className="flex justify-center"
        >
          <FounderTradingCard
            ref={cardRef}
            displayName={displayName}
            house={house}
            archetype={archetype}
            traitScores={traitScores}
            rarityTier={cardTier}
            rarityPct={rarityPct}
            journeyTime={journeyTime}
            matchPercent={crowned?.displayScore || 0}
            crownedIdea={
              crowned
                ? {
                    title: crowned.idea.idea_name,
                    industry:
                      crowned.idea.domain_primary?.replace(/_/g, ' ') || 'your industry',
                  }
                : null
            }
          />
        </motion.div>

        {/* Quick share row — 4 × 44×44 circular. Frictionless, right under
            the card so the "just saw it, share it" loop is a single tap. */}
        <motion.div
          variants={fadeSlideUp}
          className="flex justify-center gap-3"
        >
          <QuickShareButton
            testId="share-instagram"
            label="Instagram"
            onClick={() => handleQuickShare('instagram')}
            icon={<InstagramIcon />}
          />
          <QuickShareButton
            testId="share-twitter"
            label="X / Twitter"
            onClick={() => handleQuickShare('twitter')}
            icon={<XIcon />}
          />
          <QuickShareButton
            testId="share-whatsapp"
            label="WhatsApp"
            onClick={() => handleQuickShare('whatsapp')}
            icon={<WhatsAppIcon />}
          />
          <QuickShareButton
            testId="share-download"
            label={cardSaving ? 'Saving' : 'Download'}
            onClick={() => handleQuickShare('download')}
            disabled={cardSaving}
            icon={<DownloadIcon />}
          />
        </motion.div>

        {downloadError && (
          <p className="text-xs text-rose-400/80 text-center -mt-3">{downloadError}</p>
        )}

        {/* Top 3 matched ideas — compact so the viral loop stays above the fold. */}
        <motion.section variants={fadeSlideUp}>
          <h2 className="font-serif text-lg text-ivory mb-3 px-1">Your Top Matches</h2>
          <div className="space-y-3">
            {allIdeas.map((si) => {
              const isCrowned = si.idea.idea_id === state.crownedIdeaId;
              return (
                <div
                  key={si.idea.idea_id}
                  className={`rounded-xl p-3 bg-white/5 backdrop-blur-sm ${
                    isCrowned ? 'border-2 border-gold/60' : 'border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isCrowned ? 'text-gold' : 'text-ivory'
                      }`}
                    >
                      {isCrowned && <span className="mr-1">👑</span>}
                      {si.idea.idea_name}
                    </p>
                    <span className="text-[10px] font-mono text-ivory/50 shrink-0">
                      {si.displayScore}%
                    </span>
                  </div>
                  <p className="text-xs text-ivory/60 mt-1 line-clamp-1">
                    {si.idea.one_liner}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* The #CatalstChallenge viral loop. */}
        <motion.div variants={fadeSlideUp}>
          <ChallengeSection
            houseColor={house.hex}
            houseName={house.name}
            archetype={archetype}
            matchPercent={crowned?.displayScore || 0}
            crownedIdeaName={crowned?.idea.idea_name}
            onSaveCard={handleSaveCard}
          />
        </motion.div>

        {/* Markdown pack — secondary download (not on the critical path). */}
        <motion.div variants={fadeSlideUp} className="pt-1">
          <button
            onClick={handleDownloadMd}
            data-testid="download-md"
            className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-ivory/65 text-[12px] hover:bg-white/10 transition flex items-center justify-center gap-1.5"
          >
            📄 Download full idea pack (.md)
          </button>
        </motion.div>

        {/* Existing MysticVaultCard — team pitch. */}
        <motion.div variants={fadeSlideUp} className="pt-4 border-t border-white/10">
          <MysticVaultCard
            matchPercent={crowned?.displayScore}
            ideaName={crowned?.idea.idea_name}
            houseName={house.name}
            variant="full"
          />
        </motion.div>

        {/* Skip link — soft exit for users who don't want the vault pitch. */}
        <motion.button
          variants={fadeSlideUp}
          onClick={() => {
            const el = document.querySelector('[data-testid="vault-continue-cta"]') as HTMLButtonElement | null;
            el?.click();
          }}
          className="block mx-auto mt-2 text-ivory/60 hover:text-ivory/90 underline-offset-4 hover:underline transition text-sm"
        >
          Maybe later — continue to my house →
        </motion.button>

        <ScreenQuote screen="s11" />

        <p className="text-[10px] text-ivory/25 text-center font-mono px-4">
          {lines.s11.journeyComplete(house.name)}
        </p>
      </motion.div>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

interface QuickShareButtonProps {
  testId: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function QuickShareButton({ testId, label, icon, onClick, disabled }: QuickShareButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.06 }}
      whileTap={{ scale: disabled ? 1 : 0.92 }}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      aria-label={label}
      className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm grid place-items-center transition disabled:opacity-50 disabled:cursor-not-allowed border border-white/15"
    >
      {icon}
    </motion.button>
  );
}

// ── Trait score derivation ───────────────────────────────────────────────

// Orb → radar-axis contributions. Sum into a per-axis bonus based on
// whether the orb was picked + which slot (dominant/supporting/balancing).
// A single orb can contribute to multiple axes (e.g. Vision → scale + vision).
const ORB_AXIS_WEIGHTS: Record<string, Partial<RadarScores>> = {
  Grit: { grit: 1.0, impact: 0.4 },
  Vision: { vision: 1.0, scale: 0.6 },
  Craft: { craft: 1.0, impact: 0.2 },
  Influence: { impact: 0.9, empathy: 0.3, scale: 0.4 },
  Empathy: { empathy: 1.0, impact: 0.3 },
  Analysis: { scale: 0.7, craft: 0.4, vision: 0.3 },
  Freedom: { vision: 0.4, craft: 0.3 },
  Stability: { scale: 0.5, grit: 0.4 },
};

// House bias — a small +/- per axis representing the house's archetype.
const HOUSE_AXIS_BIAS: Record<string, Partial<RadarScores>> = {
  architects: { craft: 8, scale: 6, vision: 4 },
  vanguards: { grit: 8, impact: 7, scale: 3 },
  alchemists: { empathy: 7, vision: 6, craft: 5 },
  pathfinders: { vision: 7, grit: 6, empathy: 4 },
};

function deriveTraitScores(
  crystalOrbs: string[],
  houseId: string | null,
): RadarScores {
  const slotBoost = [30, 20, 15];
  // Base of 42 gives every axis a visible presence on the radar, even when
  // the user's picks don't touch it.
  const axes: RadarScores = {
    scale: 42,
    impact: 42,
    craft: 42,
    empathy: 42,
    vision: 42,
    grit: 42,
  };

  crystalOrbs.slice(0, 3).forEach((orb, slot) => {
    const weights = ORB_AXIS_WEIGHTS[orb] || {};
    const boost = slotBoost[slot] ?? 10;
    (Object.keys(axes) as (keyof RadarScores)[]).forEach((k) => {
      const w = weights[k] ?? 0;
      axes[k] += w * boost;
    });
  });

  const bias = houseId ? HOUSE_AXIS_BIAS[houseId] || {} : {};
  (Object.keys(axes) as (keyof RadarScores)[]).forEach((k) => {
    axes[k] += bias[k] ?? 0;
  });

  // Clamp 5–95 so the polygon never touches the guide edges (uncanny) or
  // collapses to a pinpoint.
  (Object.keys(axes) as (keyof RadarScores)[]).forEach((k) => {
    axes[k] = Math.max(5, Math.min(95, Math.round(axes[k])));
  });

  return axes;
}

// ── Time helpers ─────────────────────────────────────────────────────────

function sumMs(arr: number[]): number {
  return arr.reduce((acc, v) => acc + (Number.isFinite(v) && v > 0 ? v : 0), 0);
}

function formatMs(ms: number): string {
  if (ms <= 0) return '0:00';
  const secs = Math.round(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Inline SVG icons (lucide-react isn't a dep) ─────────────────────────

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="white" stroke="none" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
