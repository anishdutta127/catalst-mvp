'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type VesselKind = 'hourglass' | 'chalice' | 'blade';

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
        width: 92,
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
      {/* Vessel SVG — sized 60×90 inside a 92×130 frame, centered */}
      <div style={{ width: 60, height: 90, marginBottom: 4 }}>
        {kind === 'hourglass' && <HourglassSvg fillLevel={fillLevel} color={color} />}
        {kind === 'chalice' && <ChaliceSvg fillLevel={fillLevel} color={color} />}
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
  // Top triangle shrinks upward as sand drains; bottom triangle grows upward.
  const topBaseY = 12 + fillLevel * 12; // top of top-bulb sand drops as fill grows? actually:
  // We model: top bulb has sand that shrinks (base rises / tip shifts)
  // Top sand triangle: (14-fl*4, 12+fl*12) → (46+fl*4, 12+fl*12) → (30, 38)
  // As fillLevel increases, the two base corners move inward horizontally
  // (sand is draining) and downward vertically — so the triangle gets smaller.
  return (
    <svg viewBox="0 0 60 90" width="100%" height="100%">
      {/* Top bulb (empty outline) */}
      <path
        d="M10 8 L50 8 L30 42 Z"
        stroke={color}
        strokeWidth="1.5"
        fill="rgba(212,168,67,0.12)"
      />
      {/* Bottom bulb */}
      <path
        d="M30 42 L50 82 L10 82 Z"
        stroke={color}
        strokeWidth="1.5"
        fill="rgba(212,168,67,0.12)"
      />
      {/* Sand in top bulb — shrinks as fill increases */}
      {fillLevel < 1 && (
        <path
          d={`M${14 - fillLevel * 4} ${topBaseY} L${46 + fillLevel * 4} ${topBaseY} L30 38 Z`}
          fill="#FCD34D"
          opacity="0.85"
        />
      )}
      {/* Sand in bottom bulb — grows as fill increases */}
      {fillLevel > 0 && (
        <path
          d={`M30 42 L${50 - (1 - fillLevel) * 14} ${78 - (1 - fillLevel) * 22} L${
            10 + (1 - fillLevel) * 14
          } ${78 - (1 - fillLevel) * 22} Z`}
          fill="#FCD34D"
          opacity="0.9"
        />
      )}
      {/* Frame tops/bottoms */}
      <line x1="6" y1="8" x2="54" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line
        x1="6"
        y1="82"
        x2="54"
        y2="82"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChaliceSvg({ fillLevel, color }: SvgProps) {
  // Cup interior fills from bottom up. fillLevel 0 = empty cup, 1 = brimming.
  const topY = 50 - fillLevel * 28;
  const leftX = 16 - fillLevel * 4;
  const rightX = 44 + fillLevel * 4;

  return (
    <svg viewBox="0 0 60 90" width="100%" height="100%">
      {/* Cup — outer outline */}
      <path
        d="M10 10 Q10 45 30 50 Q50 45 50 10 Z"
        stroke={color}
        strokeWidth="1.5"
        fill="rgba(212,168,67,0.10)"
      />
      {/* Liquid — shape fills from bottom of cup upward */}
      {fillLevel > 0 && (
        <path
          d={`M${leftX} ${topY} Q30 ${topY + 2} ${rightX} ${topY} Q50 45 50 10 L10 10 Q10 45 ${leftX} ${topY} Z`}
          fill="#FCD34D"
          opacity="0.65"
        />
      )}
      {/* Stem */}
      <line x1="30" y1="50" x2="30" y2="72" stroke={color} strokeWidth="2.5" />
      {/* Base */}
      <ellipse
        cx="30"
        cy="76"
        rx="16"
        ry="4"
        stroke={color}
        strokeWidth="1.5"
        fill="rgba(212,168,67,0.12)"
      />
      {/* Three coin dots rising above the rim when well-funded */}
      {fillLevel >= 0.75 && (
        <g>
          <circle cx="24" cy="22" r="2.5" fill="#FCD34D" />
          <circle cx="32" cy="18" r="2.5" fill="#FCD34D" />
          <circle cx="38" cy="24" r="2.5" fill="#FCD34D" />
        </g>
      )}
    </svg>
  );
}

function BladeSvg({ isAnswered, color }: { isAnswered: boolean; color: string }) {
  return (
    <svg viewBox="0 0 60 90" width="100%" height="100%">
      {/* Blade */}
      <path
        d="M30 6 L36 20 L36 62 L30 68 L24 62 L24 20 Z"
        stroke={isAnswered ? '#FCD34D' : color}
        strokeWidth="1.5"
        fill={isAnswered ? 'rgba(252,211,77,0.45)' : 'rgba(212,168,67,0.08)'}
      />
      {/* Center fuller */}
      <line x1="30" y1="6" x2="30" y2="68" stroke={color} strokeWidth="1" opacity="0.6" />
      {/* Crossguard */}
      <rect x="12" y="66" width="36" height="4" rx="2" fill={color} />
      {/* Hilt */}
      <rect x="26" y="70" width="8" height="14" rx="1" fill="#5a3c18" />
      {/* Pommel */}
      <circle cx="30" cy="86" r="3.5" fill={color} />
    </svg>
  );
}
