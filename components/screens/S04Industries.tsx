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
 * S04 — Industry Discovery (zero-scroll layout rebuild).
 *
 * Layout laws (top to bottom, strict fixed heights):
 *   [A] Filter strip   — 36px : wavelength-style category bar, tints + gold underline.
 *   [B] Counter + undo — 24px : progress mono text + optional undo link.
 *   [C] Card zone      — flex-1 : IndustrySwipeCard + blurred peek behind.
 *   [D] Action bar     — 64px : Pass / Edge / Keep thumb-zone buttons.
 *   [E] Continue CTA   — 56px : always visible, greyed until 2 keeps,
 *                               one-shot gold pulse at threshold crossing.
 *   [F] Screen quote   — 24px : philosophy bottom line.
 *
 * Total fixed: 204px. Card takes all remaining space — it is the hero.
 * No scroll on the activity zone itself.
 */

const MAX_EDGES = 2;
const MIN_KEEPS_TO_CONTINUE = 2;

// Filter strip — category id + subtle tint for the wavelength bar.
const CATEGORIES: ReadonlyArray<{ label: string; id: string | null; tint: string }> = [
  { label: 'All',      id: null,       tint: '#D4A843' },
  { label: 'Tech',     id: 'tech',     tint: '#7C3AED' },
  { label: 'Creative', id: 'creative', tint: '#EC4899' },
  { label: 'Health',   id: 'health',   tint: '#10B981' },
  { label: 'Finance',  id: 'finance',  tint: '#3B82F6' },
  { label: 'Social',   id: 'social',   tint: '#0EA5E9' },
  { label: 'Build',    id: 'build',    tint: '#F59E0B' },
  { label: 'Play',     id: 'play',     tint: '#F43F5E' },
  { label: 'Other',    id: 'other',    tint: '#64748B' },
];

const INDUSTRIES = industriesRaw as unknown as IndustryCardData[];

export function S04Industries() {
  const industriesKept   = useJourneyStore((s) => s.industriesKept);
  const industriesPassed = useJourneyStore((s) => s.industriesPassed);
  const industriesEdged  = useJourneyStore((s) => s.industriesEdged);
  const keepIndustry     = useJourneyStore((s) => s.keepIndustry);
  const passIndustry     = useJourneyStore((s) => s.passIndustry);
  const edgeIndustry     = useJourneyStore((s) => s.edgeIndustry);
  const advanceScreen    = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage   = useUIStore((s) => s.enqueueMessage);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ type: 'keep' | 'pass' | 'edge'; id: string } | null>(null);
  const [nudge, setNudge] = useState('');
  const [isPulsing, setIsPulsing] = useState(false);
  const dialogueSent = useRef(false);
  const hasPulsed = useRef(false);

  // Intro dialogue — once per mount.
  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    enqueueMessage({ speaker: 'cedric', text: lines.s04.cedric.intro, type: 'instruction' });
    const t = setTimeout(() => {
      enqueueMessage({ speaker: 'pip', text: lines.s04.pip.intro, type: 'dialogue' });
    }, 2500);
    return () => clearTimeout(t);
  }, [enqueueMessage]);

  // One-shot gold pulse on the Continue CTA when the user first crosses
  // the 2-keep threshold.
  useEffect(() => {
    if (industriesKept.length >= MIN_KEEPS_TO_CONTINUE && !hasPulsed.current) {
      hasPulsed.current = true;
      setIsPulsing(true);
      const t = setTimeout(() => setIsPulsing(false), 400);
      return () => clearTimeout(t);
    }
  }, [industriesKept.length]);

  // Deck: unseen cards, category-filter preferred first.
  const seenIds = useMemo(
    () => new Set([...industriesKept, ...industriesPassed, ...industriesEdged]),
    [industriesKept, industriesPassed, industriesEdged],
  );

  const deck = useMemo(() => {
    const unseen = INDUSTRIES.filter((i) => !seenIds.has(i.id));
    if (!activeCategory) return unseen;
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
      useJourneyStore.setState({ industriesKept: state.industriesKept.filter((id) => id !== lastAction.id) });
    } else if (lastAction.type === 'pass') {
      useJourneyStore.setState({ industriesPassed: state.industriesPassed.filter((id) => id !== lastAction.id) });
    } else {
      useJourneyStore.setState({ industriesEdged: state.industriesEdged.filter((id) => id !== lastAction.id) });
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
    <div className="flex flex-col h-full">
      {/* ════════ [A] Filter strip — 36px wavelength bar ════════ */}
      <div className="shrink-0 h-9 flex overflow-x-auto scrollbar-none rounded-lg border border-white/5 bg-white/[0.02]">
        {CATEGORIES.map((c, i) => {
          const active = activeCategory === c.id;
          return (
            <button
              key={c.label}
              onClick={() => setActiveCategory(c.id)}
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
                  style={{
                    background: '#D4A843',
                    boxShadow: '0 0 8px rgba(212,168,67,0.7)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ════════ [B] Counter + undo — 24px ════════ */}
      <div className="shrink-0 h-6 flex items-center justify-between px-1 text-[10px] font-mono uppercase tracking-wider">
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

      {/* ════════ [C] Card zone — flex-1 ════════ */}
      <div className="flex-1 relative min-h-0 py-1.5">
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

          {/* Peek card — dimmed + blurred, doesn't compete */}
          {nextCard && (
            <motion.div
              key={`peek-${nextCard.id}`}
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 0.25, scale: 0.95, y: 8 }}
              className="absolute inset-0 pointer-events-none backdrop-blur-sm"
              style={{ zIndex: 1 }}
            >
              <div
                className="w-full h-full rounded-2xl"
                style={{
                  background: `linear-gradient(160deg, ${nextCard.color_primary || '#444'} 0%, ${nextCard.color_secondary || '#222'} 70%, #0C0E12 100%)`,
                }}
              />
            </motion.div>
          )}

          {/* Active card */}
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

        {/* Nudge overlay — absolutely positioned so it doesn't steal layout */}
        <AnimatePresence>
          {nudge && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-2 left-0 right-0 text-center text-xs text-amber-400/90 pointer-events-none z-30"
            >
              {nudge}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ════════ [D] Action bar — 64px ════════ */}
      <div className="shrink-0 h-16 grid grid-cols-3 gap-3 py-1">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handlePass}
          disabled={!currentCard}
          data-testid="action-pass"
          className="h-14 rounded-2xl bg-white/5 border-2 border-white/15 hover:border-red-400/50 hover:bg-red-500/10 text-ivory/80 font-semibold flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-[18px]">✕</span>
          Pass
        </motion.button>
        <motion.button
          whileTap={edgeAvailable && currentCard ? { scale: 0.96 } : undefined}
          onClick={handleEdge}
          data-testid="action-edge"
          disabled={!edgeAvailable || !currentCard}
          className={`h-14 rounded-2xl border-2 font-semibold flex items-center justify-center gap-1.5 text-sm transition-colors ${
            edgeAvailable
              ? 'bg-gold/10 border-gold/50 hover:border-gold hover:bg-gold/20 text-gold'
              : 'bg-white/3 border-white/10 text-ivory/30 cursor-not-allowed'
          }`}
        >
          <span className="text-[16px]">★</span>
          <span>Edge</span>
          <span className="text-[10px] font-mono opacity-70">
            {industriesEdged.length}/{MAX_EDGES}
          </span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleKeep}
          disabled={!currentCard}
          data-testid="action-keep"
          className="h-14 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/20 text-emerald-300 font-semibold flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-[18px]">✓</span>
          Keep
        </motion.button>
      </div>

      {/* ════════ [E] Continue CTA — 56px (always visible) ════════ */}
      <div className="shrink-0 h-14 py-1">
        <motion.button
          onClick={handleContinue}
          data-testid="continue-btn"
          disabled={!canContinue}
          animate={isPulsing ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={{ duration: isPulsing ? 0.4 : 0.2, times: isPulsing ? [0, 0.5, 1] : undefined }}
          className={`w-full h-12 rounded-2xl font-semibold text-[14px] transition-colors duration-300 ${
            canContinue
              ? 'bg-gold text-dark hover:bg-gold/90 shadow-[0_0_16px_rgba(212,168,67,0.35)] cursor-pointer'
              : 'bg-white/5 text-ivory/35 border border-white/10 cursor-not-allowed'
          }`}
        >
          {canContinue
            ? `Continue with ${industriesKept.length} kept →`
            : `Keep at least ${MIN_KEEPS_TO_CONTINUE} to continue`}
        </motion.button>
      </div>

      {/* ════════ [F] Screen quote — 24px ════════ */}
      <div className="shrink-0 h-6 flex items-center justify-center overflow-hidden">
        <ScreenQuote screen="s04" />
      </div>
    </div>
  );
}
