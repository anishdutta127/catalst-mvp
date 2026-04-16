'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';

/**
 * S00 — Gateway. Zero chat. Clean input. Opacity CTA.
 */
export function S00Gateway() {
  const setDisplayName = useJourneyStore((s) => s.setDisplayName);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const [name, setName] = useState('');

  const handleAdvance = () => {
    if (name.trim().length >= 2) {
      setDisplayName(name.trim());
      advanceScreen();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-0">
      <motion.h1
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="font-serif text-5xl font-bold tracking-[0.2em] text-gold mb-3"
      >
        CATALST
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="text-ivory/60 italic text-base mb-8"
      >
        welcome to verdania, the enchanted startup garden
      </motion.p>

      <motion.input
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdvance()}
        placeholder="Your first name"
        data-testid="name-input"
        className="w-full max-w-sm h-14 bg-black/40 border border-white/20 rounded-2xl px-5 text-ivory text-center text-lg placeholder:text-ivory/30 focus:outline-none focus:border-gold/60 focus:bg-black/50 transition-all mb-3"
      />

      <p className="text-[11px] tracking-[0.18em] text-ivory/40 uppercase mb-6">
        3 startup ideas matched to your personality · 5 minutes
      </p>

      <motion.button
        onClick={handleAdvance}
        data-testid="s00-cta"
        className="w-full max-w-sm h-13 rounded-2xl font-semibold text-[15px] transition-all mb-8"
        style={{
          opacity: name.trim().length >= 2 ? 1 : 0,
          pointerEvents: name.trim().length >= 2 ? 'auto' : 'none',
          background: '#d4a843',
          color: '#0a0a0c',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Enter Verdania →
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        className="text-ivory/25 italic text-[12px]"
      >
        &ldquo;Knowing yourself is the beginning of all wisdom.&rdquo; — Aristotle
      </motion.p>
    </div>
  );
}
