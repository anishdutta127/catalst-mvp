'use client';

import { useEffect, useRef } from 'react';
import { JourneyShell } from '@/components/layout/JourneyShell';
import { useUIStore } from '@/lib/store/uiStore';

/**
 * Test route for message lifecycle verification.
 *
 * Script:
 *   T=0s:   Cedric: "Welcome to Verdania." (streams, fades after ~4s)
 *   T=1.5s: Pip: "Oh! Oh! I know this place!" (overlaps briefly)
 *   T=4s:   Cedric: "You've never been here before, Pip." (replaces msg 1)
 *
 * Verify: never more than 2 messages visible, fade timing clean, no stacking.
 */
export default function TestMessagesPage() {
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);
  const messageCount = useUIStore((s) => s.messageQueue.length);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // T=0s: Cedric welcome
    enqueueMessage({
      speaker: 'cedric',
      text: 'Welcome to Verdania.',
      type: 'dialogue',
    });

    // T=1.5s: Pip excited (overlaps with Cedric)
    setTimeout(() => {
      enqueueMessage({
        speaker: 'pip',
        text: 'Oh! Oh! I know this place!',
        type: 'dialogue',
      });
    }, 1500);

    // T=4s: Cedric reply (replaces expired msg 1, maintains 2-cap)
    setTimeout(() => {
      enqueueMessage({
        speaker: 'cedric',
        text: "You've never been here before, Pip.",
        type: 'dialogue',
      });
    }, 4000);
  }, [enqueueMessage]);

  return (
    <JourneyShell
      currentScreen="s00"
      completedScreens={[]}
      ctaVisible={false}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-xs font-mono text-ivory/40 uppercase tracking-widest">
          message lifecycle test
        </p>
        <p className="text-sm text-ivory/50 max-w-sm">
          Watch the dialogue strip above. 3 messages fire on a timer.
          Max 2 should be visible at once. Messages fade after their hold time.
        </p>
      </div>

      {/* Dev-only message count overlay */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="fixed top-2 right-2 z-50 bg-black/80 text-green-400 text-xs font-mono px-2 py-1 rounded">
          msgs: {messageCount}
        </div>
      )}
    </JourneyShell>
  );
}
