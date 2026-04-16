/**
 * Hook wrapper around lib/timing.ts for component use.
 * Creates a timer instance per hook call — no shared state.
 */

import { useMemo } from 'react';
import { createTimer } from '@/lib/timing';

export function useResponseTime() {
  const timer = useMemo(() => createTimer(), []);
  return { start: timer.start, stop: timer.stop, peek: timer.peek };
}
