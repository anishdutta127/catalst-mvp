'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import industriesRaw from '@/content/industries.json';
import { filterByIndustryOnly } from '@/lib/scoring/orchestrator';
import { IDEAS } from '@/lib/scoring/engine';

interface Industry {
  id: string;
  name: string;
  icon: string;
  hookLine: string;
  stats: { marketSize: string; growth: string; whatsHot: string[] };
  trendingIdeas: string[];
}

const INDUSTRIES = industriesRaw as unknown as Industry[];

const FILTERS = [
  { label: 'All', ids: null },
  { label: 'Tech', ids: ['ai_ml', 'cybersecurity', 'hardware_robotics', 'space_tech', 'web3'] },
  { label: 'Creative', ids: ['creator_media', 'gaming_entertainment', 'fashion_beauty'] },
  { label: 'Health', ids: ['health_wellness', 'sports_fitness', 'senior_care', 'cannabis'] },
  { label: 'Finance', ids: ['finance_payments', 'legal_compliance', 'real_estate_home'] },
  { label: 'Social', ids: ['education_learning', 'community_social', 'parenting', 'dating', 'spirituality'] },
  { label: 'Other', ids: ['food_agriculture', 'climate_energy', 'logistics_mobility', 'travel', 'pet_care'] },
];

/**
 * S04 — Industry Discovery
 *
 * Filter chips, 25 industry cards, bottom sheet on tap, Pass/Edge/Keep actions.
 * Continue after >=2 interactions. Min 2 keeps to advance.
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
  const dialogueSent = useRef(false);

  const totalActions = industriesKept.length + industriesPassed.length + industriesEdged.length;

  // Cedric intro
  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s04.cedric.intro,
      type: 'dialogue',
    });
    setTimeout(() => {
      enqueueMessage({
        speaker: 'pip',
        text: lines.s04.pip.intro,
        type: 'dialogue',
      });
    }, 2500);
  }, [enqueueMessage]);

  const filtered = useMemo(() => {
    const filter = FILTERS.find((f) => f.label === activeFilter);
    if (!filter || !filter.ids) return INDUSTRIES;
    return INDUSTRIES.filter((i) => filter.ids!.includes(i.id));
  }, [activeFilter]);

  function getStatus(id: string): 'kept' | 'passed' | 'edged' | null {
    if (industriesKept.includes(id)) return 'kept';
    if (industriesPassed.includes(id)) return 'passed';
    if (industriesEdged.includes(id)) return 'edged';
    return null;
  }

  function handleContinue() {
    if (industriesKept.length < 2) {
      setNudge('Keep at least 2 industries to continue');
      setTimeout(() => setNudge(''), 2000);
      return;
    }
    // Cache filtered ideas in store (side effect for orchestrator preload)
    const cached = filterByIndustryOnly(IDEAS, industriesKept);
    console.log(`[S04] Filtered ${cached.length} ideas from ${IDEAS.length}`);
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s04.cedric.afterAll(industriesKept.length, industriesEdged.length),
      type: 'dialogue',
    });
    setTimeout(() => advanceScreen(), 600);
  }

  const openIndustry = INDUSTRIES.find((i) => i.id === openSheet);

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setActiveFilter(f.label)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeFilter === f.label
                ? 'bg-gold/20 text-gold border border-gold/40'
                : 'bg-dark-surface border border-white/10 text-ivory/50 hover:text-ivory/70'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Status bar */}
      <div className="text-[10px] font-mono text-ivory/30 shrink-0">
        {industriesKept.length} kept {industriesEdged.length > 0 && ` · ${industriesEdged.length} edged`} {industriesPassed.length > 0 && ` · ${industriesPassed.length} passed`}
      </div>

      {/* Cards grid */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {filtered.map((ind) => {
          const status = getStatus(ind.id);
          if (status === 'passed') return null;
          return (
            <motion.button
              key={ind.id}
              layout
              onClick={() => setOpenSheet(ind.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                status === 'kept'
                  ? 'bg-dark-surface border-2 border-gold/40'
                  : status === 'edged'
                  ? 'bg-dark-surface border border-gold/20'
                  : 'bg-dark-surface border border-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-xl shrink-0">{ind.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ivory truncate">{ind.name}</p>
              </div>
              {status === 'kept' && <span className="text-gold text-xs">✓</span>}
              {status === 'edged' && <span className="text-gold/60 text-xs">★</span>}
            </motion.button>
          );
        })}
      </div>

      {/* Continue button */}
      <AnimatePresence>
        {totalActions >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="shrink-0 flex flex-col items-center gap-1"
          >
            {nudge && <p className="text-xs text-error">{nudge}</p>}
            <button
              onClick={handleContinue}
              className="px-6 py-2.5 rounded-full bg-gold text-dark font-semibold text-sm hover:bg-gold/90 transition-all"
            >
              Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {openIndustry && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenSheet(null)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            {/* Sheet */}
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
              className="fixed bottom-0 left-0 right-0 z-50 bg-dark-surface border-t border-white/10 rounded-t-2xl max-h-[70dvh] overflow-y-auto"
            >
              {/* Drag handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              <div className="px-4 pb-4 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{openIndustry.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-ivory">{openIndustry.name}</h3>
                    <p className="text-xs text-ivory/40">{openIndustry.stats.marketSize} · {openIndustry.stats.growth}</p>
                  </div>
                </div>

                {/* Hook */}
                <p className="text-sm text-ivory/70">{openIndustry.hookLine}</p>

                {/* Trending */}
                <div>
                  <p className="text-xs text-ivory/40 uppercase tracking-wider mb-1">Trending</p>
                  <div className="flex flex-wrap gap-1.5">
                    {openIndustry.trendingIdeas.map((idea) => (
                      <span key={idea} className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold/70">
                        {idea}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { passIndustry(openIndustry.id); setOpenSheet(null); }}
                    className="flex-1 py-2.5 rounded-lg bg-white/5 text-ivory/50 text-sm font-medium hover:bg-white/10 transition-all"
                  >
                    Pass
                  </button>
                  <button
                    onClick={() => { edgeIndustry(openIndustry.id); setOpenSheet(null); }}
                    disabled={industriesEdged.length >= 2 && !industriesEdged.includes(openIndustry.id)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      industriesEdged.length >= 2 && !industriesEdged.includes(openIndustry.id)
                        ? 'bg-white/5 text-ivory/20 cursor-not-allowed'
                        : 'bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20'
                    }`}
                  >
                    Edge ★
                  </button>
                  <button
                    onClick={() => { keepIndustry(openIndustry.id); setOpenSheet(null); }}
                    className="flex-1 py-2.5 rounded-lg bg-gold/20 text-gold font-semibold text-sm border border-gold/40 hover:bg-gold/30 transition-all"
                  >
                    Keep
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
