'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/lib/store/uiStore';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { CedricBubble } from '@/components/characters/CedricBubble';
import { DIALOGUE_TIMING } from '@/lib/constants';

/**
 * ChatZone — ZONE 1 (fixed 140px).
 *
 * Layout: Pip blob (left) + message area (right).
 * Max 1 Cedric + 1 Pip message visible at a time.
 * Background: rgba(0,0,0,0.5) with subtle bottom border.
 */

function getPipColor(screen: string): string {
  const s = parseInt(screen.replace(/\D/g, '') || '0');
  if (s <= 3) return '#4ade80';   // pale green S00-S03
  if (s <= 7) return '#fbbf24';   // amber S04-S07
  return '#D4A843';               // gold S08-S11
}

export function ChatZone() {
  const messages = useUIStore((s) => s.messageQueue);
  const removeMessage = useUIStore((s) => s.removeMessage);
  const clearOnScreenChange = useUIStore((s) => s.clearOnScreenChange);
  const currentScreen = useJourneyStore((s) => s.currentScreen);

  // Clear on screen change
  useEffect(() => {
    clearOnScreenChange();
  }, [currentScreen, clearOnScreenChange]);

  // Auto-remove expired dialogue
  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      for (const msg of messages) {
        if (msg.type === 'dialogue' && msg.expiresAt && now > msg.expiresAt) {
          removeMessage(msg.id);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [messages, removeMessage]);

  const cedricMsg = messages.find((m) => m.speaker === 'cedric');
  const pipMsg = messages.find((m) => m.speaker === 'pip');
  const pipColor = getPipColor(currentScreen);

  return (
    <div className="h-full px-4 flex items-start gap-3 pt-2"
      style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Pip blob */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-8 h-8 rounded-full shrink-0 mt-1"
        style={{ background: `radial-gradient(circle at 40% 35%, ${pipColor}, ${pipColor}80)` }}
      />

      {/* Message area */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 overflow-hidden">
        {/* Cedric message */}
        <AnimatePresence mode="popLayout">
          {cedricMsg && (
            <motion.div
              key={cedricMsg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: DIALOGUE_TIMING.fadeOutDuration / 1000 }}
            >
              <CedricBubble text={cedricMsg.text} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pip message — raw text, no background */}
        <AnimatePresence mode="popLayout">
          {pipMsg && (
            <motion.div
              key={pipMsg.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[13px] italic leading-snug line-clamp-2"
              style={{ color: '#4ade80' }}
            >
              {pipMsg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
