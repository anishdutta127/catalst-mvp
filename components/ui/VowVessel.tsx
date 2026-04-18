'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type VesselKind = 'hourglass' | 'chest' | 'blade';

interface VowVesselProps {
  kind: VesselKind;
  label: string;
  /** Currently being answered — pulses a glow. */
  isActive: boolean;
  /** Has been filled in — shows checkmark badge, locks fill visual. */
  isAnswered: boolean;
  /** 0–1. For hourglass: fraction of sand in bottom bulb. For chalice: how
   *  full the cup. For blade: 1 if inscribed, 0 otherwise. */
  fillLevel?: number;
  /** Primary glow color when active. Default gold. */
  color?: string;
  onClick: () => void;
}

/**
 * VowVessel — a tap target representing one of the Three Vows (Hours / Coin /
 * Edge). Renders a simple SVG vessel (hourglass / chalice / blade), pulses a
 * drop-shadow glow when active, and stamps a gold checkmark top-right when
 * answered. Fill level is driven by the parent so the visual reflects the
 * user's commitment strength.
 */
function VowVesselImpl({
  kind,
  label,
  isActive,
  isAnswered,
  fillLevel = 0,
  color = '#D4A843',
  onClick,
}: VowVesselProps) {
  return (
    <motion.button
      onClick={onClick}
      type="button"
      aria-label={`${label} vow${isAnswered ? ' (answered)' : isActive ? ' (active)' : ''}`}
      whileTap={{ scale: 0.94 }}
      animate={{
        // Gold drop-shadow pulse ONLY when active. Once answered (and not
        // active) it shows a soft static halo. When idle + unanswered it's
        // dim. Calm filter values so the page never feels like it's partying.
        filter: isActive
          ? [
              `drop-shadow(0 0 4px ${color}60)`,
              `drop-shadow(0 0 14px ${color})`,
              `drop-shadow(0 0 4px ${color}60)`,
            ]
          : isAnswered
          ? `drop-shadow(0 0 6px ${color}70)`
          : `drop-shadow(0 0 2px ${color}25)`,
      }}
      transition={{
        duration: isActive ? 2.2 : 0.4,
        repeat: isActive ? Infinity : 0,
        ease: 'easeInOut',
      }}
      className="relative flex flex-col items-center justify-end rounded-xl transition-colors"
      style={{
        width: 96,
        height: 130,
        background: isActive
          ? `rgba(12, 14, 18, 0.55)`
          : 'rgba(12, 14, 18, 0.35)',
        border: isActive
          ? `1px solid ${color}70`
          : isAnswered
          ? `1px solid ${color}45`
          : `1px solid rgba(255,255,255,0.10)`,
      }}
    >
      {/* Vessel SVG — 72×72 square viewBox inside a 96×130 frame */}
      <div style={{ width: 72, height: 72, marginBottom: 4 }}>
        {kind === 'hourglass' && <HourglassSvg fillLevel={fillLevel} color={color} />}
        {kind === 'chest' && <ChestSvg fillLevel={fillLevel} color={color} />}
        {kind === 'blade' && <BladeSvg isAnswered={isAnswered} color={color} />}
      </div>

      {/* Label */}
      <span
        className="text-[10px] font-mono uppercase tracking-[0.22em] mb-2"
        style={{ color: isAnswered || isActive ? color : 'rgba(245,240,232,0.45)' }}
      >
        {label}
      </span>

      {/* Checkmark badge — spring-pops in when the vow is sealed */}
      <AnimatePresence>
        {isAnswered && (
          <motion.span
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold leading-none"
            style={{
              background: color,
              color: '#0C0E12',
              boxShadow: `0 0 8px ${color}80`,
            }}
            aria-hidden
          >
            ✓
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export const VowVessel = memo(VowVesselImpl);

// ─── Vessel SVGs ──────────────────────────────────────────────────────────

interface SvgProps {
  fillLevel: number;
  color: string;
}

function HourglassSvg({ fillLevel, color }: SvgProps) {
  // fillLevel 0→1: sand moves from top bulb into bottom bulb.
  // 72×72 viewBox — bulbs span roughly 14-58 horizontally, 10-62 vertically.
  const topBaseY = 13 + fillLevel * 10;
  const bottomBaseY = 60 - (1 - fillLevel) * 22;
  const bottomInset = (1 - fillLevel) * 16;
  return (
    <svg viewBox="0 0 72 72" width="100%" height="100%">
      {/* Top bulb outline */}
      <path
        d="M14 10 L58 10 L36 34 Z"
        stroke={color}
        strokeWidth="1.5"
        fill="rgba(212,168,67,0.12)"
      />
      {/* Bottom bulb outline */}
      <path
        d="M36 34 L58 62 L14 62 Z"
        stroke={color}
        strokeWidth="1.5"
        fill="rgba(212,168,67,0.12)"
      />
      {/* Sand in top bulb — recedes toward the neck as fill grows */}
      {fillLevel < 1 && (
        <path
          d={`M18 ${topBaseY} L54 ${topBaseY} L36 32 Z`}
          fill="#FCD34D"
          opacity="0.85"
        />
      )}
      {/* Sand in bottom bulb — grows upward as fill rises */}
      {fillLevel > 0 && (
        <path
          d={`M36 34 L${58 - bottomInset} ${bottomBaseY} L${14 + bottomInset} ${bottomBaseY} Z`}
          fill="#FCD34D"
          opacity="0.9"
        />
      )}
      {/* Frame caps (top + bottom horizontal bars) */}
      <line x1="10" y1="10" x2="62" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="10" y1="62" x2="62" y2="62" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ChestSvg({ fillLevel, color }: SvgProps) {
  // Treasure chest — replaces the earlier chalice. Overflowing gold coins
  // appear progressively above the lid as fillLevel rises, signalling
  // "more capital to spend." Bootstrap = empty chest, well-funded =
  // overflowing with coins above the lid.
  return (
    <svg viewBox="0 0 72 72" width="100%" height="100%">
      {/* Chest body */}
      <rect
        x="10"
        y="32"
        width="52"
        height="28"
        rx="3"
        stroke={color}
        strokeWidth="1.5"
        fill="rgba(90,60,24,0.65)"
      />
      {/* Chest lid (domed) */}
      <path
        d="M10 32 L10 26 Q10 14 22 14 L50 14 Q62 14 62 26 L62 32 Z"
        stroke={color}
        strokeWidth="1.5"
        fill="rgba(90,60,24,0.75)"
      />
      {/* Lid seam */}
      <line x1="10" y1="32" x2="62" y2="32" stroke={color} strokeWidth="1" opacity="0.6" />
      {/* Vertical metal bands */}
      <line x1="24" y1="14" x2="24" y2="60" stroke={color} strokeWidth="1.2" opacity="0.7" />
      <line x1="48" y1="14" x2="48" y2="60" stroke={color} strokeWidth="1.2" opacity="0.7" />
      {/* Center lock */}
      <rect
        x="32"
        y="34"
        width="8"
        height="10"
        rx="1"
        stroke={color}
        strokeWidth="1.2"
        fill="rgba(90,60,24,0.9)"
      />
      <circle cx="36" cy="38" r="1.2" fill={color} />

      {/* Inner glow in the chest once there's any fill */}
      {fillLevel >= 0.5 && (
        <rect
          x="12"
          y="36"
          width="48"
          height="20"
          rx="2"
          fill="#FCD34D"
          opacity={0.08 + fillLevel * 0.12}
        />
      )}

      {/* Coin progression above the lid */}
      {fillLevel >= 0.25 && <circle cx="20" cy="20" r="3" fill="#FCD34D" opacity="0.95" />}
      {fillLevel >= 0.5 && (
        <>
          <circle cx="30" cy="16" r="3" fill="#FCD34D" opacity="0.95" />
          <circle cx="52" cy="20" r="3" fill="#FCD34D" opacity="0.95" />
        </>
      )}
      {fillLevel >= 0.75 && (
        <>
          <circle cx="42" cy="14" r="3" fill="#FCD34D" opacity="0.95" />
          <circle cx="25" cy="12" r="2.5" fill="#FCD34D" opacity="0.85" />
          <circle cx="47" cy="11" r="2.5" fill="#FCD34D" opacity="0.85" />
        </>
      )}
      {fillLevel >= 1 && (
        <>
          <circle cx="36" cy="8" r="2.5" fill="#FCD34D" opacity="0.9" />
          <circle cx="18" cy="10" r="2" fill="#FCD34D" opacity="0.8" />
          <circle cx="55" cy="9" r="2" fill="#FCD34D" opacity="0.8" />
        </>
      )}
    </svg>
  );
}

function BladeSvg({ isAnswered, color }: { isAnswered: boolean; color: string }) {
  return (
    <svg viewBox="0 0 72 72" width="100%" height="100%">
      {/* Blade */}
      <path
        d="M36 6 L44 20 L44 50 L36 56 L28 50 L28 20 Z"
        stroke={isAnswered ? '#FCD34D' : color}
        strokeWidth="1.5"
        fill={isAnswered ? 'rgba(252,211,77,0.45)' : 'rgba(212,168,67,0.08)'}
      />
      {/* Center fuller */}
      <line x1="36" y1="8" x2="36" y2="55" stroke={color} strokeWidth="1" opacity="0.6" />
      {/* Crossguard */}
      <rect x="16" y="54" width="40" height="5" rx="2" fill={color} />
      {/* Hilt */}
      <rect x="32" y="59" width="8" height="9" rx="1" fill="#5a3c18" />
      {/* Pommel */}
      <circle cx="36" cy="68" r="3" fill={color} />
      {/* Etched glow when answered */}
      {isAnswered && (
        <path
          d="M36 6 L44 20 L44 50 L36 56 L28 50 L28 20 Z"
          fill="none"
          stroke="#FCD34D"
          strokeWidth="2.5"
          opacity="0.4"
        />
      )}
    </svg>
  );
}
