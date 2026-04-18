'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { ProcessingSwirl } from '@/components/ui/ProcessingSwirl';
import { CRYSTAL_ORBS } from '@/lib/constants';

/**
 * S01 LLM Shortcut — Path 3
 *
 * ONE screen. Two panels:
 *   [TOP]    The master prompt the user copies into their ChatGPT/Claude/Gemini
 *            session. Copy button. Small helper text.
 *   [BOTTOM] Paste textarea where they drop the LLM's JSON reply.
 *            Submit → parse → populate all skipped-screen fields →
 *            skip S02/S03/S04/S06/S07 → land on S08 (forge) which runs
 *            the scoring engine and navigates to S09.
 *
 * Design notes:
 *   • Prompt requests ONLY concrete picks (emojis, words, orb names, industry
 *     slugs, headline/time/resource/advantage labels) — valid values listed.
 *     No free-form psychology. Makes parsing reliable and lets the existing
 *     engine.ts score without any reverse-engineering of signals.
 *   • Parser validates every field against the known-valid option lists
 *     from lib/constants.ts + the industry JSON. If invalid, shows a precise
 *     inline error so the user can re-run their LLM or edit.
 *   • Schema matches ForgeProfile EXACTLY — no translator layer.
 *   • Mobile-first: stacks vertically, code block scrolls horizontally on
 *     narrow viewports, sticky copy button, min 44px tap targets.
 */

// ═══════════════════════════════════════════════════════════
// The master prompt — embedded verbatim in the UI for copy
// ═══════════════════════════════════════════════════════════

const MASTER_PROMPT = String.raw`You're helping me skip ahead in a startup-founder matchmaker called Catalst.

You've been talking to me for a while. Use everything you know about my
psychology, motives, fears, taste, working style, and what I engage with
vs what I say — to fill out this profile AS IF YOU WERE ME.

Don't ask follow-up questions. Infer. Be pointed, not polite. Go below the
surface — Level 1 is what I claim I want, Level 2 is the gap between what
I say and what I engage with, Level 3 is the shadow motive I wouldn't
admit. Let Level 3 tint your picks.

Return ONLY the JSON block below — no prose around it, no markdown fences.

{
  "displayName": "",

  "blot_responses": ["", "", ""],
  // Q1 pick ONE: 👥 🦋 💥 🩸
  //   👥 crowd/people · 🦋 abstract/butterfly · 💥 conflict/explosion · 🩸 raw/emotional
  // Q2 pick ONE: 🗿 👑 🌳 🐻 👢 🦇
  //   🗿 monument · 👑 authority · 🌳 growth · 🐻 primal · 👢 movement · 🦇 dark/hidden
  // Q3 pick ONE: 🔬 🌋 🎨 🌺 👤 👁️ ☁️
  //   🔬 precision · 🌋 force · 🎨 expression · 🌺 beauty · 👤 isolation · 👁️ observation · ☁️ abstraction

  "word_responses": ["", "", "", ""],
  // Q1 word after "Home":   one of [Quiet, Alive, Loud, Open]
  // Q2 word after "Change": one of [Weaker, Stronger, Confusing, Exciting]
  // Q3 word after "First":  one of [Old, New, Familiar, Strange]
  // Q4 word after "Heart":  one of [Safe, Wild, Heavy, Thrill]

  "crystal_orbs_top3": ["", "", ""],
  // Pick EXACTLY 3 from [Grit, Vision, Craft, Influence, Empathy, Analysis, Freedom, Stability]
  // in rank order (strongest first). These are the traits I'd claim as mine.

  "crystal_unchosen": [],
  // The remaining 5 from that list go here (the traits I'd NOT identify with).

  "industries_kept": [],
  // Pick 3–6 industry ids I'd actually build in.
  // Valid ids: ai_ml, health_wellness, creator_media, finance_payments,
  // education_learning, food_agriculture, climate_energy, gaming_entertainment,
  // fashion_beauty, sports_fitness, community_social, real_estate_home,
  // logistics_mobility, legal_compliance, hardware_robotics, pet_care,
  // spirituality, space_tech, cybersecurity, dating, travel, senior_care,
  // parenting, cannabis, web3, saas_productivity, ecommerce_retail,
  // govtech_civic, mental_health, hrtech_future_work

  "industries_edged": [],
  // 0–2 industry ids I'd admire but not commit to.

  "industries_passed": [],
  // 3–8 industry ids I'd reject.

  "headline_choice": "",
  // The future headline I'd fantasize about. Pick ONE exactly:
  //   "Built to $100M ARR"
  //   "Working from Anywhere, 3-hour days"
  //   "IPO'd, $1B in the bank"
  //   "Impacted 10 Million Users"
  //   "50,000 Founders I Helped"

  "time_budget": "",
  // Realistic weekly commitment. ONE of: "5-10 hrs" "10-20 hrs" "20-40 hrs" "Full-time"

  "resource_level": "",
  // Capital I can deploy. ONE of: "Bootstrap" "< ₹8L" "₹8L - ₹80L" "₹80L+"

  "competitive_advantage": "",
  // One sentence on my unfair edge. Empty string if I don't have one.

  "shadow_insight": "",
  // One sentence Level-3 reading that would make me uncomfortable but nod.

  "confidence": 0
  // 0-100 — how much of this is from real context vs guessing
}`;

// ═══════════════════════════════════════════════════════════
// Valid option sets (mirrored from scoring engine + industries)
// ═══════════════════════════════════════════════════════════

const BLOT1_VALID = ['👥', '🦋', '💥', '🩸'];
const BLOT2_VALID = ['🗿', '👑', '🌳', '🐻', '👢', '🦇'];
const BLOT3_VALID = ['🔬', '🌋', '🎨', '🌺', '👤', '👁️', '☁️'];

const WORD1_VALID = ['Quiet', 'Alive', 'Loud', 'Open'];
const WORD2_VALID = ['Weaker', 'Stronger', 'Confusing', 'Exciting'];
const WORD3_VALID = ['Old', 'New', 'Familiar', 'Strange'];
const WORD4_VALID = ['Safe', 'Wild', 'Heavy', 'Thrill'];

// Orb names MUST match CRYSTAL_WORK keys in engine.ts (Pascal-Case).
const ORB_NAMES_VALID = CRYSTAL_ORBS.map((o) => o.name);

const INDUSTRIES_VALID = new Set([
  'ai_ml', 'health_wellness', 'creator_media', 'finance_payments',
  'education_learning', 'food_agriculture', 'climate_energy',
  'gaming_entertainment', 'fashion_beauty', 'sports_fitness',
  'community_social', 'real_estate_home', 'logistics_mobility',
  'legal_compliance', 'hardware_robotics', 'pet_care', 'spirituality',
  'space_tech', 'cybersecurity', 'dating', 'travel', 'senior_care',
  'parenting', 'cannabis', 'web3', 'saas_productivity',
  'ecommerce_retail', 'govtech_civic', 'mental_health', 'hrtech_future_work',
]);

const HEADLINE_VALID = [
  'Built to $100M ARR',
  'Working from Anywhere, 3-hour days',
  "IPO'd, $1B in the bank",
  'Impacted 10 Million Users',
  '50,000 Founders I Helped',
];

const TIME_BUDGET_VALID = ['5-10 hrs', '10-20 hrs', '20-40 hrs', 'Full-time'];
const RESOURCE_VALID = ['Bootstrap', '< ₹8L', '₹8L - ₹80L', '₹80L+'];

// ═══════════════════════════════════════════════════════════
// Parser
// ═══════════════════════════════════════════════════════════

interface ParsedShortcut {
  displayName: string;
  blot_responses: [string, string, string];
  word_responses: [string, string, string, string];
  crystal_orbs_top3: [string, string, string];
  crystal_unchosen: string[];
  industries_kept: string[];
  industries_edged: string[];
  industries_passed: string[];
  headline_choice: string;
  time_budget: string;
  resource_level: string;
  competitive_advantage: string;
  shadow_insight?: string;
  confidence?: number;
}

type ParseResult =
  | { ok: true; data: ParsedShortcut }
  | { ok: false; error: string; hints: string[] };

function stripFences(raw: string): string {
  // Some LLMs wrap JSON in ```json ... ``` even when told not to.
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '');
  s = s.replace(/\s*```$/i, '');
  return s.trim();
}

function parseLLMResponse(raw: string): ParseResult {
  const stripped = stripFences(raw);
  let obj: unknown;
  try {
    obj = JSON.parse(stripped);
  } catch (e) {
    return {
      ok: false,
      error: 'That did not parse as JSON.',
      hints: ['Check for stray backticks, prose around the JSON, or trailing commas.'],
    };
  }
  if (!obj || typeof obj !== 'object') {
    return { ok: false, error: 'JSON parsed but is not an object.', hints: [] };
  }
  const o = obj as Record<string, unknown>;

  const hints: string[] = [];
  const missing: string[] = [];

  function str(k: string): string {
    const v = o[k];
    if (typeof v !== 'string') { missing.push(k); return ''; }
    return v;
  }
  function arr(k: string): unknown[] {
    const v = o[k];
    if (!Array.isArray(v)) { missing.push(k); return []; }
    return v;
  }
  function strArr(k: string): string[] {
    return arr(k).filter((x): x is string => typeof x === 'string');
  }

  const displayName = str('displayName');
  const blots = strArr('blot_responses');
  const words = strArr('word_responses');
  const top3 = strArr('crystal_orbs_top3');
  const unchosen = strArr('crystal_unchosen');
  const kept = strArr('industries_kept');
  const edged = strArr('industries_edged');
  const passed = strArr('industries_passed');
  const headline = str('headline_choice');
  const tb = str('time_budget');
  const rl = str('resource_level');
  const advantage = str('competitive_advantage');
  const shadow = typeof o.shadow_insight === 'string' ? o.shadow_insight : '';
  const confidence = typeof o.confidence === 'number' ? o.confidence : 50;

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing required fields: ${missing.join(', ')}`,
      hints: ['Re-run the prompt in your LLM — it may have skipped a field.'],
    };
  }

  // Validate enums
  if (blots.length !== 3) hints.push(`blot_responses must have exactly 3 entries (got ${blots.length})`);
  else {
    if (!BLOT1_VALID.includes(blots[0])) hints.push(`blot_responses[0] "${blots[0]}" invalid — use one of: ${BLOT1_VALID.join(' ')}`);
    if (!BLOT2_VALID.includes(blots[1])) hints.push(`blot_responses[1] "${blots[1]}" invalid — use one of: ${BLOT2_VALID.join(' ')}`);
    if (!BLOT3_VALID.includes(blots[2])) hints.push(`blot_responses[2] "${blots[2]}" invalid — use one of: ${BLOT3_VALID.join(' ')}`);
  }
  if (words.length !== 4) hints.push(`word_responses must have exactly 4 entries (got ${words.length})`);
  else {
    if (!WORD1_VALID.includes(words[0])) hints.push(`word_responses[0] "${words[0]}" invalid — use one of: ${WORD1_VALID.join(', ')}`);
    if (!WORD2_VALID.includes(words[1])) hints.push(`word_responses[1] "${words[1]}" invalid — use one of: ${WORD2_VALID.join(', ')}`);
    if (!WORD3_VALID.includes(words[2])) hints.push(`word_responses[2] "${words[2]}" invalid — use one of: ${WORD3_VALID.join(', ')}`);
    if (!WORD4_VALID.includes(words[3])) hints.push(`word_responses[3] "${words[3]}" invalid — use one of: ${WORD4_VALID.join(', ')}`);
  }
  if (top3.length !== 3) hints.push(`crystal_orbs_top3 must have exactly 3 entries (got ${top3.length})`);
  else {
    for (const orb of top3) {
      if (!ORB_NAMES_VALID.includes(orb)) hints.push(`crystal orb "${orb}" invalid — use: ${ORB_NAMES_VALID.join(', ')}`);
    }
  }
  for (const ind of [...kept, ...edged, ...passed]) {
    if (!INDUSTRIES_VALID.has(ind)) hints.push(`industry "${ind}" is not a valid id`);
  }
  if (!HEADLINE_VALID.includes(headline)) hints.push(`headline_choice "${headline}" invalid — use exactly one of the 5 options`);
  if (!TIME_BUDGET_VALID.includes(tb)) hints.push(`time_budget "${tb}" invalid — use one of: ${TIME_BUDGET_VALID.join(', ')}`);
  if (!RESOURCE_VALID.includes(rl)) hints.push(`resource_level "${rl}" invalid — use one of: ${RESOURCE_VALID.join(', ')}`);

  if (hints.length > 0) {
    return {
      ok: false,
      error: 'Some fields have invalid values.',
      hints,
    };
  }

  return {
    ok: true,
    data: {
      displayName,
      blot_responses: [blots[0], blots[1], blots[2]],
      word_responses: [words[0], words[1], words[2], words[3]],
      crystal_orbs_top3: [top3[0], top3[1], top3[2]],
      crystal_unchosen: unchosen,
      industries_kept: kept,
      industries_edged: edged,
      industries_passed: passed,
      headline_choice: headline,
      time_budget: tb,
      resource_level: rl,
      competitive_advantage: advantage,
      shadow_insight: shadow,
      confidence,
    },
  };
}

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

export function S01LLMShortcut() {
  const setDisplayName       = useJourneyStore((s) => s.setDisplayName);
  const setIdeaMode          = useJourneyStore((s) => s.setIdeaMode);
  const setUserIdeaText      = useJourneyStore((s) => s.setUserIdeaText);
  const keepIndustry         = useJourneyStore((s) => s.keepIndustry);
  const passIndustry         = useJourneyStore((s) => s.passIndustry);
  const edgeIndustry         = useJourneyStore((s) => s.edgeIndustry);
  const selectOrb            = useJourneyStore((s) => s.selectOrb);
  const setHeadlineChoice    = useJourneyStore((s) => s.setHeadlineChoice);
  const setTimeBudget        = useJourneyStore((s) => s.setTimeBudget);
  const setResourceLevel     = useJourneyStore((s) => s.setResourceLevel);
  const setCompetitiveAdvantage = useJourneyStore((s) => s.setCompetitiveAdvantage);
  const goToScreen           = useJourneyStore((s) => s.goToScreen);
  const enqueueMessage       = useUIStore((s) => s.enqueueMessage);
  const clearAllMessages     = useUIStore((s) => s.clearAllMessages);

  const [pasted, setPasted] = useState('');
  const [parseError, setParseError] = useState<{ error: string; hints: string[] } | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const dialogueSent = useRef(false);

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    // Drop S01 Pip entrance / Cedric welcomes that linger in the queue —
    // Path C is a distinct beat and should not replay the ritual intro.
    clearAllMessages();
    enqueueMessage({
      speaker: 'cedric',
      text: "Paste this prompt into your ChatGPT or Claude. It knows you better than five minutes of quizzes ever could.",
      type: 'instruction',
    });
    setTimeout(() => {
      enqueueMessage({
        speaker: 'pip',
        text: lines.s01_llm.pip.entrance,
        type: 'dialogue',
      });
    }, 700);
  }, [enqueueMessage, clearAllMessages]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(MASTER_PROMPT);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1600);
    } catch {
      // Fallback for older browsers / insecure contexts
      const ta = document.createElement('textarea');
      ta.value = MASTER_PROMPT;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1600);
    }
  }

  function handleSubmit() {
    setParseError(null);
    const result = parseLLMResponse(pasted);
    if (!result.ok) {
      setParseError({ error: result.error, hints: result.hints });
      return;
    }

    const d = result.data;
    setSubmitting(true);

    // ─── Populate ForgeProfile across the store ───
    if (d.displayName) setDisplayName(d.displayName);
    setIdeaMode('shortcut');
    setUserIdeaText('');  // explicitly clear — shortcut is NOT Path B

    // S02 blots + S03 words: write direct, use recordXResponse so arrays sit
    // at the right indices. Time values synthesized — scoring engine uses
    // stdDev + average to compute bigFive.N; we pick plausible mid-range
    // values to avoid biasing neuroticism up or down.
    const store = useJourneyStore.getState();
    useJourneyStore.setState({
      blotResponses: d.blot_responses,
      blotResponseTimes: [2200, 2400, 2000],
      wordResponses: d.word_responses,
      wordResponseTimes: [1800, 2100, 1900, 2000],
      industriesKept: d.industries_kept,
      industriesPassed: d.industries_passed,
      industriesEdged: d.industries_edged.slice(0, 2),  // engine caps at 2
      industryDwellTimes: Array(30).fill(3000),
      scrollDepthPerCard: [],
      crystalOrbs: d.crystal_orbs_top3,
      crystalSelectionOrder: [0, 1, 2],
      crystalSelectionTimes: [1500, 1800, 2000],
      unchosenOrbs: d.crystal_unchosen.length > 0
        ? d.crystal_unchosen
        : ORB_NAMES_VALID.filter((n) => !d.crystal_orbs_top3.includes(n)),
      headlineChoice: d.headline_choice,
      timeBudget: d.time_budget,
      resourceLevel: d.resource_level,
      competitiveAdvantage: d.competitive_advantage,
    });

    // Mark S02, S03, S04, S06, S07 as completed so the progress bar reflects
    // the skipped path and any downstream guards pass.
    const skipped: import('@/lib/constants').ScreenId[] = ['s00', 's01', 's01_llm', 's02', 's03', 's04', 's06', 's07'];
    useJourneyStore.setState({
      completedScreens: skipped,
      screenHistory: [...store.screenHistory, 's01_llm'],
    });

    enqueueMessage({
      speaker: 'cedric',
      text: 'The shortcut worked. Your profile is being forged now.',
      type: 'dialogue',
    });

    // Forward to S08 — the forge screen runs the scoring pipeline then
    // routes to S09 automatically. Slight delay so the message can land.
    setTimeout(() => {
      goToScreen('s08');
    }, 900);
  }

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════

  if (submitting) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center h-full"
      >
        <ProcessingSwirl color="#14B8A6" milestoneIcon="⚡" milestoneLabel="Shortcut" />
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto px-1 pb-2">
      {/* ─── TOP PANEL: Master prompt + copy ─── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-mono uppercase tracking-[0.18em] text-teal-300/90">
            1 · Copy this prompt
          </h2>
          <button
            onClick={handleCopy}
            data-testid="llm-copy-prompt"
            className={`shrink-0 min-h-[36px] px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
              copyState === 'copied'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                : 'bg-teal-400/15 text-teal-200 border border-teal-400/40 hover:bg-teal-400/25'
            }`}
          >
            {copyState === 'copied' ? '✓ Copied' : 'Copy prompt'}
          </button>
        </div>

        {/* The prompt block. Max-height + scroll so it doesn't swallow the
            whole screen on mobile; user can scroll inside or just hit Copy. */}
        <div
          className="rounded-xl bg-dark-surface border border-white/10 text-ivory/85 text-[11.5px] leading-[1.55] font-mono overflow-auto"
          style={{ maxHeight: '30vh' }}
        >
          <pre className="whitespace-pre-wrap break-words p-3">{MASTER_PROMPT}</pre>
        </div>

        <p className="text-[11px] text-ivory/45 leading-relaxed">
          Paste into your ChatGPT / Claude / Gemini session — whichever one
          has been remembering you. The LLM will reply with a JSON block.
          Copy that whole block, then paste it below.
        </p>
      </div>

      {/* ─── BOTTOM PANEL: Paste + submit ─── */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[13px] font-mono uppercase tracking-[0.18em] text-teal-300/90">
          2 · Paste the JSON reply
        </h2>
        <textarea
          value={pasted}
          onChange={(e) => { setPasted(e.target.value); setParseError(null); }}
          placeholder='{ "displayName": "…", "blot_responses": ["…","…","…"], … }'
          rows={7}
          data-testid="llm-paste-textarea"
          className="w-full min-h-[140px] px-3 py-2.5 rounded-lg bg-dark-surface border border-white/10 text-ivory placeholder:text-ivory/25 focus:outline-none focus:border-teal-400/50 text-[12px] font-mono resize-none"
          spellCheck={false}
          autoCorrect="off"
        />

        <AnimatePresence>
          {parseError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg bg-rose-500/10 border border-rose-400/40 px-3 py-2 text-[11.5px] text-rose-300"
              role="alert"
            >
              <p className="font-semibold mb-1">{parseError.error}</p>
              {parseError.hints.length > 0 && (
                <ul className="list-disc list-inside space-y-0.5 text-rose-300/85">
                  {parseError.hints.slice(0, 4).map((h, i) => <li key={i}>{h}</li>)}
                  {parseError.hints.length > 4 && (
                    <li className="italic">…and {parseError.hints.length - 4} more</li>
                  )}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleSubmit}
          disabled={pasted.trim().length < 10}
          data-testid="llm-submit"
          className={`w-full min-h-[48px] rounded-2xl font-semibold text-[14px] transition-colors ${
            pasted.trim().length >= 10
              ? 'bg-teal-400 text-dark hover:bg-teal-400/90 shadow-[0_0_14px_rgba(45,212,191,0.35)]'
              : 'bg-white/5 text-ivory/30 border border-white/10 cursor-not-allowed'
          }`}
        >
          {pasted.trim().length >= 10 ? 'Forge my profile →' : 'Paste the JSON to continue'}
        </button>

        <button
          onClick={() => goToScreen('s01')}
          className="text-[11px] text-ivory/45 hover:text-ivory/75 underline underline-offset-4 self-center mt-1"
        >
          ← back to paths
        </button>
      </div>
    </div>
  );
}
