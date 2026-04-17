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

type TrendingChip = { name: string; isIndia: boolean };
type TrendingBlock = { chips: TrendingChip[]; label: string; icon: string };
type FallbackStat = { leadLabel: string; value: string; unit: string; name: string };

function formatMarketSize(m: number): string {
  if (m >= 1000) return `$${(m / 1000).toFixed(1)}T`;
  return `$${m}B`;
}

function formatCategory(c: string): string {
  return c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * IndustrySwipeCard — Hinge-style swipe card for S04.
 *
 * Front (40/22/23/15 vertical split):
 *   - Hero (40%)  : color gradient, emoji 56px, name 28px serif, meta line.
 *   - Prompt (22%): ONE Hinge prompt — slightly larger type than before,
 *                   since it's alone.
 *   - Data (23%)  : trending-companies chip row (global-primary + one 🇮🇳
 *                   India leader blended in) OR fallback "fastest-growing
 *                   slice" stat if no trending data.
 *   - Hint (15%)  : "tap for the deep read →".
 *
 * Back:
 *   - Header (emoji + name + "the deep read")
 *   - 2nd Hinge prompt as left-border accent intro
 *   - Why now
 *   - ⚡ AI disruption angle
 *   - Top 3 sub-CAGRs
 *   - What's happening (📰 headline + 🌿 cultural trend + opposite chip row)
 *   - Footer "← back to pitch"
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

  // Meta line: "$200B · 36% CAGR · Tech"
  const metaLine = useMemo(() => {
    const parts: string[] = [];
    if (industry.market_size_b) parts.push(formatMarketSize(industry.market_size_b));
    if (industry.cagr_pct) parts.push(`${industry.cagr_pct}% CAGR`);
    if (industry.category) parts.push(formatCategory(industry.category));
    return parts.join(' · ');
  }, [industry.market_size_b, industry.cagr_pct, industry.category]);

  // 2 prompts per card — front gets the first, back gets the second.
  const [frontPrompt, backPrompt] = useMemo(() => {
    const bank = industry.hinge_prompts || [];
    if (bank.length === 0) return [null, null];
    if (bank.length === 1) return [bank[0], null];
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }, [industry.id, industry.hinge_prompts]);

  const topCagrs = useMemo(() => {
    const arr = industry.sub_category_cagrs || [];
    return [...arr].sort((a, b) => b.cagr_pct - a.cagr_pct).slice(0, 3);
  }, [industry.sub_category_cagrs]);

  // Front data block: trending-companies chip row (global-primary + blend 1 India)
  // Fallback cascade: trending_global → india_leaders → trending_startups → stat.
  const { frontTrending, fallbackStat, frontSource } = useMemo(() => {
    const global = industry.trending_global || [];
    const india = industry.india_leaders || industry.example_startups_india || [];
    const other = industry.trending_startups || [];

    // Primary: global with one India leader blended as the last chip.
    if (global.length >= 2) {
      const globalSlice = global.slice(0, india.length > 0 ? 4 : 5);
      const chips: TrendingChip[] = globalSlice.map((n) => ({ name: n, isIndia: false }));
      if (india.length > 0) chips.push({ name: india[0], isIndia: true });
      return {
        frontTrending: { chips, label: 'Trending now', icon: '🌎' } as TrendingBlock,
        fallbackStat: null,
        frontSource: 'global-with-india' as const,
      };
    }

    // Secondary: India-only if no global data.
    if (india.length >= 2) {
      return {
        frontTrending: {
          chips: india.slice(0, 5).map((n) => ({ name: n, isIndia: true })),
          label: 'Leading in India',
          icon: '🇮🇳',
        } as TrendingBlock,
        fallbackStat: null,
        frontSource: 'india' as const,
      };
    }

    // Tertiary: generic trending_startups bucket.
    if (other.length >= 2) {
      return {
        frontTrending: {
          chips: other.slice(0, 5).map((n) => ({ name: n, isIndia: false })),
          label: 'Notable players',
          icon: '✨',
        } as TrendingBlock,
        fallbackStat: null,
        frontSource: 'other' as const,
      };
    }

    // Final fallback: top sub-CAGR as a big stat.
    const top = topCagrs[0];
    if (top) {
      return {
        frontTrending: null,
        fallbackStat: {
          leadLabel: 'Fastest-growing slice',
          value: `${top.cagr_pct}`,
          unit: '% CAGR',
          name: top.name,
        } as FallbackStat,
        frontSource: 'stat' as const,
      };
    }

    return { frontTrending: null, fallbackStat: null, frontSource: 'none' as const };
  }, [industry.trending_global, industry.india_leaders, industry.example_startups_india, industry.trending_startups, topCagrs]);

  // Back data block: opposite of what's on front so chips aren't duplicated.
  const backTrending = useMemo((): TrendingBlock | null => {
    const global = industry.trending_global || [];
    const india = industry.india_leaders || industry.example_startups_india || [];

    if (frontSource === 'global-with-india') {
      // Front used global + india[0]. Back shows remaining india leaders.
      const rest = india.slice(1, 5);
      if (rest.length === 0) return null;
      return {
        chips: rest.map((n) => ({ name: n, isIndia: true })),
        label: 'More from India',
        icon: '🇮🇳',
      };
    }

    if (frontSource === 'india') {
      // Front used india only. Back shows global trending if present.
      if (global.length === 0) return null;
      return {
        chips: global.slice(0, 5).map((n) => ({ name: n, isIndia: false })),
        label: 'Trending globally',
        icon: '🌎',
      };
    }

    if (frontSource === 'other' || frontSource === 'stat' || frontSource === 'none') {
      // Front had generic/stat — back can surface any lists that exist.
      if (global.length) {
        return {
          chips: global.slice(0, 5).map((n) => ({ name: n, isIndia: false })),
          label: 'Trending globally',
          icon: '🌎',
        };
      }
      if (india.length) {
        return {
          chips: india.slice(0, 5).map((n) => ({ name: n, isIndia: true })),
          label: 'Leading in India',
          icon: '🇮🇳',
        };
      }
    }

    return null;
  }, [frontSource, industry.trending_global, industry.india_leaders, industry.example_startups_india]);

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
            {/* Hero — 40% */}
            <div
              className="basis-[40%] shrink-0 relative flex flex-col justify-end px-5 pb-3"
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
                <div className="text-[56px] leading-none select-none mb-1" aria-hidden>
                  {emoji}
                </div>
                <h2 className="text-[28px] font-serif font-bold text-white leading-[1.05]">
                  {industry.name}
                </h2>
                {metaLine && (
                  <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-white/65 mt-1.5">
                    {metaLine}
                  </p>
                )}
              </div>
            </div>

            {/* 1 Hinge prompt — 22% */}
            <div className="basis-[22%] shrink-0 flex items-center px-5">
              {frontPrompt ? (
                <div className="w-full bg-black/35 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <p
                    className="text-[10px] font-mono uppercase tracking-[0.15em] font-semibold mb-1.5"
                    style={{ color: `${color}E0` }}
                  >
                    {frontPrompt.label}
                  </p>
                  <p className="text-[14px] text-white/95 leading-snug line-clamp-2">
                    {frontPrompt.text}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Data block — 23% (trending chips OR stat fallback) */}
            <div className="basis-[23%] shrink-0 flex flex-col justify-center px-5">
              {frontTrending ? (
                <div>
                  <p className="text-[10px] text-white/55 uppercase tracking-[0.15em] font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="text-[12px]">{frontTrending.icon}</span>
                    {frontTrending.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {frontTrending.chips.map((chip) => (
                      <span
                        key={chip.name}
                        className="text-[11px] px-2.5 py-1 rounded-full text-white/90 border inline-flex items-center gap-1"
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
                </div>
              ) : fallbackStat ? (
                <div>
                  <p className="text-[10px] text-white/55 uppercase tracking-[0.15em] font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="text-[12px]">🚀</span>
                    {fallbackStat.leadLabel}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[26px] font-bold leading-none" style={{ color }}>
                      {fallbackStat.value}
                    </span>
                    <span className="text-[12px] text-white/75">{fallbackStat.unit}</span>
                    <span className="text-[11px] text-white/40">·</span>
                    <span className="text-[12px] text-white/70 truncate">{fallbackStat.name}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Hint — 15% */}
            <div className="basis-[15%] shrink-0 flex items-center justify-center">
              <p className="text-[10px] italic text-ivory/45 tracking-wide">
                tap for the deep read →
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

            {/* Scrollable zones */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 min-h-0">
              {/* 2nd Hinge prompt — left-border accent intro */}
              {backPrompt && (
                <div
                  className="bg-white/5 border-l-2 rounded-r-xl px-4 py-3"
                  style={{ borderColor: color }}
                >
                  <p
                    className="text-[9px] font-mono uppercase tracking-[0.15em] font-semibold mb-1"
                    style={{ color: `${color}CC` }}
                  >
                    {backPrompt.label}
                  </p>
                  <p className="text-[13px] text-white/90 leading-relaxed">{backPrompt.text}</p>
                </div>
              )}

              {/* Why now */}
              {industry.why_now && (
                <div className="border-l-2 pl-3" style={{ borderColor: color }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color }}>
                    Why now
                  </p>
                  <p className="text-[12px] text-white/85 leading-relaxed italic">
                    {industry.why_now}
                  </p>
                </div>
              )}

              {/* AI disruption angle */}
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

              {/* Top 3 sub-CAGRs */}
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

              {/* What's happening — headline + cultural trend + opposite chip row */}
              {(industry.recent_headline || industry.cultural_trend || backTrending) && (
                <div className="bg-white/4 border border-white/8 rounded-xl p-3 space-y-2">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest font-semibold">
                    What's happening
                  </p>
                  {industry.recent_headline && (
                    <p className="text-[11.5px] text-white/85 leading-snug flex items-start gap-1.5">
                      <span className="shrink-0">📰</span>
                      <span>{industry.recent_headline}</span>
                    </p>
                  )}
                  {industry.cultural_trend && (
                    <p className="text-[11.5px] text-white/70 leading-snug italic flex items-start gap-1.5">
                      <span className="shrink-0">🌿</span>
                      <span>&ldquo;{industry.cultural_trend}&rdquo;</span>
                    </p>
                  )}
                  {backTrending && backTrending.chips.length > 0 && (
                    <div className="flex items-center flex-wrap gap-1.5 pt-1">
                      <span className="text-[11px] shrink-0">{backTrending.icon}</span>
                      {backTrending.chips.map((chip) => (
                        <span
                          key={chip.name}
                          className="text-[10px] px-2 py-0.5 rounded-full text-white/80 inline-flex items-center gap-1"
                          style={{ background: `${color}22`, border: `1px solid ${color}40` }}
                        >
                          {chip.isIndia && <span className="text-[9px] leading-none">🇮🇳</span>}
                          {chip.name}
                        </span>
                      ))}
                    </div>
                  )}
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
