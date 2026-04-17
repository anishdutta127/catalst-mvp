'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MILESTONES, type Milestone, type ScreenId } from '@/lib/constants';

interface HeaderProps {
  currentScreen: ScreenId;
  completedScreens: ScreenId[];
}

type MilestoneState = 'active' | 'completed' | 'upcoming';

function getMilestoneState(
  ms: Milestone,
  current: ScreenId,
  completed: ScreenId[],
): MilestoneState {
  if (ms.screens.includes(current)) return 'active';
  if (ms.screens.some((s) => completed.includes(s))) return 'completed';
  return 'upcoming';
}

/**
 * MilestoneIcon — single icon in the progress strip.
 *
 * Tracks its own previous state so it can play a "just completed" celebration
 * animation when it transitions from `active` → `completed` (Duolingo-style
 * reward feedback paired with the on-screen ProcessingSwirl milestone burst).
 */
function MilestoneIcon({ ms, state }: { ms: Milestone; state: MilestoneState }) {
  const wasActive = useRef(false);
  const wasUpcoming = useRef(true);
  const [celebrate, setCelebrate] = useState<'completion' | 'activation' | null>(null);

  useEffect(() => {
    // Track entry into active so we can fire a completion burst on exit.
    if (state === 'active' && wasUpcoming.current) {
      // upcoming → active: smaller pulse so the user sees their next stop wake up
      wasUpcoming.current = false;
      wasActive.current = true;
      setCelebrate('activation');
      const t = setTimeout(() => setCelebrate(null), 900);
      return () => clearTimeout(t);
    }
    if (state === 'active') wasActive.current = true;
    if (state === 'completed' && wasActive.current) {
      // active → completed: full Duolingo burst, delayed so the screen swap
      // settles before the eye is pulled to the corner.
      wasActive.current = false;
      const armT = setTimeout(() => setCelebrate('completion'), 350);
      const stopT = setTimeout(() => setCelebrate(null), 350 + 1500);
      return () => { clearTimeout(armT); clearTimeout(stopT); };
    }
  }, [state]);

  const baseOpacity =
    state === 'active' ? 1 : state === 'completed' ? 0.7 : 0.2;

  const animateProps =
    celebrate === 'completion'
      ? {
          scale: [1, 2.0, 1.1, 1.25, 1],
          opacity: [baseOpacity, 1, 1, 1, baseOpacity],
          filter: [
            'drop-shadow(0 0 0px rgba(212,168,67,0))',
            'drop-shadow(0 0 22px rgba(212,168,67,1)) drop-shadow(0 0 40px rgba(212,168,67,0.6))',
            'drop-shadow(0 0 14px rgba(212,168,67,0.8))',
            'drop-shadow(0 0 8px rgba(212,168,67,0.5))',
            'drop-shadow(0 0 0px rgba(212,168,67,0))',
          ],
        }
      : celebrate === 'activation'
        ? {
            scale: [0.9, 1.3, 1],
            opacity: [0.2, 1, baseOpacity],
            filter: [
              'drop-shadow(0 0 0px rgba(212,168,67,0))',
              'drop-shadow(0 0 12px rgba(212,168,67,0.85))',
              'drop-shadow(0 0 5px rgba(212,168,67,0.6))',
            ],
          }
        : { scale: 1, opacity: baseOpacity };

  const animateTransition =
    celebrate === 'completion'
      ? { duration: 1.4, ease: 'easeOut' as const }
      : celebrate === 'activation'
        ? { duration: 0.7, ease: 'easeOut' as const }
        : { duration: 0.3, ease: 'easeOut' as const };

  return (
    <motion.span
      className="text-[14px] inline-block"
      animate={animateProps}
      transition={animateTransition}
      style={{
        filter:
          !celebrate && state === 'active'
            ? 'drop-shadow(0 0 5px rgba(212,168,67,0.6))'
            : undefined,
      }}
    >
      {ms.icon}
    </motion.span>
  );
}

/**
 * Header — 56px high with vertical padding. Full-viewport-width.
 * CATALST left, timer + milestones right. Hidden on s00.
 */
export function Header({ currentScreen, completedScreens }: HeaderProps) {
  const isGateway = currentScreen === 's00';
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  if (isGateway) return null;

  return (
    <header
      className="w-full px-6 py-3.5"
      style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 100%)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div className="mx-auto w-full max-w-[820px] flex items-center justify-between">
        {/* Logo */}
        <span className="text-[11px] tracking-[0.3em] text-gold/60 font-semibold uppercase font-serif">
          CATALST
        </span>

        {/* Timer + milestones */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-ivory/30 tabular-nums">{timeStr}</span>
          <div className="flex items-center gap-1">
            {MILESTONES.map((ms, i) => {
              const state = getMilestoneState(ms, currentScreen, completedScreens);
              return (
                <div key={ms.id} className="flex items-center">
                  {i > 0 && <div className="w-1.5 h-[1px] bg-gold/20 mx-0.5" />}
                  <MilestoneIcon ms={ms} state={state} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
