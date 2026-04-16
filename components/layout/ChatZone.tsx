'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/lib/store/uiStore';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { CedricBubble } from '@/components/characters/CedricBubble';
import { DIALOGUE_TIMING } from '@/lib/constants';

/**
 * ChatZone — split layout: Cedric left, Pip right.
 * Pip hidden on S00, fades in on S01.
 * Pip blob has two white dot "eyes".
 */

function getPipColor(screen: string): string {
  const s = parseInt(screen.replace(/\D/g, '') || '0');
  if (s <= 3) return '#4ade80';
  if (s <= 7) return '#fbbf24';
  return '#D4A843';
}

export function ChatZone() {
  const messages = useUIStore((s) => s.messageQueue);
  const removeMessage = useUIStore((s) => s.removeMessage);
  const clearOnScreenChange = useUIStore((s) => s.clearOnScreenChange);
  const currentScreen = useJourneyStore((s) => s.currentScreen);

  useEffect(() => { clearOnScreenChange(); }, [currentScreen, clearOnScreenChange]);

  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      for (const msg of messages) {
        if (msg.type === 'dialogue' && msg.expiresAt && now > msg.expiresAt) removeMessage(msg.id);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [messages, removeMessage]);

  const cedricMsg = messages.find((m) => m.speaker === 'cedric');
  const pipMsg = messages.find((m) => m.speaker === 'pip');
  const pipColor = getPipColor(currentScreen);
  const showPip = currentScreen !== 's00';

  return (
    <div className="h-full flex px-3 py-2 gap-2">
      {/* LEFT: Cedric side */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <AnimatePresence mode="popLayout">
          {cedricMsg && (
            <motion.div
              key={cedricMsg.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DIALOGUE_TIMING.fadeOutDuration / 1000 }}
            >
              <CedricBubble text={cedricMsg.text} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT: Pip side */}
      <AnimatePresence>
        {showPip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-end justify-center gap-1 shrink-0"
            style={{ width: 100 }}
          >
            {/* Pip message — raw green italic text, right-aligned */}
            <AnimatePresence mode="popLayout">
              {pipMsg && (
                <motion.p
                  key={pipMsg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[12px] italic leading-snug text-right line-clamp-2"
                  style={{ color: '#4ade80' }}
                >
                  {pipMsg.text}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Pip blob with face dots */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-medium" style={{ color: '#4ade80' }}>Pip</span>
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
                style={{ width: 28, height: 28 }}
              >
                <div
                  className="w-full h-full rounded-full"
                  style={{ background: `radial-gradient(circle at 40% 35%, ${pipColor}, ${pipColor}88)` }}
                />
                {/* Eyes */}
                <div className="absolute top-[8px] left-[6px] w-1.5 h-1.5 bg-white rounded-full" />
                <div className="absolute top-[8px] right-[6px] w-1.5 h-1.5 bg-white rounded-full" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
