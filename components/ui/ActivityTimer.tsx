'use client';

import { useEffect, useRef, useState } from 'react';

interface ActivityTimerProps {
  durationMs: number;
  onExpire: () => void;
  /** Reset key — change to restart the timer */
  resetKey?: string | number;
}

/**
 * ActivityTimer — depleting circle arc, top-right of activity zone.
 * 24px diameter, 3px gold stroke, depletes clockwise.
 * < 20%: amber + pulse. Uses CSS animation for smooth 60fps.
 */
export function ActivityTimer({ durationMs, onExpire, resetKey }: ActivityTimerProps) {
  const [pct, setPct] = useState(1);
  const startRef = useRef(Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    firedRef.current = false;
    setPct(1);

    const raf = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / durationMs);
      setPct(remaining);

      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire();
        return;
      }
      if (remaining > 0) requestAnimationFrame(raf);
    };

    const id = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(id);
  }, [durationMs, onExpire, resetKey]);

  const circumference = 2 * Math.PI * 10;
  const isLow = pct < 0.2;
  const color = isLow ? '#fbbf24' : '#D4A843';

  return (
    <div className={`absolute top-3 right-3 ${isLow ? 'animate-pulse' : ''}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90">
        <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle
          cx="12" cy="12" r="10" fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${pct * circumference} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
