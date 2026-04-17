'use client';

import { useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface HingePrompt {
  label: string;
  text: string;
}

interface SubCagr {
  name: string;
  cagr_pct: number;
}

export interface IndustryCardData {
  id: string;
  name: string;
  emoji: string;
  icon?: string;
  category?: string;
  color_primary?: string;
  color_secondary?: string;
  tagline?: string;
  market_size_b?: number;
  cagr_pct?: number;
  hinge_prompts?: HingePrompt[];
  why_now?: string;
  ai_disruption_angle?: string;
  cultural_trend?: string;
  recent_headline?: string;
  investor_sentiment_short?: string;
  investor_sentiment?: string;
  sub_category_cagrs?: SubCagr[];
  india_leaders?: string[];
  example_startups_india?: string[];
  trending_global?: string[];
  trending_startups?: string[];
}

interface IndustrySwipeCardProps {
  industry: IndustryCardData;
  onPass: () => void;
  onKeep: () => void;
  onEdge: () => void;
  edgeAvailable: boolean;
  edgesUsed: number;
  cardKey: string | number;
}

type RaceChip = { name: string; isIndia: boolean };
type RaceBlock = { chips: RaceChip[] };
type FallbackStat = { leadLabel: string; value: string; unit: string; name: string };

function formatMarketSize(m: number): string {
  if (m >= 1000) return `$${(m / 1000).toFixed(1)}T`;
  return `$${m}B`;
}

function formatCategory(c: string): string {
  return c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * IndustrySwipeCard — S04 swipe card, rewritten as a conviction-bet sheet.
 *
 * Front stack (36/14/19/16/15 vertical split):
 *   - HERO (36%)    : emoji 48px, name 24px serif, meta line
 *                     ("$200B · 36% CAGR · TECH").
 *   - THE PULL (14%): label + the industry tagline. No card — just a
 *                     conviction line on the dark background.
 *   - THE OPENING (19%): gold left-border card. Surfaces the
 *                     "TOGETHER WE COULD" hinge prompt as the bet.
 *   - WHO'S IN THE RACE (16%): chip row — 4 global + 1 🇮🇳 India leader.
 *   - FLIP HINT (15%): "↻  flip for the full read".
 *
 * Back — 4 sections only:
 *   - ⚡ AI disruption angle
 *   - Top 3 sub-CAGRs (with bars)
 *   - 📰 What's happening (recent headline)
 *   - 🇮🇳 India leaders (up to 6 chips)
 *
 * Gestures: drag left = Pass, right = Keep, up = Edge. Tap = flip.
 */
export function IndustrySwipeCard({
  industry,
  onPass,
  onKeep,
  onEdge,
  edgeAvailable,
  cardKey,
}: IndustrySwipeCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const passOpacity = useTransform(x, [-120, -40], [1, 0]);
  const keepOpacity = useTransform(x, [40, 120], [0, 1]);
  const edgeOpacity = useTransform(y, [-120, -40], [1, 0]);

  const color = industry.color_primary || '#D4A843';
  const colorDark = industry.color_secondary || '#78350F';
  const emoji = industry.emoji || industry.icon || '🌐';

  const metaLine = useMemo(() => {
    const parts: string[] = [];
    if (industry.market_size_b) parts.push(formatMarketSize(industry.market_size_b));
    if (industry.cagr_pct) parts.push(`${industry.cagr_pct}% CAGR`);
    if (industry.category) parts.push(formatCategory(industry.category));
    return parts.join(' · ');
  }, [industry.market_size_b, industry.cagr_pct, industry.category]);

  // THE PULL — prefer tagline, fall back to cultural_trend.
  const pullText = industry.tagline || industry.cultural_trend || '';

  // THE OPENING — the "TOGETHER WE COULD" prompt. Fallback: first prompt.
  const openingText = useMemo(() => {
    const bank = industry.hinge_prompts || [];
    if (bank.length === 0) return null;
    const together = bank.find((p) => p.label.toUpperCase() === 'TOGETHER WE COULD');
    return (together || bank[0])?.text || null;
  }, [industry.hinge_prompts]);

  const topCagrs = useMemo(() => {
    const arr = industry.sub_category_cagrs || [];
    return [...arr].sort((a, b) => b.cagr_pct - a.cagr_pct).slice(0, 3);
  }, [industry.sub_category_cagrs]);

  // WHO'S IN THE RACE — global-primary + 1 India leader blended as last chip.
  // Falls back cleanly when data is thin.
  const { raceBlock, fallbackStat } = useMemo(() => {
    const global = industry.trending_global || [];
    const india = industry.india_leaders || industry.example_startups_india || [];
    const other = industry.trending_startups || [];

    if (global.length >= 2) {
      const take = india.length > 0 ? 4 : 5;
      const chips: RaceChip[] = global.slice(0, take).map((n) => ({ name: n, isIndia: false }));
      if (india.length > 0) chips.push({ name: india[0], isIndia: true });
      return { raceBlock: { chips } as RaceBlock, fallbackStat: null };
    }
    if (india.length >= 2) {
      return {
        raceBlock: { chips: india.slice(0, 5).map((n) => ({ name: n, isIndia: true })) } as RaceBlock,
        fallbackStat: null,
      };
    }
    if (other.length >= 2) {
      return {
        raceBlock: { chips: other.slice(0, 5).map((n) => ({ name: n, isIndia: false })) } as RaceBlock,
        fallbackStat: null,
      };
    }
    const top = topCagrs[0];
    if (top) {
      return {
        raceBlock: null,
        fallbackStat: {
          leadLabel: 'Fastest-growing slice',
          value: `${top.cagr_pct}`,
          unit: '% CAGR',
          name: top.name,
        } as FallbackStat,
      };
    }
    return { raceBlock: null, fallbackStat: null };
  }, [industry.trending_global, industry.india_leaders, industry.example_startups_india, industry.trending_startups, topCagrs]);

  const indiaLeaders = (industry.india_leaders || industry.example_startups_india || []).slice(0, 6);

  function handleDragEnd(_: unknown, info: { offset: { x: number; y: number } }) {
    const { x: dx, y: dy } = info.offset;
    const SWIPE_THRESHOLD = 100;
    if (dx < -SWIPE_THRESHOLD) {
      setExitDirection('left');
      setTimeout(onPass, 200);
    } else if (dx > SWIPE_THRESHOLD) {
      setExitDirection('right');
      setTimeout(onKeep, 200);
    } else if (dy < -SWIPE_THRESHOLD && edgeAvailable) {
      setExitDirection('up');
      setTimeout(onEdge, 200);
    } else {
      x.set(0);
      y.set(0);
    }
  }

  const exitAnim = exitDirection
    ? {
        left: { x: -500, opacity: 0, rotate: -25 },
        right: { x: 500, opacity: 0, rotate: 25 },
        up: { y: -500, opacity: 0, scale: 0.9 },
      }[exitDirection]
    : undefined;

  // Gold tints for labels
  const GOLD_SOLID = '#D4A843';
  const GOLD_TINT = 'rgba(212,168,67,0.56)'; // #D4A84390 equivalent

  return (
    <motion.div
      key={cardKey}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, touchAction: 'none' }}
      initial={{ opacity: 0, scale: 0.92, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={exitAnim}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      onTap={() => setFlipped((f) => !f)}
    >
      {/* Drag overlays */}
      <motion.div style={{ opacity: passOpacity }} className="absolute top-5 left-5 z-20 pointer-events-none">
        <div className="text-red-500 border-4 border-red-500 rounded-xl px-4 py-2 text-xl font-black tracking-widest rotate-[-12deg]">
          PASS
        </div>
      </motion.div>
      <motion.div style={{ opacity: keepOpacity }} className="absolute top-5 right-5 z-20 pointer-events-none">
        <div className="text-green-500 border-4 border-green-500 rounded-xl px-4 py-2 text-xl font-black tracking-widest rotate-[12deg]">
          KEEP
        </div>
      </motion.div>
      <motion.div style={{ opacity: edgeOpacity }} className="absolute top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="text-gold border-4 border-gold rounded-xl px-4 py-2 text-xl font-black tracking-widest">
          ★ EDGE
        </div>
      </motion.div>

      {/* Flipper */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ perspective: '1600px' }}>
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* ═══════════════ FRONT ═══════════════ */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: '#0C0E12',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              boxShadow: `0 14px 44px -10px ${color}80, 0 0 0 1px ${color}30`,
            }}
          >
            {/* HERO — 36% */}
            <div
              className="basis-[36%] shrink-0 relative flex flex-col justify-end px-5 pb-3"
              style={{
                background: `linear-gradient(160deg, ${color} 0%, ${colorDark} 65%, #0C0E12 100%)`,
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 10%, white 1px, transparent 1px),
                                    radial-gradient(circle at 80% 30%, white 1px, transparent 1px),
                                    radial-gradient(circle at 50% 70%, white 1px, transparent 1px)`,
                  backgroundSize: '90px 90px',
                }}
              />
              <div className="relative">
                <div className="text-[48px] leading-none select-none mb-1" aria-hidden>
                  {emoji}
                </div>
                <h2 className="text-[24px] font-serif font-bold text-white leading-[1.05]">
                  {industry.name}
                </h2>
                {metaLine && (
                  <p className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-white/65 mt-1">
                    {metaLine}
                  </p>
                )}
              </div>
            </div>

            {/* THE PULL — 14% (label + tagline, no container) */}
            <div className="basis-[14%] shrink-0 flex flex-col justify-center px-5">
              {pullText && (
                <>
                  <p
                    className="text-[9px] font-mono uppercase font-semibold mb-1"
                    style={{ color: GOLD_TINT, letterSpacing: '0.2em' }}
                  >
                    The Pull
                  </p>
                  <p className="text-[15px] italic text-ivory/90 leading-[1.3]">
                    {pullText}
                  </p>
                </>
              )}
            </div>

            {/* THE OPENING — 19% (gold-accent card with the conviction bet) */}
            <div className="basis-[19%] shrink-0 flex items-center px-5">
              {openingText && (
                <div
                  className="w-full rounded-[10px]"
                  style={{
                    background: 'rgba(212,168,67,0.08)',
                    borderLeft: '2px solid rgba(212,168,67,0.5)',
                    padding: '10px 12px',
                  }}
                >
                  <p
                    className="text-[9px] font-mono uppercase font-semibold mb-1"
                    style={{ color: GOLD_SOLID, letterSpacing: '0.2em' }}
                  >
                    The Opening
                  </p>
                  <p className="text-[13px] text-ivory/85 leading-snug">{openingText}</p>
                </div>
              )}
            </div>

            {/* WHO'S IN THE RACE — 16% (chip row or stat fallback) */}
            <div className="basis-[16%] shrink-0 flex flex-col justify-center px-5">
              {raceBlock ? (
                <>
                  <p
                    className="text-[9px] font-mono uppercase font-semibold mb-1.5"
                    style={{ color: GOLD_TINT, letterSpacing: '0.2em' }}
                  >
                    Who's in the Race
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {raceBlock.chips.map((chip) => (
                      <span
                        key={chip.name}
                        className="text-[11px] px-2.5 py-0.5 rounded-full text-white/90 border inline-flex items-center gap-1"
                        style={{
                          background: `${color}22`,
                          borderColor: `${color}55`,
                        }}
                      >
                        {chip.isIndia && <span className="text-[10px] leading-none">🇮🇳</span>}
                        {chip.name}
                      </span>
                    ))}
                  </div>
                </>
              ) : fallbackStat ? (
                <>
                  <p
                    className="text-[9px] font-mono uppercase font-semibold mb-1"
                    style={{ color: GOLD_TINT, letterSpacing: '0.2em' }}
                  >
                    🚀 {fallbackStat.leadLabel}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[22px] font-bold leading-none" style={{ color }}>
                      {fallbackStat.value}
                    </span>
                    <span className="text-[12px] text-white/75">{fallbackStat.unit}</span>
                    <span className="text-[11px] text-white/40">·</span>
                    <span className="text-[12px] text-white/70 truncate">{fallbackStat.name}</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* FLIP HINT — 15% */}
            <div className="basis-[15%] shrink-0 flex items-center justify-center">
              <p className="text-[10px] italic text-ivory/35 tracking-wide">
                ↻  flip for the full read
              </p>
            </div>
          </div>

          {/* ═══════════════ BACK ═══════════════ */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(180deg, #14171E 0%, #0C0E12 100%)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              boxShadow: `0 14px 44px -10px ${color}80, 0 0 0 1px ${color}30`,
            }}
          >
            {/* Header strip */}
            <div className="shrink-0 px-5 pt-4 pb-3 flex items-center gap-3 border-b border-white/5">
              <div className="text-[28px] leading-none">{emoji}</div>
              <div>
                <h3 className="text-[18px] font-serif font-bold text-white leading-tight">
                  {industry.name}
                </h3>
                <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
                  the deep read
                </p>
              </div>
            </div>

            {/* 4 zones only */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
              {/* 1. AI disruption angle */}
              {industry.ai_disruption_angle && (
                <div className="bg-purple-500/10 border border-purple-500/25 rounded-xl p-3 flex items-start gap-2">
                  <span className="text-[15px] mt-0.5">⚡</span>
                  <div className="min-w-0">
                    <p className="text-[9px] text-purple-300 uppercase tracking-widest mb-1 font-semibold">
                      AI disruption angle
                    </p>
                    <p className="text-[12px] text-white/85 leading-relaxed">
                      {industry.ai_disruption_angle}
                    </p>
                  </div>
                </div>
              )}

              {/* 2. Top sub-CAGRs */}
              {topCagrs.length > 0 && (
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2 font-semibold">
                    Top sub-categories
                  </p>
                  <div className="space-y-1.5">
                    {topCagrs.map((sc) => (
                      <div key={sc.name} className="flex items-center gap-2">
                        <span className="text-[11px] text-white/75 flex-1 truncate">{sc.name}</span>
                        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, sc.cagr_pct * 1.5)}%`,
                              background: color,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-mono w-9 text-right" style={{ color }}>
                          {sc.cagr_pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. What's happening — recent headline */}
              {industry.recent_headline && (
                <div className="bg-white/4 border border-white/8 rounded-xl p-3">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1.5 font-semibold">
                    What's happening
                  </p>
                  <p className="text-[12px] text-white/85 leading-snug flex items-start gap-1.5">
                    <span className="shrink-0">📰</span>
                    <span>{industry.recent_headline}</span>
                  </p>
                </div>
              )}

              {/* 4. India leaders */}
              {indiaLeaders.length > 0 && (
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2 font-semibold flex items-center gap-1.5">
                    <span>🇮🇳</span>
                    India leaders
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {indiaLeaders.map((name) => (
                      <span
                        key={name}
                        className="text-[11px] px-2.5 py-1 rounded-full text-white/90 border"
                        style={{ background: `${color}22`, borderColor: `${color}55` }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-2 border-t border-white/5">
              <p className="text-[10px] text-ivory/55 italic">← back to pitch</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
