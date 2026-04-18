'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';

/**
 * S00 — Gateway. Single parent stagger for Duolingo-grade smoothness.
 * Content sits inside a centered "premium card" with backdrop blur so it
 * reads cleanly against the busy garden background.
 */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 220,
      damping: 22,
    },
  },
};

export function S00Gateway() {
  const setDisplayName = useJourneyStore((s) => s.setDisplayName);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const [name, setName] = useState('');

  useEffect(() => {
    // Cold-start guard: a fresh /journey landing on S00 should never carry
    // residual Path B text from a previous session's close-without-reset.
    // Zustand has no `persist` middleware here, but hot-reload and browser
    // tab reuse can still surface stale in-memory state.
    const s = useJourneyStore.getState();
    if (s.currentScreen === 's00' && (s.userIdeaText || s.ideaMode === 'directed')) {
      useJourneyStore.setState({ userIdeaText: '', ideaMode: null });
    }
  }, []);

  const handleAdvance = () => {
    if (name.trim().length >= 2) {
      setDisplayName(name.trim());
      advanceScreen();
    }
  };

  const canAdvance = name.trim().length >= 2;

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[440px] flex flex-col items-center text-center px-9 py-12 rounded-[28px]"
        style={{
          background: 'rgba(0, 0, 0, 0.62)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 60px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(212,168,67,0.04) inset',
        }}
      >
        <motion.h1
          variants={itemVariants}
          className="font-serif text-[44px] font-bold tracking-[0.22em] text-gold mb-5"
        >
          CATALST
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-ivory/70 italic text-[15px] leading-relaxed mb-10 px-2"
        >
          welcome to verdania,<br />the enchanted startup garden
        </motion.p>

        <motion.input
          variants={itemVariants}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdvance()}
          placeholder="Your first name"
          data-testid="name-input"
          className="w-full h-14 bg-black/40 border border-white/15 rounded-2xl px-5 text-ivory text-center text-lg placeholder:text-ivory/30 focus:outline-none focus:border-gold/60 focus:bg-black/55 transition-all mb-4"
        />

        <motion.p
          variants={itemVariants}
          className="text-[11px] tracking-[0.18em] text-ivory/45 uppercase mb-9"
        >
          3 startup ideas · matched to your personality · 5 min
        </motion.p>

        <motion.button
          variants={itemVariants}
          onClick={handleAdvance}
          data-testid="s00-cta"
          className="w-full h-14 rounded-2xl font-semibold text-[15px] tracking-wide transition-all mb-9"
          style={{
            opacity: canAdvance ? 1 : 0,
            pointerEvents: canAdvance ? 'auto' : 'none',
            background: '#d4a843',
            color: '#0a0a0c',
            boxShadow: canAdvance ? '0 8px 24px -8px rgba(212,168,67,0.55)' : 'none',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Begin Your Journey →
        </motion.button>

        <motion.p
          variants={itemVariants}
          className="text-ivory/35 italic text-[12px] leading-relaxed"
        >
          &ldquo;Knowing yourself is the beginning of all wisdom.&rdquo;<br />
          <span className="text-ivory/25 not-italic">— Aristotle</span>
        </motion.p>
      </motion.div>
    </div>
  );
}
