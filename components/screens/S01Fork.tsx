'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';

/**
 * S01 — The Fork (enriched)
 *
 * Three full-height cards: Path A, B, C — all equally prominent.
 * Path C has teal accent (premium/power-user feel).
 */
export function S01Fork() {
  const displayName = useJourneyStore((s) => s.displayName);
  const setIdeaMode = useJourneyStore((s) => s.setIdeaMode);
  const setUserIdeaText = useJourneyStore((s) => s.setUserIdeaText);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const goToScreen = useJourneyStore((s) => s.goToScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [showIdeaInput, setShowIdeaInput] = useState(false);
  const [ideaText, setIdeaText] = useState('');
  const dialogueSent = useRef(false);

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s01.cedric.welcome1(displayName || 'Traveler'),
      type: 'dialogue',
    });
    setTimeout(() => {
      enqueueMessage({ speaker: 'pip', text: lines.s01.pip.entrance, type: 'dialogue' });
    }, 2000);
  }, [enqueueMessage, displayName]);

  function handlePathA() {
    setIdeaMode('open');
    enqueueMessage({ speaker: 'cedric', text: lines.s01.cedric.pathA.response, type: 'dialogue' });
    setTimeout(() => advanceScreen(), 600);
  }

  function handlePathB() {
    setShowIdeaInput(true);
    enqueueMessage({ speaker: 'cedric', text: lines.s01.cedric.pathB.prompt, type: 'dialogue' });
  }

  function handleIdeaSubmit() {
    if (ideaText.trim().length < 5) return;
    setIdeaMode('directed');
    setUserIdeaText(ideaText.trim());
    enqueueMessage({ speaker: 'cedric', text: lines.s01.cedric.pathB.afterSubmit, type: 'dialogue' });
    setTimeout(() => advanceScreen(), 600);
  }

  function handlePathC() {
    setIdeaMode('shortcut');
    goToScreen('s01_llm');
  }

  if (showIdeaInput) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-full px-4">
        <p className="text-xs text-ivory/40 uppercase tracking-wider">Describe your idea</p>
        <textarea
          value={ideaText}
          onChange={(e) => setIdeaText(e.target.value)}
          placeholder={lines.s01.ideaPlaceholder}
          autoFocus
          rows={3}
          data-testid="idea-input"
          className="w-full max-w-md px-4 py-3 rounded-lg bg-dark-surface border border-white/10 text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold/50 text-sm resize-none"
        />
        <button
          onClick={handleIdeaSubmit}
          disabled={ideaText.trim().length < 5}
          data-testid="idea-submit"
          className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
            ideaText.trim().length >= 5
              ? 'bg-gold text-dark hover:bg-gold/90'
              : 'bg-gold/30 text-ivory/40 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 justify-center h-full px-2">
      {/* Path A */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={handlePathA}
        data-testid="path-a-card"
        className="relative bg-dark-surface border border-white/10 rounded-xl p-5 text-left cursor-pointer hover:border-gold/40 transition-colors"
      >
        <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold">~5 min</span>
        <span className="text-2xl block mb-2">🌿</span>
        <p className="text-lg font-serif text-ivory">Find my startup idea</p>
        <p className="text-xs text-ivory-muted mt-1">Personality-matched from 260 curated ideas</p>
      </motion.button>

      {/* Path B */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        onClick={handlePathB}
        data-testid="path-b-card"
        className="relative bg-dark-surface border border-white/10 rounded-xl p-5 text-left cursor-pointer hover:border-gold/40 transition-colors"
      >
        <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold">~5 min</span>
        <span className="text-2xl block mb-2">💡</span>
        <p className="text-lg font-serif text-ivory">I already have an idea</p>
        <p className="text-xs text-ivory-muted mt-1">Validate it against your founder personality</p>
      </motion.button>

      {/* Path C — teal premium accent */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        onClick={handlePathC}
        data-testid="path-c-link"
        className="relative bg-dark-surface border border-teal/30 rounded-xl p-5 text-left cursor-pointer hover:border-teal/60 transition-colors"
      >
        <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-teal/20 text-teal">~2 min</span>
        <span className="text-2xl block mb-2">⚡</span>
        <p className="text-lg font-serif text-ivory">AI Shortcut</p>
        <p className="text-xs text-ivory-muted mt-1">Paste your ChatGPT profile for instant matching</p>
        <p className="text-[10px] text-teal/60 mt-2">Most efficient · Skips 4 screens</p>
      </motion.button>
    </div>
  );
}
