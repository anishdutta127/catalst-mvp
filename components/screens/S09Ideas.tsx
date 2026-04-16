'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import type { ScoredIdea } from '@/lib/scoring/types';

/**
 * S09 — Ideas Revealed
 *
 * Mount guard: if matchedIdeas null → redirect to S08.
 * 3 idea cards, accordion deep dive, WhatsApp CTA, crowning.
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

  const [expandedSection, setExpandedSection] = useState<string | null>('idea-0');
  const dialogueSent = useRef(false);

  // Mount guard: redirect to S08 if no ideas
  useEffect(() => {
    if (!matchedIdeas) {
      console.error('[S09] GUARD: no matchedIdeas, redirecting to S08');
      goToScreen('s08');
    }
  }, [matchedIdeas, goToScreen]);

  // Cedric reveal dialogue
  useEffect(() => {
    if (dialogueSent.current || !matchedIdeas) return;
    dialogueSent.current = true;
    enqueueMessage({ speaker: 'cedric', text: lines.s09.cedric.reveal1, type: 'dialogue' });
    setTimeout(() => {
      enqueueMessage({ speaker: 'pip', text: lines.s09.pip.reveal, type: 'dialogue' });
    }, 2000);
  }, [enqueueMessage, matchedIdeas]);

  if (!matchedIdeas) return null;

  const ideas: { scored: ScoredIdea; tier: keyof typeof TIER_META }[] = [
    { scored: matchedIdeas.nest, tier: 'nest' },
    { scored: matchedIdeas.spark, tier: 'spark' },
    { scored: matchedIdeas.wildvine, tier: 'wildvine' },
  ];
  if (matchedIdeas.yourIdea) {
    ideas.unshift({ scored: matchedIdeas.yourIdea, tier: 'your_idea' });
  }

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
        type: 'whyYou',
        sessionId,
        context: {
          ideaName: idea.scored.idea.idea_name,
          ideaOneLiner: idea.scored.idea.one_liner,
          userWorkStyle: 'analytical',
          houseId: houseId || 'founder',
          topStrengths: 'determination and vision',
        },
      }),
    })
      .then((r) => r.json())
      .then((data) => setWhyYouText(ideaId, data.text))
      .catch(() =>
        setWhyYouText(
          ideaId,
          `Your instincts led you here. ${idea.scored.idea.idea_name} fits the way you think. Trust the match.`
        )
      );
  }

  function toggleSection(key: string) {
    setExpandedSection((s) => (s === key ? null : key));
  }

  function getWhatsAppUrl(idea: ScoredIdea) {
    const msg = encodeURIComponent(
      `Hi Anish! I just found my idea on Catalst. I'm a ${houseId || 'founder'} founder. My top match: ${idea.idea.idea_name} in ${idea.idea.domain_primary}. I want to book a 30-min strategy call (₹500).`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pb-4">
      {/* Idea cards */}
      <div className="flex flex-col sm:flex-row gap-3">
        {ideas.map(({ scored, tier }, idx) => {
          const isCrowned = crownedIdeaId === scored.idea.idea_id;
          const meta = TIER_META[tier];
          const isNest = tier === 'nest';

          return (
            <motion.button
              key={scored.idea.idea_id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              onClick={() => handleCrown(scored.idea.idea_id)}
              className={`flex-1 bg-dark-surface rounded-lg p-4 text-left transition-all ${
                isCrowned
                  ? 'border-2 border-gold/70 shadow-[0_0_12px_rgba(212,168,67,0.4)]'
                  : isNest
                  ? 'border-2 border-gold/30'
                  : 'border border-white/10 hover:border-white/20'
              } cursor-pointer`}
            >
              {/* Tier badge */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">{meta.emoji}</span>
                <span className="text-[10px] font-mono text-gold/60 uppercase tracking-wider">{meta.label}</span>
                <span className="ml-auto text-[10px] font-mono text-ivory/30">{scored.displayScore}%</span>
              </div>

              {/* Idea name */}
              <h3 className="text-base font-serif text-ivory leading-snug mb-1">
                {scored.idea.idea_name}
              </h3>
              <p className="text-xs text-ivory-muted leading-relaxed line-clamp-2">
                {scored.idea.one_liner}
              </p>

              {/* Domain pill */}
              <div className="mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold/70 border border-gold/20">
                  {scored.idea.domain_primary.replace(/_/g, ' ')}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Crowned idea deep dive */}
      {crownedIdeaId && (() => {
        const crowned = ideas.find((i) => i.scored.idea.idea_id === crownedIdeaId);
        if (!crowned) return null;
        const idea = crowned.scored.idea;
        const whyYou = whyYouTexts[crownedIdeaId];

        const sections = [
          { key: `idea-${crownedIdeaId}`, title: 'The Idea', content: idea.pain_to_promise },
          { key: `why-${crownedIdeaId}`, title: 'Why You', content: whyYou || '' },
          { key: `market-${crownedIdeaId}`, title: 'The Market', content: `${idea.domain_primary.replace(/_/g, ' ')} — ${idea.why_now}` },
          { key: `steps-${crownedIdeaId}`, title: 'First Steps', content: `Week 1: ${idea.quickStart.week1}\nMVP: ${idea.quickStart.mvp}\nFirst customers: ${idea.quickStart.firstCustomers}` },
          { key: `risk-${crownedIdeaId}`, title: 'The Risk', content: idea.proof.gap },
        ];

        return (
          <div className="flex flex-col gap-1 mt-2">
            {sections.map((sec, i) => (
              <div key={sec.key} className="bg-dark-surface border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(sec.key)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer"
                >
                  <span className="text-xs font-semibold text-ivory/70">{sec.title}</span>
                  <span className="text-ivory/30 text-xs">{expandedSection === sec.key ? '−' : '+'}</span>
                </button>
                <AnimatePresence>
                  {(expandedSection === sec.key || (i === 0 && !expandedSection)) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3">
                        {sec.content === '__loading__' ? (
                          <div className="animate-pulse space-y-2">
                            <div className="h-3 bg-white/10 rounded w-3/4" />
                            <div className="h-3 bg-white/10 rounded w-1/2" />
                          </div>
                        ) : (
                          <p className="text-xs text-ivory/50 leading-relaxed whitespace-pre-line">
                            {sec.content}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* WhatsApp CTA */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-surface border border-gold/20 rounded-lg p-4 mt-2"
            >
              <p className="text-xs text-ivory/60 mb-2">Want to build this?</p>
              <a
                href={getWhatsAppUrl(crowned.scored)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 rounded-full border border-gold/40 text-gold text-xs font-medium hover:bg-gold/10 transition-all"
              >
                Message Anish on WhatsApp
              </a>
            </motion.div>
          </div>
        );
      })()}

      {/* Advance CTA — appears after crowning */}
      {crownedIdeaId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center pt-2"
        >
          <button
            onClick={() => advanceScreen()}
            className="px-8 py-3 rounded-full bg-gold text-dark font-semibold hover:bg-gold/90 hover:shadow-[0_0_8px_rgba(212,168,67,0.3)] transition-all"
          >
            This is my idea →
          </button>
        </motion.div>
      )}
    </div>
  );
}
