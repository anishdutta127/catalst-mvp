'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import industriesRaw from '@/content/industries.json';
import { filterByIndustryOnly } from '@/lib/scoring/orchestrator';
import { IDEAS } from '@/lib/scoring/engine';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { IndustrySwipeCard, type IndustryCardData } from '@/components/ui/IndustrySwipeCard';

/**
 * S04 — Industry Discovery (Hinge rebuild).
 *
 * Mechanic:
 *   - ONE swipe card at a time, full activity zone (no sheet).
 *   - Drag left = Pass, right = Keep, up = Edge (max 2).
 *   - Tap card = flip to deep read (Why Now / AI angle / India leaders / etc.).
 *   - Category tags at TOP (All/Tech/Creative/Health/Finance/Social/Build/Play)
 *     filter the UPCOMING deck, not the current card.
 *   - Persistent Continue CTA at bottom — greyed until 2+ kept.
 *   - Bottom action bar: large Pass / Edge / Keep buttons (thumb-zone).
 *   - Progress counter top-right: "3 of 15 · 1 kept · 0 edged".
 */

const MAX_EDGES = 2;
const MIN_KEEPS_TO_CONTINUE = 2;

const CATEGORIES = [
  { label: 'All', id: null },
  { label: 'Tech', id: 'tech' },
  { label: 'Creative', id: 'creative' },
  { label: 'Health', id: 'health' },
  { label: 'Finance', id: 'finance' },
  { label: 'Social', id: 'social' },
  { label: 'Build', id: 'build' },
  { label: 'Play', id: 'play' },
  { label: 'Other', id: 'other' },
];

const INDUSTRIES = industriesRaw as unknown as IndustryCardData[];

export function S04Industries() {
  const industriesKept = useJourneyStore((s) => s.industriesKept);
  const industriesPassed = useJourneyStore((s) => s.industriesPassed);
  const industriesEdged = useJourneyStore((s) => s.industriesEdged);
  const keepIndustry = useJourneyStore((s) => s.keepIndustry);
  const passIndustry = useJourneyStore((s) => s.passIndustry);
  const edgeIndustry = useJourneyStore((s) => s.edgeIndustry);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ type: 'keep' | 'pass' | 'edge'; id: string } | null>(null);
  const [nudge, setNudge] = useState('');
  const dialogueSent = useRef(false);

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    enqueueMessage({ speaker: 'cedric', text: lines.s04.cedric.intro, type: 'instruction' });
    setTimeout(() => {
      enqueueMessage({ speaker: 'pip', text: lines.s04.pip.intro, type: 'dialogue' });
    }, 2500);
  }, [enqueueMessage]);

  // Build the deck: not-yet-seen + (optional category filter applied to UPCOMING cards)
  const seenIds = useMemo(
    () => new Set([...industriesKept, ...industriesPassed, ...industriesEdged]),
    [industriesKept, industriesPassed, industriesEdged],
  );

  const deck = useMemo(() => {
    const unseen = INDUSTRIES.filter((i) => !seenIds.has(i.id));
    if (!activeCategory) return unseen;
    // Keep category-matching cards first, then others as fallback so user never hits an empty state.
    const inCat = unseen.filter((i) => i.category === activeCategory);
    const outCat = unseen.filter((i) => i.category !== activeCategory);
    return [...inCat, ...outCat];
  }, [seenIds, activeCategory]);

  const currentCard = deck[0];
  const nextCard = deck[1];
  const totalSeen = industriesKept.length + industriesPassed.length + industriesEdged.length;
  const edgeAvailable = industriesEdged.length < MAX_EDGES;
  const canContinue = industriesKept.length >= MIN_KEEPS_TO_CONTINUE;

  function handlePass() {
    if (!currentCard) return;
    passIndustry(currentCard.id);
    setLastAction({ type: 'pass', id: currentCard.id });
  }

  function handleKeep() {
    if (!currentCard) return;
    keepIndustry(currentCard.id);
    setLastAction({ type: 'keep', id: currentCard.id });
  }

  function handleEdge() {
    if (!currentCard) return;
    if (!edgeAvailable) {
      setNudge('Only 2 edges allowed — use them wisely');
      setTimeout(() => setNudge(''), 1800);
      return;
    }
    edgeIndustry(currentCard.id);
    setLastAction({ type: 'edge', id: currentCard.id });
  }

  function handleUndo() {
    if (!lastAction) return;
    const state = useJourneyStore.getState();
    if (lastAction.type === 'keep') {
      useJourneyStore.setState({
        industriesKept: state.industriesKept.filter((id) => id !== lastAction.id),
      });
    } else if (lastAction.type === 'pass') {
      useJourneyStore.setState({
        industriesPassed: state.industriesPassed.filter((id) => id !== lastAction.id),
      });
    } else if (lastAction.type === 'edge') {
      useJourneyStore.setState({
        industriesEdged: state.industriesEdged.filter((id) => id !== lastAction.id),
      });
    }
    setLastAction(null);
  }

  function handleContinue() {
    if (!canContinue) {
      setNudge(`Keep at least ${MIN_KEEPS_TO_CONTINUE} to continue`);
      setTimeout(() => setNudge(''), 2000);
      return;
    }
    filterByIndustryOnly(IDEAS, industriesKept);
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s04.cedric.afterAll(industriesKept.length, industriesEdged.length),
      type: 'dialogue',
    });
    setTimeout(() => advanceScreen(), 600);
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* TOP: category tags */}
      <div className="shrink-0 px-1 pt-1 pb-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((c) => {
            const active = activeCategory === c.id;
            return (
              <button
                key={c.label}
                onClick={() => setActiveCategory(c.id)}
                data-testid={`category-${c.label.toLowerCase()}`}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-gold text-dark shadow-[0_0_12px_rgba(212,168,67,0.3)]'
                    : 'bg-white/6 text-ivory/55 hover:text-ivory/80 border border-white/10'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Counter row */}
      <div className="shrink-0 flex items-center justify-between px-1 pb-2 text-[10px] font-mono uppercase tracking-wider">
        <span className="text-ivory/40">
          {totalSeen} of {INDUSTRIES.length} · {industriesKept.length} kept
          {industriesEdged.length > 0 && ` · ${industriesEdged.length} edged`}
        </span>
        {lastAction && (
          <button
            onClick={handleUndo}
            className="text-gold/70 hover:text-gold underline underline-offset-2 cursor-pointer"
          >
            ↺ undo last
          </button>
        )}
      </div>

      {/* CARD ZONE — absolutely positioned cards for smooth swipe */}
      <div className="flex-1 relative min-h-[400px]">
        <AnimatePresence mode="popLayout">
          {!currentCard && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center text-center px-6"
            >
              <div>
                <p className="text-[48px] mb-3">🌿</p>
                <p className="text-ivory/60 text-sm">All fifteen worlds seen.</p>
                <p className="text-ivory/35 text-xs mt-1">
                  {industriesKept.length} kept — the garden is narrowing.
                </p>
              </div>
            </motion.div>
          )}

          {/* Next card peeking behind — creates a deck feel */}
          {nextCard && (
            <motion.div
              key={`peek-${nextCard.id}`}
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 0.5, scale: 0.95, y: 8 }}
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 1 }}
            >
              <div
                className="w-full h-full rounded-2xl"
                style={{
                  background: `linear-gradient(160deg, ${nextCard.color_primary || '#444'} 0%, ${nextCard.color_secondary || '#222'} 70%, #0C0E12 100%)`,
                  opacity: 0.6,
                }}
              />
            </motion.div>
          )}

          {/* Current card */}
          {currentCard && (
            <div key={`wrap-${currentCard.id}`} className="absolute inset-0" style={{ zIndex: 10 }}>
              <IndustrySwipeCard
                industry={currentCard}
                cardKey={currentCard.id}
                onPass={handlePass}
                onKeep={handleKeep}
                onEdge={handleEdge}
                edgeAvailable={edgeAvailable}
                edgesUsed={industriesEdged.length}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Nudge message */}
      <AnimatePresence>
        {nudge && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="shrink-0 text-center text-xs text-amber-400/80 py-1"
          >
            {nudge}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ACTION BAR — big thumb-zone buttons */}
      {currentCard && (
        <div className="shrink-0 grid grid-cols-3 gap-3 pt-3 pb-2">
          <button
            onClick={handlePass}
            data-testid="action-pass"
            className="h-14 rounded-2xl bg-white/5 border-2 border-white/15 hover:border-red-400/50 hover:bg-red-500/10 text-ivory/80 font-semibold flex items-center justify-center gap-2 text-sm transition-all"
          >
            <span className="text-[20px]">✕</span> Pass
          </button>
          <button
            onClick={handleEdge}
            data-testid="action-edge"
            disabled={!edgeAvailable}
            className={`h-14 rounded-2xl border-2 font-semibold flex items-center justify-center gap-1.5 text-sm transition-all ${
              edgeAvailable
                ? 'bg-gold/10 border-gold/50 hover:border-gold hover:bg-gold/20 text-gold'
                : 'bg-white/3 border-white/10 text-ivory/30 cursor-not-allowed'
            }`}
          >
            <span className="text-[18px]">★</span>
            <span>Edge</span>
            <span className="text-[10px] font-mono opacity-70">
              {industriesEdged.length}/{MAX_EDGES}
            </span>
          </button>
          <button
            onClick={handleKeep}
            data-testid="action-keep"
            className="h-14 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/20 text-emerald-300 font-semibold flex items-center justify-center gap-2 text-sm transition-all"
          >
            <span className="text-[20px]">✓</span> Keep
          </button>
        </div>
      )}

      {/* PERSISTENT CONTINUE CTA — greyed until ≥2 kept */}
      <div className="shrink-0 pt-1 pb-1">
        <button
          onClick={handleContinue}
          data-testid="continue-btn"
          disabled={!canContinue}
          className={`w-full h-12 rounded-2xl font-semibold text-[14px] transition-all ${
            canContinue
              ? 'bg-gold text-dark hover:bg-gold/90 shadow-[0_0_16px_rgba(212,168,67,0.35)] cursor-pointer'
              : 'bg-white/5 text-ivory/35 border border-white/10 cursor-not-allowed'
          }`}
        >
          {canContinue
            ? `Continue with ${industriesKept.length} kept →`
            : `Keep at least ${MIN_KEEPS_TO_CONTINUE} to continue`}
        </button>
      </div>

      <ScreenQuote screen="s04" />
    </div>
  );
}
