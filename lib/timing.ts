/**
 * Implicit Response Time Tracking
 *
 * Factory-based: each createTimer() call returns an independent instance.
 * No module-level state — safe for concurrent use across screens.
 *
 * Tracks how long users spend on each interaction without them knowing.
 * Faster responses = more instinctive/authentic preferences.
 * Slower responses = more deliberate/uncertain preferences.
 */

export type ResponseSpeed = 'fast' | 'medium' | 'slow';

export interface Timer {
  start(): void;
  stop(): number;
  peek(): number;
}

/** Create an independent timer instance. */
export function createTimer(): Timer {
  let _startTime: number | null = null;
  return {
    start() {
      _startTime = performance.now();
    },
    stop(): number {
      if (_startTime === null) return 0;
      const elapsed = Math.round(performance.now() - _startTime);
      _startTime = null;
      return elapsed;
    },
    peek(): number {
      if (_startTime === null) return 0;
      return Math.round(performance.now() - _startTime);
    },
  };
}

/**
 * Categorize a response time into speed buckets.
 * Based on research on implicit association timing:
 *   - fast: < 1500ms (instinctive, gut reaction)
 *   - medium: 1500-4000ms (considered but comfortable)
 *   - slow: > 4000ms (deliberate, uncertain, or conflicted)
 */
export function categorizeSpeed(ms: number): ResponseSpeed {
  if (ms < 1500) return 'fast';
  if (ms < 4000) return 'medium';
  return 'slow';
}
