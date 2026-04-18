'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'; // pie-only now that the back uses share charts instead of growth lines
import { staggerContainer, fadeSlideUp } from '@/lib/motion';
import { INDUSTRY_STATS, FALLBACK_STAT } from '@/content/industry-stats';

interface HingePrompt {
  label: string;
  text: string;
}

interface SubCagr {
  name: string;
  cagr_pct: number;
}

interface QuickStats {
  three_year_growth_pct?: number;
  india_startups_count?: string;
  biggest_recent_exit?: string;
}

interface BackStatEntry {
  value: string;
  label: string;
}

interface BackStats {
  funding_12m?: BackStatEntry;
  india_share?: BackStatEntry;
  median_to_a?: BackStatEntry;
  profitable_co_count?: BackStatEntry;
}

interface SubcategoryShare {
  name: string;
  share_pct: number;
  icon: string;
  description: string;
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
  // Batch 2 hinge-data enrichment fields.
  user_behavior_shift?: string;
  impact_potential?: string;
  india_scene?: string;
  quick_stats?: QuickStats;
  // Batch 3 back redesign fields.
  back_stats?: BackStats;
  subcategory_shares?: SubcategoryShare[];
}

interface IndustrySwipeCardProps {
  industry: IndustryCardData;
  onPass: () => void;
  onKeep: () => void;
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

/** Cheap deterministic hash (djb2-ish) — used to pick per-card witty prompts
 *  stably across flip + re-renders without re-rolling on every paint. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

/** Shift every RGB channel of a hex color by `amount` (−255..255), clamped.
 *  Used to derive pie-segment colors from the industry's primary color so
 *  the palette stays cohesive. */
function adjustColor(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(h.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(h.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(h.slice(4, 6), 16) + amount));
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

/**
 * Synthesize a 5-point market-size series ending at marketSizeB in 2026,
 * compounding backward at cagrPct. The source JSON has no `growth_chart`
 * field today, so we generate a directionally-correct sparkline from the
 * market size + CAGR we already store. If either is missing, returns []
 * and the sparkline won't render.
 */
/**
 * FlipIcon — two small arrows pointing at each other, with a gap between.
 * Reads as "flip between two sides" (unlike ↻ which reads as "refresh").
 * Sized inline via the `size` prop; color inherits from its container.
 */
function FlipIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      style={{ color: 'rgba(255,255,255,0.75)' }}
    >
      <path
        d="M3 5 L1 7 L3 9 M1 7 L6 7 M11 5 L13 7 L11 9 M13 7 L8 7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * IndustrySwipeCard — S04 swipe card with a bento front and a rich back.
 *
 * Front stack (auto / auto / auto / flex / auto vertical split):
 *   - HERO           : logo tile (left) + name + meta (right)
 *   - HOOK           : italicized tagline (single line)
 *   - WITTY PROMPT   : Hinge-style prompt with label, randomized per card
 *   - BENTO (flex)   : 2-col grid, 3 rows, EXPLICIT grid positions
 *       Row 1 [col-span-2] : TILE A — 💡 OPPORTUNITY (gold-tinted)
 *       Row 2 [B | C]      : 🔥 TRENDING  |  👀 TO WATCH
 *       Row 3 [col-span-2] : HOTTEST SUB-SPACE — bar + CAGR %
 *   - FOOTER         : "↻ flip for the deeper read"
 *
 * Back — header + witty prompt + 5 zones:
 *   1. WITTY PROMPT (different pick than front)
 *   2. ⚡ AI disruption angle                       (full-width thesis)
 *   3. Top 3 sub-CAGRs                              (full-width, bars)
 *   4. USER BEHAVIOR SHIFT | IMPACT POTENTIAL       (2-col row)
 *   5. 📰 What's happening (recent headline)        (full-width)
 *   6. 🇮🇳 India scene                              (full-width)
 *
 * Gestures: drag left = Pass, right = Keep, up = Edge. Tap = flip.
 */
export function IndustrySwipeCard({
  industry,
  onPass,
  onKeep,
  cardKey,
}: IndustrySwipeCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  // Scroll hint — shown on mount, fades on first scroll. Re-armed each time
  // the card flips back to the front.
  const [scrollHintVisible, setScrollHintVisible] = useState(true);
  // Which sub-category tab is active on the back's pie-chart section.
  const [activeSubcat, setActiveSubcat] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const passOpacity = useTransform(x, [-120, -40], [1, 0]);
  const keepOpacity = useTransform(x, [40, 120], [0, 1]);

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

  // TILE A — "TOGETHER WE COULD" prompt text, truncated to ~100 chars.
  const opportunityText = useMemo(() => {
    const bank = industry.hinge_prompts || [];
    if (bank.length === 0) return null;
    const together = bank.find((p) => p.label.toUpperCase() === 'TOGETHER WE COULD');
    const raw = (together || bank[0])?.text || null;
    return raw ? truncateAtWord(raw, 100) : null;
  }, [industry.hinge_prompts]);

  // Front + bottom witty prompts — two distinct picks from the Hinge bank,
  // excluding "TOGETHER WE COULD" (reserved for Tile A). Deterministic from
  // industry.id so nothing re-shuffles on flip or re-render. The back card
  // no longer uses a witty prompt (the new stats grid replaces it).
  const { frontPrompt, bottomPrompt } = useMemo(() => {
    const bank = (industry.hinge_prompts || []).filter(
      (p) => p.label.toUpperCase() !== 'TOGETHER WE COULD',
    );
    if (bank.length === 0) return { frontPrompt: null, bottomPrompt: null };
    const h = hashString(industry.id);
    const frontIdx = h % bank.length;
    const front = bank[frontIdx];
    const remaining = bank.filter((_, i) => i !== frontIdx);
    const bottom = remaining.length > 0 ? remaining[(h >> 3) % remaining.length] : null;
    return { frontPrompt: front, bottomPrompt: bottom };
  }, [industry.id, industry.hinge_prompts]);

  // TILE B + C — curated India company callouts
  const stats = INDUSTRY_STATS[industry.id] || FALLBACK_STAT;

  const topCagrs = useMemo(() => {
    const arr = industry.sub_category_cagrs || [];
    return [...arr].sort((a, b) => b.cagr_pct - a.cagr_pct).slice(0, 3);
  }, [industry.sub_category_cagrs]);
  const topSubCagr = topCagrs[0] || null;

  // Hide the scroll hint after the user scrolls the front. Listens on the
  // scroll container directly (not window) so we don't fight sibling scrolls.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop > 8) setScrollHintVisible(false);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Re-arm the scroll hint + reset scrollTop whenever we flip back to front.
  useEffect(() => {
    if (!flipped) {
      setScrollHintVisible(true);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [flipped]);

  function handleDragEnd(_: unknown, info: { offset: { x: number; y: number } }) {
    const { x: dx } = info.offset;
    const SWIPE_THRESHOLD = 100;
    if (dx < -SWIPE_THRESHOLD) {
      setExitDirection('left');
      setTimeout(onPass, 200);
    } else if (dx > SWIPE_THRESHOLD) {
      setExitDirection('right');
      setTimeout(onKeep, 200);
    } else {
      x.set(0);
    }
  }

  const exitAnim = exitDirection
    ? {
        left: { x: -500, opacity: 0, rotate: -25 },
        right: { x: 500, opacity: 0, rotate: 25 },
      }[exitDirection]
    : undefined;

  const GOLD_SOLID = '#D4A843';
  const GOLD_70 = 'rgba(212,168,67,0.70)';

  return (
    <motion.div
      key={cardKey}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      style={{ x, rotate }}
      initial={{ opacity: 0, scale: 0.92, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={exitAnim}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
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

      {/* Flipper */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ perspective: '1600px' }}>
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
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
              // Only the visible face gets pointer events so the hidden face's
              // flip button can't be clicked through the 3D stack.
              pointerEvents: flipped ? 'none' : 'auto',
            }}
          >
            {/* ─── HERO — logo left, text right ─── */}
            <div
              className="shrink-0 relative flex items-center gap-3 px-5 pt-5 pb-4"
              style={{
                background: `linear-gradient(160deg, ${color} 0%, ${colorDark} 70%, #0C0E12 100%)`,
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
              {/* Logo tile */}
              <div
                className="relative shrink-0 w-16 h-16 rounded-xl flex items-center justify-center border backdrop-blur-sm leading-none"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  borderColor: 'rgba(255,255,255,0.25)',
                  fontSize: 32,
                }}
                aria-hidden
              >
                {emoji}
              </div>
              {/* Name + meta */}
              <div className="relative flex-1 min-w-0">
                <h2 className="text-[22px] sm:text-[24px] font-serif font-bold text-white leading-tight mb-0.5 truncate">
                  {industry.name}
                </h2>
                {metaLine && (
                  <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-white/70 truncate">
                    {metaLine}
                  </p>
                )}
              </div>
            </div>

            {/* ─── SCROLLABLE BODY — everything below the hero scrolls ─── */}
            <div
              ref={scrollRef}
              className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide"
              style={{
                // Allow vertical pan so the browser scrolls naturally inside
                // the card while Framer Motion still captures horizontal drag.
                touchAction: 'pan-y',
                // Soft bottom fade so content blends behind the action circles
                // instead of cutting off abruptly.
                maskImage:
                  'linear-gradient(to bottom, black 0%, black 85%, transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, black 0%, black 85%, transparent 100%)',
              }}
            >
              {/* HOOK — italic tagline */}
              <div className="flex items-center px-5 pt-[14px] pb-2">
                {hookText && (
                  <p className="text-[13px] italic text-ivory/85 leading-snug line-clamp-2">
                    {hookText}
                  </p>
                )}
              </div>

              {/* WITTY PROMPT #1 — label stacked above text for breathing room */}
              {frontPrompt && (
                <div className="flex flex-col gap-1.5 px-5 py-3 border-y border-white/5">
                  <p
                    className="text-[9px] font-mono uppercase text-gold/60 leading-[1.3]"
                    style={{ letterSpacing: '0.18em' }}
                  >
                    {frontPrompt.label}
                  </p>
                  <p className="text-[13px] italic text-white/85 leading-snug">
                    &ldquo;{frontPrompt.text}&rdquo;
                  </p>
                </div>
              )}

              {/* BENTO — auto height now that parent scrolls. Children
                  cascade in with a gentle 60ms stagger so the bento feels
                  composed rather than dropped in all at once. */}
              <motion.div
                className="grid gap-2.5 px-5 pt-[14px] pb-2"
                style={{ gridTemplateColumns: '1fr 1fr' }}
                variants={staggerContainer(0.1, 0.06)}
                initial="hidden"
                animate="visible"
              >
                {/* TILE A — 💡 OPPORTUNITY */}
                {opportunityText && (
                  <motion.div
                    variants={fadeSlideUp}
                    className="rounded-xl min-w-0"
                    style={{
                      gridColumn: '1 / -1',
                      background: 'rgba(212,168,67,0.10)',
                      border: '1px solid rgba(212,168,67,0.30)',
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
                    <p className="text-[13px] text-ivory/90 leading-snug font-semibold">
                      {opportunityText}
                    </p>
                  </motion.div>
                )}

                {/* TILE B — 🔥 TRENDING */}
                <motion.div
                  variants={fadeSlideUp}
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
                  <p className="text-[10.5px] text-ivory/65 leading-snug mt-1 line-clamp-3">
                    {stats.trending.stat}
                  </p>
                </motion.div>

                {/* TILE C — 👀 TO WATCH */}
                <motion.div
                  variants={fadeSlideUp}
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
                  <p className="text-[10.5px] text-ivory/65 leading-snug mt-1 line-clamp-3">
                    {stats.watch.why}
                  </p>
                </motion.div>

                {/* TILE D — HOTTEST SUB-SPACE */}
                {topSubCagr && (
                  <motion.div
                    variants={fadeSlideUp}
                    className="rounded-xl px-3 py-2 min-w-0"
                    style={{
                      gridColumn: '1 / -1',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.10)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 min-w-0 max-w-[45%]">
                        <p className="text-[9.5px] font-mono uppercase text-ivory/45 tracking-[0.15em] leading-none">
                          Hottest Sub-Space
                        </p>
                        <p className="text-[13px] text-ivory/90 font-semibold leading-tight mt-1 truncate">
                          {topSubCagr.name}
                        </p>
                      </div>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, topSubCagr.cagr_pct * 1.5)}%`,
                              background: color,
                            }}
                          />
                        </div>
                        <span
                          className="text-[12px] font-mono font-bold shrink-0"
                          style={{ color: GOLD_SOLID }}
                        >
                          {topSubCagr.cagr_pct}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* QUICK STATS ROW — 3 mini tiles, only when we have data */}
              {industry.quick_stats && (
                <div className="grid grid-cols-3 gap-2 px-5 pt-[14px] pb-3">
                  {industry.quick_stats.three_year_growth_pct !== undefined && (
                    <div
                      className="rounded-lg px-2 py-1.5 text-center min-w-0"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.10)',
                      }}
                    >
                      <p className="text-[8px] font-mono uppercase tracking-wider text-ivory/40 leading-tight truncate">
                        3-YR GROWTH
                      </p>
                      <p className="text-[14px] font-bold leading-tight mt-0.5" style={{ color: '#10B981' }}>
                        +{industry.quick_stats.three_year_growth_pct}%
                      </p>
                    </div>
                  )}
                  {industry.quick_stats.india_startups_count && (
                    <div
                      className="rounded-lg px-2 py-1.5 text-center min-w-0"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.10)',
                      }}
                    >
                      <p className="text-[8px] font-mono uppercase tracking-wider text-ivory/40 leading-tight truncate">
                        INDIA COS
                      </p>
                      <p className="text-[14px] font-bold leading-tight mt-0.5" style={{ color: GOLD_SOLID }}>
                        {industry.quick_stats.india_startups_count}
                      </p>
                    </div>
                  )}
                  {industry.quick_stats.biggest_recent_exit && (
                    <div
                      className="rounded-lg px-2 py-1.5 text-center min-w-0"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.10)',
                      }}
                    >
                      <p className="text-[8px] font-mono uppercase tracking-wider text-ivory/40 leading-tight truncate">
                        RECENT EXIT
                      </p>
                      <p className="text-[10px] font-bold leading-tight mt-0.5 line-clamp-2" style={{ color: '#60A5FA' }}>
                        {industry.quick_stats.biggest_recent_exit}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SECOND WITTY PROMPT — rewards scrolling; same stacked layout */}
              {bottomPrompt && (
                <div className="mx-5 mb-3 pt-3 border-t border-white/[0.08]">
                  <div className="flex flex-col gap-1.5">
                    <p
                      className="text-[9px] font-mono uppercase text-gold/55 leading-[1.3]"
                      style={{ letterSpacing: '0.18em' }}
                    >
                      {bottomPrompt.label}
                    </p>
                    <p className="text-[13px] italic text-white/80 leading-snug">
                      &ldquo;{bottomPrompt.text}&rdquo;
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom spacer — keeps real content from ending behind the
                  floating action circles during a deep scroll. */}
              <div className="h-[120px]" aria-hidden />
            </div>

            {/* Scroll hint + Flip pill are rendered OUTSIDE the 3D-rotating
                faces (below this flipper div) so their text never mirrors
                when the card flips. */}
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
              // Only the visible face gets pointer events so flip-back clicks
              // actually reach the button inside this face.
              pointerEvents: flipped ? 'auto' : 'none',
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

            {/* Body — scrollable, replaces the old sparkline/witty/5-zone stack.
                New order: hero stats grid → pie + legend → sub-cat tabs+desc →
                AI disruption → what's happening → India scene. */}
            <div
              className="flex-1 overflow-y-auto scrollbar-hide pb-[120px] min-h-0"
              style={{ touchAction: 'pan-y' }}
            >
              {/* ── Zone 1: Hero stats grid (2×2) ── */}
              {industry.back_stats && (
                <div className="grid grid-cols-2 gap-2 px-5 pt-4 pb-3">
                  {([
                    industry.back_stats.funding_12m,
                    industry.back_stats.india_share,
                    industry.back_stats.median_to_a,
                    industry.back_stats.profitable_co_count,
                  ].filter(Boolean) as BackStatEntry[]).map((stat, i) => (
                    <div
                      key={i}
                      className="rounded-xl px-3 py-2.5"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.10)',
                      }}
                    >
                      <p className="text-[9.5px] font-mono uppercase tracking-wider text-ivory/50 leading-tight mb-1">
                        {stat.label}
                      </p>
                      <p
                        className="text-[18px] font-serif font-bold leading-tight"
                        style={{ color }}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Zone 2: Pie chart of sub-category market share ── */}
              {industry.subcategory_shares && industry.subcategory_shares.length > 0 && (
                <div className="px-5 pt-2 pb-3">
                  <p className="text-[9.5px] font-mono uppercase tracking-widest text-ivory/50 mb-2">
                    Sub-category market share
                  </p>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 110, height: 110 }} className="shrink-0">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={industry.subcategory_shares}
                            dataKey="share_pct"
                            cx="50%"
                            cy="50%"
                            innerRadius={22}
                            outerRadius={52}
                            paddingAngle={2}
                            stroke="rgba(12,14,18,0.6)"
                            strokeWidth={1}
                            isAnimationActive={false}
                          >
                            {industry.subcategory_shares.map((_, i) => {
                              const palette = [
                                color,
                                adjustColor(color, 40),
                                adjustColor(color, -30),
                                adjustColor(color, 20),
                                adjustColor(color, -55),
                              ];
                              const fill = palette[i % palette.length];
                              return (
                                <Cell
                                  key={i}
                                  fill={fill}
                                  fillOpacity={activeSubcat === i ? 1 : 0.78}
                                />
                              );
                            })}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      {industry.subcategory_shares.map((seg, i) => {
                        const palette = [
                          color,
                          adjustColor(color, 40),
                          adjustColor(color, -30),
                          adjustColor(color, 20),
                          adjustColor(color, -55),
                        ];
                        const fill = palette[i % palette.length];
                        const active = activeSubcat === i;
                        return (
                          <button
                            key={seg.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSubcat(i);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 w-full text-left rounded-md px-1 py-0.5 transition-colors"
                            style={{
                              background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                            }}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-sm shrink-0"
                              style={{ background: fill }}
                            />
                            <span
                              className={`text-[11px] flex-1 leading-tight truncate ${
                                active ? 'text-ivory/95 font-medium' : 'text-ivory/70'
                              }`}
                            >
                              {seg.name}
                            </span>
                            <span className="text-[10px] font-mono text-ivory/55 shrink-0">
                              {seg.share_pct}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Zone 3: Sub-category icon tabs + description ── */}
              {industry.subcategory_shares && industry.subcategory_shares.length > 0 && (
                <div className="px-5 pb-4">
                  <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                    {industry.subcategory_shares.map((seg, i) => {
                      const palette = [
                        color,
                        adjustColor(color, 40),
                        adjustColor(color, -30),
                        adjustColor(color, 20),
                        adjustColor(color, -55),
                      ];
                      const fill = palette[i % palette.length];
                      const active = activeSubcat === i;
                      return (
                        <button
                          key={seg.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSubcat(i);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] transition-all"
                          style={{
                            background: active
                              ? `${fill}30`
                              : 'rgba(255,255,255,0.03)',
                            border: active
                              ? `1.5px solid ${fill}`
                              : '1px solid rgba(255,255,255,0.10)',
                            color: active ? '#FFFFFF' : 'rgba(245,240,232,0.65)',
                          }}
                        >
                          <span>{seg.icon}</span>
                          <span className="font-medium">{seg.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`desc-${activeSubcat}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-xl px-3.5 py-2.5 mt-1"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.10)',
                      }}
                    >
                      <p className="text-[12px] text-ivory/85 leading-relaxed">
                        {industry.subcategory_shares[activeSubcat]?.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {/* ── Zone 4: AI disruption angle (kept) ── */}
              {industry.ai_disruption_angle && (
                <div className="px-5 pb-4">
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
                </div>
              )}

              {/* ── Zone 5: What's happening (kept) ── */}
              {industry.recent_headline && (
                <div className="px-5 pb-4">
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1.5 font-semibold">
                      What's happening
                    </p>
                    <p className="text-[12px] text-white/85 leading-snug flex items-start gap-1.5">
                      <span className="shrink-0">📰</span>
                      <span>{industry.recent_headline}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* ── Zone 6: India scene (kept) ── */}
              {industry.india_scene && (
                <div className="px-5 pb-4">
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1.5 font-semibold flex items-center gap-1.5">
                      <span>🇮🇳</span>
                      India scene
                    </p>
                    <p className="text-[12px] text-white/85 leading-snug">
                      {industry.india_scene}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* (Flip pill lives outside the flipper — see below.) */}
          </div>
        </motion.div>
      </div>

      {/* Flip pill — single, outside the 3D-rotating faces so its text
          stays right-side-up regardless of flip state. Always bottom-right.
          zIndex 50 puts it above the floating action circles (z-20). */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setFlipped((f) => !f);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute bottom-3 right-3 h-8 px-3 rounded-full flex items-center gap-1.5 backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
        style={{
          zIndex: 50,
          background: 'rgba(12,14,18,0.55)',
          border: '1px solid rgba(255,255,255,0.18)',
        }}
        aria-label={flipped ? 'Flip back to the pitch' : 'Flip for the deeper read'}
      >
        <FlipIcon size={12} />
        <span className="text-[11px] font-medium text-white/80 leading-none">
          Flip
        </span>
      </button>

      {/* Scroll hint — only on the front face. Lives outside the flipper so
          its text reads normally; conditionally hidden when flipped. */}
      <AnimatePresence>
        {!flipped && scrollHintVisible && (
          <motion.div
            key="scroll-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute bottom-14 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ zIndex: 40 }}
          >
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-0.5 text-white/70"
            >
              <span className="text-[10px] font-mono uppercase tracking-wider">
                scroll for more
              </span>
              <span className="text-[14px] leading-none">⌄</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
