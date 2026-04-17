'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore, firePipTimerExpiry } from '@/lib/store/uiStore';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { PipSprite, type PipEmotion } from '@/components/characters/PipSprite';
import { PipText } from '@/components/characters/PipText';

/**
 * PipFloater — Pip lives at the top-right of the activity zone.
 *
 * - Reads the latest Pip dialogue from the queue, waits on uiStore.cedricDone
 *   so reading order stays Cedric → Pip across layout regions.
 * - When uiStore.pipTimer is active, renders a depleting ring around the
 *   sprite (the timer is now visually anchored to Pip so users understand
 *   what it counts down).
 */

const SPRITE_SIZE = 60;
const RING_OUTER = 78;
const RING_RADIUS = 36;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

// Pip stays green throughout the journey. His character changes through
// emotion (eye/blush/aura geometry), not through color — explicit user call.
const PIP_COLOR = '#4ade80';

function derivePipEmotion(screen: string, text: string | undefined): PipEmotion {
  if (!text) return 'idle';
  const t = text.toLowerCase();
  if (/creeps|scary|intense|wait|weirdly|chaos|bigger/.test(t)) return 'wideeye';
  if (/yes|!!|actually good|finally|favorite|favourite|amazing/.test(t)) return 'happy';
  if (/just saying|i was here|please|don.?t ruin/.test(t)) return 'shy';
  if (/whatever that means|technically|i think/.test(t)) return 'tilt';
  if (screen === 's10' || screen === 's11') return 'glow';
  return 'happy';
}

function usePipTimerProgress(): number | null {
  const pipTimer = useUIStore((s) => s.pipTimer);
  const [pct, setPct] = useState<number | null>(pipTimer ? 1 : null);

  useEffect(() => {
    if (!pipTimer || !pipTimer.active) {
      setPct(null);
      return;
    }
    let cancelled = false;
    let firedOnce = false;
    let rafId: number | null = null;
    const { durationMs, startedAt } = pipTimer;

    const tick = () => {
      if (cancelled) return;
      const elapsed = Date.now() - startedAt;
      // Clamp to [0, 1] — when startedAt is in the future (intro grace
      // period), elapsed is negative and we want the ring rendered at full.
      const remaining = Math.max(0, Math.min(1, 1 - elapsed / durationMs));
      setPct(remaining);
      if (elapsed >= durationMs) {
        if (!firedOnce) {
          firedOnce = true;
          firePipTimerExpiry();
        }
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    setPct(1);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [pipTimer]);

  return pct;
}

export function PipFloater() {
  const messages = useUIStore((s) => s.messageQueue);
  const currentScreen = useJourneyStore((s) => s.currentScreen);
  const timerPct = usePipTimerProgress();

  if (currentScreen === 's00') return null;

  // Pip starts streaming as soon as a Pip message lands in the queue. Reading
  // order (Cedric first, Pip second) is enforced by *when* screens enqueue
  // their Pip lines — not by a gate. This lets Pip "interrupt" Cedric on the
  // screens where that beat reads better.
  const pipMsg = [...messages].reverse().find((m) => m.speaker === 'pip');
  const pipColor = PIP_COLOR;
  const pipEmotion = derivePipEmotion(currentScreen, pipMsg?.text);
  const showText = !!pipMsg;

  const showRing = timerPct !== null;
  const ringIsLow = showRing && timerPct < 0.25;
  const ringColor = ringIsLow ? '#f59e0b' : pipColor;

  return (
    <div className="pointer-events-none absolute top-2 right-2 z-20 flex items-start justify-end gap-2 max-w-[300px]">
      <div className="flex-1 min-w-0 pt-2">
        <AnimatePresence mode="wait">
          {showText && (
            <motion.div
              key={pipMsg.id}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <PipText text={pipMsg.text} color={pipColor} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div
        className="shrink-0 relative"
        style={{ width: RING_OUTER, height: RING_OUTER }}
      >
        {/* Depleting timer ring — only when timer active */}
        {showRing && (
          <svg
            width={RING_OUTER}
            height={RING_OUTER}
            viewBox={`0 0 ${RING_OUTER} ${RING_OUTER}`}
            className="absolute inset-0 -rotate-90"
          >
            <circle
              cx={RING_OUTER / 2}
              cy={RING_OUTER / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="3"
            />
            <motion.circle
              cx={RING_OUTER / 2}
              cy={RING_OUTER / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="3"
              strokeDasharray={`${timerPct * RING_CIRC} ${RING_CIRC}`}
              strokeLinecap="round"
              animate={ringIsLow ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
              transition={ringIsLow ? { duration: 0.9, repeat: Infinity } : { duration: 0.2 }}
              style={{ filter: `drop-shadow(0 0 6px ${ringColor}88)` }}
            />
          </svg>
        )}
        {/* Sprite — centered inside the ring's bounding box */}
        <div
          className="absolute"
          style={{
            top: (RING_OUTER - SPRITE_SIZE) / 2,
            left: (RING_OUTER - SPRITE_SIZE) / 2,
            width: SPRITE_SIZE,
            height: SPRITE_SIZE,
          }}
        >
          <PipSprite emotion={pipEmotion} color={pipColor} size={SPRITE_SIZE} />
        </div>
      </div>
    </div>
  );
}
