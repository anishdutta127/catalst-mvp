'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { finalRun } from '@/lib/scoring/orchestrator';
import { buildForgeProfile } from '@/lib/scoring/buildProfile';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { PipWithPoof } from '@/components/characters/PipWithPoof';
import { PipFloatingBubble } from '@/components/ui/PipFloatingBubble';
import { VowVessel } from '@/components/ui/VowVessel';

/**
 * S07 — Verdania Chronicle + Constraints.
 *
 * Two phases:
 *   1. HEADLINES — the user reads 4 "future newspapers" (their possible
 *      10-year selves) and picks the one that makes their heart race. Each
 *      future has its own visual mood — drag-to-swipe between them.
 *   2. CONSTRAINTS — quick practical pills (time / budget / edge) so the
 *      scoring engine has enough signal to match. Progress indicator at
 *      top, polished selection pills, one gold breathing CTA when ready.
 */

/** Lighten a hex color toward white by `amt` (0–1). Used for accent tints. */
function lighten(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const blend = (c: number) => Math.round(c + (255 - c) * amt);
  return (
    '#' +
    [blend(r), blend(g), blend(b)]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
  );
}

type Headline = (typeof lines.s07.headlines)[number];

export function S07Chronicle() {
  const state = useJourneyStore();
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [phase, setPhase] = useState<'headlines' | 'constraints'>(
    state.ideaMode === 'shortcut' ? 'constraints' : 'headlines',
  );
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedAdvantage, setSelectedAdvantage] = useState('');
  const [revealing, setRevealing] = useState(false);
  // Pip lives locally on S07 (bottom-right, above CTA) so his bubble can't
  // collide with the chronicle card's big hero headline. Reactions land in
  // pipReaction state and render via PipFloatingBubble with direction="bottom-right".
  const [pipReaction, setPipReaction] = useState<string | null>(null);
  const ambientFiredRef = useRef(false);
  const dialogueSent = useRef(false);
  const constraintsDialogueSent = useRef(false);
  const displayName = state.displayName || 'Traveler';

  // Ambient Pip dwell line — fires once after 15s if nothing else has
  // happened. Local state (not messageQueue) because PipFloater is hidden
  // on this screen.
  useEffect(() => {
    if (ambientFiredRef.current) return;
    const bank = lines.ambientPip.s07;
    if (!bank || bank.length === 0) return;
    const t = setTimeout(() => {
      if (ambientFiredRef.current) return;
      ambientFiredRef.current = true;
      setPipReaction(bank[Math.floor(Math.random() * bank.length)]);
    }, 15000);
    return () => clearTimeout(t);
  }, []);

  // Intro dialogue — once per phase.
  useEffect(() => {
    if (phase === 'headlines') {
      if (dialogueSent.current) return;
      dialogueSent.current = true;
      enqueueMessage({
        speaker: 'cedric',
        text: lines.s07.cedric.headlineIntro,
        type: 'instruction',
      });
      // Pip's intro goes to LOCAL state — the chat-strip PipFloater is
      // hidden on S07 so enqueueing would silence this line.
      const t = setTimeout(() => {
        setPipReaction(lines.s07.pip.headlineIntro);
      }, 2400);
      return () => clearTimeout(t);
    }
    if (phase === 'constraints') {
      if (constraintsDialogueSent.current) return;
      constraintsDialogueSent.current = true;
      // Clear stale headline-intro out of the chat strip before the vow intro
      useUIStore.getState().clearAllMessages();
      enqueueMessage({
        speaker: 'cedric',
        text: lines.s07.vows.intro,
        type: 'instruction',
      });
    }
  }, [enqueueMessage, phase]);

  function handleHeadlineSelect() {
    const hl = lines.s07.headlines[headlineIdx];
    state.setHeadlineChoice(hl.id);
    // Short beat for the button press to animate, then shift phase.
    setTimeout(() => setPhase('constraints'), 450);
  }

  function handleComplete() {
    if (!selectedTime || !selectedResource || revealing) return;
    setRevealing(true);
    state.setTimeBudget(selectedTime);
    state.setResourceLevel(selectedResource);
    if (selectedAdvantage) state.setCompetitiveAdvantage(selectedAdvantage);

    enqueueMessage({ speaker: 'cedric', text: lines.s07.cedric.afterAll, type: 'dialogue' });

    setTimeout(() => {
      try {
        const profile = buildForgeProfile({
          ...state,
          timeBudget: selectedTime,
          resourceLevel: selectedResource,
          competitiveAdvantage: selectedAdvantage,
        } as unknown as import('@/lib/store/journeyStore').JourneyState);
        const result = finalRun(profile);
        state.setMatchedIdeas(result.pipeline);
        state.setHouseId(result.house);
      } catch (err) {
        console.error('[S07] finalRun failed:', err);
      }
    }, 0);

    setTimeout(() => state.advanceScreen(), 850);
  }

  return (
    <div className="flex flex-col h-full relative">
      <AnimatePresence mode="wait">
        {phase === 'headlines' ? (
          <HeadlinesPhase
            key="headlines"
            headlineIdx={headlineIdx}
            setHeadlineIdx={setHeadlineIdx}
            displayName={displayName}
            onSelect={handleHeadlineSelect}
          />
        ) : (
          <ConstraintsPhase
            key="constraints"
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            selectedResource={selectedResource}
            setSelectedResource={setSelectedResource}
            selectedAdvantage={selectedAdvantage}
            setSelectedAdvantage={setSelectedAdvantage}
            onComplete={handleComplete}
            revealing={revealing}
            onCedricBeat={(text) =>
              enqueueMessage({ speaker: 'cedric', text, type: 'dialogue' })
            }
            onPipReaction={setPipReaction}
          />
        )}
      </AnimatePresence>

      {/* Pip — anchored BOTTOM-RIGHT, above the CTA. Keeps him out of the
          chronicle card's hero headline area which takes the upper half. */}
      <div
        className="absolute z-30 pointer-events-none"
        style={{ bottom: 78, right: 10 }}
      >
        <PipWithPoof
          emotion="tilt"
          color="#4ade80"
          size={48}
          enterDelay={1000}
          visible={true}
        />
      </div>

      {/* Reaction bubble — grows UPWARD from above Pip (bottom-right anchor) */}
      <AnimatePresence>
        {pipReaction && (
          <PipFloatingBubble
            key={pipReaction}
            text={pipReaction}
            color="#4ade80"
            direction="bottom-right"
            onComplete={() => setPipReaction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Phase 1: Headlines ────────────────────────────────────────────────────

interface HeadlinesPhaseProps {
  headlineIdx: number;
  setHeadlineIdx: (n: number) => void;
  displayName: string;
  onSelect: () => void;
}

function HeadlinesPhase({ headlineIdx, setHeadlineIdx, displayName, onSelect }: HeadlinesPhaseProps) {
  const total = lines.s07.headlines.length;
  const current = lines.s07.headlines[headlineIdx];
  const theme = current.theme;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      {/* Swipeable magazine-style future-card */}
      <div className="flex-1 relative min-h-0 pt-1 pb-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <FutureCard
            key={current.id}
            hl={current}
            displayName={displayName}
            headlineIdx={headlineIdx}
            total={total}
            onSwipeLeft={() => setHeadlineIdx(Math.min(total - 1, headlineIdx + 1))}
            onSwipeRight={() => setHeadlineIdx(Math.max(0, headlineIdx - 1))}
          />
        </AnimatePresence>
      </div>

      {/* Dots + arrows */}
      <div className="shrink-0 h-9 flex items-center justify-center gap-4">
        <button
          onClick={() => setHeadlineIdx(Math.max(0, headlineIdx - 1))}
          disabled={headlineIdx === 0}
          className="text-ivory/50 disabled:opacity-25 text-lg px-2 leading-none"
          aria-label="Previous future"
        >
          ‹
        </button>
        <div className="flex gap-1.5">
          {lines.s07.headlines.map((h, i) => {
            const active = i === headlineIdx;
            return (
              <button
                key={h.id}
                onClick={() => setHeadlineIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: active ? 20 : 8,
                  height: 8,
                  background: active ? h.theme.color_primary : 'rgba(255,255,255,0.18)',
                  boxShadow: active ? `0 0 6px ${h.theme.color_primary}80` : 'none',
                }}
                aria-label={`Go to future ${i + 1}`}
              />
            );
          })}
        </div>
        <button
          onClick={() => setHeadlineIdx(Math.min(total - 1, headlineIdx + 1))}
          disabled={headlineIdx === total - 1}
          className="text-ivory/50 disabled:opacity-25 text-lg px-2 leading-none"
          aria-label="Next future"
        >
          ›
        </button>
      </div>

      {/* CTA */}
      <div className="shrink-0 px-3 pb-2">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSelect}
          data-testid={`headline-card-${headlineIdx}`}
          className="relative w-full h-12 rounded-2xl font-bold text-[14px] overflow-hidden flex items-center justify-center gap-2"
          style={{
            background: theme.color_primary,
            color: '#0C0E12',
          }}
        >
          <motion.span
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{
              boxShadow: [
                `0 0 14px ${theme.color_primary}55`,
                `0 0 28px ${theme.color_primary}aa`,
                `0 0 14px ${theme.color_primary}55`,
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative">This future is mine</span>
          <span className="relative">→</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

interface FutureCardProps {
  hl: Headline;
  displayName: string;
  headlineIdx: number;
  total: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

/**
 * FutureCard — magazine-style feature article. Named regions:
 *   • Category strip + "Future X / Y" counter at top
 *   • Big serif headline hero
 *   • Featured stat callout (huge number + context)
 *   • Lead paragraph (1-2 sentences)
 *   • Pull-quote (decorative " + large italic + attribution)
 *   • Support-stat chips at the bottom
 *
 * Drag-to-swipe between futures with subtle rotate/fade feedback.
 */
function FutureCard({
  hl,
  displayName,
  headlineIdx,
  total,
  onSwipeLeft,
  onSwipeRight,
}: FutureCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-6, 6]);
  const dragOpacity = useTransform(x, [-260, -60, 0, 60, 260], [0.3, 0.7, 1, 0.7, 0.3]);

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    const dx = info.offset.x;
    if (dx < -100) {
      onSwipeLeft();
    } else if (dx > 100) {
      onSwipeRight();
    } else {
      x.set(0);
    }
  }

  const theme = hl.theme;
  const pullQuoteAttribution = hl.pull_quote.attribution(displayName);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.35}
      onDragEnd={handleDragEnd}
      style={{
        x,
        rotate,
        opacity: dragOpacity,
        touchAction: 'pan-y',
        // Higher base opacity + backdrop blur so the cave/palace art can't
        // fight the text for attention. Theme color still tints the top so
        // each future's mood (LEGACY / FREEDOM / SCALE / COMMUNITY) reads.
        background: `linear-gradient(145deg, ${theme.color_primary}28 0%, ${theme.color_secondary}1A 50%, rgba(8, 10, 14, 0.92) 100%)`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${theme.color_primary}35`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px ${theme.color_primary}20`,
      }}
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
    >
      {/* Scrollable content region — magazine-style layout */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {/* Category strip (left) + counter (right) */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-1 h-4 rounded-full"
              style={{ background: theme.color_primary }}
            />
            <span className="text-[14px] leading-none">{theme.icon}</span>
            <span
              className="text-[10px] font-mono uppercase font-bold tracking-[0.22em]"
              style={{ color: theme.color_primary }}
            >
              {theme.category}
            </span>
          </div>
          <span className="text-[10px] font-mono text-ivory/40 tracking-widest">
            FUTURE {headlineIdx + 1} / {total}
          </span>
        </div>

        {/* Headline — hero */}
        <div className="px-6 pb-4">
          <h2 className="text-[24px] sm:text-[28px] font-serif font-bold text-ivory leading-[1.15]">
            {hl.headline(displayName)}
          </h2>
        </div>

        {/* Featured stat — big number callout */}
        <div className="px-6 pb-4">
          <div
            className="flex items-baseline gap-3 py-3 border-t border-b"
            style={{ borderColor: `${theme.color_primary}30` }}
          >
            <p
              className="text-[34px] sm:text-[38px] font-serif font-bold leading-none shrink-0"
              style={{ color: theme.color_primary }}
            >
              {hl.featured_stat.value}
            </p>
            <p className="text-[12px] text-ivory/75 leading-snug flex-1 pt-1">
              {hl.featured_stat.context}
            </p>
          </div>
        </div>

        {/* Pull-quote — hoisted ABOVE the lead so it's always in the top
            half of the card (guarantees the emotional anchor is visible
            without scrolling on all four slides, not just the last). */}
        {hl.pull_quote && (
          <div className="relative mx-6 mb-4 py-3 pl-5 pr-4">
            <span
              className="absolute -top-1 left-0 text-[56px] font-serif leading-none"
              style={{ color: theme.color_primary, opacity: 0.35 }}
              aria-hidden
            >
              &ldquo;
            </span>
            <p
              className="text-[15px] italic font-serif leading-snug pl-6"
              style={{ color: lighten(theme.color_primary, 0.75) }}
            >
              {hl.pull_quote.text}
            </p>
            <p className="text-[10.5px] text-ivory/55 mt-2 pl-6 uppercase tracking-wider">
              — {pullQuoteAttribution}
            </p>
          </div>
        )}

        {/* Lead paragraph */}
        <div className="px-6 pb-4">
          <p className="text-[14px] text-ivory/85 leading-relaxed">{hl.lead}</p>
        </div>

        {/* Support-stat chips */}
        <div className="px-6 pb-5">
          <div className="flex gap-2 flex-wrap">
            {hl.support_stats.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <span>{s.icon}</span>
                <span className="text-ivory/80">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Phase 2: Constraints — THE THREE VOWS ────────────────────────────────

type VowKey = 'hours' | 'coin' | 'edge';

interface ConstraintsPhaseProps {
  selectedTime: string;
  setSelectedTime: (s: string) => void;
  selectedResource: string;
  setSelectedResource: (s: string) => void;
  selectedAdvantage: string;
  setSelectedAdvantage: (s: string) => void;
  onComplete: () => void;
  revealing: boolean;
  /** Fire a Cedric dialogue line into the chat strip. */
  onCedricBeat: (text: string) => void;
  /** Fire a Pip line into the local floating bubble. */
  onPipReaction: (text: string) => void;
}

/**
 * ConstraintsPhase — THE THREE VOWS
 *
 * The founder commits three things before the match: hours (phial of sand),
 * coin (chalice), edge (blade). Each vessel is a tap-target; when active
 * the question + choices render in a glass-morph panel below. Cedric beats
 * fire after each vow, a Pip ambient at 15s of total dwell, Pip reaction
 * after the edge line. One gold breathing "Seal your vows" CTA at the
 * bottom, which runs the scoring pipeline.
 *
 * All three stored values remain scoring-compatible (engine.ts now recognises
 * both the legacy pill labels and the new vow labels in its lookup tables).
 */
function ConstraintsPhase({
  selectedTime,
  setSelectedTime,
  selectedResource,
  setSelectedResource,
  selectedAdvantage,
  setSelectedAdvantage,
  onComplete,
  revealing,
  onCedricBeat,
  onPipReaction,
}: ConstraintsPhaseProps) {
  const vows = lines.s07.vows;
  // Used by EdgeTextarea to surface industry-specific sample edges first.
  const industriesKept = useJourneyStore((s) => s.industriesKept);

  // Which vow the user is currently answering. Auto-advances after each fill,
  // but the user can tap any vessel to re-edit.
  const [activeVow, setActiveVow] = useState<VowKey>('hours');
  // Whether the user explicitly skipped the edge vow. Counts as "answered"
  // for vessel fill + seal-CTA unlock purposes, but blocks the Pip
  // "that's a GOOD one" reaction which only fires on a real edge.
  const [edgeSkipped, setEdgeSkipped] = useState(false);

  // Refs so the Cedric beats / Pip reactions fire ONCE each, even if the
  // user re-picks the same vow (swapping answer shouldn't re-trigger beats).
  const beat1Fired = useRef(false);
  const beat2Fired = useRef(false);
  const beat3Fired = useRef(false);
  const ambientFired = useRef(false);
  const pipEdgeFired = useRef(false);

  // Derive fillLevels for the three vessels from the selected values. For
  // hours + coin, fill = choiceIndex / (n - 1). For edge, fill = 1 if the
  // user's text is strong (>= minStrong chars), else 0.
  const hoursIdx = vows.hours.choices.findIndex((c) => c.value === selectedTime);
  const coinIdx = vows.coin.choices.findIndex((c) => c.value === selectedResource);
  const hoursFill = hoursIdx >= 0 ? hoursIdx / (vows.hours.choices.length - 1) : 0;
  const coinFill = coinIdx >= 0 ? coinIdx / (vows.coin.choices.length - 1) : 0;
  const edgeTrimmed = selectedAdvantage.trim();
  const edgeStrong = edgeTrimmed.length >= vows.edge.minStrong;
  // "Answered" includes explicit skip so the user isn't forced to write
  // something they don't yet have words for.
  const edgeAnswered = edgeStrong || edgeSkipped;
  const edgeFill = edgeAnswered ? 1 : 0;

  const hoursAnswered = !!selectedTime;
  const coinAnswered = !!selectedResource;
  const filledCount =
    (hoursAnswered ? 1 : 0) + (coinAnswered ? 1 : 0) + (edgeAnswered ? 1 : 0);
  const canComplete = hoursAnswered && coinAnswered && edgeAnswered;

  // Cedric beats — one per completed vow. filledCount is the trigger so
  // order-agnostic: if the user answers Edge first, the "one down" beat
  // fires when the first vow of any kind is filled.
  useEffect(() => {
    if (filledCount >= 1 && !beat1Fired.current) {
      beat1Fired.current = true;
      onCedricBeat(vows.cedricBeats.afterFirst);
    }
    if (filledCount >= 2 && !beat2Fired.current) {
      beat2Fired.current = true;
      onCedricBeat(vows.cedricBeats.afterSecond);
    }
    if (filledCount >= 3 && !beat3Fired.current) {
      beat3Fired.current = true;
      onCedricBeat(vows.cedricBeats.afterThird);
    }
  }, [filledCount, onCedricBeat, vows]);

  // Pip reaction when the edge vow is first sealed with a REAL edge (not
  // a skip). Skips don't get the "that's a GOOD one" reaction — that line
  // would feel hollow if the user deliberately chose not to declare.
  useEffect(() => {
    if (edgeStrong && !pipEdgeFired.current) {
      pipEdgeFired.current = true;
      setTimeout(() => onPipReaction(vows.pip.afterEdge), 900);
    }
  }, [edgeStrong, onPipReaction, vows]);

  // Ambient Pip line — fires once at 15s of dwell on this phase if the
  // edge vow hasn't been answered yet (at which point he says something
  // more specific). Cleans up on unmount.
  useEffect(() => {
    if (ambientFired.current) return;
    const t = setTimeout(() => {
      if (ambientFired.current || edgeAnswered) return;
      ambientFired.current = true;
      onPipReaction(vows.pip.ambient);
    }, 15000);
    return () => clearTimeout(t);
  }, [onPipReaction, vows, edgeAnswered]);

  // When a vessel is filled, auto-advance to the next empty one. Skip if
  // the user has just re-tapped an already-answered vow to re-edit.
  function handleHoursSelect(value: string) {
    const alreadyAnswered = selectedTime === value;
    setSelectedTime(value);
    if (!alreadyAnswered && !coinAnswered) setActiveVow('coin');
    else if (!alreadyAnswered && !edgeAnswered) setActiveVow('edge');
  }

  function handleCoinSelect(value: string) {
    const alreadyAnswered = selectedResource === value;
    setSelectedResource(value);
    if (!alreadyAnswered && !edgeAnswered) setActiveVow('edge');
    else if (!alreadyAnswered && !hoursAnswered) setActiveVow('hours');
  }

  const activeQuestion =
    activeVow === 'hours'
      ? vows.hours.question
      : activeVow === 'coin'
      ? vows.coin.question
      : vows.edge.question;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="shrink-0 text-center pt-1 pb-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.32em] text-gold/65">
          {vows.header}
        </p>
      </div>

      {/* Three vessels in a row */}
      <div className="shrink-0 flex items-start justify-center gap-3 pb-4">
        <VowVessel
          kind="hourglass"
          label={vows.hours.label}
          isActive={activeVow === 'hours'}
          isAnswered={hoursAnswered}
          fillLevel={hoursFill}
          onClick={() => setActiveVow('hours')}
        />
        <VowVessel
          kind="chest"
          label={vows.coin.label}
          isActive={activeVow === 'coin'}
          isAnswered={coinAnswered}
          fillLevel={coinFill}
          onClick={() => setActiveVow('coin')}
        />
        <VowVessel
          kind="blade"
          label={vows.edge.label}
          isActive={activeVow === 'edge'}
          isAnswered={edgeAnswered}
          fillLevel={edgeFill}
          onClick={() => setActiveVow('edge')}
        />
      </div>

      {/* Answer panel — glass-morph, swaps based on active vow */}
      <div
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide rounded-2xl mx-1"
        style={{
          background: 'rgba(12, 14, 18, 0.72)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(212,168,67,0.25)',
        }}
      >
        <div className="px-5 py-4">
          <p className="text-[13.5px] font-serif italic text-ivory/90 leading-relaxed mb-4">
            {activeQuestion}
          </p>

          <AnimatePresence mode="wait">
            {activeVow === 'hours' && (
              <motion.div
                key="hours-choices"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-2"
              >
                {vows.hours.choices.map((c) => (
                  <VowChoiceTile
                    key={c.value}
                    icon="⏳"
                    title={c.value}
                    flavor={c.flavor}
                    active={selectedTime === c.value}
                    onClick={() => handleHoursSelect(c.value)}
                    testId={`vow-hours-${c.value}`}
                  />
                ))}
              </motion.div>
            )}

            {activeVow === 'coin' && (
              <motion.div
                key="coin-choices"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-2"
              >
                {vows.coin.choices.map((c) => (
                  <VowChoiceTile
                    key={c.value}
                    icon="🪙"
                    title={c.value}
                    flavor={c.flavor}
                    active={selectedResource === c.value}
                    onClick={() => handleCoinSelect(c.value)}
                    testId={`vow-coin-${c.value}`}
                  />
                ))}
              </motion.div>
            )}

            {activeVow === 'edge' && (
              <motion.div
                key="edge-choices"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <EdgeTextarea
                  value={selectedAdvantage}
                  onChange={(s) => {
                    setSelectedAdvantage(s);
                    // Typing anything cancels a prior skip. Intentional —
                    // if the user now has words, treat the vow as truly
                    // declared rather than skipped.
                    if (s.length > 0 && edgeSkipped) setEdgeSkipped(false);
                  }}
                  placeholders={vows.edge.placeholders}
                  maxLength={vows.edge.maxLength}
                  minStrong={vows.edge.minStrong}
                  industriesKept={industriesKept}
                  skipped={edgeSkipped}
                  onSkip={() => {
                    setSelectedAdvantage('');
                    setEdgeSkipped(true);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Seal the vows CTA — gold breathing pulse when all three are filled */}
      <div className="shrink-0 px-1 pt-3 pb-1 h-[58px]">
        <AnimatePresence mode="wait">
          {canComplete && !revealing ? (
            <motion.button
              key="seal"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onComplete}
              data-testid="reveal-btn"
              className="relative w-full h-12 rounded-2xl bg-gold text-dark font-bold text-[14px] flex items-center justify-center gap-2 overflow-hidden"
            >
              <motion.span
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{
                  boxShadow: [
                    '0 0 14px rgba(212,168,67,0.40)',
                    '0 0 28px rgba(212,168,67,0.80)',
                    '0 0 14px rgba(212,168,67,0.40)',
                  ],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="relative">{vows.sealCta}</span>
              <motion.span
                className="relative"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </motion.button>
          ) : revealing ? (
            <motion.p
              key="revealing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center text-[11px] font-mono uppercase tracking-[0.3em] text-gold/85 pt-3.5"
            >
              The garden is narrowing…
            </motion.p>
          ) : (
            <motion.div
              key="seal-idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-12 rounded-2xl flex items-center justify-center border"
              style={{
                borderColor: 'rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <span className="text-[12px] font-mono uppercase tracking-[0.25em] text-ivory/35">
                {vows.sealCtaIdle}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScreenQuote screen="s07" />
    </motion.div>
  );
}

// ─── Vow subcomponents ────────────────────────────────────────────────────

interface VowChoiceTileProps {
  icon: string;
  title: string;
  flavor: string;
  active: boolean;
  onClick: () => void;
  testId?: string;
}

function VowChoiceTile({ icon, title, flavor, active, onClick, testId }: VowChoiceTileProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-testid={testId}
      whileTap={{ scale: 0.97 }}
      animate={{
        background: active ? 'rgba(212,168,67,0.14)' : 'rgba(255,255,255,0.04)',
        borderColor: active ? 'rgba(212,168,67,0.75)' : 'rgba(255,255,255,0.12)',
      }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-start text-left px-3 py-2.5 rounded-xl border"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[13px]" style={{ opacity: active ? 1 : 0.7 }}>
          {icon}
        </span>
        <p
          className="text-[14px] font-semibold leading-none"
          style={{ color: active ? '#FFFFFF' : 'rgba(245,240,232,0.90)' }}
        >
          {title}
        </p>
      </div>
      <p
        className="text-[11px] italic leading-snug"
        style={{ color: active ? 'rgba(245,240,232,0.75)' : 'rgba(245,240,232,0.45)' }}
      >
        {flavor}
      </p>
    </motion.button>
  );
}

/**
 * Sample competitive-advantage starters — clickable chips below the edge
 * textarea. Split into universal starters (every founder can relate) and
 * industry-specific lines that get mixed in first when the user's kept
 * industries match the key. Universal-first ordering means even a user who
 * didn't pick an industry still sees approachable options.
 */
const UNIVERSAL_EDGES = [
  "I've built products before",
  'I know people in this space',
  "I've worked with this industry for years",
  "I'm good at convincing people",
  'I can sell to customers directly',
  "I've raised money from investors",
  'I code well',
  'I can write and speak publicly',
  "I've lived/worked abroad",
  'I have strong social media presence',
  "I'm a subject matter expert",
  "I've shipped things fast before",
] as const;

const INDUSTRY_EDGES: Record<string, readonly string[]> = {
  ai_ml: ["I understand how LLMs actually work", "I've shipped an AI product before"],
  health_wellness: ["I've worked in healthcare", "I'm a certified practitioner"],
  creator_media: ['I have a following on social media', "I've worked in media/content"],
  finance_payments: ["I've worked in banking/fintech", 'I understand compliance deeply'],
  education_learning: ["I've taught students for years", "I've worked in edtech"],
  food_agriculture: ["I've worked with farmers/supply chain", "I'm a chef or F&B operator"],
  climate_energy: ["I've worked in climate/sustainability", 'I understand the energy grid'],
  gaming_entertainment: ["I've shipped a game before", 'I have a gamer community'],
  fashion_beauty: ["I've worked with D2C brands", 'I have an eye for trend cycles'],
  sports_fitness: ['I train/coach athletes', "I've built a fitness community"],
  community_social: ["I've built an engaged community online", "I'm a skilled moderator"],
  real_estate_home: ["I've worked in real estate/proptech", 'I understand local housing markets'],
  logistics_mobility: ["I've worked in logistics/ops", 'I understand supply-chain routing'],
  legal_compliance: ["I've worked in law/compliance", 'I understand regulatory filings'],
  hardware_robotics: ["I've built physical products", 'I understand manufacturing'],
};

/** Pick 2-3 industry-specific edges based on the user's kept industries. */
function getIndustrySpecificSamples(industriesKept: readonly string[]): string[] {
  const specific: string[] = [];
  for (const ind of industriesKept.slice(0, 3)) {
    const bank = INDUSTRY_EDGES[ind];
    if (bank) specific.push(...bank);
  }
  return specific.slice(0, 3);
}

interface EdgeTextareaProps {
  value: string;
  onChange: (s: string) => void;
  placeholders: readonly string[];
  maxLength: number;
  minStrong: number;
  industriesKept: readonly string[];
  skipped: boolean;
  onSkip: () => void;
}

/**
 * EdgeTextarea — stone-inscription-styled textarea for the Edge vow. Placeholder
 * cycles through the example bank every 3s while empty + unfocused to nudge
 * the user with concrete shapes of what a good edge looks like. Sample chips
 * below the textarea are industry-aware (user's kept industries show up first)
 * and a "Skip this vow" link lets users who don't know bypass the requirement.
 */
function EdgeTextarea({
  value,
  onChange,
  placeholders,
  maxLength,
  minStrong,
  industriesKept,
  skipped,
  onSkip,
}: EdgeTextareaProps) {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (value.length > 0 || focused) return;
    const t = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(t);
  }, [value, focused, placeholders.length]);

  const count = value.length;
  const strong = count >= minStrong;
  const nearMax = count >= maxLength * 0.85;

  return (
    <div>
      <textarea
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholders[placeholderIdx]}
        data-testid="vow-edge-input"
        className="w-full rounded-xl resize-none outline-none transition-colors"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${
            strong ? 'rgba(212,168,67,0.55)' : 'rgba(255,255,255,0.15)'
          }`,
          padding: '14px 16px',
          minHeight: 80,
          color: 'rgba(245,240,232,0.95)',
          fontSize: 14,
          fontFamily: 'Georgia, "Times New Roman", serif',
          lineHeight: 1.55,
        }}
      />
      <div className="flex items-center justify-between mt-1.5 px-1">
        <p className="text-[10px] italic text-ivory/40">
          {skipped
            ? 'Skipped — that\u2019s okay.'
            : strong
            ? 'Etched.'
            : `at least ${minStrong} characters`}
        </p>
        <p
          className="text-[10px] font-mono"
          style={{
            color: nearMax ? 'rgba(212,168,67,0.8)' : 'rgba(245,240,232,0.40)',
          }}
        >
          {count}/{maxLength}
        </p>
      </div>

      {/* Sample tags — industry-specific first (2-3 from the user's kept
          industries), universal afterward. Tapping REPLACES the textarea
          content with the sample. Clears the skipped state implicitly via
          parent's onChange handler (typing cancels skip). */}
      {!skipped && (() => {
        const industrySamples = getIndustrySpecificSamples(industriesKept);
        const universalSamples = UNIVERSAL_EDGES.slice(0, 8 - industrySamples.length);
        return (
          <div className="mt-3">
            <p className="text-[9.5px] font-mono uppercase tracking-widest text-ivory/40 mb-2">
              Not sure? Tap one that&rsquo;s close:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {industrySamples.map((sample) => (
                <button
                  key={`ind-${sample}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(sample);
                  }}
                  // Industry-specific chips get a subtle gold tint so they
                  // stand out as more personally relevant than universals.
                  className="px-2.5 py-1 rounded-full text-[11px] transition-colors"
                  style={{
                    background: 'rgba(212,168,67,0.10)',
                    border: '1px solid rgba(212,168,67,0.30)',
                    color: 'rgba(250,216,144,0.95)',
                  }}
                >
                  {sample}
                </button>
              ))}
              {universalSamples.map((sample) => (
                <button
                  key={`univ-${sample}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(sample);
                  }}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-white/[0.04] border border-white/10 text-ivory/70 hover:bg-white/[0.08] hover:border-white/20 hover:text-ivory/95 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Skip link — gives the user an escape hatch. Counts as "answered"
          for CTA-unlock purposes but skips Pip's afterEdge reaction. */}
      {!skipped && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSkip();
          }}
          data-testid="vow-edge-skip"
          className="mt-3 text-[11px] text-ivory/50 hover:text-ivory/85 transition-colors underline underline-offset-2"
        >
          Skip — I&rsquo;m still figuring this out
        </button>
      )}
    </div>
  );
}
