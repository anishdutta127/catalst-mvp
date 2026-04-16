/**
 * Implicit Response Time Tracking
 *
 * Tracks how long users spend on each interaction without them knowing.
 * Faster responses = more instinctive/authentic preferences.
 * Slower responses = more deliberate/uncertain preferences.
 */

let _startTime: number | null = null;

/** Call when a stimulus is first shown to the user */
export function startTimer(): void {
  _startTime = performance.now();
}

/** Call when the user responds. Returns elapsed ms since startTimer(). */
export function stopTimer(): number {
  if (_startTime === null) return 0;
  const elapsed = performance.now() - _startTime;
  _startTime = null;
  return Math.round(elapsed);
}

/** Returns ms elapsed since startTimer() without stopping it */
export function peekTimer(): number {
  if (_startTime === null) return 0;
  return Math.round(performance.now() - _startTime);
}

/**
 * Categorize a response time into speed buckets.
 * Based on research on implicit association timing:
 *   - fast: < 1500ms (instinctive, gut reaction)
 *   - medium: 1500-4000ms (considered but comfortable)
 *   - slow: > 4000ms (deliberate, uncertain, or conflicted)
 */
export type ResponseSpeed = 'fast' | 'medium' | 'slow';

export function categorizeSpeed(ms: number): ResponseSpeed {
  if (ms < 1500) return 'fast';
  if (ms < 4000) return 'medium';
  return 'slow';
}
