'use client';

import { useEffect, useRef } from 'react';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';

/**
 * useAmbientPipLine — fires one Pip dialogue line from the per-screen
 * `ambientPip` bank (see content/lines.ts) after `delayMs` of dwell on
 * the screen. Fires at most once per screen mount; cleans up on unmount
 * so ambient lines never leak across screen transitions.
 *
 * Use this in screens that are primarily "read + pick" (S02/S03/S06/S07/S09)
 * to give slow readers a cheeky interjection without rushing fast users.
 */
export function useAmbientPipLine(screen: string, delayMs = 15000): void {
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const bank = (lines.ambientPip as Record<string, string[] | undefined>)[screen];
    if (!bank || bank.length === 0) return;

    const t = setTimeout(() => {
      const line = bank[Math.floor(Math.random() * bank.length)];
      enqueueMessage({ speaker: 'pip', text: line, type: 'dialogue' });
      fired.current = true;
    }, delayMs);

    return () => clearTimeout(t);
  }, [screen, delayMs, enqueueMessage]);
}
