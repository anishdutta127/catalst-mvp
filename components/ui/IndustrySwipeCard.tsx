'use client';

import { useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { INDUSTRY_STATS, FALLBACK_STAT } from '@/content/industry-stats';

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
  // New richer back-of-card fields (Batch 2 hinge-data enrichment).
  user_behavior_shift?: string;
  impact_potential?: string;
  india_scene?: string;
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

function formatMarketSize(m: number): string {
  if (m >= 1000) return `$${(m / 1000).toFixed(1)}T`;
  return `$${m}B`;
}

function formatCategory(c: string): string {
  return c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/** Truncate to ~max chars at a word boundary with an ellipsis. */
function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const end = lastSpace > max * 0.7 ? lastSpace : max - 1;
  return cut.slice(0, end).trimEnd() + '…';
}

/**
 * IndustrySwipeCard — S04 swipe card with a bento front and a rich back.
 *
 * Front stack (32/8/flex/10 vertical split):
 *   - HERO (32%)   : emoji 48px, name 24px serif, meta line
 *   - HOOK (8%)    : italicized tagline on dark bg (no label, no border)
 *   - BENTO (flex) : 2-col grid, 3 rows
 *       Row 1 [col-span-2] : TILE A — 💡 OPPORTUNITY (gold-tinted card)
 *       Row 2 [B | C]      : 🔥 TRENDING  |  👀 TO WATCH
 *       Row 3 [col-span-2] : HOTTEST SUB-SPACE — bar + CAGR %
 *   - FOOTER (10%) : "↻  flip for the deeper read"
 *
 * Back — 6 zones:
 *   1. ⚡ AI disruption angle                       (full-width thesis)
 *   2. Top 3 sub-CAGRs                              (full-width, bars)
 *   3. USER BEHAVIOR SHIFT | IMPACT POTENTIAL       (2-col row)
 *   4. 📰 What's happening (recent headline)        (full-width)
 *   5. 🇮🇳 India scene                              (full-width)
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

  const hookText = industry.tagline || industry.cultural_trend || '';

  // TILE A — "TOGETHER WE COULD" prompt text, truncated to ~85 chars.
  const opportunityText = useMemo(() => {
    const bank = industry.hinge_prompts || [];
    if (bank.length === 0) return null;
    const together = bank.find((p) => p.label.toUpperCase() === 'TOGETHER WE COULD');
    const raw = (together || bank[0])?.text || null;
    return raw ? truncateAtWord(raw, 85) : null;
  }, [industry.hinge_prompts]);

  // TILE B + C — curated India company callouts
  const stats = INDUSTRY_STATS[industry.id] || FALLBACK_STAT;

  const topCagrs = useMemo(() => {
    const arr = industry.sub_category_cagrs || [];
    return [...arr].sort((a, b) => b.cagr_pct - a.cagr_pct).slice(0, 3);
  }, [industry.sub_category_cagrs]);
  const topSubCagr = topCagrs[0] || null;

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

  const GOLD_SOLID = '#D4A843';
  const GOLD_70 = 'rgba(212,168,67,0.70)';

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
            {/* ─── HERO — 32% ─── */}
            <div
              className="basis-[32%] shrink-0 relative flex flex-col justify-end px-5 pb-3"
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

            {/* ─── HOOK — 8% (no label, no border) ─── */}
            <div className="basis-[8%] shrink-0 flex items-center px-4">
              {hookText && (
                <p className="text-[14px] italic text-ivory/90 leading-snug line-clamp-1">
                  {hookText}
                </p>
              )}
            </div>

            {/* ─── BENTO GRID — flex-1 ─── */}
            <div className="flex-1 grid grid-cols-2 grid-rows-[auto_minmax(0,1fr)_auto] gap-2 px-4 pb-1 min-h-0 overflow-hidden">
              {/* TILE A — 💡 OPPORTUNITY (gold-tinted, full-width) */}
              {opportunityText && (
                <div
                  className="col-span-2 rounded-xl"
                  style={{
                    background: 'rgba(212,168,67,0.09)',
                    border: '1px solid rgba(212,168,67,0.28)',
                    padding: '10px 12px',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[14px] leading-none">💡</span>
                    <p
                      className="text-[10px] font-mono uppercase font-semibold"
                      style={{ color: GOLD_70, letterSpacing: '0.18em' }}
                    >
                      Opportunity
                    </p>
                  </div>
                  <p className="text-[13px] text-ivory/90 leading-snug font-semibold line-clamp-2">
                    {opportunityText}
                  </p>
                </div>
              )}

              {/* TILE B — 🔥 TRENDING */}
              <div
                className="rounded-xl px-3 py-2 min-w-0"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <p className="text-[10px] font-mono uppercase text-ivory/45 tracking-[0.15em] leading-none">
                  🔥 Trending
                </p>
                <p className="text-[13px] font-semibold text-ivory/95 leading-tight mt-1 truncate">
                  {stats.trending.company}
                </p>
                <p className="text-[10.5px] text-ivory/65 leading-snug mt-1 line-clamp-2">
                  {stats.trending.stat}
                </p>
              </div>

              {/* TILE C — 👀 TO WATCH */}
              <div
                className="rounded-xl px-3 py-2 min-w-0"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <p className="text-[10px] font-mono uppercase text-ivory/45 tracking-[0.15em] leading-none">
                  👀 To Watch
                </p>
                <p className="text-[13px] font-semibold text-ivory/95 leading-tight mt-1 truncate">
                  {stats.watch.company}
                </p>
                <p className="text-[10.5px] text-ivory/65 leading-snug mt-1 line-clamp-2">
                  {stats.watch.why}
                </p>
              </div>

              {/* TILE D — HOTTEST SUB-SPACE (label + name+CAGR row + 2px bar) */}
              {topSubCagr && (
                <div
                  className="col-span-2 rounded-xl px-3 py-2 min-w-0"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <p className="text-[10px] font-mono uppercase text-ivory/45 tracking-[0.15em] leading-none mb-1">
                    Hottest Sub-Space
                  </p>
                  <div className="flex items-baseline justify-between mb-1.5 gap-2">
                    <span className="text-[12px] text-ivory/90 font-medium truncate">
                      {topSubCagr.name}
                    </span>
                    <span
                      className="text-[11px] font-mono font-bold shrink-0"
                      style={{ color: GOLD_SOLID }}
                    >
                      {topSubCagr.cagr_pct}% CAGR
                    </span>
                  </div>
                  <div className="h-[2px] w-full bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, topSubCagr.cagr_pct * 1.5)}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ─── FOOTER / HINT — 10% ─── */}
            <div className="basis-[10%] shrink-0 flex items-center justify-center">
              <p className="text-[10px] italic text-ivory/35 tracking-wide">
                ↻  flip for the deeper read
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

            {/* 6-zone body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
              {/* 1. AI disruption angle — full */}
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

              {/* 2. Hottest sub-categories — full */}
              {topCagrs.length > 0 && (
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2 font-semibold">
                    Hottest sub-categories
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

              {/* 3. Behavior shift + Impact potential — 2-col row */}
              {(industry.user_behavior_shift || industry.impact_potential) && (
                <div className="grid grid-cols-2 gap-2">
                  {industry.user_behavior_shift && (
                    <div className="bg-white/4 border border-white/8 rounded-xl p-3">
                      <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1.5 font-semibold">
                        User behavior
                      </p>
                      <p className="text-[11.5px] text-white/80 leading-snug">
                        {industry.user_behavior_shift}
                      </p>
                    </div>
                  )}
                  {industry.impact_potential && (
                    <div className="bg-white/4 border border-white/8 rounded-xl p-3">
                      <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1.5 font-semibold">
                        Impact ceiling
                      </p>
                      <p className="text-[11.5px] text-white/80 leading-snug">
                        {industry.impact_potential}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 4. What's happening — full */}
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

              {/* 5. India scene — full */}
              {industry.india_scene && (
                <div className="bg-white/4 border border-white/8 rounded-xl p-3">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1.5 font-semibold flex items-center gap-1.5">
                    <span>🇮🇳</span>
                    India scene
                  </p>
                  <p className="text-[12px] text-white/85 leading-snug">
                    {industry.india_scene}
                  </p>
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
