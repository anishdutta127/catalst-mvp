/**
 * LLM Response Parser for the Shortcut Path.
 *
 * Takes raw text pasted from ChatGPT/Claude/Gemini and extracts
 * the personality data needed by the scoring engine. Forgiving parsing,
 * never throws, always returns usable defaults for missing fields.
 */

import type { ForgeProfile } from './scoring';

// Orb name normalization (case insensitive, handles variations)
const ORB_NAMES = ['grit', 'vision', 'craft', 'influence', 'empathy', 'analysis', 'freedom', 'stability'];

function matchField(text: string, label: string, options: string[]): string | null {
  // Try exact label match first
  const re = new RegExp(`${label}[:\\s]+(.+)`, 'i');
  const m = text.match(re);
  if (!m) return null;
  const val = m[1].trim().toLowerCase();
  // Find best matching option
  for (const opt of options) {
    if (val.includes(opt.toLowerCase().replace(/[-_]/g, '.'))) return opt;
  }
  return null;
}

function extractOrbs(text: string): [string, string, string] {
  const re = /TOP\s*3\s*STRENGTHS[:\s]+(.+)/i;
  const m = text.match(re);
  if (!m) return ['Vision', 'Grit', 'Analysis']; // defaults
  const raw = m[1].toLowerCase();
  const found = ORB_NAMES.filter((o) => raw.includes(o));
  // Capitalize
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return [
    cap(found[0] ?? 'vision'),
    cap(found[1] ?? 'grit'),
    cap(found[2] ?? 'analysis'),
  ] as [string, string, string];
}

function extractIndustries(text: string): string[] {
  const re = /INDUSTRIES[^:]*[:\s]+(.+)/i;
  const m = text.match(re);
  if (!m) return [];
  return m[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean).slice(0, 5);
}

function extractHeadline(text: string): string {
  const re = /HEADLINE[^:]*[:\s]+(.+)/i;
  const m = text.match(re);
  if (!m) return 'achievement';
  const val = m[1].toLowerCase();
  if (val.includes('100m') || val.includes('valuation')) return 'achievement';
  if (val.includes('anywhere') || val.includes('profitable')) return 'autonomy';
  if (val.includes('10m') || val.includes('user')) return 'power';
  if (val.includes('50k') || val.includes('help') || val.includes('community')) return 'affiliation';
  return 'achievement';
}

function extractSummary(text: string): string {
  const re = /ONE.?LINE.*?SUMMARY[:\s]+(.+)/i;
  const m = text.match(re);
  return m?.[1]?.trim() ?? '';
}

/** Count how many fields were successfully parsed (out of 11) */
export function countParsedFields(text: string): number {
  let count = 0;
  if (/DRIVE[:\s]+/i.test(text)) count++;
  if (/RISK[:\s]+/i.test(text)) count++;
  if (/WORK\s*STYLE[:\s]+/i.test(text)) count++;
  if (/DECISION/i.test(text)) count++;
  if (/TEAM/i.test(text)) count++;
  if (/COMPETITION/i.test(text)) count++;
  if (/STRENGTHS[:\s]+/i.test(text)) count++;
  if (/VALUES/i.test(text)) count++;
  if (/INDUSTRIES/i.test(text)) count++;
  if (/HEADLINE/i.test(text)) count++;
  if (/SUMMARY/i.test(text)) count++;
  return count;
}

/**
 * Parse raw LLM response text into a partial ForgeProfile.
 * Never throws. Returns sensible defaults for all missing fields.
 */
export function parseLLMResponse(text: string): Partial<ForgeProfile> {
  const drive = matchField(text, 'DRIVE', ['achievement', 'affiliation', 'power', 'autonomy']);
  const risk = matchField(text, 'RISK', ['thrill-seeker', 'calculated', 'cautious']);
  const work = matchField(text, 'WORK.?STYLE', ['builder', 'seller', 'researcher', 'creator', 'host']);
  const decision = matchField(text, 'DECISION.?MAKING', ['instinct-first', 'data-first', 'people-first', 'vision-first']);
  const team = matchField(text, 'TEAM.?PREFERENCE', ['solo', 'small-team', 'large-team']);
  const comp = matchField(text, 'COMPETITION.?RESPONSE', ['outbuild', 'differentiate', 'loyalty', 'validate']);

  const orbs = extractOrbs(text);
  const headline = extractHeadline(text);
  const summary = extractSummary(text);

  // Map DRIVE to blot 1
  const blot1 =
    drive === 'affiliation' ? '👥' :
    drive === 'achievement' ? '🦋' :
    drive === 'power' ? '💥' : '🩸';

  // Map WORK STYLE to blot 2
  const blot2 =
    work === 'builder' ? '👢' :
    work === 'host' ? '🌳' :
    work === 'researcher' ? '🗿' : '🦇';

  // Map RISK to blot 3
  const blot3 =
    risk === 'thrill-seeker' ? '☁️' :
    risk === 'cautious' ? '🌺' : '🔥';

  // Map DECISION to word responses
  const powerWord = decision === 'vision-first' || drive === 'power' ? 'Control' : 'Freedom';
  const togetherWord = team === 'solo' ? 'Slower' : 'Stronger';
  const buildWord = decision === 'instinct-first' ? 'New' : 'Better';
  const riskWord = risk === 'thrill-seeker' ? 'Thrill' : 'Calculated';

  // Map to scenario responses
  const s1 =
    decision === 'data-first' ? '📊' :
    decision === 'people-first' ? '📞' :
    decision === 'vision-first' ? '📢' : '🔧';
  const s2 =
    comp === 'validate' ? '🎯' :
    comp === 'differentiate' ? '🔍' :
    comp === 'loyalty' ? '🤝' : '⚡';
  const s3 =
    team === 'large-team' ? '👤' :
    work === 'seller' ? '📈' :
    work === 'builder' ? '💻' : '🔬';

  const allOrbs = ['Grit', 'Vision', 'Craft', 'Influence', 'Empathy', 'Analysis', 'Freedom', 'Stability'];
  const unchosen = allOrbs.filter((o) => !orbs.includes(o));

  return {
    blot_responses: [blot1, blot2, blot3] as [string, string, string],
    blot_response_times: [2000, 2000, 2000] as [number, number, number],
    word_responses: [powerWord, togetherWord, buildWord, riskWord] as [string, string, string, string],
    word_response_times: [1500, 1500, 1500, 1500] as [number, number, number, number],
    scenario_responses: [s1, s2, s3] as [string, string, string],
    scenario_response_times: [2000, 2000, 2000] as [number, number, number],
    crystal_orbs: orbs as [string, string, string],
    crystal_selection_order: [0, 1, 2] as [number, number, number],
    crystal_selection_times: [1000, 1000, 1000] as [number, number, number],
    unchosen_orbs: unchosen,
    headline_choice: headline,
    competitive_advantage: summary,
  };
}

/** Store extracted industries as the user's "kept" list */
export function parseIndustries(text: string): string[] {
  return extractIndustries(text);
}
