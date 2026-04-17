'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/lib/store/uiStore';

interface ActivityTimerProps {
  durationMs: number;
  onExpire: () => void;
  /** Reset key — change to restart the timer */
  resetKey?: string | number;
  /** Hold the ring at full for this long before the countdown actually
   *  begins. Used on a screen's first question so the timer doesn't
   *  start ticking while the user is still reading the intro. */
  startDelayMs?: number;
}

/**
 * ActivityTimer — registers a depleting timer with the UI store.
 *
 * Renderless: PipFloater owns the visual (a ring around Pip's sprite) and the
 * RAF loop. Screens just declare "I want a timer for N ms, call this onExpire."
 *
 * The previous version rendered a tiny 24px ring in the corner; we now want
 * the timer visually attached to Pip so the user understands what it counts.
 */
export function ActivityTimer({
  durationMs,
  onExpire,
  resetKey = 'default',
  startDelayMs = 0,
}: ActivityTimerProps) {
  const startPipTimer = useUIStore((s) => s.startPipTimer);
  const stopPipTimer = useUIStore((s) => s.stopPipTimer);

  useEffect(() => {
    startPipTimer(durationMs, resetKey, onExpire, startDelayMs);
    return () => stopPipTimer();
    // onExpire intentionally omitted — startPipTimer captures the latest closure
    // each time durationMs/resetKey/startDelayMs changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs, resetKey, startDelayMs, startPipTimer, stopPipTimer]);

  return null;
}
