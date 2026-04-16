'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';

interface PipWithTimerProps {
  durationMs?: number;
  onExpire?: () => void;
  size?: number;
  resetKey?: string | number;
}

const PIP_COLORS: Record<string, string | null> = {
  s00: null, s01: '#86efac', s02: '#86efac', s03: '#86efac',
  s04: '#86efac', s06: '#4ade80', s07: '#fcd34d',
  s08: '#d4a843', s09: '#d4a843', s10: '#d4a843', s11: '#d4a843',
};

/**
 * PipWithTimer — Pip blob inside a depleting SVG arc ring.
 * The ring IS the timer. No separate timer component needed.
 */
export function PipWithTimer({ durationMs, onExpire, size = 40, resetKey }: PipWithTimerProps) {
  const currentScreen = useJourneyStore((s) => s.currentScreen);
  const pipColor = PIP_COLORS[currentScreen] || '#86efac';
  const [progress, setProgress] = useState(1);

  const radius = (size / 2) - 4;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!durationMs) return;
    setProgress(1);
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 1 - elapsed / durationMs);
      setProgress(remaining);
      if (remaining <= 0) {
        onExpire?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, onExpire, resetKey]);

  const isLow = progress < 0.2;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Timer arc ring */}
      {durationMs && (
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={isLow ? '#fbbf24' : '#d4a843'}
            strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.05s linear' }} />
        </svg>
      )}

      {/* Pip blob */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: durationMs ? '5px' : '0px',
          background: `radial-gradient(circle at 35% 30%, ${pipColor}, ${pipColor}77)`,
        }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Eyes */}
        <div className="absolute rounded-full bg-white"
          style={{ width: '22%', height: '22%', top: '24%', left: '20%' }} />
        <div className="absolute rounded-full bg-white"
          style={{ width: '22%', height: '22%', top: '24%', right: '20%' }} />
        {/* Smile */}
        <div className="absolute rounded-full border-b-2 border-white/70"
          style={{ width: '38%', height: '20%', bottom: '22%', left: '31%' }} />
      </motion.div>
    </div>
  );
}
