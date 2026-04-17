'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

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

/**
 * IndustrySwipeCard — the Hinge-style card for S04.
 *
 * Front: emoji hero, tagline, 3 random hinge prompts from bank, TAM/CAGR chips.
 * Back: Why now, AI angle, India leaders, trending global, cultural trend, recent headline, sub-CAGRs.
 *
 * Drag gesture: left = Pass, right = Keep, up = Edge (if available).
 * Tap card = flip front/back.
 * Action buttons at bottom always clickable.
 */
export function IndustrySwipeCard({
  industry,
  onPass,
  onKeep,
  onEdge,
  edgeAvailable,
  edgesUsed,
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
  const tagline = industry.tagline || industry.cultural_trend || '';

  // Pick 3 prompts per render (stable per card mount via useMemo)
  const displayPrompts = useMemo(() => {
    const bank = industry.hinge_prompts || [];
    if (bank.length <= 3) return bank;
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [industry.id]);

  const indiaLeaders = industry.india_leaders || industry.example_startups_india || [];
  const trendingGlobal = industry.trending_global || industry.trending_startups || [];
  const subCagrs = industry.sub_category_cagrs || [];

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
      // Snap back
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
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={exitAnim}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      onTap={() => setFlipped((f) => !f)}
    >
      {/* PASS / KEEP / EDGE overlays on drag */}
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute top-6 left-6 z-20 pointer-events-none"
      >
        <div className="text-red-500 border-4 border-red-500 rounded-xl px-4 py-2 text-xl font-black tracking-widest rotate-[-12deg]">
          PASS
        </div>
      </motion.div>
      <motion.div
        style={{ opacity: keepOpacity }}
        className="absolute top-6 right-6 z-20 pointer-events-none"
      >
        <div className="text-green-500 border-4 border-green-500 rounded-xl px-4 py-2 text-xl font-black tracking-widest rotate-[12deg]">
          KEEP
        </div>
      </motion.div>
      <motion.div
        style={{ opacity: edgeOpacity }}
        className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      >
        <div className="text-gold border-4 border-gold rounded-xl px-4 py-2 text-xl font-black tracking-widest">
          ★ EDGE
        </div>
      </motion.div>

      {/* Card body — flipper */}
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden"
        style={{ perspective: '1600px' }}
      >
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: `linear-gradient(160deg, ${color} 0%, ${colorDark} 60%, #0C0E12 100%)`,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              boxShadow: `0 12px 40px -10px ${color}80, 0 0 0 1px ${color}30`,
            }}
          >
            {/* Geometric pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 10%, white 1px, transparent 1px),
                                  radial-gradient(circle at 80% 30%, white 1px, transparent 1px),
                                  radial-gradient(circle at 50% 70%, white 1px, transparent 1px)`,
                backgroundSize: '80px 80px',
              }}
            />

            {/* Hero section */}
            <div className="relative px-6 pt-7 pb-4 flex flex-col items-start gap-2">
              <div className="text-[72px] leading-none select-none" aria-hidden>
                {emoji}
              </div>
              <h2 className="text-[26px] sm:text-[32px] font-serif font-bold text-white leading-[1.1]">
                {industry.name}
              </h2>
              {tagline && (
                <p className="text-[13px] italic text-white/75 leading-snug max-w-[85%]">
                  "{tagline}"
                </p>
              )}
              <div className="flex gap-2 flex-wrap mt-1">
                {industry.market_size_b && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white backdrop-blur-sm">
                    💰 ${industry.market_size_b}B market
                  </span>
                )}
                {industry.cagr_pct && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white backdrop-blur-sm">
                    📈 {industry.cagr_pct}% CAGR
                  </span>
                )}
              </div>
            </div>

            {/* Hinge prompts */}
            <div className="relative flex-1 px-5 pb-4 space-y-2.5 overflow-y-auto">
              {displayPrompts.map((p, i) => (
                <div
                  key={i}
                  className="bg-black/25 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10"
                >
                  <p className="text-[9px] text-white/50 uppercase tracking-[0.15em] font-semibold mb-1">
                    {p.label}
                  </p>
                  <p className="text-[13px] text-white leading-snug">{p.text}</p>
                </div>
              ))}
            </div>

            {/* Flip hint */}
            <div className="relative px-5 pb-3 flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest">
              <span>swipe to decide</span>
              <span>tap for details →</span>
            </div>
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(180deg, #14171E 0%, #0C0E12 100%)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              boxShadow: `0 12px 40px -10px ${color}80, 0 0 0 1px ${color}30`,
            }}
          >
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="text-4xl">{emoji}</div>
                <div>
                  <h3 className="text-[20px] font-serif font-bold text-white">{industry.name}</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                    the deep read
                  </p>
                </div>
              </div>

              {/* Why now */}
              {industry.why_now && (
                <div className="border-l-2 pl-3" style={{ borderColor: color }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color }}>
                    Why now
                  </p>
                  <p className="text-[12px] text-white/80 leading-relaxed">{industry.why_now}</p>
                </div>
              )}

              {/* AI angle */}
              {industry.ai_disruption_angle && (
                <div className="bg-purple-500/10 border border-purple-500/25 rounded-xl p-3">
                  <p className="text-[9px] text-purple-300 uppercase tracking-widest mb-1">
                    ⚡ AI disruption angle
                  </p>
                  <p className="text-[12px] text-white/85 leading-relaxed">
                    {industry.ai_disruption_angle}
                  </p>
                </div>
              )}

              {/* Sub-category CAGRs */}
              {subCagrs.length > 0 && (
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2">
                    Sub-category CAGR
                  </p>
                  <div className="space-y-1.5">
                    {subCagrs.map((sc) => (
                      <div key={sc.name} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] text-white/70">{sc.name}</span>
                            <span className="text-[11px] font-mono" style={{ color }}>
                              {sc.cagr_pct}%
                            </span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, sc.cagr_pct * 1.5)}%`,
                                background: color,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cultural trend */}
              {industry.cultural_trend && (
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">
                    Cultural trend
                  </p>
                  <p className="text-[12px] text-white/75 italic leading-relaxed">
                    "{industry.cultural_trend}"
                  </p>
                </div>
              )}

              {/* India leaders */}
              {indiaLeaders.length > 0 && (
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2">
                    🇮🇳 India leaders
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {indiaLeaders.slice(0, 6).map((n) => (
                      <span
                        key={n}
                        className="text-[10px] px-2 py-0.5 rounded-full text-white/80"
                        style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending global */}
              {trendingGlobal.length > 0 && (
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2">
                    🌎 Trending globally
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {trendingGlobal.slice(0, 6).map((n) => (
                      <span
                        key={n}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent headline */}
              {industry.recent_headline && (
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">
                    📰 Recent headline
                  </p>
                  <p className="text-[12px] text-white/85 leading-snug font-medium">
                    {industry.recent_headline}
                  </p>
                </div>
              )}

              {/* Investor sentiment */}
              {(industry.investor_sentiment_short || industry.investor_sentiment) && (
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">
                    Investor sentiment
                  </p>
                  <p className="text-[12px] text-white/75 leading-relaxed">
                    {industry.investor_sentiment_short || industry.investor_sentiment}
                  </p>
                </div>
              )}
            </div>

            {/* Back footer */}
            <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest">
              <span>← tap to flip back</span>
              <span>{industry.category || 'explore'}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
