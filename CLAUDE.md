# Catalst MVP — Claude Code Instructions

## What this project is
Catalst is a personality-driven startup idea matching web app. Users walk an enchanted garden journey (~5 min), answer psychology-backed mini-games, and receive 3 matched startup ideas plus a shareable founder profile. This is a REBUILD of a previous v7 attempt. Everything learned is in ./handoff/.

## Stack we currently assume
- Next.js 14 App Router, TypeScript, Tailwind
- Framer Motion, Zustand, Recharts, Tone.js, html-to-image
- @google/generative-ai (Gemini)
- Supabase, PostHog, Sentry to be added

Challenge any of these if something better serves the use case.

## First task: READ before planning
1. ./handoff/CATALST_V7_FINAL_BUILD_SPEC.md - the v7 spec
2. ./handoff/CATALST_V7_FINAL_FIX_SPEC.md - playtest observations and fixes
3. ./handoff/CATALST_V7_MIDJOURNEY_BIBLE.md - visual style reference

Reference files:
- ./handoff/scoring-reference.ts - working scoring engine (1164 lines)
- ./handoff/personality-reference.ts, llmParser-reference.ts, timing-reference.ts
- ./handoff/content/ - ideas.json (260), industries.json (25), houses.json (4), lines.ts (all dialogue)
- ./handoff/public/ - 12 backgrounds + 3 Rorschach plates

## What we observed in v7 playtest (discuss, do not assume)

These are things that FELT wrong to the user. The planner should interrogate each one and propose what to do differently. Some may have better alternatives than what I list here.

1. **Message timing** - Character by character typing felt dated next to Claude/ChatGPT. We tried word-by-word. Either can work depending on feel. Worth testing both.

2. **Pip duplication** - Multiple PipCompanion instances rendered at once on some screens. Whatever the fix, only one Pip should be visible at a time.

3. **Message stacking** - Dialogue kept stacking on screen. User wanted old messages to fade as new ones arrive (one or two visible max). Discuss how to handle instructions vs. transient dialogue.

4. **Layout zones** - User request: CATALST header visible on gateway, fades/shrinks once journey starts. Below that: space for Cedric dialogue, space for Pip, activity area, CTA. Whether Pip needs a dedicated zone or should float into activity during games is open.

5. **Desktop width** - v7 locked content to 480px even on 1440px screens, felt mobile-cramped. Claude/ChatGPT use ~720px. Open to better recommendations.

6. **Selection animations** - v7 tried shatter (rotate/scale/opacity) on unselected options. User found it janky. Clean dissolve felt better. Designer should propose what feels best for the garden theme.

7. **Timer** - v7 had filling bars that user found confusing (felt like progress, not countdown). Depleting vine felt more intuitive. Open to other metaphors.

8. **Word count on S03** - v7 had 4 words (POWER, TOGETHER, BUILD, RISK). User felt TOGETHER was redundant with other signals. Consider keeping 3 or 4 based on scoring engine needs.

9. **S05 Scenarios** - Caused fatigue in v7 playtest (user wanted to skip straight to results). Planner should evaluate: keep, kill, or redesign?

10. **Industry S04** - v7 forced users through 25 cards sequentially. User wanted filter chips + ability to continue after liking just a few. Open to better discovery patterns.

11. **Progress indicator** - Thin bar felt lost. User wanted milestone icons with IDEAS milestone visually special as the "carrot." Open to other approaches.

12. **Scoring engine** - The reference implementation works end-to-end. Do not rewrite unless architecture demands it. Can be imported and adapted.

## Screen flow (current proposal, challenge it)

Path A (Find me an idea): S00 Gateway, S02 Inkblots, S03 Words, S04 Industry, S06 Crystal, S07 Chronicle + constraints, S08 Forge, S09 Ideas, S10 Sorting, S11 Profile

Path B (I have an idea): Same as A, idea text captured at fork

Path C (LLM shortcut): S00, S01_LLMShortcut, S04, S07 (constraints only), S08 (faster), S09, S10, S11

## User data + release readiness
- Anonymous session ID at start
- Journey state saved to Supabase on every screen (enables resume on refresh)
- Final profile + crowned idea persisted
- Optional email capture at S11 to email the idea pack
- PostHog events: screen views, selections, timer expiries, CTA taps, drop-offs
- Sentry for runtime errors
- All analytics opt-in with a clear privacy note

## Character voices
Cedric: wise mentor, dry wit, funny father figure. Power distance through gravity not rudeness.
Pip: eager, excitable, occasionally accidentally insightful. Evolves visually through the journey.
Arc: early testing/witty, middle growing respect, late genuine warmth (Welcome home at S10).

## gstack workflow
After every feature branch: git commit, /review, self design-review with per-dimension scores, fix anything that feels off, merge, new branch.

## Deployment target
Vercel, custom domain. Free tiers for all services where possible. Server-side env vars for API keys.

## Your first move
Do NOT write code. Use /plan-eng-review to propose architecture. Include your recommendation on each of the 12 v7 observations above, and propose the layout system. Present options where tradeoffs exist. I will approve before you build.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
