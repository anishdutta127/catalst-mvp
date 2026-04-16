'use client';

/**
 * Journey Page — single-page state machine for the entire Catalst flow.
 * Renders the current screen inside JourneyShell based on Zustand state.
 *
 * Gate 4: S00-S04, S06-S07. Gate 5: S08-S10.
 * Remaining: S11, S01_LLM use placeholder.
 */

import { useJourneyStore } from '@/lib/store/journeyStore';
import { JourneyShell } from '@/components/layout/JourneyShell';
import { GoldButton } from '@/components/ui/GoldButton';
import { S00Gateway } from '@/components/screens/S00Gateway';
import { S01Fork } from '@/components/screens/S01Fork';
import { S02Inkblots } from '@/components/screens/S02Inkblots';
import { S03Words } from '@/components/screens/S03Words';
import { S04Industries } from '@/components/screens/S04Industries';
import { S06Crystal } from '@/components/screens/S06Crystal';
import { S07Chronicle } from '@/components/screens/S07Chronicle';
import { S08Forge } from '@/components/screens/S08Forge';
import { S09Ideas } from '@/components/screens/S09Ideas';
import { S10Sorting } from '@/components/screens/S10Sorting';
import { S11Profile } from '@/components/screens/S11Profile';
import type { ScreenId } from '@/lib/constants';

// ── Placeholder for unbuilt screens ──

function PlaceholderScreen({ screenId }: { screenId: ScreenId }) {
  const screenLabels: Partial<Record<ScreenId, string>> = {
    s01_llm: 'LLM Shortcut',
    s05: 'Founder Scenarios (Killed)',
    s09b: 'Idea Deep Dive',
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
        Coming in a later gate.
      </p>
    </div>
  );
}

// ── Screen wrappers (ignore screenId prop for real screens) ──

function S00Wrapper() { return <S00Gateway />; }
function S01Wrapper() { return <S01Fork />; }
function S02Wrapper() { return <S02Inkblots />; }
function S03Wrapper() { return <S03Words />; }
function S04Wrapper() { return <S04Industries />; }
function S06Wrapper() { return <S06Crystal />; }
function S07Wrapper() { return <S07Chronicle />; }
function S08Wrapper() { return <S08Forge />; }
function S09Wrapper() { return <S09Ideas />; }
function S10Wrapper() { return <S10Sorting />; }
function S11Wrapper() { return <S11Profile />; }

// ── Screen registry ──

const SCREEN_COMPONENTS: Record<ScreenId, React.ComponentType<{ screenId: ScreenId }>> = {
  s00: S00Wrapper,
  s01: S01Wrapper,
  s01_llm: PlaceholderScreen,
  s02: S02Wrapper,
  s03: S03Wrapper,
  s04: S04Wrapper,
  s05: PlaceholderScreen,
  s06: S06Wrapper,
  s07: S07Wrapper,
  s08: S08Wrapper,
  s09: S09Wrapper,
  s09b: PlaceholderScreen,
  s10: S10Wrapper,
  s11: S11Wrapper,
};

// ── Screens that manage their own CTA (no global CTA bar) ──
const SELF_MANAGED_SCREENS = new Set<ScreenId>([
  's00', 's01', 's02', 's03', 's04', 's06', 's07',
  's08', 's09', 's10', 's11',
]);

// ── Page ──

export default function JourneyPage() {
  const currentScreen = useJourneyStore((s) => s.currentScreen);
  const completedScreens = useJourneyStore((s) => s.completedScreens);
  const displayName = useJourneyStore((s) => s.displayName);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);

  const ScreenComponent = SCREEN_COMPONENTS[currentScreen];
  const isSelfManaged = SELF_MANAGED_SCREENS.has(currentScreen);

  // S00: show CTA only when name entered (managed by S00Gateway component)
  // All Gate 4 screens manage their own advancement
  const showGlobalCta = !isSelfManaged && currentScreen !== 's11';

  return (
    <JourneyShell
      currentScreen={currentScreen}
      completedScreens={completedScreens}
      ctaVisible={showGlobalCta}
      ctaContent={
        showGlobalCta ? (
          <GoldButton onClick={advanceScreen}>
            Continue
          </GoldButton>
        ) : undefined
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
