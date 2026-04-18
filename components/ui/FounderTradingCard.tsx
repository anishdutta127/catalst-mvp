'use client';

import { motion } from 'framer-motion';
import { forwardRef, useMemo } from 'react';
import type { FounderStats } from '@/lib/founder-stats';

interface FounderTradingCardProps {
  /** Display name — capitalized */
  displayName: string;
  /** House object — hex, name, id */
  house: { id: string; name: string; hex: string; tagline: string };
  /** Crystal orb names + colors, in selection order */
  orbs: { name: string; color: string }[];
  /** Crowned idea */
  crownedIdeaName: string | undefined;
  crownedIdeaDomain: string | undefined;
  matchPercent: number;
  /** Pre-computed stats */
  stats: FounderStats;
}

/**
 * FounderTradingCard — 9:16 holographic card, designed to be screenshot-worthy.
 *
 * Composition (top to bottom):
 *   - Holographic border (animated gradient sweep)
 *   - House sigil watermark (big, subtle, in background)
 *   - Tier badge: rarity tier + house name
 *   - Hero match % (huge typography)
 *   - Trait triangle (3 orbs with lines, house sigil in center)
 *   - Trait signature (3-letter code)
 *   - Smart stats grid (rarity, speed, novelty, fit)
 *   - Crowned idea + domain chip
 *   - Founder slug at bottom
 *
 * Rendering uses forwardRef so html-to-image can capture it for download/share.
 */
export const FounderTradingCard = forwardRef<HTMLDivElement, FounderTradingCardProps>(
  function FounderTradingCard(props, ref) {
    const {
      displayName,
      house,
      orbs,
      crownedIdeaName,
      crownedIdeaDomain,
      matchPercent,
      stats,
    } = props;

    const slug = `catalst.app/${house.id.replace(/s$/, '')}/${displayName.toLowerCase().replace(/\s+/g, '')}`;

    // Holographic border — conic-gradient that rotates 8s so the foil
    // reads as a real iridescent sweep, not a left-right pan. Stops cycle
    // through house-hex + two contrast whites so the border shimmers with
    // the user's color while staying legible as "foil".
    const foilGradient = useMemo(() => {
      const hex = house.hex;
      return `conic-gradient(from 0deg,
        ${hex} 0deg,
        #ffffff 45deg,
        ${hex} 90deg,
        #f3e8ff 135deg,
        ${hex} 180deg,
        #ffe4e6 225deg,
        ${hex} 270deg,
        #ffffff 315deg,
        ${hex} 360deg
      )`;
    }, [house.hex]);

    const tierColor: Record<FounderStats['rarity']['tier'], string> = {
      LEGENDARY: '#F59E0B',
      EPIC:      '#A855F7',
      RARE:      '#3B82F6',
      UNCOMMON:  '#10B981',
      COMMON:    '#6B7280',
    };

    const initial = (house.name.match(/of (\w)/)?.[1] || house.name.charAt(0)).toUpperCase();

    return (
      <div
        ref={ref}
        data-testid="founder-trading-card"
        className="relative mx-auto rounded-[28px] overflow-hidden"
        style={{
          width: 340,
          height: 604, // 9:16 ratio
          background: '#0A0B10',
        }}
      >
        {/* ── Holographic border — conic-gradient rotating 8s ──
            The border layer is a rotating conic fill; the inner cutout div
            rides the same rotation mask, leaving the foil visible only on
            the ~3px rim. CSS `conic-gradient` can't be background-animated,
            so we rotate the whole layer — visually identical.  */}
        <motion.div
          className="absolute inset-0 rounded-[28px] pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{
            padding: 3,
            background: foilGradient,
          }}
        />
        {/* Inner cutout sits on top of the rotating rim and hides everything
            except the outer 3px — the rim reads as a shimmering foil edge. */}
        <div
          className="absolute inset-[3px] rounded-[25px] pointer-events-none"
          style={{
            background: `linear-gradient(180deg, #0A0B10 0%, #14171E 30%, #0A0B10 100%)`,
          }}
        />

        {/* ── House sigil watermark in background ── */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none"
          aria-hidden
        >
          <span
            className="font-serif font-black"
            style={{
              fontSize: 520,
              color: house.hex,
              lineHeight: 1,
              marginTop: -40,
            }}
          >
            {initial}
          </span>
        </div>

        {/* ── Subtle grid noise texture ── */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 10%, white 1px, transparent 1.5px),
                              radial-gradient(circle at 75% 40%, white 1px, transparent 1.5px),
                              radial-gradient(circle at 40% 75%, white 1px, transparent 1.5px),
                              radial-gradient(circle at 88% 88%, white 1px, transparent 1.5px)`,
            backgroundSize: '120px 120px',
          }}
        />

        {/* ── Content layer ── */}
        <div className="relative h-full flex flex-col px-5 py-5 text-ivory">
          {/* Top row — tier badge + house */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col items-start gap-1">
              <span
                className="text-[9px] font-mono font-bold tracking-[0.2em] px-2 py-0.5 rounded-full"
                style={{
                  background: `${tierColor[stats.rarity.tier]}20`,
                  border: `1px solid ${tierColor[stats.rarity.tier]}70`,
                  color: tierColor[stats.rarity.tier],
                }}
              >
                {stats.rarity.tier}
              </span>
              <span className="text-[10px] text-ivory/55 uppercase tracking-[0.18em]">
                {house.name.replace('House of ', '')}
              </span>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-[18px] border-2"
              style={{
                color: house.hex,
                borderColor: `${house.hex}80`,
                background: `radial-gradient(circle at 35% 25%, ${house.hex}30, ${house.hex}08)`,
                boxShadow: `0 0 14px ${house.hex}60`,
              }}
            >
              {initial}
            </div>
          </div>

          {/* FOUNDER MATCH label — serif, uppercase, spaced — sits above the
              hero percentage so the stat has a "title" rather than floating
              in isolation. */}
          <p
            className="text-center text-[10px] font-serif font-semibold uppercase tracking-[0.42em] mt-3"
            style={{ color: `${house.hex}CC`, textShadow: `0 0 8px ${house.hex}40` }}
          >
            Founder Match
          </p>

          {/* Hero stat — match % */}
          <div className="flex items-baseline justify-center mt-1 mb-1">
            <span
              className="font-serif font-black leading-none"
              style={{
                fontSize: 96,
                color: house.hex,
                textShadow: `0 0 32px ${house.hex}50`,
                letterSpacing: '-0.04em',
              }}
            >
              {matchPercent}
            </span>
            <span className="text-ivory/60 text-[20px] ml-1.5 font-serif">%</span>
          </div>

          {/* Trait triangle */}
          <div className="my-3 flex justify-center">
            <svg viewBox="0 0 120 100" width="120" height="100" style={{ overflow: 'visible' }}>
              <defs>
                <filter id="tc-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Connecting lines */}
              {orbs.length >= 2 && (
                <line x1="60" y1="15" x2="20" y2="85" stroke={orbs[0].color} strokeWidth="1.2" opacity="0.55" />
              )}
              {orbs.length >= 2 && (
                <line x1="60" y1="15" x2="100" y2="85" stroke={orbs[1].color} strokeWidth="1.2" opacity="0.55" />
              )}
              {orbs.length >= 3 && (
                <line x1="20" y1="85" x2="100" y2="85" stroke={orbs[2].color} strokeWidth="1.2" opacity="0.55" />
              )}

              {/* House sigil in center */}
              <text
                x="60"
                y="58"
                textAnchor="middle"
                fontSize="14"
                fontFamily="serif"
                fontWeight="bold"
                fill={house.hex}
                opacity="0.45"
              >
                {initial}
              </text>

              {/* Orb dots */}
              {orbs[0] && (
                <circle cx="60" cy="15" r="7" fill={orbs[0].color} filter="url(#tc-glow)" />
              )}
              {orbs[1] && (
                <circle cx="20" cy="85" r="7" fill={orbs[1].color} filter="url(#tc-glow)" />
              )}
              {orbs[2] && (
                <circle cx="100" cy="85" r="7" fill={orbs[2].color} filter="url(#tc-glow)" />
              )}
            </svg>
          </div>

          {/* Trait signature */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <div className="h-[1px] flex-1 bg-ivory/10" />
            <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-ivory/70">
              {stats.traitSignature}
            </span>
            <div className="h-[1px] flex-1 bg-ivory/10" />
          </div>

          {/* Smart stats grid — 2x2 */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <StatCell label="Rarity" value={`1/${stats.rarity.pool}`} color={house.hex} />
            <StatCell label="Speed" value={`Top ${100 - stats.responseSpeedRank.percentile}%`} color={house.hex} />
            <StatCell label="Novelty" value={stats.noveltyDecile.label.replace('Top ', 'Top ')} color={house.hex} />
            <StatCell label="Fit" value={stats.industryFitRank.label.split(' match')[0]} color={house.hex} />
          </div>

          {/* Crowned idea */}
          {crownedIdeaName && (
            <div
              className="rounded-xl px-3 py-2 mb-3 border"
              style={{
                background: `linear-gradient(90deg, ${house.hex}15, ${house.hex}05)`,
                borderColor: `${house.hex}35`,
              }}
            >
              <p className="text-[8px] font-mono uppercase tracking-widest text-ivory/40 mb-0.5">
                crowned idea
              </p>
              <p className="text-[13px] font-serif font-bold text-ivory leading-tight">
                {crownedIdeaName}
              </p>
              {crownedIdeaDomain && (
                <p className="text-[10px] text-ivory/55 mt-0.5 leading-tight">
                  in {crownedIdeaDomain.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom — name + slug */}
          <div className="text-center space-y-0.5">
            <p className="text-[18px] font-serif font-bold" style={{ color: '#F5F0E8' }}>
              {displayName}
            </p>
            <p className="text-[9px] font-mono text-ivory/40 tracking-wider">
              {slug}
            </p>
          </div>
        </div>

      </div>
    );
  },
);

// ─ Sub-component ─────────────────────────────────────────────

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-lg px-2 py-1.5"
      style={{
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <p className="text-[8px] font-mono uppercase tracking-wider text-ivory/35">{label}</p>
      <p className="text-[11px] font-serif font-bold leading-tight" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
