/**
 * Catalst v8 — Path-aware dialogue helper.
 *
 * Wraps any dialogue line so it can optionally pick a Path B (directed) or
 * Path C (shortcut) variant before falling back to the default string.
 *
 * Usage:
 *
 *   import { pathLine } from '@/lib/speakPath';
 *   import { lines } from '@/content/lines';
 *
 *   const ideaMode = useJourneyStore((s) => s.ideaMode);
 *
 *   enqueueMessage({
 *     speaker: 'pip',
 *     text: pathLine('s04.pip.intro', lines.s04.pip.intro, ideaMode),
 *     type: 'dialogue',
 *   });
 *
 * Variants live in content/line-variants.ts. Any key not in the variants
 * map passes through unchanged — migration can be incremental.
 */

import { LINE_VARIANTS } from '@/content/line-variants';

export type IdeaMode = 'open' | 'directed' | 'shortcut' | null;

/**
 * Look up a path-specific variant for a dotted line key. Returns the
 * matching variant when present, otherwise `defaultText` verbatim.
 */
export function pathLine(
  key: string,
  defaultText: string,
  mode: IdeaMode,
): string {
  const variant = LINE_VARIANTS[key];
  if (!variant) return defaultText;

  if (mode === 'directed' && variant.directed) return variant.directed;
  if (mode === 'shortcut' && variant.shortcut) return variant.shortcut;

  return defaultText;
}
