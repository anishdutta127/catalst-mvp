'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import industriesRaw from '@/content/industries.json';
import { filterByIndustryOnly } from '@/lib/scoring/orchestrator';
import { IDEAS } from '@/lib/scoring/engine';
import { ScreenQuote } from '@/components/ui/ScreenQuote';

interface Industry {
  id: string; name: string; icon: string; hookLine: string;
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
 * S04 — Industry Discovery (enriched)
 *
 * Filter chips, enriched 72px cards with market data, bottom sheet,
 * persistent CTA strip, action bar (Pass/Edge/Keep), undo last.
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
  const [lastAction, setLastAction] = useState<{ type: string; id: string } | null>(null);
  const dialogueSent = useRef(false);

  const totalActions = industriesKept.length + industriesPassed.length + industriesEdged.length;

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    enqueueMessage({ speaker: 'cedric', text: lines.s04.cedric.intro, type: 'instruction' });
    setTimeout(() => {
      enqueueMessage({ speaker: 'pip', text: lines.s04.pip.intro, type: 'dialogue' });
    }, 2500);
  }, [enqueueMessage]);

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.label === activeFilter);
    if (!f || !f.ids) return INDUSTRIES;
    return INDUSTRIES.filter((i) => f.ids!.includes(i.id));
  }, [activeFilter]);

  function getStatus(id: string): 'kept' | 'passed' | 'edged' | null {
    if (industriesKept.includes(id)) return 'kept';
    if (industriesPassed.includes(id)) return 'passed';
    if (industriesEdged.includes(id)) return 'edged';
    return null;
  }

  function handleAction(type: 'keep' | 'pass' | 'edge', id: string) {
    if (type === 'keep') keepIndustry(id);
    else if (type === 'pass') passIndustry(id);
    else edgeIndustry(id);
    setLastAction({ type, id });
    setOpenSheet(null);
  }

  function handleContinue() {
    if (industriesKept.length < 2) {
      setNudge('Keep at least 2 industries');
      setTimeout(() => setNudge(''), 2000);
      return;
    }
    filterByIndustryOnly(IDEAS, industriesKept);
    enqueueMessage({ speaker: 'cedric', text: lines.s04.cedric.afterAll(industriesKept.length, industriesEdged.length), type: 'dialogue' });
    setTimeout(() => advanceScreen(), 600);
  }

  const openIndustry = INDUSTRIES.find((i) => i.id === openSheet);

  return (
    <div className="flex flex-col h-full overflow-hidden">
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
                : 'bg-white/5 text-ivory/50 hover:text-ivory/70'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Persistent CTA strip */}
      <div className="flex items-center justify-between py-2 px-1 shrink-0 border-b border-white/5">
        <span className="text-[10px] font-mono text-ivory/30">
          {industriesKept.length} kept{industriesEdged.length > 0 ? ` · ${industriesEdged.length} edged` : ''}{industriesPassed.length > 0 ? ` · ${industriesPassed.length} passed` : ''}
        </span>
        {totalActions >= 2 && (
          <button
            onClick={handleContinue}
            data-testid="continue-btn"
            className="text-xs px-3 py-1 rounded-full bg-gold text-dark font-semibold hover:bg-gold/90 transition-all"
          >
            Continue →
          </button>
        )}
      </div>
      {nudge && <p className="text-xs text-error text-center py-1">{nudge}</p>}

      {/* Card list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 py-2">
        {filtered.map((ind) => {
          const status = getStatus(ind.id);
          return (
            <motion.button
              key={ind.id}
              onClick={() => setOpenSheet(ind.id)}
              data-testid={`industry-card-${ind.id}`}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                status === 'passed' ? 'opacity-40' :
                status === 'kept' ? 'border-l-2 border-l-success bg-dark-surface border border-white/10' :
                status === 'edged' ? 'border-l-2 border-l-gold bg-dark-surface border border-white/10' :
                'bg-dark-surface border border-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-2xl shrink-0">{ind.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ivory truncate">{ind.name}</p>
                <p className="text-[10px] text-ivory/40 truncate">
                  💰 {ind.stats.marketSize} · 📊 {ind.stats.growth}
                  {ind.trendingIdeas[0] ? ` · 🔥 ${ind.trendingIdeas[0]}` : ''}
                </p>
              </div>
              {status === 'kept' && <span className="text-success text-xs">✓</span>}
              {status === 'edged' && <span className="text-gold text-xs">★</span>}
              {status === 'passed' && <span className="text-ivory/30 text-xs">✕</span>}
            </motion.button>
          );
        })}
      </div>

      <ScreenQuote screen="s04" />

      {/* Bottom sheet */}
      <AnimatePresence>
        {openIndustry && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenSheet(null)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => { if (info.offset.y > 100) setOpenSheet(null); }}
              data-testid="industry-sheet"
              className="fixed bottom-0 left-0 right-0 z-50 bg-dark-surface border-t border-white/10 rounded-t-2xl max-h-[70dvh] overflow-y-auto"
            >
              <div className="flex justify-center py-3"><div className="w-10 h-1 bg-white/20 rounded-full" /></div>
              <div className="px-4 pb-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{openIndustry.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-ivory">{openIndustry.name}</h3>
                    <p className="text-xs text-ivory/40">{openIndustry.stats.marketSize} · {openIndustry.stats.growth}</p>
                  </div>
                </div>
                <p className="text-sm text-ivory/70">{openIndustry.hookLine}</p>
                <div className="flex flex-wrap gap-1.5">
                  {openIndustry.trendingIdeas.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold/70">{t}</span>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button data-testid="pass-btn" onClick={() => handleAction('pass', openIndustry.id)}
                    className="flex-1 py-3 rounded-lg bg-white/5 text-ivory/50 text-sm font-medium hover:bg-white/10">
                    ✕ Pass
                  </button>
                  <button data-testid="edge-btn" onClick={() => handleAction('edge', openIndustry.id)}
                    disabled={industriesEdged.length >= 2 && !industriesEdged.includes(openIndustry.id)}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium ${
                      industriesEdged.length >= 2 && !industriesEdged.includes(openIndustry.id)
                        ? 'bg-white/5 text-ivory/20 cursor-not-allowed'
                        : 'bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20'
                    }`}>
                    ★ Edge
                  </button>
                  <button data-testid="keep-btn" onClick={() => handleAction('keep', openIndustry.id)}
                    className="flex-1 py-3 rounded-lg bg-gold/20 text-gold font-semibold text-sm border border-gold/40 hover:bg-gold/30">
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
