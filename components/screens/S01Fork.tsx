'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { pathLine } from '@/lib/speakPath';
import { ProcessingSwirl } from '@/components/ui/ProcessingSwirl';

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
  const ideaMode = useJourneyStore((s) => s.ideaMode);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [showIdeaInput, setShowIdeaInput] = useState(false);
  const [ideaText, setIdeaText] = useState('');
  const [processing, setProcessing] = useState(false);
  // Cards stay hidden until Pip's line is mid-stream — gives the dialogue
  // breathing room before the user is asked to choose. Cascade-from-top entry.
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const dialogueSent = useRef(false);
  const introCompleted = useRef(false);

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;

    const w1 = lines.s01.cedric.welcome1(displayName || 'Traveler');
    const w2 = lines.s01.cedric.welcome2;
    const CHAR_MS = 28;
    const READ_PAUSE = 900;
    const stream1 = w1.length * CHAR_MS;
    const stream2 = w2.length * CHAR_MS;

    // Helper: skip a delayed enqueue if the user has already left S01.
    // (Without this, a quick Path A click leaves S01 mid-welcome2 and Pip's
    // line then enqueues onto S02, breaking message order sanity.)
    const isStillHere = () => useJourneyStore.getState().currentScreen === 's01';

    enqueueMessage({ speaker: 'cedric', text: w1, type: 'dialogue' });
    setTimeout(() => {
      if (!isStillHere()) return;
      enqueueMessage({ speaker: 'cedric', text: w2, type: 'dialogue' });
    }, stream1 + READ_PAUSE);
    const pipAt = stream1 + READ_PAUSE + Math.floor(stream2 * 0.5);
    setTimeout(() => {
      if (!isStillHere()) return;
      enqueueMessage({
        speaker: 'pip',
        text: pathLine('s01.pip.entrance', lines.s01.pip.entrance, ideaMode),
        type: 'dialogue',
      });
    }, pipAt);
    // Reveal the path cards a beat after Pip starts talking.
    setTimeout(() => {
      if (!isStillHere()) return;
      setCardsRevealed(true);
      introCompleted.current = true;
    }, pipAt + 700);
  }, [enqueueMessage, displayName]);

  function handlePathA() {
    setIdeaMode('open');
    // Clear any leftover Path B idea text — otherwise a back-button + Path-A
    // sequence would leak the prior draft into the scoring pipeline and
    // trigger a phantom yourIdea tile on S09.
    setUserIdeaText('');
    setProcessing(true);
    const text = lines.s01.cedric.pathA.response;
    enqueueMessage({ speaker: 'cedric', text, type: 'dialogue' });
    setTimeout(() => advanceScreen(), text.length * 28 + 600);
  }

  function handlePathB() {
    setShowIdeaInput(true);
    enqueueMessage({ speaker: 'cedric', text: lines.s01.cedric.pathB.prompt, type: 'dialogue' });
  }

  function handleIdeaSubmit() {
    if (ideaText.trim().length < 5) return;
    setIdeaMode('directed');
    setUserIdeaText(ideaText.trim());
    setProcessing(true);

    // v8 banter beat: Pip reacts ("bold, I'd have just vibed") → Cedric
    // undercuts ("'vibed' is not a methodology") → then the existing ritual
    // afterSubmit lands. `directed` mode is set above so pathLine() picks the
    // Path B variant for both Pip and the submitReply.
    const pipText = pathLine(
      's01.pip.pathB_submitReaction',
      lines.s01.pip.pathB_submitReaction,
      'directed',
    );
    const cedricReply = pathLine(
      's01.cedric.pathB.submitReply',
      lines.s01.cedric.pathB.submitReply,
      'directed',
    );
    enqueueMessage({ speaker: 'pip', text: pipText, type: 'dialogue' });
    const pipMs = pipText.length * 35;
    setTimeout(() => {
      enqueueMessage({ speaker: 'cedric', text: cedricReply, type: 'dialogue' });
    }, pipMs + 400);

    // Ritual afterSubmit + advance — delayed past the banter pair so nothing
    // stacks on-screen at once.
    const afterSubmit = lines.s01.cedric.pathB.afterSubmit;
    const ritualDelay = pipMs + 400 + cedricReply.length * 28 + 500;
    setTimeout(() => {
      enqueueMessage({ speaker: 'cedric', text: afterSubmit, type: 'dialogue' });
    }, ritualDelay);
    setTimeout(() => advanceScreen(), ritualDelay + afterSubmit.length * 28 + 600);
  }

  function handlePathC() {
    setIdeaMode('shortcut');
    // Same reason as handlePathA — no Path B residue should reach the LLM
    // shortcut flow.
    setUserIdeaText('');
    goToScreen('s01_llm');
  }

  return (
    <AnimatePresence mode="wait">
      {processing ? (
        <motion.div
          key="swirl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24 }}
          className="flex items-center justify-center h-full"
        >
          <ProcessingSwirl
            color="#D4A843"
            milestoneIcon="🌱"
            milestoneLabel="Gate"
          />
        </motion.div>
      ) : showIdeaInput ? (
        <motion.div
          key="input"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32, transition: { duration: 0.32, ease: 'easeIn' } }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="flex flex-col items-center justify-center gap-4 h-full px-4"
        >
          {/* Back chip — escape hatch from the textarea view. Clears any
              half-typed idea so re-entering starts clean. */}
          <div className="w-full max-w-md flex items-center justify-start">
            <button
              onClick={() => {
                setShowIdeaInput(false);
                setIdeaText('');
                if (!introCompleted.current) setCardsRevealed(true);
              }}
              data-testid="path-b-back"
              className="flex items-center gap-1 text-[11px] text-ivory/50 hover:text-gold transition-colors uppercase tracking-wider"
            >
              <span>◂</span>
              <span>Back</span>
            </button>
          </div>
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
        </motion.div>
      ) : (
        <motion.div
          key="cards"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32, transition: { duration: 0.32, ease: 'easeIn' } }}
          className="flex flex-col gap-3 justify-center h-full px-2"
        >
      {/* Path A — cascades down from above once Pip is mid-line */}
      <motion.button
        initial={{ opacity: 0, y: -28 }}
        animate={cardsRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: -28 }}
        transition={{ delay: cardsRevealed ? 0 : 0, type: 'spring', stiffness: 280, damping: 24 }}
        whileTap={cardsRevealed ? { scale: 0.97 } : undefined}
        onClick={cardsRevealed ? handlePathA : undefined}
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
        initial={{ opacity: 0, y: -28 }}
        animate={cardsRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: -28 }}
        transition={{ delay: cardsRevealed ? 0.08 : 0, type: 'spring', stiffness: 280, damping: 24 }}
        whileTap={cardsRevealed ? { scale: 0.97 } : undefined}
        onClick={cardsRevealed ? handlePathB : undefined}
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
        initial={{ opacity: 0, y: -28 }}
        animate={cardsRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: -28 }}
        transition={{ delay: cardsRevealed ? 0.16 : 0, type: 'spring', stiffness: 280, damping: 24 }}
        whileTap={cardsRevealed ? { scale: 0.97 } : undefined}
        onClick={cardsRevealed ? handlePathC : undefined}
        data-testid="path-c-link"
        className="relative bg-dark-surface border border-teal/30 rounded-xl p-5 text-left cursor-pointer hover:border-teal/60 transition-colors"
      >
        <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-teal/20 text-teal">~2 min</span>
        <span className="text-2xl block mb-2">⚡</span>
        <p className="text-lg font-serif text-ivory">AI Shortcut</p>
        <p className="text-xs text-ivory-muted mt-1">Paste your ChatGPT profile for instant matching</p>
        <p className="text-[10px] text-teal/60 mt-2">Most efficient · Skips 4 screens</p>
      </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
