'use client';

/**
 * Journey Page — single-page state machine for the entire Catalst flow.
 * Renders the current screen inside JourneyShell based on Zustand state.
 */

import { useJourneyStore } from '@/lib/store/journeyStore';
import { JourneyShell } from '@/components/layout/JourneyShell';
import { GoldButton } from '@/components/ui/GoldButton';
import type { ScreenId } from '@/lib/constants';

// ── Placeholder screen — replaced per-screen in Phase 2 ──

function PlaceholderScreen({ screenId }: { screenId: ScreenId }) {
  const setDisplayName = useJourneyStore((s) => s.setDisplayName);
  const displayName = useJourneyStore((s) => s.displayName);

  const screenLabels: Partial<Record<ScreenId, string>> = {
    s00: 'The Gateway',
    s01: 'The Fork',
    s01_llm: 'LLM Shortcut',
    s02: 'Inkblots',
    s03: 'Word Association',
    s04: 'Industry Discovery',
    s05: 'Founder Scenarios',
    s06: 'Crystal Formation',
    s07: 'Verdania Chronicle',
    s08: 'The Forge',
    s09: 'Ideas Revealed',
    s09b: 'Idea Deep Dive',
    s10: 'Sorting Ceremony',
    s11: 'Founder Profile',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <div className="text-xs font-mono text-ivory/40 uppercase tracking-widest">
        {screenId}
      </div>
      <h1 className="text-3xl font-serif text-gold">
        {screenLabels[screenId] ?? screenId}
      </h1>
      <p className="text-sm text-ivory/50 max-w-sm">
        This screen will be built in Phase 2.
      </p>

      {/* Name input for S00 */}
      {screenId === 's00' && !displayName && (
        <input
          type="text"
          placeholder="What should we call you?"
          className="w-64 px-4 py-3 rounded-lg bg-dark-surface border border-gold/20 text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold/50 text-center text-base"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const value = (e.target as HTMLInputElement).value.trim();
              if (value) setDisplayName(value);
            }
          }}
        />
      )}
    </div>
  );
}

// ── Screen registry ──

const SCREEN_COMPONENTS: Record<ScreenId, React.ComponentType<{ screenId: ScreenId }>> = {
  s00: PlaceholderScreen,
  s01: PlaceholderScreen,
  s01_llm: PlaceholderScreen,
  s02: PlaceholderScreen,
  s03: PlaceholderScreen,
  s04: PlaceholderScreen,
  s05: PlaceholderScreen,
  s06: PlaceholderScreen,
  s07: PlaceholderScreen,
  s08: PlaceholderScreen,
  s09: PlaceholderScreen,
  s09b: PlaceholderScreen,
  s10: PlaceholderScreen,
  s11: PlaceholderScreen,
};

// ── Page ──

export default function JourneyPage() {
  const currentScreen = useJourneyStore((s) => s.currentScreen);
  const completedScreens = useJourneyStore((s) => s.completedScreens);
  const displayName = useJourneyStore((s) => s.displayName);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);

  const ScreenComponent = SCREEN_COMPONENTS[currentScreen];
  const canAdvance = currentScreen !== 's11' && (currentScreen !== 's00' || !!displayName);

  return (
    <JourneyShell
      currentScreen={currentScreen}
      completedScreens={completedScreens}
      ctaVisible={canAdvance}
      ctaContent={
        <GoldButton onClick={advanceScreen}>
          {currentScreen === 's00' && displayName
            ? 'Begin Your Journey'
            : 'Continue →'}
        </GoldButton>
      }
      footerContent={
        currentScreen === 's00'
          ? '5 min · 3 ideas matched to your instincts'
          : displayName
            ? `${displayName}'s journey`
            : undefined
      }
    >
      <ScreenComponent screenId={currentScreen} />
    </JourneyShell>
  );
}
