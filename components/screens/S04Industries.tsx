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
import { PipFloatingBubble } from '@/components/ui/PipFloatingBubble';
import { type PipEmotion } from '@/components/characters/PipSprite';
import { PipWithPoof } from '@/components/characters/PipWithPoof';

/**
 * S04 — Industry Discovery (zero-scroll layout rebuild, Hinge-style actions).
 *
 * Layout laws (top to bottom, strict fixed heights):
 *   [A] Filter strip   — 36px : wavelength-style category bar, tints + gold underline.
 *   [B] Counter + undo — 24px : progress mono text + optional undo link.
 *   [C] Card zone      — flex-1 : card + floating ✕ ★ ✓ action circles overlaid
 *                                 at bottom. The old [D] 64px button row is
 *                                 reclaimed — the card gets that space.
 *   [E] Continue CTA   — 56px : always visible, greyed until 2 keeps,
 *                               one-shot gold pulse at threshold crossing.
 *   [F] Screen quote   — 24px : philosophy bottom line.
 *
 * Pip lives on this screen's top-right (sprite + reaction bubble to his left).
 * The shell hides its own PipFloater on s04 so there's only one Pip.
 */

const MAX_EDGES = 2;
const MIN_KEEPS_TO_CONTINUE = 2;
const PIP_COLOR = '#4ade80';

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

/**
 * Pick an idle-dwell line for the given industry card. Industry-specific bank
 * first, general fallback if nothing matches. Picks randomly inside the bank
 * on every call so repeat hits on the same industry won't feel scripted.
 */
function pickIdleLine(card: IndustryCardData): string | null {
  const byInd = lines.s04.pip.idleByIndustry[card.id];
  if (byInd && byInd.length > 0) {
    return byInd[Math.floor(Math.random() * byInd.length)];
  }
  const general = lines.s04.pip.idleGeneral;
  if (general && general.length > 0) {
    return general[Math.floor(Math.random() * general.length)];
  }
  return null;
}

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
  const [pipReaction, setPipReaction] = useState<string | null>(null);
  // Pip physically leans toward the card when he reacts. Auto-resets after
  // ~900ms so the sprite returns to its neutral pose between beats.
  const [pipLeaning, setPipLeaning] = useState(false);
  const dialogueSent = useRef(false);
  const hasPulsed = useRef(false);
  const firstKeepFired = useRef(false);
  const firstEdgeFired = useRef(false);
  const thresholdFired = useRef(false);
  const leanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Per-card dwell timer: fires an idle Pip line if the user sits for 12s
  // without swiping. idleFiredForCard tracks which cards have already fired
  // so a returning user doesn't get the same idle beat twice.
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleFiredForCard = useRef<Set<string>>(new Set());

  // Lean Pip toward the card center when a reaction fires. Cleans up on
  // unmount and gets re-armed on every call.
  function triggerPipLean() {
    setPipLeaning(true);
    if (leanTimer.current) clearTimeout(leanTimer.current);
    leanTimer.current = setTimeout(() => setPipLeaning(false), 900);
  }

  // Final cleanup on screen unmount — stops any pending timers so idle
  // lines never fire after the user has moved on to S06.
  useEffect(() => {
    return () => {
      if (leanTimer.current) clearTimeout(leanTimer.current);
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
      idleFiredForCard.current.clear();
    };
  }, []);

  // Intro dialogue — once per mount. Cedric goes into the chat strip; Pip
  // routes to the local floating bubble so the chat strip stays Cedric-only.
  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    enqueueMessage({ speaker: 'cedric', text: lines.s04.cedric.intro, type: 'instruction' });
    const t = setTimeout(() => {
      setPipReaction(lines.s04.pip.intro);
      triggerPipLean();
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

  // Idle-dwell timer — fires a Pip line after 12s on a single card without
  // a swipe. Re-armed every time the card changes; skips cards that have
  // already fired so the same beat doesn't repeat on an undo loop.
  useEffect(() => {
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    if (!currentCard) return;
    if (idleFiredForCard.current.has(currentCard.id)) return;
    const cardForTimer = currentCard;
    dwellTimer.current = setTimeout(() => {
      const line = pickIdleLine(cardForTimer);
      if (line) {
        setPipReaction(line);
        triggerPipLean();
        idleFiredForCard.current.add(cardForTimer.id);
      }
    }, 12000);
    return () => {
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
    };
  }, [currentCard]);

  // Pip emotion — mirrors the last beat so the sprite "reacts" alongside the
  // floating bubble. idle before any action, wideeye on edge, glow once we
  // cross the 2-keep threshold, happy on a fresh keep, idle on pass.
  const pipEmotion: PipEmotion = useMemo(() => {
    if (!lastAction) return 'idle';
    if (lastAction.type === 'edge') return 'wideeye';
    if (lastAction.type === 'keep' && industriesKept.length >= MIN_KEEPS_TO_CONTINUE) return 'glow';
    if (lastAction.type === 'keep') return 'happy';
    return 'idle';
  }, [lastAction, industriesKept.length]);

  function handlePass() {
    if (!currentCard) return;
    passIndustry(currentCard.id);
    setLastAction({ type: 'pass', id: currentCard.id });
  }

  function handleKeep() {
    if (!currentCard) return;
    const prevKeepCount = industriesKept.length;
    keepIndustry(currentCard.id);
    setLastAction({ type: 'keep', id: currentCard.id });

    // Pip reaction — first keep (0 → 1). 180ms lets the card swipe-out land
    // before the bubble appears.
    if (!firstKeepFired.current && prevKeepCount === 0) {
      firstKeepFired.current = true;
      setTimeout(() => {
        setPipReaction(lines.s04.pip.afterFirstKeep);
        triggerPipLean();
      }, 180);
    }

    // Pip reaction — threshold crossed (1 → 2). 850ms spacing so the
    // firstKeep bubble has room to clear before this one appears.
    if (!thresholdFired.current && prevKeepCount === 1) {
      thresholdFired.current = true;
      setTimeout(() => {
        setPipReaction(lines.s04.pip.atThreshold);
        triggerPipLean();
      }, 850);
    }
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

    // Pip reaction — first edge. 180ms for swipe-out to resolve first.
    if (!firstEdgeFired.current) {
      firstEdgeFired.current = true;
      setTimeout(() => {
        setPipReaction(lines.s04.pip.afterFirstEdge);
        triggerPipLean();
      }, 180);
    }
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
    <div className="relative flex flex-col h-full">
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

      {/* ════════ [C] Card zone — flex-1, floating action circles overlaid ════════ */}
      <div className="flex-1 relative min-h-0 pt-3 pb-1.5">
        {/* Pip — anchored to the card's top-right corner. He extends above
            the card slightly (top: -10) so he visually "leans on its shoulder."
            PipWithPoof handles the sparkle-burst entry (enterDelay 1200 lets
            the first card settle first) and the clean scale-down exit on
            screen change. The inner motion.div drives the lean-toward-card
            reaction without re-triggering the entry animation. */}
        <div
          className="absolute z-30 pointer-events-none"
          style={{ top: -10, right: 12 }}
        >
          <motion.div
            animate={pipLeaning ? { rotate: -8, x: -4 } : { rotate: 0, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            <PipWithPoof
              emotion={pipEmotion}
              color={PIP_COLOR}
              size={52}
              enterDelay={1200}
              visible={true}
            />
          </motion.div>
        </div>

        {/* Pip floating reaction bubble — slides in from Pip's left with a
            dotted connective line so the reaction reads as HIS reaction. */}
        <AnimatePresence>
          {pipReaction && (
            <PipFloatingBubble
              key={pipReaction}
              text={pipReaction}
              color={PIP_COLOR}
              onComplete={() => setPipReaction(null)}
            />
          )}
        </AnimatePresence>

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

        {/* Floating action circles — Hinge-style, overlaid on the card's
            bottom. The empty gaps between buttons are pointer-events-none so
            drag gestures still reach the card underneath. */}
        <div className="absolute z-20 left-0 right-0 bottom-4 flex justify-center gap-6 pointer-events-none">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handlePass}
            disabled={!currentCard}
            data-testid="action-pass"
            aria-label="Pass"
            className="pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(12,14,18,0.35)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderColor: 'rgba(244,63,94,0.45)',
              boxShadow: '0 4px 16px rgba(244,63,94,0.22)',
            }}
          >
            <span className="text-[22px] text-rose-400 font-bold leading-none">✕</span>
          </motion.button>

          <motion.button
            whileTap={edgeAvailable && currentCard ? { scale: 0.9 } : undefined}
            onClick={handleEdge}
            disabled={!edgeAvailable || !currentCard}
            data-testid="action-edge"
            aria-label="Edge"
            className={`pointer-events-auto relative w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors ${
              edgeAvailable && currentCard ? '' : 'opacity-40 cursor-not-allowed'
            }`}
            style={{
              background: 'rgba(12,14,18,0.35)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderColor: edgeAvailable ? 'rgba(212,168,67,0.55)' : 'rgba(255,255,255,0.15)',
              boxShadow: edgeAvailable ? '0 4px 16px rgba(212,168,67,0.28)' : 'none',
            }}
          >
            <span className="text-[22px] leading-none" style={{ color: '#D4A843' }}>★</span>
            {industriesEdged.length > 0 && (
              <span
                className="absolute -top-1 -right-1 text-[9px] font-mono font-bold rounded-full px-1.5 py-[2px] leading-none"
                style={{
                  background: '#D4A843',
                  color: '#0C0E12',
                  border: '1px solid rgba(12,14,18,0.8)',
                }}
              >
                {industriesEdged.length}/{MAX_EDGES}
              </span>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleKeep}
            disabled={!currentCard}
            data-testid="action-keep"
            aria-label="Keep"
            className="pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(12,14,18,0.35)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderColor: 'rgba(52,211,153,0.50)',
              boxShadow: '0 4px 16px rgba(52,211,153,0.28)',
            }}
          >
            <span className="text-[22px] text-emerald-400 font-bold leading-none">✓</span>
          </motion.button>
        </div>

        {/* Nudge overlay — floats just above the action circles so it's
            visible without covering them. */}
        <AnimatePresence>
          {nudge && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-[84px] left-0 right-0 text-center text-xs text-amber-400/90 pointer-events-none z-30"
            >
              {nudge}
            </motion.p>
          )}
        </AnimatePresence>
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
