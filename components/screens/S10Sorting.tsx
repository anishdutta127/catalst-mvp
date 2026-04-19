'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { pathLine } from '@/lib/speakPath';
import housesRaw from '@/content/houses.json';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { staggerContainer, fadeSlideUp } from '@/lib/motion';

interface LineageFigure {
  name: string;
  sharedTraitLine: string;
  quantified_impact?: string;
  achievement?: string;
  epithet?: string;
  connectionLine?: string;
  quote?: string;
}
interface House {
  id: string; name: string; hex: string; tagline: string;
  description: string; strengths: string[]; lineage: LineageFigure[];
  warning?: string; collective_impact?: string;
}
const HOUSES = housesRaw as unknown as House[];
type Phase = 'crests' | 'eliminating' | 'winner' | 'lineage' | 'complete';

// House-specific "carved stone" rules — 3 per house, identity-building.
const HOUSE_RULES: Record<string, string[]> = {
  architects: [
    'Build for decades, not quarters',
    'The blueprint is never complete. Ship anyway.',
    'Depth is a moat. Surface is a trap.',
  ],
  vanguards: [
    'Move first. Apologise never.',
    'Permission is for employees. Founders take.',
    'Speed is the only moat you fully control.',
  ],
  alchemists: [
    'The pattern no one else sees is the whole game',
    'Connect two worlds. Charge for the bridge.',
    'Taste beats data when data\'s missing',
  ],
  pathfinders: [
    'The path doesn\'t exist yet. Walk anyway.',
    'Learn in public. Pivot in private.',
    'The first map is always wrong. Draw another.',
  ],
};

/**
 * S10 — Sorting Ceremony (Batch 5 centering + readability pass).
 *
 * Key fixes this pass:
 *   1. Winner crest now *actually* centers — earlier revision scaled it inside
 *      a 4-column grid cell, so the 1.6× scale bloomed off-axis (upper-left).
 *      Fix: on phase transition to 'winner', swap to a single-column flex
 *      layout. framer-motion's layoutId animates the crest between the
 *      old-grid-cell position and the new centered-flex position smoothly.
 *   2. Winner-phase content sits on a rounded-3xl bg-black/45 backdrop so
 *      the house rules + trait labels + lineage text read against the busy
 *      backgrounded scene. Lineage cards get an inner bg-white/5 wrapper so
 *      the "frozen stone" rules visually separate from the "people" cards.
 *   3. Trait diamond (radar) axis labels get textShadow so they stay legible
 *      where the chart's axis lines thin out.
 *   4. staggerContainer from lib/motion.ts pipes the reveal rhythm through
 *      the section — 120ms between blocks — so content arrives in cadence.
 */
export function S10Sorting() {
  const houseId = useJourneyStore((s) => s.houseId);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const ideaMode = useJourneyStore((s) => s.ideaMode);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [phase, setPhase] = useState<Phase>('crests');
  const [lineageIdx, setLineageIdx] = useState(-1);
  // Controls the "WELCOME HOME" banner — briefly flashes above the house
  // name title right after the winner crest settles, then fades.
  const [showWelcome, setShowWelcome] = useState(false);
  const dialogueSent = useRef(false);

  const winningHouse = HOUSES.find((h) => h.id === houseId) || HOUSES[0];
  const rules = HOUSE_RULES[winningHouse.id] || [];

  // Radar data from strengths (up to 5 axes, synthetic values that favour the winning house)
  const radarData = useMemo(() => {
    return winningHouse.strengths.slice(0, 5).map((s) => ({
      axis: s,
      you: 80 + Math.floor(Math.random() * 18),
      avg: 50 + Math.floor(Math.random() * 12),
    }));
  }, [winningHouse.id]);

  const isWinnerPhase = phase === 'winner' || phase === 'lineage' || phase === 'complete';

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;

    enqueueMessage({ speaker: 'cedric', text: lines.s10.cedric.intro2, type: 'instruction' });

    setTimeout(() => setPhase('eliminating'), 2000);
    setTimeout(() => {
      setPhase('winner');
      enqueueMessage({ speaker: 'cedric', text: lines.s10.cedric.claim, type: 'dialogue' });
      // Welcome-home banner briefly flashes above the house title, then
      // fades out to cede attention to the radar + rules.
      setTimeout(() => setShowWelcome(true), 400);
      setTimeout(() => setShowWelcome(false), 3400);
    }, 4500);
    setTimeout(() => {
      setPhase('lineage');
      enqueueMessage({ speaker: 'cedric', text: lines.s10.cedric.lineageIntro, type: 'dialogue' });
      for (let i = 0; i < winningHouse.lineage.length; i++) {
        setTimeout(() => setLineageIdx(i), i * 700);
      }
    }, 7200);
    const lineageDuration = winningHouse.lineage.length * 700;
    setTimeout(() => {
      setPhase('complete');
      enqueueMessage({
        speaker: 'pip',
        text: pathLine('s10.pip.claim', lines.s10.pip.claim, ideaMode),
        type: 'dialogue',
      });
      // Personalised closing beat — "They didn't know they were X either.
      // Not at first. You'll grow into it."
      setTimeout(() => {
        enqueueMessage({
          speaker: 'cedric',
          text: lines.s10.cedric.afterLineage(winningHouse.name.replace('House of ', '')),
          type: 'dialogue',
        });
      }, 1400);
      // v8 banter beat: Pip nudges the user toward sharing their card,
      // Cedric undercuts him ("it was not up to you, Pip."). Fires after
      // afterLineage so the sequence reads as a single closing moment.
      // Gated to non-open paths — Path A closes on a cleaner beat.
      if (ideaMode === 'directed' || ideaMode === 'shortcut') {
        const nudgeText = pathLine('s10.pip.nudge', lines.s10.pip.nudge, ideaMode);
        const nudgeReply = pathLine('s10.cedric.nudge_reply', lines.s10.cedric.nudge_reply, ideaMode);
        setTimeout(() => {
          enqueueMessage({ speaker: 'pip', text: nudgeText, type: 'dialogue' });
        }, 3800);
        const nudgeMs = nudgeText.length * 35;
        setTimeout(() => {
          enqueueMessage({ speaker: 'cedric', text: nudgeReply, type: 'dialogue' });
        }, 3800 + nudgeMs + 400);
      }
    }, 7200 + lineageDuration + 1200);
    // NOTE: the manual "Continue to my profile →" CTA still appears during
    // the complete phase for users who want to advance immediately — the
    // effect below layers a gentle auto-advance on top of it.
  }, [enqueueMessage, winningHouse]);

  // Auto-advance to S11 a beat after the complete phase begins. The closing
  // dialogue (afterLineage + optional nudge beats) lands in the first ~6s;
  // the user gets another few seconds to take in the lineage + collective
  // impact, then the ceremony closes itself. The manual CTA remains so
  // anyone who wants to keep moving can.
  useEffect(() => {
    if (phase !== 'complete') return;
    const t = setTimeout(() => advanceScreen(), 12000);
    return () => clearTimeout(t);
  }, [phase, advanceScreen]);

  return (
    <div className="flex flex-col items-center h-full overflow-y-auto pb-6 relative">
      {/* ── Ambient particles (house-colored drift) ── */}
      {isWinnerPhase && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {Array.from({ length: 18 }).map((_, i) => {
            const startX = (i * 137) % 100;
            const duration = 8 + (i % 6);
            const delay = (i * 0.4) % 5;
            return (
              <motion.div
                key={`p-${i}`}
                initial={{ opacity: 0, y: '100%', x: `${startX}%` }}
                animate={{
                  opacity: [0, 0.4, 0.4, 0],
                  y: '-20%',
                  x: `${startX + (i % 2 === 0 ? 6 : -6)}%`,
                }}
                transition={{
                  duration,
                  repeat: Infinity,
                  delay,
                  ease: 'linear',
                }}
                className="absolute rounded-full"
                style={{
                  width: 3 + (i % 3),
                  height: 3 + (i % 3),
                  background: winningHouse.hex,
                  boxShadow: `0 0 ${6 + (i % 4) * 2}px ${winningHouse.hex}`,
                  filter: 'blur(0.5px)',
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── House-color flood backdrop ── */}
      <AnimatePresence>
        {isWinnerPhase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 35%, ${winningHouse.hex}55, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Crests ──
          Two render branches so the winner crest can *actually* center instead
          of blooming off-axis inside its original grid cell. During the crests
          + eliminating phases, we render a 4-col grid so the user sees the
          ceremony. Once phase flips to 'winner', we swap to a single centered
          flex container — framer-motion layoutId ties the winner crest across
          the two trees so its position animates smoothly rather than cutting.
          The layoutId trick is the centering solution here. If it regresses
          (e.g. stays grid-positioned), fall back to conditional rendering + a
          flex parent with justify-center.  */}
      <div className="relative z-10 w-full flex items-center justify-center pt-4 min-h-[140px]">
        {!isWinnerPhase && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {HOUSES.map((house) => {
              const isWinner = house.id === winningHouse.id;
              const isEliminated = !isWinner && phase === 'eliminating';
              const initial = (house.name.match(/of (\w)/)?.[1] || house.name.charAt(0)).toUpperCase();
              const elimIdx = HOUSES.filter((h) => h.id !== winningHouse.id).indexOf(house);
              return (
                <motion.div
                  key={house.id}
                  layoutId={isWinner ? 'sorting-winner-crest' : undefined}
                  data-testid={`house-crest-${house.id}`}
                  initial={false}
                  animate={{
                    opacity: isEliminated ? 0 : 1,
                    scale: isEliminated ? 0.55 : 1,
                    rotate: isEliminated ? (elimIdx % 2 === 0 ? -8 : 8) : 0,
                    y: isEliminated ? 6 : 0,
                  }}
                  transition={{
                    duration: 0.9,
                    delay: isEliminated ? elimIdx * 0.45 : 0,
                    type: 'tween',
                  }}
                  className="relative flex flex-col items-center gap-2"
                  style={{ transformOrigin: 'center center' }}
                >
                  <div
                    className="relative w-[88px] h-[88px] rounded-full flex items-center justify-center text-[28px] font-serif font-bold border-2"
                    style={{
                      borderColor: house.hex,
                      background: `radial-gradient(circle at 40% 35%, ${house.hex}40, ${house.hex}10)`,
                      color: house.hex,
                    }}
                  >
                    {initial}
                  </div>
                  <p className="text-[10px] font-mono text-ivory/40 uppercase tracking-wider">
                    {house.name.replace('House of ', '')}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}

        {isWinnerPhase && (
          <WinnerCrest house={winningHouse} />
        )}
      </div>

      {/* ── WINNER READABILITY CONTAINER ──
          Everything after the crest lives inside a semi-translucent dark card
          so the body text remains legible over the backgrounded scene. The
          card is rounded-3xl, bg-black/45, backdrop-blur-md — heavy enough to
          give text a calm surface but light enough to preserve atmosphere.
          staggerContainer sequences the inner blocks at 120ms each. */}
      <AnimatePresence>
        {isWinnerPhase && (
          <motion.div
            key="winner-backdrop"
            variants={staggerContainer(0.3, 0.12)}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="relative z-10 w-full max-w-2xl mx-auto px-5 mt-4"
          >
            <div className="relative rounded-3xl bg-black/45 backdrop-blur-md border border-white/10 shadow-2xl px-6 sm:px-8 py-8 sm:py-10">
              {/* Welcome + House name */}
              <motion.div variants={fadeSlideUp} className="text-center relative">
                <AnimatePresence>
                  {showWelcome && (
                    <motion.p
                      initial={{ opacity: 0, y: 6, letterSpacing: '0.4em' }}
                      animate={{ opacity: 1, y: 0, letterSpacing: '0.28em' }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="text-[11px] font-mono uppercase font-bold mb-2"
                      style={{
                        color: winningHouse.hex,
                        textShadow: `0 0 12px ${winningHouse.hex}90`,
                      }}
                    >
                      Welcome home
                    </motion.p>
                  )}
                </AnimatePresence>
                <h2
                  className="text-4xl sm:text-5xl font-serif font-bold"
                  style={{
                    color: winningHouse.hex,
                    textShadow: `0 0 24px ${winningHouse.hex}60, 0 1px 3px rgba(0,0,0,0.9)`,
                  }}
                >
                  {winningHouse.name}
                </h2>
                <p
                  className="text-sm text-ivory/75 mt-2 italic"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {winningHouse.tagline}
                </p>
              </motion.div>

              {/* Radar chart */}
              <motion.div variants={fadeSlideUp} className="w-full mt-6">
                <p
                  className="text-[10px] text-ivory/60 uppercase tracking-widest text-center mb-1"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                  Your house strengths
                </p>
                <div className="h-[190px] w-full">
                  <ResponsiveContainer>
                    <RadarChart data={radarData} outerRadius={68}>
                      <PolarGrid stroke="rgba(255,255,255,0.12)" />
                      <PolarAngleAxis
                        dataKey="axis"
                        // Custom tick so we can apply textShadow — recharts' default
                        // tick renderer goes through SVG <text> which won't accept
                        // Tailwind drop shadow utilities.
                        tick={(props: unknown) => {
                          const p = props as {
                            payload: { value: string };
                            x: number;
                            y: number;
                            textAnchor?: 'start' | 'middle' | 'end' | 'inherit';
                          };
                          return (
                            <text
                              x={p.x}
                              y={p.y}
                              textAnchor={p.textAnchor ?? 'middle'}
                              fill="rgba(245,240,232,0.85)"
                              fontSize={10}
                              fontFamily="ui-sans-serif, system-ui"
                              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.85)' }}
                            >
                              {p.payload.value}
                            </text>
                          );
                        }}
                      />
                      <Radar
                        dataKey="avg"
                        stroke="rgba(255,255,255,0.28)"
                        fill="rgba(255,255,255,0.08)"
                        strokeWidth={1}
                      />
                      <Radar
                        dataKey="you"
                        stroke={winningHouse.hex}
                        fill={winningHouse.hex}
                        fillOpacity={0.32}
                        strokeWidth={2.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[9px] text-ivory/45 text-center -mt-2">
                  <span style={{ color: winningHouse.hex }}>●</span> you &nbsp;·&nbsp;
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>●</span> average founder
                </p>
              </motion.div>

              {/* House rules */}
              {(phase === 'lineage' || phase === 'complete') && rules.length > 0 && (
                <motion.div
                  variants={fadeSlideUp}
                  className="w-full mt-6 space-y-1.5"
                >
                  <p
                    className="text-[10px] text-ivory/60 uppercase tracking-widest text-center"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    House rules
                  </p>
                  {rules.map((rule, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.2 }}
                      className="text-center"
                    >
                      <p
                        className="text-[14px] font-serif italic leading-snug"
                        style={{
                          color: winningHouse.hex,
                          textShadow: `0 1px 0 rgba(0,0,0,0.5), 0 0 8px ${winningHouse.hex}40`,
                          letterSpacing: '0.02em',
                        }}
                      >
                        &ldquo;{rule}&rdquo;
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Lineage cards — nested in bg-white/5 sub-wrapper so the
                  "people" section visually separates from the "rules" that
                  precede it. */}
              {(phase === 'lineage' || phase === 'complete') && (
                <motion.div
                  variants={fadeSlideUp}
                  className="w-full mt-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 px-4 py-4"
                >
                  <p
                    className="text-[10px] text-ivory/60 uppercase tracking-widest text-center mb-3"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    Your lineage
                  </p>
                  <div className="space-y-2">
                    {winningHouse.lineage.map((fig, i) => (
                      <AnimatePresence key={fig.name}>
                        {i <= lineageIdx && (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            data-testid={`lineage-${fig.name}`}
                            className="bg-black/40 backdrop-blur-sm border rounded-xl p-3.5"
                            style={{ borderColor: `${winningHouse.hex}40` }}
                          >
                            <div className="flex items-baseline justify-between mb-1">
                              <p
                                className="text-[15px] font-serif font-bold text-ivory"
                                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                              >
                                {fig.name}
                              </p>
                              {fig.epithet && (
                                <p className="text-[9px] italic" style={{ color: winningHouse.hex }}>
                                  {fig.epithet}
                                </p>
                              )}
                            </div>
                            {fig.quantified_impact && (
                              <p className="text-[11px] leading-snug mb-1.5" style={{ color: `${winningHouse.hex}D0` }}>
                                {fig.quantified_impact}
                              </p>
                            )}
                            <p className="text-[10px] text-ivory/50 uppercase tracking-wider">
                              {fig.sharedTraitLine}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Collective impact */}
              {phase === 'complete' && winningHouse.collective_impact && (
                <motion.div
                  variants={fadeSlideUp}
                  className="w-full mt-5 text-center"
                >
                  <p
                    className="text-[13px] italic leading-relaxed"
                    style={{
                      color: `${winningHouse.hex}E0`,
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}
                  >
                    &ldquo;{winningHouse.collective_impact}&rdquo;
                  </p>
                </motion.div>
              )}

              {/* Continue CTA — gold breathing pulse */}
              {phase === 'complete' && (
                <motion.div variants={fadeSlideUp} className="w-full mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => advanceScreen()}
                    data-testid="s10-continue"
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
                    <span className="relative">Continue to my profile</span>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScreenQuote screen="s10" />
    </div>
  );
}

/**
 * WinnerCrest — the centered-and-blown-up crest during winner/lineage/complete.
 *
 * Splits out of the grid branch so framer-motion can use layoutId to animate
 * the crest between "cell-1 of a 4-col grid" and "centered alone in a flex
 * row". Scale caps at 1.6 (spec — 1.8 was blooming too large and hurt the
 * backdrop container's proportions).
 */
function WinnerCrest({ house }: { house: House }) {
  const initial = (house.name.match(/of (\w)/)?.[1] || house.name.charAt(0)).toUpperCase();
  return (
    <motion.div
      layoutId="sorting-winner-crest"
      transition={{ type: 'spring', stiffness: 180, damping: 20 }}
      className="relative flex flex-col items-center gap-2"
      style={{ transformOrigin: 'center center' }}
    >
      {/* Radial light-ray burst — fires once on entry */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: 88,
          height: 88,
          top: 0,
          left: '50%',
          marginLeft: -44,
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 0.75, 0], scale: [0.6, 2.2, 2.6] }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        aria-hidden
      >
        <svg viewBox="0 0 88 88" width="100%" height="100%" className="overflow-visible">
          {[...Array(12)].map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={44 + Math.cos(a) * 46}
                y1={44 + Math.sin(a) * 46}
                x2={44 + Math.cos(a) * 68}
                y2={44 + Math.sin(a) * 68}
                stroke={house.hex}
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </motion.div>

      {/* Persistent halo */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 150,
          height: 150,
          top: -31,
          left: '50%',
          marginLeft: -75,
          background: `radial-gradient(circle, ${house.hex}40 0%, ${house.hex}00 70%)`,
        }}
        animate={{
          opacity: [0.5, 0.85, 0.5],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      {/* The crest — scale capped at 1.6 (not 1.8). Grows via motion layout
          from its original grid-cell size; the scale here is the final
          "blown-up" dimension. */}
      <motion.div
        data-testid="house-winner"
        animate={{ scale: 1.6 }}
        transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.1 }}
        className="relative w-[88px] h-[88px] rounded-full flex items-center justify-center text-[28px] font-serif font-bold border-2 shadow-[0_0_32px_var(--glow)]"
        style={{
          borderColor: house.hex,
          background: `radial-gradient(circle at 40% 35%, ${house.hex}40, ${house.hex}10)`,
          color: house.hex,
          transformOrigin: 'center center',
          ['--glow' as string]: `${house.hex}80`,
        } as React.CSSProperties}
      >
        {initial}
      </motion.div>
    </motion.div>
  );
}
