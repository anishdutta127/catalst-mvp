'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { finalRun } from '@/lib/scoring/orchestrator';
import { buildForgeProfile } from '@/lib/scoring/buildProfile';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { useAmbientPipLine } from '@/lib/ambient-pip';

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

type ConstraintGroup = {
  key: string;
  label: string;
  icon: string;
  options: readonly string[];
};

const ADVANTAGES = [
  'Technical skill',
  'Industry network',
  'Distribution',
  'Brand/Content',
  'Capital',
] as const;

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
  const dialogueSent = useRef(false);
  const constraintsDialogueSent = useRef(false);
  const displayName = state.displayName || 'Traveler';

  useAmbientPipLine('s07');

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
      const t = setTimeout(() => {
        enqueueMessage({ speaker: 'pip', text: lines.s07.pip.headlineIntro, type: 'dialogue' });
      }, 2400);
      return () => clearTimeout(t);
    }
    if (phase === 'constraints') {
      if (constraintsDialogueSent.current) return;
      constraintsDialogueSent.current = true;
      // Clear stale headline-intro out of the chat strip before the new line
      useUIStore.getState().clearAllMessages();
      enqueueMessage({
        speaker: 'cedric',
        text: lines.s07.cedric.constraintsIntro,
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
        background: `linear-gradient(145deg, ${theme.color_primary}18 0%, ${theme.color_secondary}10 60%, #0C0E12 100%)`,
        border: `1px solid ${theme.color_primary}25`,
        boxShadow: `0 14px 44px -10px ${theme.color_primary}55`,
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

        {/* Lead paragraph */}
        <div className="px-6 pb-4">
          <p className="text-[14px] text-ivory/85 leading-relaxed">{hl.lead}</p>
        </div>

        {/* Pull-quote — the emotional anchor */}
        <div className="relative mx-6 mb-4 py-3 pl-5 pr-4">
          <span
            className="absolute -top-1 left-0 text-[56px] font-serif leading-none"
            style={{ color: theme.color_primary, opacity: 0.35 }}
            aria-hidden
          >
            &ldquo;
          </span>
          <p
            className="text-[15px] italic font-serif text-ivory/95 leading-snug pl-6"
            style={{ color: lighten(theme.color_primary, 0.7) }}
          >
            {hl.pull_quote.text}
          </p>
          <p className="text-[10.5px] text-ivory/50 mt-2 pl-6 uppercase tracking-wider">
            — {pullQuoteAttribution}
          </p>
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

// ─── Phase 2: Constraints ──────────────────────────────────────────────────

interface ConstraintsPhaseProps {
  selectedTime: string;
  setSelectedTime: (s: string) => void;
  selectedResource: string;
  setSelectedResource: (s: string) => void;
  selectedAdvantage: string;
  setSelectedAdvantage: (s: string) => void;
  onComplete: () => void;
  revealing: boolean;
}

function ConstraintsPhase({
  selectedTime,
  setSelectedTime,
  selectedResource,
  setSelectedResource,
  selectedAdvantage,
  setSelectedAdvantage,
  onComplete,
  revealing,
}: ConstraintsPhaseProps) {
  const groups: ConstraintGroup[] = [
    { key: 'time', label: 'Time to launch', icon: '⏱', options: lines.s07.timeBudgets },
    { key: 'resource', label: 'Budget range', icon: '💰', options: lines.s07.resourceLevels },
    { key: 'advantage', label: 'Your edge', icon: '⚔️', options: ADVANTAGES },
  ];

  const filledRequired = (selectedTime ? 1 : 0) + (selectedResource ? 1 : 0);
  const filledAll = filledRequired + (selectedAdvantage ? 1 : 0);
  const canComplete = !!selectedTime && !!selectedResource;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      {/* Progress header */}
      <div className="shrink-0 flex items-center justify-between px-1 pt-1 pb-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-ivory/55">
          The practicalities
        </p>
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                width: i < filledAll ? 18 : 8,
                background:
                  i < filledRequired
                    ? '#D4A843'
                    : i < filledAll
                    ? '#D4A843aa'
                    : 'rgba(255,255,255,0.18)',
              }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>
      </div>

      {/* Three constraint groups */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-1 space-y-4">
        {groups.map((g) => {
          const selected =
            g.key === 'time'
              ? selectedTime
              : g.key === 'resource'
              ? selectedResource
              : selectedAdvantage;
          const setter =
            g.key === 'time'
              ? setSelectedTime
              : g.key === 'resource'
              ? setSelectedResource
              : setSelectedAdvantage;
          const required = g.key !== 'advantage';

          return (
            <div key={g.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] leading-none">{g.icon}</span>
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-ivory/70">
                    {g.label}
                  </p>
                  {!required && (
                    <span className="text-[9px] font-mono uppercase tracking-widest text-ivory/35">
                      optional
                    </span>
                  )}
                </div>
                <AnimatePresence>
                  {selected && (
                    <motion.span
                      key="check"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                      className="text-[10px] font-mono font-bold"
                      style={{ color: '#D4A843' }}
                    >
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-2">
                {g.options.map((opt) => {
                  const active = selected === opt;
                  return (
                    <motion.button
                      key={opt}
                      onClick={() => setter(opt)}
                      data-testid={`${g.key === 'time' ? 'time' : g.key === 'resource' ? 'resource' : 'advantage'}-${opt}`}
                      whileTap={{ scale: 0.96 }}
                      animate={{
                        background: active ? '#D4A843' : 'rgba(255,255,255,0.04)',
                        color: active ? '#0C0E12' : 'rgba(245,240,232,0.75)',
                        borderColor: active ? '#D4A843' : 'rgba(255,255,255,0.12)',
                      }}
                      transition={{ duration: 0.2 }}
                      className="px-3.5 py-2 rounded-full text-[12px] font-medium border"
                    >
                      {opt}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gold breathing CTA when required fields are filled */}
      <div className="shrink-0 px-1 pt-3 pb-1 h-[58px]">
        <AnimatePresence>
          {canComplete && !revealing && (
            <motion.button
              key="reveal"
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
              <span className="relative">Generate my 3 ideas</span>
              <motion.span
                className="relative"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {revealing && (
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
          )}
        </AnimatePresence>
      </div>

      <ScreenQuote screen="s07" />
    </motion.div>
  );
}
