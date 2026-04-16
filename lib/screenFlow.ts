/**
 * Screen sequencing logic for all 3 journey paths.
 */

import type { ScreenId, IdeaMode } from './constants';

// ── Path Definitions ──────────────────────────────────────────

const PATH_A: ScreenId[] = [
  's00', 's01', 's02', 's03', 's04', 's05',
  's06', 's07', 's08', 's09', 's10', 's11',
];

// Path B uses the same sequence — idea text is captured at S01
const PATH_B = PATH_A;

const PATH_C: ScreenId[] = [
  's00', 's01_llm', 's04', 's07', 's08', 's09', 's10', 's11',
];

function getPath(mode: IdeaMode | null): ScreenId[] {
  if (mode === 'shortcut') return PATH_C;
  return PATH_A; // A and B share the same sequence
}

// ── Navigation ────────────────────────────────────────────────

export function getNextScreen(
  current: ScreenId,
  ideaMode: IdeaMode | null,
): ScreenId | null {
  // S09b (deep dive) is an overlay, not in the main flow
  if (current === 's09b') return null;

  const path = getPath(ideaMode);
  const idx = path.indexOf(current);
  if (idx === -1 || idx >= path.length - 1) return null;
  return path[idx + 1];
}

export function getPreviousScreen(
  current: ScreenId,
  ideaMode: IdeaMode | null,
): ScreenId | null {
  if (current === 's09b') return 's09';

  const path = getPath(ideaMode);
  const idx = path.indexOf(current);
  if (idx <= 0) return null;
  return path[idx - 1];
}

export function isFirstScreen(screen: ScreenId): boolean {
  return screen === 's00';
}

export function isLastScreen(screen: ScreenId): boolean {
  return screen === 's11';
}

export function getScreenIndex(screen: ScreenId, ideaMode: IdeaMode | null): number {
  const path = getPath(ideaMode);
  return path.indexOf(screen);
}

export function getTotalScreens(ideaMode: IdeaMode | null): number {
  return getPath(ideaMode).length;
}

/**
 * Returns screens that have been completed (all screens before current).
 */
export function getCompletedScreens(
  current: ScreenId,
  ideaMode: IdeaMode | null,
): ScreenId[] {
  const path = getPath(ideaMode);
  const idx = path.indexOf(current);
  if (idx <= 0) return [];
  return path.slice(0, idx);
}
