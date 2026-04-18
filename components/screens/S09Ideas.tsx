'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import type { ScoredIdea } from '@/lib/scoring/types';
import housesRaw from '@/content/houses.json';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { IdeaDossier } from '@/components/ui/IdeaDossier';
import { MysticVaultCard } from '@/components/ui/MysticVaultCard';
import { PipWithPoof } from '@/components/characters/PipWithPoof';
import { PipFloatingBubble } from '@/components/ui/PipFloatingBubble';
import { TAG_BY_ID } from '@/lib/tags';
import { pathLine } from '@/lib/speakPath';

/**
 * S09 — Ideas Revealed (Batch 3 rebuild).
 *
 * New flow:
 *   - Two modes: GRID and DOSSIER.
 *   - GRID (default): shows 3 idea cards side-by-side. User can crown inline.
 *   - Tap any card → switch to DOSSIER mode: full-screen deep read with tabs
 *     to switch between the 3 ideas. Crown from here too.
 *   - Crown CTA at bottom of each card (grid) and sticky-bottom in dossier.
 *   - Mystic Vault sapphire card below the crown CTA (only visible post-crown in both modes).
 *   - Advance to S10 via a "Continue to your house" gold CTA that shows once crowned.
 */

/** Tier visual identity: the four "flavors" of matched ideas. Each carries
 *  its own color, emoji, and one-line intent — the reveal feels like a
 *  constellation of four distinct destinies, not a uniform list. */
const TIER_META: Record<
  string,
  {
    emoji: string;
    label: string;
    intent: string;
    gradient: string;
    color: string;
    colorDim: string;
  }
> = {
  nest: {
    emoji: '🏠',
    label: 'Nest',
    intent: 'Safest fit',
    gradient: 'from-amber-400 to-amber-600',
    color: '#F59E0B',
    colorDim: '#78350F',
  },
  spark: {
    emoji: '✨',
    label: 'Spark',
    intent: 'Strongest match',
    gradient: 'from-yellow-400 to-amber-500',
    color: '#FCD34D',
    colorDim: '#78350F',
  },
  wildvine: {
    emoji: '🌿',
    label: 'Wildvine',
    intent: 'The bold leap',
    gradient: 'from-emerald-400 to-emerald-600',
    color: '#10B981',
    colorDim: '#064E3B',
  },
  your_idea: {
    emoji: '🔥',
    label: 'Your Idea',
    intent: 'What you brought in',
    gradient: 'from-orange-400 to-red-500',
    color: '#F97316',
    colorDim: '#7C2D12',
  },
};

interface HouseJson { id: string; name: string; hex: string; tagline: string }
const HOUSES = housesRaw as unknown as HouseJson[];

export function S09Ideas() {
  const matchedIdeas = useJourneyStore((s) => s.matchedIdeas);
  const houseId = useJourneyStore((s) => s.houseId);
  const crownedIdeaId = useJourneyStore((s) => s.crownedIdeaId);
  const crownIdea = useJourneyStore((s) => s.crownIdea);
  const whyYouTexts = useJourneyStore((s) => s.whyYouTexts);
  const setWhyYouText = useJourneyStore((s) => s.setWhyYouText);
  const sessionId = useJourneyStore((s) => s.sessionId);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const goToScreen = useJourneyStore((s) => s.goToScreen);
  const ideaMode = useJourneyStore((s) => s.ideaMode);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [mode, setMode] = useState<'grid' | 'dossier'>('grid');
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  const [pipReaction, setPipReaction] = useState<string | null>(null);
  const dialogueSent = useRef(false);
  const ambientFiredRef = useRef(false);

  // Ambient Pip dwell line — local state (not messageQueue) because
  // PipFloater is hidden on s09 (screenOwnsPip). Fires once at 15s if the
  // user hasn't already crowned anything.
  useEffect(() => {
    if (ambientFiredRef.current) return;
    const bank = lines.ambientPip.s09;
    if (!bank || bank.length === 0) return;
    const t = setTimeout(() => {
      if (ambientFiredRef.current) return;
      ambientFiredRef.current = true;
      setPipReaction(bank[Math.floor(Math.random() * bank.length)]);
    }, 15000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!matchedIdeas) { goToScreen('s08'); return; }
  }, [matchedIdeas, goToScreen]);

  useEffect(() => {
    if (dialogueSent.current || !matchedIdeas) return;
    dialogueSent.current = true;
    enqueueMessage({ speaker: 'cedric', text: lines.s09.cedric.reveal1, type: 'dialogue' });
    // Pip's reveal routes to LOCAL pipReaction — PipFloater is hidden on s09
    // (screenOwnsPip), so an enqueueMessage here would silently disappear.
    const t = setTimeout(
      () => setPipReaction(pathLine('s09.pip.reveal', lines.s09.pip.reveal, ideaMode)),
      2000,
    );
    return () => clearTimeout(t);
  }, [enqueueMessage, matchedIdeas]);

  if (!matchedIdeas) return null;

  const ideas: { scored: ScoredIdea; tier: 'nest' | 'spark' | 'wildvine' | 'your_idea' }[] = [
    { scored: matchedIdeas.nest, tier: 'nest' },
    { scored: matchedIdeas.spark, tier: 'spark' },
    { scored: matchedIdeas.wildvine, tier: 'wildvine' },
  ];
  if (matchedIdeas.yourIdea) ideas.unshift({ scored: matchedIdeas.yourIdea, tier: 'your_idea' });

  const activeIdea = activeIdeaId ? ideas.find((i) => i.scored.idea.idea_id === activeIdeaId) : null;
  const crowned = ideas.find((i) => i.scored.idea.idea_id === crownedIdeaId);
  const house = HOUSES.find((h) => h.id === houseId);

  function openDossier(ideaId: string) {
    setActiveIdeaId(ideaId);
    setMode('dossier');
    fetchWhyYou(ideaId);
  }

  function closeDossier() {
    setMode('grid');
  }

  function houseAsLabel(hid: string | null | undefined): string {
    if (!hid) return 'a founder';
    const article = /^[aeiou]/i.test(hid) ? 'an' : 'a';
    const noun = hid.charAt(0).toUpperCase() + hid.slice(1).toLowerCase().replace(/s$/, '');
    return `${article} ${noun}`;
  }

  function fetchWhyYou(ideaId: string) {
    if (whyYouTexts[ideaId]) return;
    const item = ideas.find((i) => i.scored.idea.idea_id === ideaId);
    if (!item) return;
    setWhyYouText(ideaId, '__loading__');
    fetch('/api/narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'whyYou',
        sessionId,
        context: {
          ideaName: item.scored.idea.idea_name,
          ideaOneLiner: item.scored.idea.one_liner,
          houseId: houseId || 'founder',
          topStrengths: 'determination and vision',
        },
      }),
    })
      .then((r) => r.json())
      .then((d) => setWhyYouText(ideaId, d.text))
      .catch(() => setWhyYouText(
        ideaId,
        `Your instincts led you here. ${item.scored.idea.idea_name} fits the way you think. As ${houseAsLabel(houseId)}, your reading of this space is sharper than most founders' — trust the pull.`,
      ));
  }

  function handleCrown(ideaId: string) {
    crownIdea(ideaId);
    // Nudge the user back to grid so they see the crowned state and the crown CTA.
    // Or keep them in dossier and show crown confirmation inline.
    // We'll keep them in dossier — CTA becomes "Continue to your house" at bottom.
  }

  // ─────────────────────────────────────────────────
  // DOSSIER MODE — full activity-zone takeover
  // ─────────────────────────────────────────────────
  if (mode === 'dossier' && activeIdea) {
    const whyYou = whyYouTexts[activeIdea.scored.idea.idea_id];
    return (
      <div className="flex flex-col h-full gap-3" data-testid="s09-dossier-mode">
        {/* Back button */}
        <div className="shrink-0 flex items-center justify-between">
          <button
            onClick={closeDossier}
            data-testid="dossier-back"
            className="text-[12px] text-ivory/60 hover:text-ivory flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="text-lg leading-none">←</span>
            <span>Back to all three</span>
          </button>
          {crownedIdeaId && (
            <button
              onClick={() => advanceScreen()}
              data-testid="advance-to-s10"
              className="text-[11px] font-semibold text-gold hover:text-gold/80 underline underline-offset-4 cursor-pointer"
            >
              Continue to your house →
            </button>
          )}
        </div>

        {/* Dossier */}
        <div className="flex-1 min-h-0">
          <IdeaDossier
            ideas={ideas.filter((i) => i.tier !== 'your_idea' || !!matchedIdeas.yourIdea)}
            activeIdeaId={activeIdea.scored.idea.idea_id}
            onSelectIdea={(id) => {
              setActiveIdeaId(id);
              fetchWhyYou(id);
            }}
            onCrown={handleCrown}
            crownedIdeaId={crownedIdeaId}
            whyYou={whyYou}
            houseName={house?.name}
          />
        </div>

        {/* Mystic Vault — only shown once crowned */}
        {crownedIdeaId && crowned && (
          <div className="shrink-0 pt-2">
            <MysticVaultCard
              matchPercent={crowned.scored.displayScore}
              ideaName={crowned.scored.idea.idea_name}
              houseName={house?.name}
              variant="teaser"
              onContinue={() => advanceScreen()}
            />
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  // GRID MODE — 3 idea preview cards
  // ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full gap-4 relative" data-testid="s09-grid-mode">
      {/* Pip — top-right, above the cards. The pt-14 on the grid below
          reserves dedicated airspace for him so the bubble doesn't clash
          with the first idea card. */}
      <div
        className="absolute z-30 pointer-events-none"
        style={{ top: 0, right: 12 }}
      >
        <PipWithPoof
          emotion="glow"
          color="#4ade80"
          size={48}
          enterDelay={1200}
          visible={true}
        />
      </div>

      {/* Pip reaction bubble — slides in from the LEFT of the sprite */}
      <AnimatePresence>
        {pipReaction && (
          <PipFloatingBubble
            key={pipReaction}
            text={pipReaction}
            color="#4ade80"
            direction="top-right"
            onComplete={() => setPipReaction(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto space-y-3 pb-2 pt-14">
        {/* Idea preview cards — stack on mobile, grid on ≥640. Cards reveal
            one-at-a-time with a spring (180ms stagger) so the three matches
            feel like a constellation being named, not a list dropped in.
            min-h gives each card real breathing room so content isn't cramped. */}
        <div className="flex flex-col sm:flex-row gap-4">
          {ideas.map(({ scored, tier }, idx) => {
            const isCrowned = crownedIdeaId === scored.idea.idea_id;
            const meta = TIER_META[tier];
            const isDimmed = !!crownedIdeaId && !isCrowned;

            return (
              <motion.button
                key={scored.idea.idea_id}
                initial={{ opacity: 0, y: 28, scale: 0.94 }}
                animate={{
                  opacity: isDimmed ? 0.45 : 1,
                  y: 0,
                  scale: isCrowned ? 1.02 : 1,
                }}
                transition={{
                  delay: idx * 0.18,
                  type: 'spring',
                  stiffness: 220,
                  damping: 22,
                }}
                // Reinforce tappability on hover — tiny lift + scale bump +
                // border intensifies to the tier's own color. Suppressed once
                // a card is crowned so the hover doesn't compete with the
                // crowned state's own glow.
                whileHover={
                  !crownedIdeaId
                    ? {
                        y: -3,
                        scale: 1.015,
                        borderColor: `${meta.color}80`,
                        transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                      }
                    : undefined
                }
                whileTap={{ scale: 0.99 }}
                onClick={() => openDossier(scored.idea.idea_id)}
                data-testid={`idea-card-${tier}`}
                className="flex-1 min-h-[280px] sm:min-h-[320px] rounded-2xl overflow-hidden text-left group cursor-pointer relative flex flex-col"
                style={{
                  background: `linear-gradient(160deg, ${meta.colorDim}35 0%, rgba(20,23,30,0.96) 55%, rgba(12,14,18,0.98) 100%)`,
                  border: `1px solid ${isCrowned ? 'rgba(212,168,67,0.70)' : `${meta.color}35`}`,
                  boxShadow: isCrowned
                    ? `0 0 24px rgba(212,168,67,0.45), 0 0 0 1px rgba(212,168,67,0.30) inset`
                    : `0 4px 18px -8px ${meta.color}40`,
                }}
              >
                {/* Tier identity strip at top */}
                <div
                  className="h-1.5"
                  style={{ background: `linear-gradient(90deg, ${meta.color} 0%, ${meta.colorDim} 100%)` }}
                />

                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  {/* Header row: tier badge + match percentage */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] leading-none shrink-0"
                        style={{
                          background: `${meta.color}22`,
                          border: `1px solid ${meta.color}50`,
                        }}
                      >
                        {meta.emoji}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-[10px] font-mono uppercase tracking-[0.18em] font-bold leading-none"
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                        </p>
                        <p className="text-[9.5px] text-ivory/50 leading-none mt-1">
                          {meta.intent}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[20px] sm:text-[22px] font-serif font-bold leading-none" style={{ color: '#D4A843' }}>
                        {scored.displayScore}%
                      </p>
                      <p className="text-[9px] font-mono text-ivory/45 uppercase tracking-widest leading-none mt-1">
                        match
                      </p>
                    </div>
                  </div>

                  {/* Idea name — big serif hero */}
                  <h3 className="text-[18px] sm:text-[20px] font-serif font-bold text-ivory leading-[1.15] mb-1.5">
                    {scored.idea.idea_name}
                  </h3>

                  {/* One-liner — extra bottom margin to breathe from the
                      tag row below, now that the row no longer shares a
                      line with the CTA. */}
                  <p className="text-[12.5px] text-ivory/70 leading-relaxed line-clamp-3 mb-4">
                    {scored.idea.one_liner}
                  </p>

                  {/* Tag row — up to 3 tags from the v8 vocabulary. Tier
                      colouring carries the nest/spark/wildvine identity; each
                      pill inherits it so the row reads as one cohesive group.
                      Falls back gracefully (null-skip) on any stale tag id. */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(scored.idea.tags ?? []).slice(0, 3).map((tagId) => {
                      const def = TAG_BY_ID[tagId];
                      if (!def) return null;
                      return (
                        <span
                          key={tagId}
                          className="text-[9.5px] px-2 py-0.5 rounded-full font-medium tracking-wide"
                          style={{
                            background: `${meta.color}18`,
                            color: meta.color,
                            border: `1px solid ${meta.color}35`,
                          }}
                        >
                          {def.label}
                        </span>
                      );
                    })}
                  </div>

                  {/* Spacer so the CTA pins to the bottom edge on taller cards. */}
                  <div className="flex-1" />

                  {/* Full-width CTA — bigger tap target, sits below a thin
                      divider so the hierarchy is: title → desc → tags → CTA.
                      Rendered as a <div> (not <button>) because the outer
                      motion.button already owns the click handler; nesting
                      buttons is invalid HTML. */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="w-full text-center text-[13px] tracking-wide text-ivory/80 group-hover:text-ivory transition py-2 flex items-center justify-center gap-2 font-medium">
                      Read the deep read
                      <motion.span
                        className="inline-flex"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ArrowRightIcon />
                      </motion.span>
                    </div>
                  </div>

                  {/* Crown overlay */}
                  <AnimatePresence>
                    {isCrowned && (
                      <motion.div
                        key="crown-badge"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                        className="absolute top-3 right-3 text-[20px] leading-none"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(212,168,67,0.8))' }}
                        aria-hidden
                      >
                        👑
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Guidance for picking */}
        {!crownedIdeaId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center py-2"
          >
            <p className="text-[12px] text-ivory/55 italic">
              Tap any idea to read its full dossier. Crown the one that fits.
            </p>
          </motion.div>
        )}

        {/* Mystic Vault (post-crown) */}
        {crownedIdeaId && crowned && (
          <MysticVaultCard
            matchPercent={crowned.scored.displayScore}
            ideaName={crowned.scored.idea.idea_name}
            houseName={house?.name}
            variant="teaser"
            onContinue={() => advanceScreen()}
          />
        )}
      </div>

      {/* Sticky bottom: Advance CTA once crowned — gold breathing pulse
          matches S06/S07 so the three "ready to continue" moments share a
          visual language. */}
      <AnimatePresence>
        {crownedIdeaId && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => advanceScreen()}
              data-testid="crown-cta"
              className="relative w-full h-14 rounded-2xl font-bold text-[15px] text-dark bg-gold flex items-center justify-center gap-2 overflow-hidden"
            >
              <motion.span
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{
                  boxShadow: [
                    '0 0 14px rgba(212,168,67,0.40)',
                    '0 0 32px rgba(212,168,67,0.85)',
                    '0 0 14px rgba(212,168,67,0.40)',
                  ],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="relative">👑 Crown it — continue to your house</span>
              <motion.span
                className="relative"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <ScreenQuote screen="s09" />
    </div>
  );
}

// ─── Inline icon (lucide-react isn't a dep) ──────────────────────────────

function ArrowRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
