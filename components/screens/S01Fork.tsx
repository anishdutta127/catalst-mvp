'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';

/**
 * S01 — The Fork
 *
 * Two cards: Path A (find me an idea), Path B (I have one).
 * Path C: small text link below cards -> stub route.
 * Milestone bar appears here (handled by Header).
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

  // Cedric welcome with name
  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s01.cedric.welcome1(displayName || 'Traveler'),
      type: 'dialogue',
    });
    setTimeout(() => {
      enqueueMessage({
        speaker: 'pip',
        text: lines.s01.pip.entrance,
        type: 'dialogue',
      });
    }, 2000);
  }, [enqueueMessage, displayName]);

  function handlePathA() {
    setIdeaMode('open');
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s01.cedric.pathA.response,
      type: 'dialogue',
    });
    setTimeout(() => advanceScreen(), 600);
  }

  function handlePathB() {
    setShowIdeaInput(true);
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s01.cedric.pathB.prompt,
      type: 'dialogue',
    });
  }

  function handleIdeaSubmit() {
    if (ideaText.trim().length < 5) return;
    setIdeaMode('directed');
    setUserIdeaText(ideaText.trim());
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s01.cedric.pathB.afterSubmit,
      type: 'dialogue',
    });
    setTimeout(() => advanceScreen(), 600);
  }

  function handlePathC() {
    setIdeaMode('shortcut');
    goToScreen('s01_llm');
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {!showIdeaInput ? (
        <>
          {/* Path A / B cards */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={handlePathA}
              className="flex-1 bg-dark-surface border border-white/10 rounded-lg p-5 text-left cursor-pointer hover:border-gold/40 transition-colors"
            >
              <span className="text-2xl mb-2 block">{lines.s01.cards.a.emoji}</span>
              <p className="text-base font-semibold text-ivory">{lines.s01.cards.a.title}</p>
              <p className="text-xs text-ivory-muted mt-1">{lines.s01.cards.a.subtitle}</p>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              onClick={handlePathB}
              className="flex-1 bg-dark-surface border border-white/10 rounded-lg p-5 text-left cursor-pointer hover:border-gold/40 transition-colors"
            >
              <span className="text-2xl mb-2 block">{lines.s01.cards.b.emoji}</span>
              <p className="text-base font-semibold text-ivory">{lines.s01.cards.b.title}</p>
              <p className="text-xs text-ivory-muted mt-1">{lines.s01.cards.b.subtitle}</p>
            </motion.button>
          </div>

          {/* Path C link */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={handlePathC}
            className="text-xs text-ivory/30 hover:text-gold/60 transition-colors underline underline-offset-2"
          >
            Already described your profile to an AI? Paste it here
          </motion.button>
        </>
      ) : (
        /* Path B — idea input */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 w-full max-w-md"
        >
          <textarea
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder={lines.s01.ideaPlaceholder}
            autoFocus
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-dark-surface border border-white/10 text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold/50 text-sm resize-none"
          />
          <button
            onClick={handleIdeaSubmit}
            disabled={ideaText.trim().length < 5}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
              ideaText.trim().length >= 5
                ? 'bg-gold text-dark hover:bg-gold/90'
                : 'bg-gold/30 text-ivory/40 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </motion.div>
      )}
    </div>
  );
}
