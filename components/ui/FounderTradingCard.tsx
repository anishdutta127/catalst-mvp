'use client';

/**
 * components/ui/FounderTradingCard.tsx
 * ────────────────────────────────────
 * The S11 share artifact — a 9:16 portrait card designed to be screenshotted
 * and posted. Every row answers: "why would I share this?"
 *
 * Composition (top to bottom):
 *   Row 1 — tier badge + house crest
 *   Row 2 — first name + archetype label
 *   Row 3 — pull quote
 *   Row 4 — 6-axis radar chart
 *   Row 5 — 3-stat pill row (rarity, sealed-in, match %)
 *   Row 6 — founder twin (expanded) + Indian twin note
 *   Row 7 — signature move + kryptonite (the quirky texture)
 *   Row 8 — crowned idea
 *   Row 9 — #CATALSTCHALLENGE badge + catalst.app/slug footer
 *
 * Holographic border: conic-gradient rotating 8s (same pattern as prior
 * batch). Reduced white stops from 55 → 33 alpha so the foil is less loud.
 *
 * The card is rendered with forwardRef so html-to-image can capture it for
 * download/share.
 */

import { forwardRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, type RadarScores } from './RadarChart';
import { FounderTwinCard } from './FounderTwinCard';
import type { Archetype } from '@/lib/archetypes';

export type CardRarityTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';

export interface FounderTradingCardProps {
  /** Display name — first-name-only rendered on the card. */
  displayName: string;
  /** House object — hex, name, id, slug. */
  house: { id: string; name: string; hex: string };
  /** The matched archetype for this user (house × dominant essence). */
  archetype: Archetype;
  /** 6-axis trait scores 0–100. */
  traitScores: RadarScores;
  /** Rarity band for the top-right pill ("LEGENDARY" etc.). */
  rarityTier: CardRarityTier;
  /** Rarity display: "Top 5%" → displayed on the stats pill. */
  rarityPct: number;
  /** Formatted journey time (e.g. "4:32"). */
  journeyTime: string;
  /** Crowned-idea match percentage (0–100). */
  matchPercent: number;
  /** Crowned idea title + its industry tag. */
  crownedIdea: { title: string; industry: string } | null;
}

// Compact rarity tier color map — used for the top-right pill only.
const TIER_COLOR: Record<CardRarityTier, string> = {
  LEGENDARY: '#F59E0B',
  RARE:      '#A855F7',
  UNCOMMON:  '#10B981',
  COMMON:    '#6B7280',
};

export const FounderTradingCard = forwardRef<HTMLDivElement, FounderTradingCardProps>(
  function FounderTradingCard(props, ref) {
    const {
      displayName,
      house,
      archetype,
      traitScores,
      rarityTier,
      rarityPct,
      journeyTime,
      matchPercent,
      crownedIdea,
    } = props;

    const firstName = (displayName || 'Founder').split(' ')[0];
    const houseSlug = house.id.replace(/s$/, '');
    const urlSlug = `catalst.app/${houseSlug}/${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    const initial = (house.name.match(/of (\w)/)?.[1] || house.name.charAt(0)).toUpperCase();

    // Indian-twin surname — the "and X in India" tail line.
    const indianLast = archetype.twinIndian.name.split(' ').slice(-1)[0];

    // Holographic foil — house-tinted conic gradient, rotating.
    const foilGradient = useMemo(() => {
      const hex = house.hex;
      return `conic-gradient(from 0deg,
        ${hex} 0deg,
        #ffffff55 45deg,
        ${hex} 90deg,
        #f3e8ff55 135deg,
        ${hex} 180deg,
        #ffe4e655 225deg,
        ${hex} 270deg,
        #ffffff55 315deg,
        ${hex} 360deg
      )`;
    }, [house.hex]);

    return (
      <div
        ref={ref}
        data-testid="founder-trading-card"
        className="relative mx-auto rounded-[28px] overflow-hidden"
        style={{
          width: 340,
          aspectRatio: '9 / 16',
          background: '#0A0B10',
        }}
      >
        {/* Holographic border — rotating conic. */}
        <motion.div
          className="absolute inset-0 rounded-[28px] pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ padding: 2, background: foilGradient }}
        />
        <div
          className="absolute inset-[2px] rounded-[26px] pointer-events-none"
          style={{
            background: `linear-gradient(180deg, #0A0B10 0%, #14171E 35%, #0A0B10 100%)`,
          }}
        />

        {/* House sigil watermark — giant faded initial behind content. */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none"
          aria-hidden
        >
          <span
            className="font-serif font-black"
            style={{
              fontSize: 480,
              color: house.hex,
              lineHeight: 1,
              marginTop: -30,
            }}
          >
            {initial}
          </span>
        </div>

        {/* Noise texture — subtle grid of dots. */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 10%, white 1px, transparent 1.5px),
                              radial-gradient(circle at 75% 40%, white 1px, transparent 1.5px),
                              radial-gradient(circle at 40% 75%, white 1px, transparent 1.5px),
                              radial-gradient(circle at 88% 88%, white 1px, transparent 1.5px)`,
            backgroundSize: '120px 120px',
          }}
        />

        {/* Content — densely packed into the 9:16 frame. */}
        <div className="relative h-full flex flex-col px-5 py-5 text-ivory overflow-hidden">
          {/* Row 1 — house crest + name · tier pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-serif font-bold text-[13px] border"
                style={{
                  color: house.hex,
                  borderColor: `${house.hex}80`,
                  background: `radial-gradient(circle at 35% 25%, ${house.hex}35, ${house.hex}08)`,
                  boxShadow: `0 0 10px ${house.hex}55`,
                }}
                aria-hidden
              >
                {initial}
              </div>
              <span className="text-[10px] tracking-[0.25em] text-ivory/75 uppercase">
                {house.name.toUpperCase()}
              </span>
            </div>
            <span
              className="text-[10px] tracking-[0.25em] px-2 py-1 rounded-full border font-mono font-bold"
              style={{
                borderColor: `${TIER_COLOR[rarityTier]}70`,
                color: TIER_COLOR[rarityTier],
                background: `${TIER_COLOR[rarityTier]}18`,
              }}
            >
              {rarityTier}
            </span>
          </div>

          {/* Row 2 — first name + archetype */}
          <div className="mt-4">
            <h1
              className="font-serif font-bold leading-none"
              style={{ fontSize: 32, color: '#F5F0E8' }}
            >
              {firstName}
            </h1>
            <h2
              className="font-serif italic text-[17px] mt-1"
              style={{
                color: house.hex,
                textShadow: `0 0 14px ${house.hex}50`,
              }}
            >
              {archetype.name}
            </h2>
          </div>

          {/* Row 3 — pull quote */}
          <blockquote
            className="mt-3 text-[12.5px] leading-relaxed italic text-ivory/85 border-l-2 pl-3"
            style={{ borderColor: house.hex }}
          >
            &ldquo;{archetype.pullQuote}&rdquo;
          </blockquote>

          {/* Row 4 — radar chart, centered */}
          <div className="my-4 flex justify-center">
            <RadarChart scores={traitScores} color={house.hex} size={200} />
          </div>

          {/* Row 5 — 3-stat pill row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <StatPill label="RARITY" value={`Top ${rarityPct}%`} color={house.hex} />
            <StatPill label="SEALED IN" value={journeyTime} color={house.hex} />
            <StatPill label="MATCH" value={`${matchPercent}%`} color={house.hex} />
          </div>

          {/* Row 6 — founder twin (expanded) */}
          <div className="mt-4">
            <div className="text-[10px] tracking-[0.25em] text-ivory/60 mb-1.5">
              YOUR FOUNDER TWIN
            </div>
            <FounderTwinCard twin={archetype.twinGlobal} color={house.hex} />
            <div className="text-[10px] text-ivory/55 mt-1.5 text-center">
              · and {indianLast} in India
            </div>
          </div>

          {/* Row 7 — signature move + kryptonite */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-[11.5px]">
            <div>
              <div className="text-[9px] tracking-[0.2em] text-ivory/55 mb-1">
                SIGNATURE MOVE
              </div>
              <div className="text-ivory/90 italic leading-snug">
                {archetype.signatureMove}
              </div>
            </div>
            <div>
              <div className="text-[9px] tracking-[0.2em] text-ivory/55 mb-1">
                KRYPTONITE
              </div>
              <div className="text-ivory/90 italic leading-snug">
                {archetype.kryptonite}
              </div>
            </div>
          </div>

          {/* Row 8 — crowned idea */}
          {crownedIdea && (
            <div
              className="mt-4 rounded-xl border border-white/10 p-3"
              style={{
                background: `linear-gradient(90deg, ${house.hex}12, ${house.hex}04)`,
              }}
            >
              <div className="text-[9px] tracking-[0.2em] text-ivory/55">
                CROWNED IDEA
              </div>
              <div className="font-serif font-bold text-[15px] leading-tight mt-1 text-ivory">
                {crownedIdea.title}
              </div>
              <div className="text-[11px] text-ivory/70 mt-0.5">
                in {crownedIdea.industry}
              </div>
            </div>
          )}

          {/* Row 9 — spacer-flex pushes footer to the bottom. */}
          <div className="flex-1" />

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px]">
            <span
              className="tracking-[0.25em] font-mono"
              style={{ color: `${house.hex}C0` }}
            >
              #CATALSTCHALLENGE
            </span>
            <span className="font-mono text-ivory/60 truncate ml-2">{urlSlug}</span>
          </div>
        </div>
      </div>
    );
  },
);

// ─── Sub-components ──────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl py-2 px-1 bg-white/5 border border-white/10 backdrop-blur-sm"
      style={{
        boxShadow: `inset 0 0 0 1px ${color}10`,
      }}
    >
      <div className="text-[9px] tracking-[0.18em] text-ivory/55 font-mono">{label}</div>
      <div
        className="text-[13px] font-bold mt-1 leading-tight"
        style={{ color, textShadow: `0 0 8px ${color}40` }}
      >
        {value}
      </div>
    </div>
  );
}

