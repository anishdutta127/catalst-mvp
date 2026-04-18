'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import housesRaw from '@/content/houses.json';
import { ScreenQuote } from '@/components/ui/ScreenQuote';

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
 * S10 — Sorting Ceremony (Batch 4 polish).
 *
 * Fixes:
 *   - Crest recentering via transform-origin: center (was offset-origin,
 *     causing the winner crest to jump off-center during scale-up).
 *   - Added house radar chart showing strengths.
 *   - Added "House rules" in carved-stone style (house-colored, italic, serif).
 *   - Added quantified_impact numbers for each lineage figure.
 *   - Added ambient house-color particle drift in the background.
 *   - Slightly longer Cedric reveal dialogue, no joke — lets the moment land.
 */
export function S10Sorting() {
  const houseId = useJourneyStore((s) => s.houseId);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
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
      enqueueMessage({ speaker: 'pip', text: lines.s10.pip.claim, type: 'dialogue' });
      // Personalised closing beat — "They didn't know they were X either.
      // Not at first. You'll grow into it."
      setTimeout(() => {
        enqueueMessage({
          speaker: 'cedric',
          text: lines.s10.cedric.afterLineage(winningHouse.name.replace('House of ', '')),
          type: 'dialogue',
        });
      }, 1400);
    }, 7200 + lineageDuration + 1200);
    // NOTE: auto-advance removed. The user now controls when to continue via
    // the "Continue to my profile →" CTA that appears during the complete
    // phase. Prevents the ceremony from cutting away before the user has
    // had time to read the lineage + collective-impact content.
  }, [enqueueMessage, winningHouse]);

  return (
    <div className="flex flex-col items-center gap-5 h-full overflow-y-auto pb-6 relative">
      {/* ── Ambient particles (house-colored drift) ── */}
      {(phase === 'winner' || phase === 'lineage' || phase === 'complete') && (
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
        {(phase === 'winner' || phase === 'lineage' || phase === 'complete') && (
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

      {/* ── 4 crests ── */}
      <div className="relative z-10 w-full flex items-center justify-center pt-4 min-h-[140px]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {HOUSES.map((house) => {
            const isWinner = house.id === winningHouse.id;
            const isEliminated = !isWinner && phase !== 'crests';
            const isRevealed = isWinner && (phase === 'winner' || phase === 'lineage' || phase === 'complete');
            const initial = (house.name.match(/of (\w)/)?.[1] || house.name.charAt(0)).toUpperCase();
            const elimIdx = HOUSES.filter((h) => h.id !== winningHouse.id).indexOf(house);
            return (
              <motion.div
                key={house.id}
                data-testid={isRevealed ? 'house-winner' : `house-crest-${house.id}`}
                initial={false}
                // Eliminated crests now dissolve with a small rotation + scale
                // so the fade reads as the house "stepping back" rather than
                // flatly dimming. Winner scales to 1.6 with a spring, no
                // rotation so it feels grounded and triumphant.
                animate={{
                  opacity: isEliminated ? 0 : 1,
                  scale: isRevealed ? 1.6 : isEliminated ? 0.55 : 1,
                  rotate: isEliminated ? (elimIdx % 2 === 0 ? -8 : 8) : 0,
                  y: isEliminated ? 6 : 0,
                }}
                transition={{
                  duration: 0.9,
                  delay: isEliminated ? elimIdx * 0.45 : 0,
                  type: isRevealed ? 'spring' : 'tween',
                  stiffness: 180,
                  damping: 18,
                }}
                className="relative flex flex-col items-center gap-2"
                style={{ transformOrigin: 'center center' }}
              >
                {/* Radial light-ray burst around the winner crest — fires once
                    on the winner phase and leaves behind a soft pulsing halo. */}
                {isRevealed && (
                  <>
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
                    {/* Persistent halo behind the crest — breathes softly */}
                    <motion.div
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: 110,
                        height: 110,
                        top: -11,
                        left: '50%',
                        marginLeft: -55,
                        background: `radial-gradient(circle, ${house.hex}40 0%, ${house.hex}00 70%)`,
                      }}
                      animate={{
                        opacity: [0.5, 0.85, 0.5],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                      aria-hidden
                    />
                  </>
                )}

                <div
                  className={`relative w-[88px] h-[88px] rounded-full flex items-center justify-center text-[28px] font-serif font-bold border-2 transition-all ${
                    isRevealed ? 'shadow-[0_0_32px_var(--glow)]' : ''
                  }`}
                  style={{
                    borderColor: house.hex,
                    background: `radial-gradient(circle at 40% 35%, ${house.hex}40, ${house.hex}10)`,
                    color: house.hex,
                    ['--glow' as string]: `${house.hex}80`,
                  } as React.CSSProperties}
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
      </div>

      {/* ── Winner title + Welcome Home banner ── */}
      <AnimatePresence>
        {(phase === 'winner' || phase === 'lineage' || phase === 'complete') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="text-center z-10 mt-3 relative"
          >
            {/* WELCOME HOME banner — flashes above the house title for ~3s
                right after the winner crest settles, then fades. Uses the
                lines.s10.cedric.claim energy. */}
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
              style={{ color: winningHouse.hex, textShadow: `0 0 24px ${winningHouse.hex}60` }}
            >
              {winningHouse.name}
            </h2>
            <p className="text-sm text-ivory/55 mt-2 italic">{winningHouse.tagline}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── House radar chart ── */}
      <AnimatePresence>
        {(phase === 'winner' || phase === 'lineage' || phase === 'complete') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="z-10 w-full max-w-sm px-4 mt-2"
          >
            <p className="text-[10px] text-ivory/40 uppercase tracking-widest text-center mb-1">
              Your house strengths
            </p>
            <div className="h-[180px] w-full">
              <ResponsiveContainer>
                <RadarChart data={radarData} outerRadius={65}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fill: 'rgba(245,240,232,0.5)', fontSize: 10 }}
                  />
                  <Radar
                    dataKey="avg"
                    stroke="rgba(255,255,255,0.2)"
                    fill="rgba(255,255,255,0.06)"
                    strokeWidth={1}
                  />
                  <Radar
                    dataKey="you"
                    stroke={winningHouse.hex}
                    fill={winningHouse.hex}
                    fillOpacity={0.28}
                    strokeWidth={2.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[9px] text-ivory/30 text-center -mt-2">
              <span style={{ color: winningHouse.hex }}>●</span> you &nbsp;·&nbsp;
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>●</span> average founder
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── House rules (carved-stone) ── */}
      <AnimatePresence>
        {(phase === 'lineage' || phase === 'complete') && rules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="z-10 w-full max-w-sm px-4 space-y-1.5"
          >
            <p className="text-[10px] text-ivory/40 uppercase tracking-widest text-center">
              House rules
            </p>
            {rules.map((rule, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 + i * 0.2 }}
                className="text-center"
              >
                <p
                  className="text-[14px] font-serif italic leading-snug"
                  style={{
                    color: winningHouse.hex,
                    textShadow: `0 1px 0 rgba(0,0,0,0.4), 0 0 8px ${winningHouse.hex}40`,
                    letterSpacing: '0.02em',
                  }}
                >
                  &ldquo;{rule}&rdquo;
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lineage cards with quantified impact ── */}
      <AnimatePresence>
        {(phase === 'lineage' || phase === 'complete') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="z-10 w-full max-w-md px-4 space-y-2 mt-2"
          >
            <p className="text-[10px] text-ivory/40 uppercase tracking-widest text-center mb-1">
              Your lineage
            </p>
            {winningHouse.lineage.map((fig, i) => (
              <AnimatePresence key={fig.name}>
                {i <= lineageIdx && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    data-testid={`lineage-${fig.name}`}
                    className="bg-dark-surface/80 backdrop-blur-sm border rounded-xl p-3.5"
                    style={{ borderColor: `${winningHouse.hex}30` }}
                  >
                    <div className="flex items-baseline justify-between mb-1">
                      <p className="text-[15px] font-serif font-bold text-ivory">{fig.name}</p>
                      {fig.epithet && (
                        <p className="text-[9px] italic" style={{ color: winningHouse.hex }}>
                          {fig.epithet}
                        </p>
                      )}
                    </div>
                    {fig.quantified_impact && (
                      <p className="text-[11px] leading-snug mb-1.5" style={{ color: `${winningHouse.hex}B0` }}>
                        {fig.quantified_impact}
                      </p>
                    )}
                    <p className="text-[10px] text-ivory/30 uppercase tracking-wider">
                      {fig.sharedTraitLine}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Collective impact ── */}
      <AnimatePresence>
        {phase === 'complete' && winningHouse.collective_impact && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="z-10 w-full max-w-sm px-4 text-center mt-1"
          >
            <p className="text-[13px] italic leading-relaxed" style={{ color: `${winningHouse.hex}D0` }}>
              &ldquo;{winningHouse.collective_impact}&rdquo;
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Continue CTA — appears on complete so the user controls when to
          move on. Gold breathing pulse matches S06 Forge / S07 Reveal /
          S09 Crown so the journey's "continue" moments share a language. */}
      <AnimatePresence>
        {phase === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.8, ease: [0.22, 1, 0.36, 1] }}
            className="z-10 w-full max-w-sm px-4 mt-4"
          >
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
      </AnimatePresence>

      <ScreenQuote screen="s10" />
    </div>
  );
}
