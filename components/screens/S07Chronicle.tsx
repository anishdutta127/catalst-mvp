'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { finalRun } from '@/lib/scoring/orchestrator';
import { buildForgeProfile } from '@/lib/scoring/buildProfile';
import { ScreenQuote } from '@/components/ui/ScreenQuote';

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

/** Per-headline visual theme. id → color palette + category tag + year icon. */
const HEADLINE_THEMES: Record<
  string,
  {
    primary: string;
    secondary: string;
    accent: string;
    category: string;
    icon: string;
  }
> = {
  achievement: {
    primary: '#D4A843',
    secondary: '#6B3F07',
    accent: '#FAD890',
    category: 'LEGACY',
    icon: '👑',
  },
  autonomy: {
    primary: '#0EA5E9',
    secondary: '#0C4A6E',
    accent: '#7DD3FC',
    category: 'FREEDOM',
    icon: '🕊️',
  },
  power: {
    primary: '#9333EA',
    secondary: '#4C1D95',
    accent: '#C4B5FD',
    category: 'SCALE',
    icon: '⚡',
  },
  affiliation: {
    primary: '#EC4899',
    secondary: '#831843',
    accent: '#FBCFE8',
    category: 'COMMUNITY',
    icon: '🌱',
  },
};

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
  const theme = HEADLINE_THEMES[current.id] ?? HEADLINE_THEMES.achievement;
  const statsParts = current.stats.split(/\s+·\s+/).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      {/* Progress ticker — "Future X of 4" */}
      <div className="shrink-0 h-6 flex items-center justify-center">
        <motion.p
          key={`progress-${headlineIdx}`}
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[10px] font-mono uppercase tracking-[0.28em] text-ivory/55"
        >
          Future {headlineIdx + 1} of {total}
        </motion.p>
      </div>

      {/* Swipeable future-card */}
      <div className="flex-1 relative min-h-0 pt-2 pb-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <FutureCard
            key={current.id}
            hl={current}
            theme={theme}
            displayName={displayName}
            statsParts={statsParts}
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
            const t = HEADLINE_THEMES[h.id] ?? HEADLINE_THEMES.achievement;
            return (
              <button
                key={h.id}
                onClick={() => setHeadlineIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: active ? 20 : 8,
                  height: 8,
                  background: active ? t.primary : 'rgba(255,255,255,0.18)',
                  boxShadow: active ? `0 0 6px ${t.primary}80` : 'none',
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
            background: theme.primary,
            color: '#0C0E12',
          }}
        >
          <motion.span
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{
              boxShadow: [
                `0 0 14px ${theme.primary}55`,
                `0 0 28px ${theme.primary}aa`,
                `0 0 14px ${theme.primary}55`,
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
  hl: (typeof lines.s07.headlines)[number];
  theme: (typeof HEADLINE_THEMES)[string];
  displayName: string;
  statsParts: string[];
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

function FutureCard({
  hl,
  theme,
  displayName,
  statsParts,
  onSwipeLeft,
  onSwipeRight,
}: FutureCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-6, 6]);
  const opacity = useTransform(x, [-260, -60, 0, 60, 260], [0.3, 0.7, 1, 0.7, 0.3]);

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

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.35}
      onDragEnd={handleDragEnd}
      style={{
        x,
        rotate,
        opacity,
        touchAction: 'pan-y',
        background: `linear-gradient(145deg, ${theme.secondary}ee 0%, #14171E 45%, #0C0E12 100%)`,
        boxShadow: `0 14px 44px -10px ${theme.primary}55, 0 0 0 1px ${theme.primary}30`,
      }}
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
    >
      {/* Masthead — category tag + year */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-[16px] leading-none">{theme.icon}</span>
          <span
            className="text-[10px] font-mono uppercase font-semibold tracking-[0.22em]"
            style={{ color: theme.accent }}
          >
            {theme.category}
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/40 tracking-widest">2036</span>
      </div>

      {/* Headline */}
      <div className="shrink-0 px-5 pt-4 pb-3">
        <h3 className="text-[20px] sm:text-[22px] font-serif font-bold text-white leading-tight">
          {hl.headline(displayName)}
        </h3>
      </div>

      {/* Stats */}
      <div className="shrink-0 px-5 pb-3 flex flex-wrap gap-2">
        {statsParts.map((stat, i) => (
          <span
            key={i}
            className="rounded-full px-2.5 py-1 text-[10.5px] font-medium"
            style={{
              background: `${theme.primary}18`,
              border: `1px solid ${theme.primary}40`,
              color: theme.accent,
            }}
          >
            {stat}
          </span>
        ))}
      </div>

      {/* Story */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 scrollbar-hide">
        <p className="text-[13.5px] text-white/80 leading-relaxed">{hl.story}</p>
      </div>

      {/* Pull-quote footer */}
      <div
        className="shrink-0 px-5 py-4 border-t"
        style={{ borderColor: `${theme.primary}35` }}
      >
        <div
          className="pl-3 border-l-2"
          style={{ borderColor: theme.primary }}
        >
          <p className="text-[12.5px] italic text-white/75 leading-snug">
            {hl.quote(displayName)}
          </p>
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
