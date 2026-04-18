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
import { useAmbientPipLine } from '@/lib/ambient-pip';

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

const TIER_META: Record<string, { emoji: string; label: string; gradient: string; color: string }> = {
  nest: { emoji: '🏠', label: 'Nest', gradient: 'from-amber-400 to-amber-600', color: '#F59E0B' },
  spark: { emoji: '✨', label: 'Spark', gradient: 'from-yellow-400 to-amber-500', color: '#FCD34D' },
  wildvine: { emoji: '🌿', label: 'Wildvine', gradient: 'from-emerald-400 to-emerald-600', color: '#10B981' },
  your_idea: { emoji: '🔥', label: 'Your Idea', gradient: 'from-orange-400 to-red-500', color: '#F97316' },
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
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [mode, setMode] = useState<'grid' | 'dossier'>('grid');
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  const dialogueSent = useRef(false);

  useAmbientPipLine('s09');

  useEffect(() => {
    if (!matchedIdeas) { goToScreen('s08'); return; }
  }, [matchedIdeas, goToScreen]);

  useEffect(() => {
    if (dialogueSent.current || !matchedIdeas) return;
    dialogueSent.current = true;
    enqueueMessage({ speaker: 'cedric', text: lines.s09.cedric.reveal1, type: 'dialogue' });
    setTimeout(() => enqueueMessage({ speaker: 'pip', text: lines.s09.pip.reveal, type: 'dialogue' }), 2000);
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
    <div className="flex flex-col h-full gap-4" data-testid="s09-grid-mode">
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {/* Idea preview cards */}
        <div className="flex flex-col sm:flex-row gap-3">
          {ideas.map(({ scored, tier }, idx) => {
            const isCrowned = crownedIdeaId === scored.idea.idea_id;
            const meta = TIER_META[tier];
            const isDimmed = !!crownedIdeaId && !isCrowned;

            return (
              <motion.button
                key={scored.idea.idea_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isDimmed ? 0.55 : 1, y: 0 }}
                transition={{ delay: idx * 0.12, duration: 0.4 }}
                whileHover={{ scale: 1.015 }}
                onClick={() => openDossier(scored.idea.idea_id)}
                data-testid={`idea-card-${tier}`}
                className={`flex-1 rounded-2xl overflow-hidden text-left transition-all group ${
                  isCrowned ? 'ring-2 ring-gold shadow-[0_0_20px_rgba(212,168,67,0.4)]' : ''
                } cursor-pointer`}
              >
                <div className={`h-1 bg-gradient-to-r ${meta.gradient}`} />
                <div className="bg-dark-surface/90 backdrop-blur-sm p-4 sm:p-5 border-x border-b border-white/10 rounded-b-2xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm">{meta.emoji}</span>
                    <span className="text-[10px] font-mono text-gold/60 uppercase tracking-wider">{meta.label}</span>
                    {isCrowned && <span>👑</span>}
                    <span className="ml-auto text-[11px] font-mono text-gold font-semibold">{scored.displayScore}%</span>
                  </div>
                  <h3 className="text-[17px] sm:text-[19px] font-serif font-bold text-ivory mb-1.5 leading-tight">
                    {scored.idea.idea_name}
                  </h3>
                  <p className="text-[12px] text-ivory/55 leading-relaxed line-clamp-2 mb-3">
                    {scored.idea.one_liner}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold/70 border border-gold/20">
                      {scored.idea.domain_primary?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-ivory/40 group-hover:text-gold/70 transition-colors">
                      read the deep dive →
                    </span>
                  </div>
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
            transition={{ delay: 0.6 }}
            className="text-center py-2"
          >
            <p className="text-[12px] text-ivory/45 italic">
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
          />
        )}
      </div>

      {/* Sticky bottom: Advance CTA once crowned */}
      <AnimatePresence>
        {crownedIdeaId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="shrink-0"
          >
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(212,168,67,0.55)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => advanceScreen()}
              data-testid="crown-cta"
              className="w-full h-14 rounded-2xl font-bold text-[16px] text-dark bg-gold hover:bg-gold/95 border border-gold/60 shadow-[0_0_18px_rgba(212,168,67,0.4)] flex items-center justify-center gap-2 transition-all"
            >
              👑 This is my idea → continue to your house
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <ScreenQuote screen="s09" />
    </div>
  );
}
