'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import type { ScoredIdea } from '@/lib/scoring/types';

// ────────────────────────────────────────────────────────────────
// Types — we read from existing idea.deep_content + top-level fields.
// ────────────────────────────────────────────────────────────────

interface DossierIdea extends ScoredIdea {
  // already covered by ScoredIdea.idea
}

interface IdeaDossierProps {
  ideas: { scored: ScoredIdea; tier: 'nest' | 'spark' | 'wildvine' | 'your_idea' }[];
  activeIdeaId: string;
  onSelectIdea: (ideaId: string) => void;
  onCrown: (ideaId: string) => void;
  crownedIdeaId: string | null;
  whyYou?: string;
  houseName?: string;
}

const TIER_META: Record<string, { emoji: string; label: string; gradient: string }> = {
  nest: { emoji: '🏠', label: 'Nest', gradient: 'from-amber-400 to-amber-600' },
  spark: { emoji: '✨', label: 'Spark', gradient: 'from-yellow-400 to-amber-500' },
  wildvine: { emoji: '🌿', label: 'Wildvine', gradient: 'from-emerald-400 to-emerald-600' },
  your_idea: { emoji: '🔥', label: 'Your Idea', gradient: 'from-orange-400 to-red-500' },
};

// ────────────────────────────────────────────────────────────────
// 7Ps Marketing Mix — derived from existing idea fields + archetype inference
// ────────────────────────────────────────────────────────────────

interface SevenPs {
  product: string;
  price: string;
  place: string;
  promotion: string;
  people: string;
  process: string;
  physical_evidence: string;
}

function derive7Ps(idea: ScoredIdea['idea']): SevenPs {
  const domain = idea.domain_primary || '';
  const starter = idea.starter_model || '';
  const solo = idea.solo_viable;
  const team = idea.team_floor || 1;
  const enterprise = idea.is_enterprise_sales;
  const marketplace = idea.is_marketplace;
  const regulated = idea.is_regulatory_heavy;
  const hardware = idea.is_hardware_heavy;
  const offline = idea.is_local_offline;

  // Place — where it lives
  let place = 'Web app, cross-platform';
  if (marketplace) place = 'Two-sided marketplace (web + mobile), network effects from day one';
  else if (hardware) place = 'Physical product + companion app, sold D2C + retail';
  else if (offline) place = 'On-ground operations in target cities, ops team + tech layer';
  else if (domain === 'creator_tools') place = 'Web app + browser extension + mobile export, creator workflow-embedded';
  else if (domain === 'ai_automation' || domain === 'saas_productivity') place = 'Web + Slack/Notion/Teams integrations, workflow-embedded';
  else if (domain === 'community_social') place = 'Web + mobile, community-native (Discord/Circle-style)';
  else if (domain === 'fintech') place = 'Mobile-first app + web dashboard, bank partnerships for rails';
  else if (domain === 'health_wellness') place = 'Mobile app + wearable integrations, optional clinician dashboard';
  else if (domain === 'ecommerce_d2c') place = 'D2C website + marketplace presence (Amazon, Nykaa, Flipkart)';
  else if (domain === 'education') place = 'Web + mobile, LMS integrations, school/parent portals';

  // Promotion — how they find you
  let promotion = 'Content-led SEO + founder-led sales + targeted LinkedIn ads';
  if (domain === 'creator_tools' || domain === 'media_entertainment') {
    promotion = 'Creator partnerships, Twitter/X demo threads, Product Hunt, referral loops';
  } else if (domain === 'ai_automation' || domain === 'saas_productivity') {
    promotion = 'Developer-led content, dev communities (HN/Reddit), LinkedIn for decision-makers, free-tier viral loop';
  } else if (domain === 'community_social') {
    promotion = 'Founder-hosted events, niche communities, creator endorsements, early-access waitlist';
  } else if (domain === 'fintech') {
    promotion = 'Trust-building content, finance influencers, partner banks/platforms, low CAC referral rewards';
  } else if (domain === 'health_wellness') {
    promotion = 'Clinician partnerships, Instagram/YouTube testimonial content, outcome-driven case studies';
  } else if (domain === 'education') {
    promotion = 'Parent/teacher communities, outcome-focused case studies, school district partnerships';
  } else if (domain === 'ecommerce_d2c') {
    promotion = 'Instagram-first creative, performance marketing on Meta/Google, influencer seeding, content shopping';
  } else if (enterprise) {
    promotion = 'Founder-led sales, industry conferences, analyst relationships, customer reference network';
  }

  // People — who runs it
  let people = solo ? 'Solo founder viable at launch, add 1-2 specialists by month 6' : `Core team of ${team}+ at launch: builder + seller at minimum`;
  if (enterprise) people = `${people}. Enterprise requires a technical founder + sales lead with industry network`;
  if (regulated) people = `${people}. Compliance advisor on retainer from day one (legal/medical/finance)`;

  // Process — how it runs
  let process = 'Rapid iteration: weekly user interviews, 2-week feature cycles, data-driven decisions';
  if (enterprise) process = 'Enterprise sales cycle: 3-6 month close, pilot → paid, reference-driven expansion';
  else if (regulated) process = 'Compliance-first shipping: legal review gate on every feature, audit trails, certified workflows';
  else if (marketplace) process = 'Supply-first manual seeding → demand onboarding → matching engine → flywheel';
  else if (hardware) process = 'Hardware cycle: prototype → 100-unit pilot → regulatory clearance → scale manufacturing';

  // Physical Evidence — how they know it's real
  let physical = 'Landing page case studies, live product demos, public usage metrics, transparent pricing';
  if (domain === 'creator_tools' || domain === 'media_entertainment') {
    physical = 'Creator testimonials with before/after metrics, public roadmap, open Twitter building';
  } else if (regulated) {
    physical = 'Certifications (HIPAA/SOC2/RBI/ISO), audit reports, transparent compliance pages, enterprise reference calls';
  } else if (enterprise) {
    physical = 'Case studies with logos, ROI calculators, analyst reports, security & compliance pages';
  } else if (marketplace || domain === 'community_social') {
    physical = 'Visible network size, live activity feeds, transparent matching/engagement metrics';
  } else if (hardware || domain === 'ecommerce_d2c') {
    physical = 'Product reviews, unboxing content, material/sourcing stories, return/warranty transparency';
  }

  // Product — use the idea's own one-liner + pain/promise
  const product = idea.one_liner || 'Defined in your dossier above';

  // Price — parse the starter_model
  const price = starter || 'Starter model: define in pilot phase based on customer willingness-to-pay';

  return { product, price, place, promotion, people, process, physical_evidence: physical };
}

// ────────────────────────────────────────────────────────────────
// Persona derivation — build an ICP card from the idea's fields
// ────────────────────────────────────────────────────────────────

interface Persona {
  headline: string;
  archetype: string;
  topDrivers: { label: string; score: number }[];
  budget_signal: string;
  buying_moment: string;
  objection: string;
}

function derivePersona(idea: ScoredIdea['idea']): Persona {
  const archetype = idea.customer_archetype || idea.icp?.summary || 'Target customer';
  const motives: { label: string; score: number }[] = [
    { label: 'Freedom',   score: idea.motive_freedom   || 0 },
    { label: 'Wealth',    score: idea.motive_wealth    || 0 },
    { label: 'Status',    score: idea.motive_status    || 0 },
    { label: 'Mastery',   score: idea.motive_mastery   || 0 },
    { label: 'Impact',    score: idea.motive_impact    || 0 },
    { label: 'Belonging', score: idea.motive_belonging || 0 },
    { label: 'Creativity',score: idea.motive_creativity|| 0 },
    { label: 'Stability', score: idea.motive_stability || 0 },
  ].sort((a, b) => b.score - a.score);
  const topDrivers = motives.slice(0, 3);

  const budgetInr = idea.budget_floor_inr || 50000;
  let budget_signal = `Willing to spend around ₹${(budgetInr / 1000).toFixed(0)}K-${((budgetInr * 3) / 1000).toFixed(0)}K on tools that solve this pain`;
  if (budgetInr >= 500000) budget_signal = `Enterprise buyer — line-item budget ₹${(budgetInr / 100000).toFixed(1)}L+, decision by committee`;
  else if (budgetInr >= 100000) budget_signal = `Mid-market buyer — ₹${(budgetInr / 1000).toFixed(0)}K-${((budgetInr * 2) / 1000).toFixed(0)}K, VP-level approval needed`;
  else if (budgetInr < 20000) budget_signal = `Prosumer — up to ₹${((budgetInr * 2) / 1000).toFixed(0)}K/month willingly, self-serve decision`;

  const d = idea.deep_content as Record<string, unknown> | undefined;
  const cp = (d?.consumer_psychology as Record<string, string> | undefined);

  const buying_moment = cp?.jobs_to_be_done
    ? `"${cp.jobs_to_be_done}"`
    : 'A specific high-stakes moment — a deadline, a promise, a visible failure — forces them to find a solution within days, not months.';

  const objection = 'Switching costs and trust. "How do I know this actually works for someone like me, without me having to change three other tools?"';

  const headline = idea.icp?.summary || archetype.split(/[,—-]/)[0].trim();

  return { headline, archetype, topDrivers, budget_signal, buying_moment, objection };
}

// ────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────

export function IdeaDossier({
  ideas,
  activeIdeaId,
  onSelectIdea,
  onCrown,
  crownedIdeaId,
  whyYou,
  houseName,
}: IdeaDossierProps) {
  const active = ideas.find((i) => i.scored.idea.idea_id === activeIdeaId) || ideas[0];
  const idea = active.scored.idea;
  const tier = active.tier;
  const scored = active.scored;
  const deepRaw = (idea as unknown as { deep_content?: Record<string, unknown> }).deep_content;

  const psych = (deepRaw?.consumer_psychology as Record<string, string> | undefined);
  const pestle = (deepRaw?.pestle as Record<string, string> | undefined);
  const aiLayers = (deepRaw?.ai_layers as string[] | undefined) || [];
  const marketData = (deepRaw?.market_data as Record<string, unknown> | undefined);
  const competitors = (deepRaw?.competitors as { name: string; weakness: string; market_share_pct: number }[] | undefined) || [];
  const positioning = (deepRaw?.positioning as string | undefined);
  const revenueModel = (deepRaw?.revenue_model as Record<string, string> | undefined);
  const firstSteps = (deepRaw?.first_steps as { step: number; action: string; timeline: string }[] | undefined) || [];
  const honestRisk = (deepRaw?.honest_risk as string | undefined);
  const whyNow = (deepRaw?.why_now as string) || idea.why_now || '';
  const growthChart = (marketData?.growth_chart as { year: string; value: number; projected?: boolean }[] | undefined) || [];
  const fitScores = (marketData?.fit_scores as Record<string, number> | undefined) || {
    skill_fit: Math.round(Math.min(100, scored.displayScore)),
    market_timing: 70,
    capital_efficiency: 65,
    execution_ease: 60,
    passion_alignment: scored.displayScore,
  };

  const sevenPs = useMemo(() => derive7Ps(idea), [idea.idea_id]);
  const persona = useMemo(() => derivePersona(idea), [idea.idea_id]);

  const meta = TIER_META[tier];
  const isCrowned = crownedIdeaId === idea.idea_id;

  const radarData = [
    { axis: 'Skill', value: fitScores.skill_fit },
    { axis: 'Market', value: fitScores.market_timing },
    { axis: 'Capital', value: fitScores.capital_efficiency },
    { axis: 'Execution', value: fitScores.execution_ease },
    { axis: 'Passion', value: fitScores.passion_alignment },
  ];

  return (
    <div className="h-full flex flex-col" data-testid="idea-dossier">
      {/* ── Top tabs: switch between the 3 ideas ── */}
      <div className="shrink-0 flex gap-1.5 pb-2 overflow-x-auto scrollbar-none">
        {ideas.map(({ scored: s, tier: t }) => {
          const tMeta = TIER_META[t];
          const isActive = s.idea.idea_id === activeIdeaId;
          const isThisCrowned = crownedIdeaId === s.idea.idea_id;
          return (
            <button
              key={s.idea.idea_id}
              onClick={() => onSelectIdea(s.idea.idea_id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-left transition-all border ${
                isActive
                  ? 'bg-gold/15 border-gold/60 shadow-[0_0_12px_rgba(212,168,67,0.25)]'
                  : 'bg-white/3 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[11px]">{tMeta.emoji}</span>
                <span className="text-[9px] font-mono uppercase tracking-wider text-ivory/50">{tMeta.label}</span>
                {isThisCrowned && <span className="text-[10px]">👑</span>}
                <span className="text-[10px] font-mono text-gold ml-auto">{s.displayScore}%</span>
              </div>
              <p className={`text-[12px] font-serif leading-tight ${isActive ? 'text-ivory' : 'text-ivory/70'}`}>
                {s.idea.idea_name}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Scrollable dossier body ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-1 px-1 space-y-6 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={idea.idea_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* ═══════════════════════════════════ */}
            {/* SECTION 1 — HERO */}
            {/* ═══════════════════════════════════ */}
            <section className="relative rounded-2xl overflow-hidden">
              <div className={`h-[3px] bg-gradient-to-r ${meta.gradient}`} />
              <div className="bg-dark-surface/90 backdrop-blur-sm p-5 border-x border-b border-white/10 rounded-b-2xl">
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gold/70 mt-1">{meta.label}</span>
                  <span className="ml-auto text-[11px] font-mono text-gold bg-gold/10 border border-gold/30 rounded-full px-2.5 py-0.5">
                    {scored.displayScore}% match
                  </span>
                </div>
                <h1 className="text-[28px] sm:text-[34px] font-serif font-bold text-ivory leading-[1.1] mb-2">
                  {idea.idea_name}
                </h1>
                <p className="text-ivory/65 text-[15px] leading-snug mb-4 italic">
                  {idea.one_liner}
                </p>
                {idea.pain_to_promise && (
                  <div className="border-l-2 border-gold/50 pl-3 py-1 bg-white/3 rounded-r-lg">
                    <p className="text-[11px] uppercase tracking-widest text-gold/60 mb-1">The Pain → Promise</p>
                    <p className="text-ivory/80 text-[13px] leading-relaxed">{idea.pain_to_promise}</p>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold/70 border border-gold/20">
                    {idea.domain_primary?.replace(/_/g, ' ')}
                  </span>
                  {idea.solo_viable && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20">
                      solo-viable
                    </span>
                  )}
                  {idea.time_floor_weeks && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-ivory/50 border border-white/10">
                      ~{idea.time_floor_weeks} weeks to MVP
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* ═══════════════════════════════════ */}
            {/* SECTION 2 — THE FIT (why you + radar) */}
            {/* ═══════════════════════════════════ */}
            <DossierSection
              index="01"
              label="The Fit"
              title="Why the garden chose this for you"
              color="#D4A843"
            >
              <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center">
                <div className="text-ivory/80 text-[13px] leading-relaxed">
                  {whyYou && whyYou !== '__loading__'
                    ? whyYou
                    : `Your instincts pointed here. As ${houseName ? `a ${houseName}` : 'the founder you are'}, your reading of ${idea.domain_primary?.replace(/_/g, ' ')} is sharper than most. Trust the pull.`}
                </div>
                <div className="w-full h-[180px] min-w-[220px]">
                  <ResponsiveContainer>
                    <RadarChart data={radarData} outerRadius={65}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="axis" tick={{ fill: 'rgba(245,240,232,0.5)', fontSize: 10 }} />
                      <PolarRadiusAxis stroke="rgba(255,255,255,0)" domain={[0, 100]} tick={false} />
                      <Radar
                        dataKey="value"
                        stroke="#D4A843"
                        fill="#D4A843"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </DossierSection>

            {/* ═══════════════════════════════════ */}
            {/* SECTION 3 — UNDERLYING NEED & MOTIVATIONAL CONFLICT */}
            {/* ═══════════════════════════════════ */}
            {psych && (
              <DossierSection index="02" label="Underlying Need" title="What this really solves" color="#EC4899">
                <div className="space-y-3">
                  <div className="grid md:grid-cols-3 gap-2">
                    <LevelCard
                      level="L1"
                      label="SURFACE WANT"
                      text={psych.level1_want}
                      color="rgba(148,163,184,0.6)"
                    />
                    <LevelCard
                      level="L2"
                      label="DEEPER NEED"
                      text={psych.level2_need}
                      color="rgba(236,72,153,0.8)"
                    />
                    <LevelCard
                      level="L3"
                      label="CORE DESIRE"
                      text={psych.level3_desire}
                      color="rgba(212,168,67,1)"
                    />
                  </div>
                  {psych.motivational_conflict && (
                    <div className="bg-orange-500/8 border border-orange-500/25 rounded-xl p-4 mt-3">
                      <p className="text-[10px] uppercase tracking-widest text-orange-400/80 mb-1.5">⚡ The motivational conflict</p>
                      <p className="text-ivory/85 text-[13px] leading-relaxed italic">
                        &ldquo;{psych.motivational_conflict}&rdquo;
                      </p>
                    </div>
                  )}
                  {psych.jobs_to_be_done && (
                    <div className="bg-white/4 border border-white/10 rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-widest text-ivory/40 mb-1.5">📋 Jobs-to-be-done</p>
                      <p className="text-ivory/75 text-[13px] leading-relaxed">{psych.jobs_to_be_done}</p>
                    </div>
                  )}
                </div>
              </DossierSection>
            )}

            {/* ═══════════════════════════════════ */}
            {/* SECTION 4 — ICP PERSONA */}
            {/* ═══════════════════════════════════ */}
            <DossierSection index="03" label="Your ICP" title="Who you're building for" color="#38BDF8">
              <div className="grid md:grid-cols-[auto_1fr] gap-4 items-start">
                {/* Persona avatar + name */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-[32px] border-2 border-sky-400/40"
                    style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.2), rgba(56,189,248,0.05))' }}
                  >
                    👤
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-sky-400/70 text-center">Persona</p>
                </div>
                {/* Persona details */}
                <div className="space-y-3 min-w-0">
                  <p className="text-ivory/90 text-[14px] font-medium leading-snug">{persona.headline}</p>
                  <p className="text-ivory/55 text-[12px] leading-relaxed">{persona.archetype}</p>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-ivory/40 mb-1.5">Top motivations</p>
                    <div className="space-y-1">
                      {persona.topDrivers.map((d) => (
                        <div key={d.label} className="flex items-center gap-2">
                          <span className="text-[11px] text-ivory/70 w-20 shrink-0">{d.label}</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round(d.score * 100)}%`,
                                background: 'linear-gradient(90deg, #38BDF8, #0EA5E9)',
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-sky-400/70 w-9 text-right">{Math.round(d.score * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/4 rounded-xl p-3 space-y-2">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-ivory/40 mb-0.5">💰 Budget signal</p>
                      <p className="text-ivory/75 text-[12px] leading-snug">{persona.budget_signal}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-ivory/40 mb-0.5">⏱ Buying moment</p>
                      <p className="text-ivory/75 text-[12px] leading-snug italic">{persona.buying_moment}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-ivory/40 mb-0.5">🚧 Objection you'll hear</p>
                      <p className="text-ivory/75 text-[12px] leading-snug">{persona.objection}</p>
                    </div>
                  </div>
                </div>
              </div>
            </DossierSection>

            {/* ═══════════════════════════════════ */}
            {/* SECTION 5 — MARKET SHAPE */}
            {/* ═══════════════════════════════════ */}
            {marketData && (
              <DossierSection index="04" label="Market Shape" title="Where the money lives" color="#34D399">
                <div className="space-y-4">
                  {/* TAM/SAM/SOM bars */}
                  <div className="space-y-2">
                    {[
                      { label: 'TAM — Total addressable', value: `$${marketData.tam_b}B`, pct: 100, color: '#34D399' },
                      { label: 'SAM — Serviceable', value: `$${marketData.sam_b}B`, pct: Math.min(100, ((marketData.sam_b as number) / (marketData.tam_b as number)) * 100), color: '#10B981' },
                      { label: 'SOM — Your slice (yr 3)', value: `$${marketData.som_m}M`, pct: Math.min(100, ((marketData.som_m as number) / ((marketData.tam_b as number) * 1000)) * 100 * 50), color: '#D4A843' },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] text-ivory/60">{m.label}</span>
                          <span className="text-[11px] font-mono font-semibold" style={{ color: m.color }}>{m.value}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${m.pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: m.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Growth chart */}
                  {growthChart.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-widest text-ivory/40">Market growth ($B)</p>
                        {marketData.growth_cagr && (
                          <p className="text-[11px] font-mono text-emerald-400">+{marketData.growth_cagr as number}% CAGR</p>
                        )}
                      </div>
                      <div className="h-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={growthChart}>
                            <defs>
                              <linearGradient id={`dgrad-${idea.idea_id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34D399" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#34D399"
                              strokeWidth={2}
                              fill={`url(#dgrad-${idea.idea_id})`}
                              dot={{ fill: '#34D399', r: 3 }}
                            />
                            <XAxis dataKey="year" tick={{ fill: 'rgba(245,240,232,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip
                              contentStyle={{ background: '#14171E', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, fontSize: 11 }}
                              labelStyle={{ color: 'rgba(245,240,232,0.5)' }}
                              formatter={(v) => [`$${v}B`, 'Market']}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Revenue model + unit economics */}
                  {revenueModel && (
                    <div className="bg-white/3 border border-white/8 rounded-xl p-3">
                      <p className="text-[10px] uppercase tracking-widest text-ivory/40 mb-1.5">💰 Revenue model</p>
                      <p className="text-ivory/80 text-[12px] mb-1">{revenueModel.primary}</p>
                      {revenueModel.secondary && <p className="text-ivory/55 text-[11px]">+ {revenueModel.secondary}</p>}
                      {revenueModel.unit_economics && (
                        <p className="text-emerald-400/80 text-[11px] mt-1.5 font-mono">{revenueModel.unit_economics}</p>
                      )}
                    </div>
                  )}
                </div>
              </DossierSection>
            )}

            {/* ═══════════════════════════════════ */}
            {/* SECTION 6 — POSITIONING & COMPETITORS */}
            {/* ═══════════════════════════════════ */}
            {(positioning || competitors.length > 0) && (
              <DossierSection index="05" label="Positioning" title="How you win against who's there" color="#F59E0B">
                {positioning && (
                  <div className="bg-gold/10 border-l-2 border-gold rounded-r-xl px-4 py-3 mb-4">
                    <p className="text-[10px] uppercase tracking-widest text-gold/70 mb-1">📍 Positioning statement</p>
                    <p className="text-ivory/85 text-[13px] leading-relaxed italic">&ldquo;{positioning}&rdquo;</p>
                  </div>
                )}
                {competitors.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-ivory/40 mb-2">⚔️ The competitive set</p>
                    <div className="space-y-2">
                      {competitors.map((c) => (
                        <div key={c.name} className="bg-white/3 border border-white/8 rounded-xl p-3">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-ivory/90 text-[13px] font-semibold">{c.name}</p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-rose-400/60 rounded-full"
                                  style={{ width: `${c.market_share_pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-ivory/50 w-9 text-right">{c.market_share_pct}%</span>
                            </div>
                          </div>
                          <p className="text-ivory/55 text-[11.5px] leading-snug">
                            <span className="text-gold/70 font-semibold">Their gap: </span>
                            {c.weakness}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </DossierSection>
            )}

            {/* ═══════════════════════════════════ */}
            {/* SECTION 7 — MARKETING MIX (7Ps) */}
            {/* ═══════════════════════════════════ */}
            <DossierSection index="06" label="Marketing Mix" title="The 7 Ps, mapped to this idea" color="#A855F7">
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  { icon: '🎯', label: 'Product', text: sevenPs.product },
                  { icon: '💰', label: 'Price', text: sevenPs.price },
                  { icon: '📍', label: 'Place', text: sevenPs.place },
                  { icon: '📣', label: 'Promotion', text: sevenPs.promotion },
                  { icon: '👥', label: 'People', text: sevenPs.people },
                  { icon: '⚙️', label: 'Process', text: sevenPs.process },
                  { icon: '🧾', label: 'Physical Evidence', text: sevenPs.physical_evidence },
                ].map((p) => (
                  <div key={p.label} className="bg-white/3 border border-white/8 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[13px]">{p.icon}</span>
                      <p className="text-[10px] uppercase tracking-widest text-violet-400/70 font-semibold">{p.label}</p>
                    </div>
                    <p className="text-ivory/75 text-[12px] leading-snug">{p.text}</p>
                  </div>
                ))}
              </div>
            </DossierSection>

            {/* ═══════════════════════════════════ */}
            {/* SECTION 8 — AI MOAT / AI LAYERS */}
            {/* ═══════════════════════════════════ */}
            {aiLayers.length > 0 && (
              <DossierSection index="07" label="AI Moat" title="Where the defensibility actually lives" color="#6366F1">
                <div className="space-y-2">
                  {aiLayers.map((layer, i) => (
                    <div key={i} className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-[10px] font-bold text-indigo-200 shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-ivory/80 text-[12.5px] leading-relaxed">{layer}</p>
                    </div>
                  ))}
                </div>
                {idea.aiAdvantage && (
                  <div className="mt-3 bg-white/3 border border-white/8 rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-widest text-ivory/40 mb-1">Your specific edge</p>
                    <p className="text-ivory/70 text-[12px] leading-snug">{idea.aiAdvantage}</p>
                  </div>
                )}
              </DossierSection>
            )}

            {/* ═══════════════════════════════════ */}
            {/* SECTION 9 — FIRST 30 DAYS */}
            {/* ═══════════════════════════════════ */}
            {firstSteps.length > 0 && (
              <DossierSection index="08" label="First 30 Days" title="The move order that works" color="#10B981">
                <div className="space-y-2.5">
                  {firstSteps.map(({ step, action, timeline }) => (
                    <div key={step} className="flex gap-3 items-start">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-[13px] font-bold shrink-0">
                        {step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-ivory/85 text-[13px] leading-snug">{action}</p>
                        <span className="inline-block mt-1 text-[10px] bg-emerald-500/10 text-emerald-400/80 rounded-full px-2 py-0.5 border border-emerald-500/20">
                          {timeline}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </DossierSection>
            )}

            {/* ═══════════════════════════════════ */}
            {/* SECTION 10 — CONTEXT (PESTLE) */}
            {/* ═══════════════════════════════════ */}
            {pestle && (
              <DossierSection index="09" label="Context" title="The forces shaping this moment" color="#14B8A6">
                {whyNow && (
                  <div className="border-l-2 border-teal-400/60 pl-3 py-1 mb-3">
                    <p className="text-[10px] uppercase tracking-widest text-teal-400/70 mb-1">🌊 Why now</p>
                    <p className="text-ivory/75 text-[12.5px] leading-relaxed">{whyNow}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['political', '🏛️', 'Political'],
                    ['economic', '💰', 'Economic'],
                    ['social', '👥', 'Social'],
                    ['technological', '⚡', 'Technological'],
                    ['legal', '⚖️', 'Legal'],
                    ['environmental', '🌱', 'Environmental'],
                  ] as const).map(([k, icon, label]) =>
                    pestle[k] ? (
                      <div key={k} className="bg-white/3 border border-white/8 rounded-xl p-2.5">
                        <p className="text-[9px] uppercase tracking-widest text-ivory/40 mb-1">{icon} {label}</p>
                        <p className="text-ivory/70 text-[11px] leading-snug">{pestle[k]}</p>
                      </div>
                    ) : null
                  )}
                </div>
              </DossierSection>
            )}

            {/* ═══════════════════════════════════ */}
            {/* SECTION 11 — THE HONEST RISK */}
            {/* ═══════════════════════════════════ */}
            {honestRisk && (
              <DossierSection index="10" label="The Risk" title="What kills this if you're not careful" color="#EF4444">
                <div className="bg-red-500/8 border border-red-500/25 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-red-400/80 mb-1.5">⚠️ The honest read</p>
                  <p className="text-ivory/80 text-[13px] leading-relaxed">{honestRisk}</p>
                </div>
              </DossierSection>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Sticky Crown CTA at bottom ── */}
      {!isCrowned && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 pt-2"
        >
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(212,168,67,0.55)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onCrown(idea.idea_id)}
            data-testid="dossier-crown-cta"
            className="w-full h-14 rounded-2xl font-bold text-[16px] text-dark bg-gold hover:bg-gold/95 border border-gold/60 shadow-[0_0_18px_rgba(212,168,67,0.4)] flex items-center justify-center gap-2 transition-all"
          >
            👑 Crown this idea — make it yours
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────

function DossierSection({
  index, label, title, color, children,
}: {
  index: string;
  label: string;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-dark-surface/60 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-3">
      <div className="flex items-baseline gap-3">
        <span className="text-[10px] font-mono text-ivory/30">{index}</span>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-0.5" style={{ color }}>
            {label}
          </p>
          <h3 className="text-[18px] font-serif font-bold text-ivory leading-tight">{title}</h3>
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

function LevelCard({ level, label, text, color }: { level: string; label: string; text: string; color: string }) {
  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        background: `linear-gradient(180deg, ${color}10 0%, ${color}03 100%)`,
        borderColor: `${color}30`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[11px] font-mono font-bold" style={{ color }}>{level}</span>
        <p className="text-[9px] uppercase tracking-widest" style={{ color }}>{label}</p>
      </div>
      <p className="text-ivory/80 text-[12px] leading-relaxed">{text}</p>
    </div>
  );
}
