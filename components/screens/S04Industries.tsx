'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import industriesRaw from '@/content/industries.json';
import { filterByIndustryOnly } from '@/lib/scoring/orchestrator';
import { IDEAS } from '@/lib/scoring/engine';
import { ProcessingSwirl } from '@/components/ui/ProcessingSwirl';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Industry {
  id: string; name: string; icon: string; hookLine: string;
  stats: { marketSize: string; growth: string; whatsHot: string[] };
  trendingIdeas: string[];
  emoji?: string; market_size_b?: number; cagr_pct?: number;
  trending_insight?: string; why_now?: string; ai_opportunity?: string;
  investor_sentiment?: string;
  trending_startups?: string[]; example_startups_india?: string[];
  tam_b?: number; sam_b?: number; som_m?: number;
  growth_data?: { year: string; value: number }[];
}

const INDUSTRIES = industriesRaw as unknown as Industry[];

const FILTERS = [
  { label: 'All', ids: null as string[] | null },
  { label: 'Tech', ids: ['ai_ml', 'cybersecurity', 'hardware_robotics', 'space_tech', 'web3'] },
  { label: 'Creative', ids: ['creator_media', 'gaming_entertainment', 'fashion_beauty'] },
  { label: 'Health', ids: ['health_wellness', 'sports_fitness', 'senior_care', 'cannabis'] },
  { label: 'Finance', ids: ['finance_payments', 'legal_compliance', 'real_estate_home'] },
  { label: 'Social', ids: ['education_learning', 'community_social', 'parenting', 'dating', 'spirituality'] },
  { label: 'Other', ids: ['food_agriculture', 'climate_energy', 'logistics_mobility', 'travel', 'pet_care'] },
];

const SWIPE_THRESHOLD = 110;

type ActionType = 'keep' | 'pass' | 'edge';

/**
 * S04 — Industry Discovery (Hinge-style swipe)
 *
 * One card at a time. Swipe right = Keep, left = Pass, up = Edge.
 * Buttons mirror the gestures for non-swipe users. Tap card opens the
 * detail sheet. Filter chips at top, persistent (always-visible) Continue
 * CTA below — greyed until 2 industries are kept.
 */
export function S04Industries() {
  const industriesKept = useJourneyStore((s) => s.industriesKept);
  const industriesPassed = useJourneyStore((s) => s.industriesPassed);
  const industriesEdged = useJourneyStore((s) => s.industriesEdged);
  const keepIndustry = useJourneyStore((s) => s.keepIndustry);
  const passIndustry = useJourneyStore((s) => s.passIndustry);
  const edgeIndustry = useJourneyStore((s) => s.edgeIndustry);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [activeFilter, setActiveFilter] = useState('All');
  const [openSheet, setOpenSheet] = useState<string | null>(null);
  const [nudge, setNudge] = useState('');
  const [processing, setProcessing] = useState(false);
  // Direction the swipe should fly off (set when an action is dispatched).
  const [exitDir, setExitDir] = useState<{ x: number; y: number; rotate: number } | null>(null);
  const dialogueSent = useRef(false);

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    const isStillHere = () => useJourneyStore.getState().currentScreen === 's04';
    enqueueMessage({ speaker: 'cedric', text: lines.s04.cedric.intro, type: 'instruction' });
    setTimeout(() => {
      if (!isStillHere()) return;
      enqueueMessage({ speaker: 'pip', text: lines.s04.pip.intro, type: 'dialogue' });
    }, 2200);
  }, [enqueueMessage]);

  // The pool of industries that haven't been actioned yet, scoped to filter.
  const filteredPool = useMemo(() => {
    const f = FILTERS.find((x) => x.label === activeFilter);
    const base = !f || !f.ids ? INDUSTRIES : INDUSTRIES.filter((i) => f.ids!.includes(i.id));
    return base.filter(
      (i) =>
        !industriesKept.includes(i.id) &&
        !industriesPassed.includes(i.id) &&
        !industriesEdged.includes(i.id),
    );
  }, [activeFilter, industriesKept, industriesPassed, industriesEdged]);

  const totalActions =
    industriesKept.length + industriesPassed.length + industriesEdged.length;
  const canContinue = industriesKept.length >= 2;

  const current = filteredPool[0];
  const next = filteredPool[1];

  function commitAction(type: ActionType, id: string) {
    if (type === 'keep') keepIndustry(id);
    else if (type === 'pass') passIndustry(id);
    else edgeIndustry(id);
    setOpenSheet(null);
    setExitDir(null);
  }

  function handleAction(type: ActionType, id: string) {
    // Trigger the matching off-screen exit so the user sees the card fly out
    // in the direction of their decision.
    if (type === 'keep') setExitDir({ x: 380, y: 20, rotate: 16 });
    else if (type === 'pass') setExitDir({ x: -380, y: 20, rotate: -16 });
    else setExitDir({ x: 0, y: -380, rotate: 0 });
    setTimeout(() => commitAction(type, id), 220);
  }

  function handleContinue() {
    if (!canContinue) {
      setNudge('Keep at least 2 industries');
      setTimeout(() => setNudge(''), 1800);
      return;
    }
    setProcessing(true);
    filterByIndustryOnly(IDEAS, industriesKept);
    const wrap = lines.s04.cedric.afterAll(industriesKept.length, industriesEdged.length);
    enqueueMessage({ speaker: 'cedric', text: wrap, type: 'dialogue' });
    setTimeout(() => advanceScreen(), wrap.length * 28 + 800);
  }

  const openIndustry = INDUSTRIES.find((i) => i.id === openSheet);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 px-1 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setActiveFilter(f.label)}
            data-testid={`filter-${f.label}`}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeFilter === f.label
                ? 'bg-gold text-dark'
                : 'bg-white/5 text-ivory/55 hover:text-ivory/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Persistent CTA strip — always visible, greyed until enough kept */}
      <div className="flex items-center justify-between py-2 px-1 shrink-0 border-b border-white/8">
        <span className="text-[10px] font-mono text-ivory/35">
          {industriesKept.length} kept
          {industriesEdged.length > 0 ? ` · ${industriesEdged.length} edged` : ''}
          {industriesPassed.length > 0 ? ` · ${industriesPassed.length} passed` : ''}
        </span>
        <button
          onClick={handleContinue}
          data-testid="continue-btn"
          className={`text-xs px-3 py-1 rounded-full font-semibold transition-all ${
            canContinue
              ? 'bg-gold text-dark hover:bg-gold/90'
              : 'bg-white/8 text-ivory/30 cursor-not-allowed'
          }`}
        >
          Continue →
        </button>
      </div>
      {nudge && (
        <p className="text-[11px] text-amber-400 text-center py-1">{nudge}</p>
      )}

      {/* Card stack zone — fills the rest, holds the swipe area + buttons */}
      <AnimatePresence mode="wait">
        {processing ? (
          <motion.div
            key="swirl"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="flex-1 w-full flex items-center justify-center"
          >
            <ProcessingSwirl
              color="#D4A843"
              milestoneIcon="🌊"
              milestoneLabel="World"
              caption="charting your terrain"
            />
          </motion.div>
        ) : (
          <motion.div
            key="cards"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28, transition: { duration: 0.24, ease: 'easeIn' } }}
            className="flex-1 flex flex-col min-h-0 pt-2"
          >
            <div className="flex-1 relative min-h-0 px-1">
              {!current ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                  <p className="text-ivory/60 text-sm">No industries left in this filter.</p>
                  <p className="text-ivory/35 text-xs">Switch filters or hit Continue when ready.</p>
                </div>
              ) : (
                <div className="relative h-full">
                  {/* Preview card behind — depth */}
                  {next && (
                    <motion.div
                      key={`preview-${next.id}`}
                      className="absolute inset-0 rounded-2xl border border-white/6 bg-dark-surface/60"
                      initial={{ scale: 0.93, y: 12, opacity: 0.55 }}
                      animate={{ scale: 0.93, y: 12, opacity: 0.55 }}
                    />
                  )}
                  <SwipeCard
                    key={current.id}
                    industry={current}
                    exitDir={exitDir}
                    onTap={() => setOpenSheet(current.id)}
                    onSwipe={(type) => handleAction(type, current.id)}
                  />
                </div>
              )}
            </div>

            {/* Action bar — mirrors swipe directions */}
            <div className="shrink-0 flex items-center justify-center gap-3 py-3">
              <ActionButton
                kind="pass"
                disabled={!current}
                onClick={() => current && handleAction('pass', current.id)}
              />
              <ActionButton
                kind="edge"
                disabled={
                  !current ||
                  (industriesEdged.length >= 2 && !industriesEdged.includes(current.id))
                }
                onClick={() => current && handleAction('edge', current.id)}
              />
              <ActionButton
                kind="keep"
                disabled={!current}
                onClick={() => current && handleAction('keep', current.id)}
              />
            </div>
            <p className="text-center text-[10px] font-mono text-ivory/30 pb-2 shrink-0">
              {totalActions + 1 > INDUSTRIES.length ? INDUSTRIES.length : totalActions + 1} of {INDUSTRIES.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail sheet — same structure as before, scoped to activity zone */}
      <AnimatePresence>
        {openIndustry && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenSheet(null)}
              className="absolute inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setOpenSheet(null);
              }}
              data-testid="industry-sheet"
              className="absolute inset-x-0 bottom-0 z-50 bg-dark-surface border-t border-white/10 rounded-t-2xl max-h-[75%] overflow-y-auto"
            >
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="px-5 pt-1 pb-6 space-y-5">
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{openIndustry.emoji || openIndustry.icon}</span>
                  <div>
                    <h3 className="text-ivory font-serif text-xl font-bold">{openIndustry.name}</h3>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {openIndustry.cagr_pct && (
                        <span className="text-[11px] bg-gold/20 text-gold rounded-full px-2.5 py-0.5 font-medium">
                          {openIndustry.cagr_pct}% CAGR
                        </span>
                      )}
                      {openIndustry.market_size_b && (
                        <span className="text-[11px] bg-white/10 text-ivory/60 rounded-full px-2.5 py-0.5">
                          ${openIndustry.market_size_b}B market
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {openIndustry.trending_insight && (
                  <div className="bg-gold/10 border-l-2 border-gold rounded-r-xl px-4 py-3">
                    <p className="text-[10px] text-gold/70 uppercase tracking-widest mb-1">
                      What&apos;s happening right now
                    </p>
                    <p className="text-ivory/90 text-[13px] leading-relaxed italic">
                      &ldquo;{openIndustry.trending_insight}&rdquo;
                    </p>
                  </div>
                )}

                {openIndustry.growth_data && openIndustry.growth_data.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-ivory/40 uppercase tracking-wider">
                        Market Size ($B)
                      </p>
                      {openIndustry.cagr_pct && (
                        <p className="text-[11px] text-gold">+{openIndustry.cagr_pct}% per year</p>
                      )}
                    </div>
                    <div className="h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={openIndustry.growth_data}>
                          <defs>
                            <linearGradient id={`grad-${openIndustry.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#D4A843" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="value" stroke="#D4A843" strokeWidth={2} fill={`url(#grad-${openIndustry.id})`} dot={false} />
                          <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: '#14171E', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 8, fontSize: 11 }} labelStyle={{ color: 'rgba(255,255,255,0.5)' }} formatter={(v) => [`$${v}B`, 'Market size']} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {openIndustry.tam_b && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-ivory/40 uppercase tracking-wider">Market Layers</p>
                    {[
                      { label: 'Total Market (TAM)', value: openIndustry.tam_b, color: 'rgba(212,168,67,0.7)' },
                      { label: 'Serviceable (SAM)', value: openIndustry.sam_b || 0, color: 'rgba(212,168,67,0.5)' },
                      { label: 'Your Slice (SOM)', value: (openIndustry.som_m || 0) / 1000, color: 'rgba(212,168,67,0.35)' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-[10px] text-ivory/40 w-32 flex-shrink-0">{label}</span>
                        <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min((value / openIndustry.tam_b!) * 100, 100)}%`, background: color }} />
                        </div>
                        <span className="text-[11px] text-gold w-12 text-right">${value.toFixed(0)}B</span>
                      </div>
                    ))}
                  </div>
                )}

                {openIndustry.why_now && (
                  <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3">
                    <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider mb-1">Why this moment</p>
                    <p className="text-ivory/80 text-[12px] leading-relaxed">{openIndustry.why_now}</p>
                  </div>
                )}

                {openIndustry.ai_opportunity && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                    <p className="text-[10px] text-purple-400/70 uppercase tracking-wider mb-1">The AI angle</p>
                    <p className="text-ivory/80 text-[12px] leading-relaxed">{openIndustry.ai_opportunity}</p>
                  </div>
                )}

                {openIndustry.trending_startups && openIndustry.trending_startups.length > 0 && (
                  <div>
                    <p className="text-[10px] text-ivory/40 uppercase tracking-wider mb-2">Companies to watch</p>
                    <div className="flex flex-wrap gap-1.5">
                      {openIndustry.trending_startups.map((s) => (
                        <span key={s} className="text-[11px] bg-white/8 border border-white/10 rounded-full px-2.5 py-1 text-ivory/70">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {openIndustry.example_startups_india && openIndustry.example_startups_india.length > 0 && (
                  <div>
                    <p className="text-[10px] text-ivory/40 uppercase tracking-wider mb-2">India leaders</p>
                    <div className="flex flex-wrap gap-1.5">
                      {openIndustry.example_startups_india.map((s) => (
                        <span key={s} className="text-[11px] bg-orange-500/10 border border-orange-500/20 rounded-full px-2.5 py-1 text-orange-300/80">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    data-testid="pass-btn"
                    onClick={() => handleAction('pass', openIndustry.id)}
                    className="flex-1 h-11 rounded-xl border border-white/15 bg-white/5 text-ivory/60 text-[13px] hover:bg-red-500/15 hover:border-red-500/30 transition-all"
                  >
                    ✕ Pass
                  </button>
                  <button
                    data-testid="edge-btn"
                    onClick={() => handleAction('edge', openIndustry.id)}
                    disabled={industriesEdged.length >= 2 && !industriesEdged.includes(openIndustry.id)}
                    className={`flex-1 h-11 rounded-xl text-[13px] font-medium transition-all ${
                      industriesEdged.length >= 2 && !industriesEdged.includes(openIndustry.id)
                        ? 'border border-white/10 bg-white/5 text-ivory/20 cursor-not-allowed'
                        : 'border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20'
                    }`}
                  >
                    ★ Edge
                  </button>
                  <button
                    data-testid="keep-btn"
                    onClick={() => handleAction('keep', openIndustry.id)}
                    className="flex-1 h-11 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[13px] font-medium hover:bg-emerald-500/20 transition-all"
                  >
                    ✓ Keep
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── SwipeCard ────────────────────────────────────────────────── */

function SwipeCard({
  industry,
  exitDir,
  onTap,
  onSwipe,
}: {
  industry: Industry;
  exitDir: { x: number; y: number; rotate: number } | null;
  onTap: () => void;
  onSwipe: (type: ActionType) => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Subtle rotation tied to horizontal drag distance, like a physical card.
  const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14]);
  const passOpacity = useTransform(x, [-180, -40, 0], [1, 0.2, 0]);
  const keepOpacity = useTransform(x, [0, 40, 180], [0, 0.2, 1]);
  const edgeOpacity = useTransform(y, [-180, -40, 0], [1, 0.2, 0]);

  const stats = [
    industry.market_size_b ? `$${industry.market_size_b}B market` : industry.stats?.marketSize,
    industry.cagr_pct ? `${industry.cagr_pct}% CAGR` : industry.stats?.growth,
  ].filter(Boolean);

  return (
    <motion.div
      drag
      dragElastic={0.7}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onDragEnd={(_, info) => {
        const { offset } = info;
        if (offset.y < -SWIPE_THRESHOLD && Math.abs(offset.y) > Math.abs(offset.x)) {
          onSwipe('edge');
        } else if (offset.x > SWIPE_THRESHOLD) {
          onSwipe('keep');
        } else if (offset.x < -SWIPE_THRESHOLD) {
          onSwipe('pass');
        }
      }}
      animate={
        exitDir
          ? { x: exitDir.x, y: exitDir.y, rotate: exitDir.rotate, opacity: 0 }
          : { x: 0, y: 0, rotate: 0, opacity: 1 }
      }
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{ x, y, rotate }}
      className="absolute inset-0 rounded-2xl bg-dark-surface border border-white/12 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)] cursor-grab active:cursor-grabbing select-none overflow-hidden"
      onClick={(e) => {
        // Suppress accidental tap when finishing a drag.
        if (Math.abs(x.get()) > 6 || Math.abs(y.get()) > 6) return;
        // Don't fire tap on the action buttons.
        if ((e.target as HTMLElement).closest('[data-action-pill]')) return;
        onTap();
      }}
    >
      {/* Decision tint overlays */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ opacity: keepOpacity, background: 'linear-gradient(135deg, rgba(16,185,129,0.20), rgba(16,185,129,0))' }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ opacity: passOpacity, background: 'linear-gradient(135deg, rgba(239,68,68,0.20), rgba(239,68,68,0))' }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ opacity: edgeOpacity, background: 'linear-gradient(180deg, rgba(212,168,67,0.20), rgba(212,168,67,0))' }}
      />

      {/* Decision corner labels */}
      <motion.span
        style={{ opacity: keepOpacity }}
        className="absolute top-4 left-4 px-2.5 py-1 rounded-md border-2 border-emerald-400 text-emerald-300 text-[10px] font-bold tracking-widest uppercase rotate-[-12deg] pointer-events-none"
      >
        ✓ Keep
      </motion.span>
      <motion.span
        style={{ opacity: passOpacity }}
        className="absolute top-4 right-4 px-2.5 py-1 rounded-md border-2 border-red-400 text-red-300 text-[10px] font-bold tracking-widest uppercase rotate-[12deg] pointer-events-none"
      >
        ✕ Pass
      </motion.span>
      <motion.span
        style={{ opacity: edgeOpacity }}
        className="absolute top-4 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md border-2 border-gold text-gold text-[10px] font-bold tracking-widest uppercase pointer-events-none"
      >
        ★ Edge
      </motion.span>

      {/* Card body */}
      <div className="h-full flex flex-col p-5">
        <div className="shrink-0 flex items-start gap-3">
          <span className="text-5xl leading-none">{industry.emoji || industry.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-ivory font-serif text-[20px] font-bold leading-tight">{industry.name}</h3>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {stats.map((s) => (
                <span key={s} className="text-[10px] bg-white/8 text-ivory/60 rounded-full px-2 py-0.5">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {industry.trending_insight && (
          <div className="mt-4 bg-gold/8 border-l-2 border-gold/60 rounded-r-lg px-3 py-2.5">
            <p className="text-[9px] text-gold/70 uppercase tracking-widest mb-1">What's happening</p>
            <p className="text-ivory/85 text-[12px] leading-snug italic line-clamp-3">
              &ldquo;{industry.trending_insight}&rdquo;
            </p>
          </div>
        )}

        {industry.why_now && (
          <p className="mt-3 text-ivory/65 text-[12px] leading-snug line-clamp-3">{industry.why_now}</p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-[10px] text-ivory/35 italic">tap for the deep dive →</span>
          <span className="text-[9px] text-ivory/25 uppercase tracking-widest">swipe to choose</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── ActionButton ─────────────────────────────────────────────── */

function ActionButton({
  kind,
  disabled,
  onClick,
}: {
  kind: ActionType;
  disabled?: boolean;
  onClick: () => void;
}) {
  const meta = {
    pass: { icon: '✕', label: 'Pass', cls: 'border-red-400/40 text-red-300 hover:bg-red-500/15' },
    edge: { icon: '★', label: 'Edge', cls: 'border-gold/50 text-gold hover:bg-gold/15' },
    keep: { icon: '✓', label: 'Keep', cls: 'border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/15' },
  }[kind];

  return (
    <motion.button
      data-action-pill
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center transition-colors ${
        disabled ? 'border-white/10 text-ivory/20 cursor-not-allowed' : meta.cls
      }`}
    >
      <span className="text-lg leading-none">{meta.icon}</span>
      <span className="text-[8px] tracking-widest uppercase mt-0.5">{meta.label}</span>
    </motion.button>
  );
}
