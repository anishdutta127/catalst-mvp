'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { analytics } from '@/lib/analytics';
import type { ScoredIdea } from '@/lib/scoring/types';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { FitRadar } from '@/components/ui/FitRadar';
import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts';

/**
 * S09 — Ideas Revealed (enriched)
 *
 * Staggered card reveal, gradient header, crown mechanic,
 * accordion deep-dive, SELL ZONE with WhatsApp CTA.
 */

const TIER_META = {
  nest: { emoji: '🏠', label: 'Nest', desc: 'Safest, highest feasibility' },
  spark: { emoji: '✨', label: 'Spark', desc: 'Strongest overall match' },
  wildvine: { emoji: '🌿', label: 'Wildvine', desc: 'Bold leap, different domain' },
  your_idea: { emoji: '🔥', label: 'Your Idea', desc: 'Your submitted idea' },
};

const WHATSAPP_NUMBER = '919686917041';

export function S09Ideas() {
  const matchedIdeas = useJourneyStore((s) => s.matchedIdeas);
  const houseId = useJourneyStore((s) => s.houseId);
  const crownedIdeaId = useJourneyStore((s) => s.crownedIdeaId);
  const crownIdea = useJourneyStore((s) => s.crownIdea);
  const whyYouTexts = useJourneyStore((s) => s.whyYouTexts);
  const setWhyYouText = useJourneyStore((s) => s.setWhyYouText);
  const sessionId = useJourneyStore((s) => s.sessionId);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const goToScreen = useJourneyStore((s) => s.goToScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const dialogueSent = useRef(false);

  useEffect(() => {
    if (!matchedIdeas) { goToScreen('s08'); return; }
  }, [matchedIdeas, goToScreen]);

  useEffect(() => {
    if (dialogueSent.current || !matchedIdeas) return;
    dialogueSent.current = true;
    enqueueMessage({ speaker: 'cedric', text: lines.s09.cedric.reveal1, type: 'dialogue' });
    setTimeout(() => enqueueMessage({ speaker: 'pip', text: lines.s09.pip.reveal, type: 'dialogue' }), 2000);
  }, [enqueueMessage, matchedIdeas]);

  if (!matchedIdeas) return null;

  const ideas: { scored: ScoredIdea; tier: keyof typeof TIER_META }[] = [
    { scored: matchedIdeas.nest, tier: 'nest' },
    { scored: matchedIdeas.spark, tier: 'spark' },
    { scored: matchedIdeas.wildvine, tier: 'wildvine' },
  ];
  if (matchedIdeas.yourIdea) ideas.unshift({ scored: matchedIdeas.yourIdea, tier: 'your_idea' });

  function handleCrown(ideaId: string) {
    crownIdea(ideaId);
    fetchWhyYou(ideaId);
  }

  function fetchWhyYou(ideaId: string) {
    if (whyYouTexts[ideaId]) return;
    const idea = ideas.find((i) => i.scored.idea.idea_id === ideaId);
    if (!idea) return;
    setWhyYouText(ideaId, '__loading__');
    fetch('/api/narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'whyYou', sessionId,
        context: { ideaName: idea.scored.idea.idea_name, ideaOneLiner: idea.scored.idea.one_liner, houseId: houseId || 'founder', topStrengths: 'determination and vision' },
      }),
    })
      .then((r) => r.json())
      .then((d) => setWhyYouText(ideaId, d.text))
      .catch(() => setWhyYouText(ideaId, `Your instincts led you here. ${idea.scored.idea.idea_name} fits the way you think.`));
  }

  function toggleSection(key: string) { setExpandedSection((s) => (s === key ? null : key)); }

  function getWhatsAppUrl(scored: ScoredIdea) {
    const msg = encodeURIComponent(`Hi Anish! I just found my idea on Catalst. I'm a ${houseId || 'founder'} founder. My top match: ${scored.idea.idea_name} in ${scored.idea.domain_primary}. I want to book a 30-min strategy call (₹500).`);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  }

  const crowned = ideas.find((i) => i.scored.idea.idea_id === crownedIdeaId);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pb-4" data-testid="s09-ideas">
      {/* Idea cards — staggered reveal */}
      <div className="flex flex-col sm:flex-row gap-3">
        {ideas.map(({ scored, tier }, idx) => {
          const isCrowned = crownedIdeaId === scored.idea.idea_id;
          const meta = TIER_META[tier];
          const isDimmed = !!crownedIdeaId && !isCrowned;

          return (
            <motion.button
              key={scored.idea.idea_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isDimmed ? 0.5 : 1, y: 0 }}
              transition={{ delay: idx * 0.15, duration: 0.4 }}
              onClick={() => handleCrown(scored.idea.idea_id)}
              data-testid={`idea-card-${tier}`}
              className={`flex-1 rounded-xl overflow-hidden text-left transition-all ${
                isCrowned ? 'ring-2 ring-gold shadow-[0_0_16px_rgba(212,168,67,0.3)] scale-[1.02]' :
                'hover:ring-1 hover:ring-white/20'
              } cursor-pointer`}
            >
              {/* Gradient header bar */}
              <div className="h-1" style={{ background: `linear-gradient(90deg, #D4A843, ${tier === 'wildvine' ? '#059669' : '#F59E0B'})` }} />

              <div className="bg-dark-surface p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">{meta.emoji}</span>
                  <span className="text-[10px] font-mono text-gold/60 uppercase tracking-wider">{meta.label}</span>
                  {isCrowned && <span className="ml-1">👑</span>}
                  <span className="ml-auto text-xs font-mono text-gold">{scored.displayScore}%</span>
                </div>
                <h3 className="text-base font-serif text-ivory mb-1">{scored.idea.idea_name}</h3>
                <p className="text-xs text-ivory/50 leading-relaxed line-clamp-2">{scored.idea.one_liner}</p>
                <div className="mt-2 flex gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold/70 border border-gold/20">
                    {scored.idea.domain_primary.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Crowned idea deep dive */}
      {crowned && (() => {
        const idea = crowned.scored.idea;
        const whyYou = whyYouTexts[crownedIdeaId!];
        // Derive fit scores from idea properties + score
        const fitScores = {
          skill_fit: Math.round(Math.min(100, crowned.scored.displayScore + (idea.builder_fit || 0.5) * 20)),
          market_timing: Math.round(Math.min(100, 50 + (idea.novelty_score || 5) * 5)),
          capital_efficiency: Math.round(Math.min(100, idea.solo_viable ? 85 : 60)),
          execution_ease: Math.round(Math.min(100, (1 - (idea.time_floor_weeks || 4) / 24) * 100)),
          passion_alignment: Math.round(Math.min(100, crowned.scored.displayScore + 5)),
        };

        // Market size from idea stats
        const marketStats = idea.analytics || {} as Record<string, string>;

        const dc = (idea as unknown as Record<string, unknown>).deep_content as Record<string, unknown> | undefined;
        const cp = dc?.consumer_psychology as Record<string, string> | undefined;
        const md = dc?.market_data as Record<string, unknown> | undefined;
        const pestle = dc?.pestle as Record<string, string> | undefined;
        const competitors = dc?.competitors as Array<{ name: string; weakness: string; market_share_pct: number }> | undefined;
        const revenueModel = dc?.revenue_model as Record<string, string> | undefined;
        const firstSteps = dc?.first_steps as Array<{ step: number; action: string; timeline: string }> | undefined;
        const growthChart = md?.growth_chart as Array<{ year: string; value: number }> | undefined;

        const sections = [
          { key: 'idea', title: 'The Idea', content: idea.pain_to_promise, jsx: cp?.jobs_to_be_done ? (
            <div className="p-4 space-y-3">
              <p className="text-ivory/80 text-[14px] leading-relaxed">{idea.pain_to_promise}</p>
              <div className="bg-gold/8 border-l-2 border-gold px-4 py-3 rounded-r-xl">
                <p className="text-[10px] text-gold/60 uppercase tracking-wider mb-1">The job this idea does</p>
                <p className="text-ivory/80 text-[13px] italic leading-relaxed">&ldquo;{cp.jobs_to_be_done}&rdquo;</p>
              </div>
            </div>
          ) : null as React.ReactNode },
          { key: 'why', title: 'Why You', content: whyYou || '', jsx: (whyYou && whyYou !== '__loading__') ? (
            <div className="p-4 space-y-3">
              <p className="text-ivory/70 text-[13px] leading-relaxed">{whyYou}</p>
              <div className="flex flex-col items-center pt-2">
                <p className="text-[10px] text-ivory/35 uppercase tracking-wider mb-2">Your founder fit</p>
                <FitRadar scores={fitScores} />
                <p className="text-[10px] text-ivory/25 italic mt-1">Gold = your profile. Grey = average founder.</p>
              </div>
            </div>
          ) : null as React.ReactNode },
          { key: 'market', title: 'The Market', content: '', jsx: (
            <div className="p-4 space-y-4">
              <p className="text-xs text-ivory/50 leading-relaxed">{idea.domain_primary.replace(/_/g, ' ')} — {idea.why_now}</p>
              {growthChart && growthChart.length > 0 && (
                <div>
                  <p className="text-[10px] text-ivory/40 uppercase tracking-wider mb-2">Market Growth ($B)</p>
                  <div className="h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={growthChart}>
                        <defs><linearGradient id={`ig-${idea.idea_id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4A843" stopOpacity={0.4}/><stop offset="95%" stopColor="#D4A843" stopOpacity={0}/></linearGradient></defs>
                        <Area type="monotone" dataKey="value" stroke="#D4A843" strokeWidth={2} fill={`url(#ig-${idea.idea_id})`} dot={false}/>
                        <XAxis dataKey="year" tick={{fill:'rgba(255,255,255,0.25)',fontSize:9}} axisLine={false} tickLine={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {pestle && (
                <div>
                  <p className="text-[10px] text-ivory/35 uppercase tracking-wider mb-2">Context scan</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[['political','🏛️','Political'],['economic','💰','Economic'],['social','👥','Social'],['technological','⚡','Tech'],['legal','⚖️','Legal'],['environmental','🌱','Green']].map(([key,icon,label]) => (
                      pestle[key] ? (
                        <div key={key} className="bg-white/4 rounded-xl p-2.5">
                          <p className="text-[9px] text-ivory/30 uppercase tracking-wider mb-0.5">{icon} {label}</p>
                          <p className="text-ivory/65 text-[11px] leading-snug">{pestle[key]}</p>
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) },
          { key: 'steps', title: 'First Steps', content: '', jsx: (
            <div className="p-4 space-y-3">
              {(firstSteps || [
                {step:1, action: idea.quickStart.week1, timeline:'Week 1'},
                {step:2, action: idea.quickStart.mvp, timeline:'Week 2-4'},
                {step:3, action: idea.quickStart.firstCustomers, timeline:'Month 2'},
              ]).map(({step, action, timeline}) => (
                <div key={step} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-gold text-[12px] font-bold flex-shrink-0 mt-0.5">{step}</div>
                  <div className="flex-1">
                    <p className="text-ivory text-[13px] font-medium leading-snug">{action}</p>
                    <span className="inline-block mt-1 text-[10px] bg-white/8 text-ivory/40 rounded-full px-2 py-0.5">{timeline}</span>
                  </div>
                </div>
              ))}
            </div>
          ) },
          { key: 'risk', title: 'The Risk', content: '', jsx: (
            <div className="p-4 space-y-4">
              <div className="bg-orange-500/8 border border-orange-500/25 rounded-xl p-4">
                <p className="text-[9px] text-orange-400/70 uppercase tracking-wider mb-2">The honest risk</p>
                <p className="text-ivory/80 text-[13px] leading-relaxed">{(dc?.honest_risk as string) || idea.proof.gap}</p>
              </div>
              {competitors && competitors.length > 0 && (
                <div>
                  <p className="text-[10px] text-ivory/35 uppercase tracking-wider mb-2">Competition</p>
                  {competitors.map((c) => (
                    <div key={c.name} className="flex items-start gap-3 py-2.5 border-b border-white/6 last:border-0">
                      <div className="flex-1">
                        <p className="text-ivory/80 text-[13px] font-medium">{c.name}</p>
                        <p className="text-ivory/40 text-[11px] mt-0.5">Gap: {c.weakness}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[11px] text-ivory/40">{c.market_share_pct}% share</p>
                        <div className="w-16 h-1.5 bg-white/10 rounded-full mt-1"><div className="h-full bg-red-400/50 rounded-full" style={{width:`${c.market_share_pct}%`}}/></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {revenueModel && (
                <div className="bg-white/4 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] text-ivory/35 uppercase tracking-wider">Revenue model</p>
                  <p className="text-ivory/70 text-[12px]">{revenueModel.primary}</p>
                  {revenueModel.secondary && <p className="text-ivory/45 text-[11px]">+ {revenueModel.secondary}</p>}
                </div>
              )}
            </div>
          ) },
        ];

        return (
          <div className="flex flex-col gap-1">
            {sections.map((sec) => (
              <div key={sec.key} className="bg-dark-surface border border-white/10 rounded-lg overflow-hidden" data-testid={`accordion-${sec.title}`}>
                <button onClick={() => toggleSection(sec.key)} className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer">
                  <span className="text-xs font-semibold text-ivory/70">{sec.title}</span>
                  <span className="text-ivory/30 text-xs">{expandedSection === sec.key ? '−' : '+'}</span>
                </button>
                <AnimatePresence>
                  {expandedSection === sec.key && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      {sec.jsx ? sec.jsx : (
                      <div className="px-4 pb-3">
                        {sec.content === '__loading__' ? (
                          <div className="animate-pulse space-y-2">
                            <div className="h-3 bg-white/10 rounded w-3/4" />
                            <div className="h-3 bg-white/10 rounded w-1/2" />
                          </div>
                        ) : (
                          <p className="text-xs text-ivory/50 leading-relaxed whitespace-pre-line">{sec.content}</p>
                        )}
                      </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        );
      })()}

      {/* SELL ZONE */}
      {crowned && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-dark-surface border-2 border-gold/30 rounded-2xl p-6 text-center space-y-3">
          <h4 className="text-[22px] font-serif text-ivory">YOUR IDEA. BUILT. SHIPPED. IN 7 DAYS.</h4>
          <div className="flex gap-2 justify-center flex-wrap">
            {['⚡ Claude Code experts', '🏗️ Full MVP', '📱 Real product'].map((p) => (
              <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold/70">{p}</span>
            ))}
          </div>
          <p className="text-gold font-semibold">Strategy call from ₹500</p>
          <a
            href={getWhatsAppUrl(crowned.scored)}
            target="_blank" rel="noopener noreferrer"
            data-testid="whatsapp-cta"
            onClick={() => analytics.cta('whatsapp')}
            className="block w-full py-3.5 rounded-full bg-gold text-dark font-semibold text-sm hover:bg-gold/90 transition-all"
          >
            💬 Start the Conversation →
          </a>
          <p className="text-[10px] text-ivory/30">30 min · No commitment · Real builder talk</p>
        </motion.div>
      )}

      <ScreenQuote screen="s09" />

      {/* Crown CTA — purple premium */}
      {crownedIdeaId && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(124,58,237,0.55)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => advanceScreen()}
          data-testid="crown-cta"
          className="w-full h-14 rounded-2xl font-bold text-[16px] text-white bg-gradient-to-r from-violet-700 to-purple-600 border border-violet-400/25 shadow-[0_0_18px_rgba(124,58,237,0.35)] flex items-center justify-center gap-2 transition-all"
        >
          This is my idea →
        </motion.button>
      )}
    </div>
  );
}
