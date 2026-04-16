/**
 * Hook wrapper around lib/timing.ts for component use.
 * Provides start/stop with automatic cleanup.
 */

import { useCallback, useRef } from 'react';

export function useResponseTime() {
  const startRef = useRef<number | null>(null);

  const start = useCallback(() => {
    startRef.current = performance.now();
  }, []);

  const stop = useCallback((): number => {
    if (startRef.current === null) return 0;
    const elapsed = Math.round(performance.now() - startRef.current);
    startRef.current = null;
    return elapsed;
  }, []);

  const peek = useCallback((): number => {
    if (startRef.current === null) return 0;
    return Math.round(performance.now() - startRef.current);
  }, []);

  return { start, stop, peek };
}
