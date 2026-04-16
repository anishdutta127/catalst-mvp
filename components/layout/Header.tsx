'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ScreenId } from '@/lib/constants';

interface HeaderProps {
  currentScreen: ScreenId;
  completedScreens: ScreenId[];
}

const MILESTONES = [
  { icon: '🌱', id: 'gate', screens: ['s00', 's01', 's01_llm'] },
  { icon: '🔮', id: 'mind', screens: ['s02', 's03'] },
  { icon: '🌊', id: 'world', screens: ['s04'] },
  { icon: '⚡', id: 'test', screens: ['s05'] },
  { icon: '💎', id: 'crystal', screens: ['s06', 's07'] },
  { icon: '🔥', id: 'forge', screens: ['s08'] },
  { icon: '💡', id: 'ideas', screens: ['s09', 's09b'] },
  { icon: '🏠', id: 'home', screens: ['s10', 's11'] },
];

function getMilestoneState(ms: typeof MILESTONES[0], current: ScreenId, completed: ScreenId[]): 'active' | 'completed' | 'upcoming' {
  if (ms.screens.includes(current)) return 'active';
  if (ms.screens.some((s) => completed.includes(s as ScreenId))) return 'completed';
  return 'upcoming';
}

/**
 * Header — 48px. CATALST left, timer counter + milestone bar right.
 * On S00: CATALST centered, no milestone bar (handled by S00 component).
 */
export function Header({ currentScreen, completedScreens }: HeaderProps) {
  const isGateway = currentScreen === 's00';
  const [elapsed, setElapsed] = useState(0);

  // Timer counts up
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

  if (isGateway) return null; // S00 renders its own header

  return (
    <header className="h-full px-4 flex items-center">
      <div className="mx-auto w-full max-w-[720px] flex items-center justify-between">
        {/* Logo */}
        <span className="text-xs tracking-[0.3em] text-gold/60 font-semibold uppercase font-serif">
          CATALST
        </span>

        {/* Timer + milestones */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-ivory/30">{timeStr}</span>
          <div className="flex items-center gap-0.5">
            {MILESTONES.map((ms, i) => {
              const state = getMilestoneState(ms, currentScreen, completedScreens);
              const isIdeas = ms.id === 'ideas';
              return (
                <div key={ms.id} className="flex items-center">
                  {i > 0 && <div className="w-1 h-0.5 bg-gold/20" />}
                  <span
                    className={`text-[12px] ${
                      state === 'active' ? 'opacity-100 drop-shadow-[0_0_4px_rgba(212,168,67,0.6)]' :
                      state === 'completed' ? 'opacity-80' : 'opacity-30'
                    } ${isIdeas ? 'text-[14px]' : ''}`}
                  >
                    {ms.icon}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
