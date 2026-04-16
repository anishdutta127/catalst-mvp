'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QUOTES } from '@/content/lines';

interface ScreenQuoteProps {
  screen: string;
}

/**
 * ScreenQuote — philosophy quote at bottom of activity zone.
 * Small italic text, ivory-muted/40, 11px, centered.
 * Fades in after 1.5s. Hidden on short screens (< 700px).
 */
export function ScreenQuote({ screen }: ScreenQuoteProps) {
  const [visible, setVisible] = useState(false);
  const quote = QUOTES[screen];

  useEffect(() => {
    setVisible(false);
    if (!quote) return;
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [screen, quote]);

  if (!quote) return null;

  return (
    <motion.div
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.6 }}
      className="text-center py-2 hidden min-h-[700px]:block"
    >
      <p className="text-[11px] text-ivory/40 italic">
        &ldquo;{quote.text}&rdquo; — {quote.author}
      </p>
    </motion.div>
  );
}
