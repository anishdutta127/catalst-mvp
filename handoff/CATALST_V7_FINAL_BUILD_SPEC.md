# CATALST v7 — FINAL BUILD SPEC
## Status: ALL SCREENS LOCKED — Ready for Execution
## Date: April 14, 2026

---

# OVERVIEW

**Total screens:** 12 (S00-S12, with S09b as deep dive overlay)
**Time to ideas:** ~4 minutes
**Total journey:** ~7-8 minutes
**Tech stack:** Next.js 14, TypeScript, Tailwind, Framer Motion, Zustand
**Target:** Mobile-first, internationally oriented (USD), Instagram-shareable

---

# CHARACTER SYSTEM

## Cedric — The Guide
- **Voice:** Wise mentor with dry wit. Funny father figure. Maintains power distance through gravity and knowledge, not rudeness. Earns respect by acknowledging the weight of what the user is doing. Drops wisdom casually. Occasionally roasts Pip gently.
- **Arc:** Early = testing, slightly distant, witty. Middle = growing respect, less joking. Late (Forge onward) = genuine gravity, pride. "Welcome home" is the first time he's warm without a joke attached.
- **Visual:** Chat bubbles, left-aligned, with 🔥 Cedric name tag. Glassmorphism card style.

## Pip — The Companion
- **Voice:** Young, eager, excitable. Says what the user is thinking in a funny way. Occasionally accidentally insightful. Made to feel silly by Cedric's maturity but never mean-spiritedly.
- **Arc:** Starts as a tiny nervous seedling. Grows slightly bigger/more defined as journey progresses. After crystal formation, gains house-coloured glow. By founder card, has a tiny leaf or bloom. The journey grew Pip too.
- **Visual:** Small animated sprite in the CENTRE ACTIVITY AREA (mobile-first). 5-6 states: idle float, excited bounce, nervous wobble, pointing/directing, hiding/peeking, celebration. Even when idle, gently sways. Entrance animations vary per screen (bounce in, materialise from particles, peek from behind elements, drop from above).
- **Position:** Lives in the centre activity area between Cedric's chat bubbles and the interactive elements. Moves around as a live companion — different positions per context. During activities, sometimes points at options, sits on cards, or hides behind elements.

## The Dynamic
- Cedric introduces/guides → Pip reacts (says what user thinks) → Cedric responds to Pip → activity appears
- Reactions happen AFTER segments, not during (to avoid distracting from the activity)
- Comedy is the onboarding — users don't feel assessed, they feel entertained

---

# THE COMPLETE FLOW

---

## S00 — GATEWAY + WELCOME ✅

**Layout:** Full-viewport, centred column
- Rich Midjourney garden background (dark/moody enchanted gate, full bleed)
- Golden firefly particles drifting over background
- CATALST wordmark (centred, gold/ivory, tracked spacing)
- "verdania — the startup garden" (small, muted)
- Rotating quote (italicised, warm gold): cycles between 2-3 options per load
- "What should we call you?" + name input field
- "Begin Your Journey" CTA (gold fill, appears on name entry)
- Footer: "5 min · 3 ideas matched to your instincts"
- NO "free" anywhere — devalues the product
- NO social proof for MVP

**Transition:** Gateway compresses upward (wordmark → topbar, rest fades). Chat interface reveals below. This is a HYBRID — gateway IS the top of the chat scroll but dominates viewport until entry. The transition is the moment the user realises "this is a conversation."

**Enchanted garden elements:** Vine/leaf motifs as subtle borders on chat bubbles, organic edges on input fields, particles continue throughout all screens.

**Data captured:** `display_name`
**Preloading begins:** Industry card data, idea library index

---

## S01 — THE FORK ✅

**Cedric:** "[Name]. The garden recognized you before you typed your name."

**Cedric:** "What you're about to do — most people spend years circling it. We're going to cut through that noise in a few minutes. I'll read your instincts. You just react."

**🌱 Pip** *(bounces in, first entrance, settles in centre area):* "That's his way of saying welcome! I think."

**Fork cards (spring animation):**

**Card A:** 🌿 **"Find me an idea"** — *Let the garden reveal what fits.*
**Card B:** 🔥 **"I already have one"** — *I want to test it against my instincts.*

**If Card A:**
**Cedric:** "Good. Blank slates are underrated."
**🌱 Pip:** "I had an idea once! Cedric said it was 'adorable.'"
**Cedric:** "That wasn't a compliment, Pip."

**If Card B:**
**Cedric:** "Alright, let's hear it. One sentence. No elevator pitch — just the raw thought."
*(Text input appears as chat reply area. Placeholder: "e.g., An AI tool that helps restaurants manage food waste")*
**🌱 Pip** *(slides near input):* "Don't stress about making it perfect — Cedric's going to pull it apart anyway."
*(User types → appears as right-aligned chat bubble)*
**Cedric:** "The garden will remember this. Let's see what your instincts say."

**Auto-advance to S02.**

**Data captured:** `idea_mode` (open | directed), `user_idea_text` (if directed)
**Frameworks:** Effectuation vs Causation (partial), decision speed

---

## S02 — INKBLOTS (3 Rorschach Cards) ✅

**Pattern per blot:**
1. Cedric intro (chat bubble)
2. Blot appears in circular viewing window (centre activity area, top 40% mobile viewport, dark vignette)
3. 4 options in 2×2 grid (bottom 60% — NO scrolling, everything visible, gut reaction)
4. User taps → selected glows, others fade, subtle badge flash (NO label — keeps mystery)
5. Blot dissolves with particle effect
6. AFTER blot dissolves: Pip reacts, Cedric responds to Pip
7. Next blot materialises

**Before Blot 1:**
**Cedric:** "Three shapes. No right answers. Tell me what you see — not what it is."
**🌱 Pip:** "These things give me the creeps. But like... in a good way?"
Counter: "1 of 3" (top right)

### BLOT 1 — Rorschach Plate II (black + red, two figures)
**Probes:** Core motivation — what drives you? (McClelland nAch/nAff/nPow)
**Image:** Real Plate II from rorschach.org (public domain, 1921)

| Position | Option | Scoring |
|----------|--------|---------|
| Top-left | 👥 "Two people — hands touching" | nAff → host_fit, community ideas |
| Top-right | 🦋 "A butterfly mid-transformation" | nAch → builder_fit, innovation ideas |
| Bottom-left | 💥 "A rocket launch — pure thrust" | nPow → seller_fit, platform/marketplace |
| Bottom-right | 🩸 "Something wounded — but still alive" | Resilience → high boldness, tough-market, social impact |

**After selection → badge flash → dissolve:**
**🌱 Pip:** "Okay that was weirdly intense. Is it supposed to feel like that?"
**Cedric:** "It means it's working. Next."

### BLOT 2 — Rorschach Plate IV (dark imposing figure, "The Father Card")
**Probes:** Relationship with power/authority — execution DNA
**Image:** Real Plate IV

Counter: "2 of 3"
**🌱 Pip** *(peering around the viewing window):* "This one's... bigger."

| Position | Option | Scoring |
|----------|--------|---------|
| Top-left | 🗿 "A giant — seen from below" | Systems thinker → enterprise/B2B, Conscientiousness |
| Top-right | 🌳 "An ancient tree — roots and all" | Long-term builder → infrastructure, stability motive |
| Bottom-left | 👢 "Heavy boots — someone walking forward" | Action-oriented → high Grit, effectuation, Dominance |
| Bottom-right | 🦇 "Wings spread wide — about to take off" | Freedom-seeking → pathfinder, new-market, Openness |

**After selection → badge flash → dissolve:**
**🌱 Pip** *(trying to act tough):* "I wasn't scared. Just so you know."
**Cedric:** "Nobody said you were, Pip."
**🌱 Pip:** "...I'm just saying."

### BLOT 3 — Rorschach Plate IX (vague, pastel, hardest card)
**Probes:** Ambiguity tolerance — risk signature. #1 predictor of startup comfort with uncertainty.
**Image:** Real Plate IX

Counter: "3 of 3"
**Cedric:** *(NO intro line — silence before this one. The blot just appears.)*

| Position | Option | Scoring |
|----------|--------|---------|
| Top-left | 🔥 "Fire and smoke — something burning" | Destruction/creation cycle → high boldness, disruption |
| Top-right | 🌺 "Flowers blooming — an explosion of life" | Optimistic creator → creator_fit, lifestyle, Openness |
| Bottom-left | 👁️ "A face — something looking back at me" | Self-aware → empathy, coaching/consulting, host_fit |
| Bottom-right | ☁️ "Honestly? Chaos. Beautiful chaos." | Highest ambiguity tolerance → moonshot, blue ocean |

**After final selection:** All 3 trait badges orbit briefly as constellation → compress and absorb.
**Cedric:** "Three instincts. The reading is taking shape. We're just getting started."
**🌱 Pip** *(slightly bigger than at start):* "I felt something shift. Did you feel that?"

**Auto-advance to S03.**

**Data captured:** `blot_responses[3]`, `blot_response_times[3]`
**Frameworks:** Rorschach (primary), McClelland nAch/nAff/nPow, Big Five Openness, implicit timing
**Diagnostic triangle:** Blot 1 = motivation engine, Blot 2 = execution DNA, Blot 3 = risk signature

---

## S03 — WORD ASSOCIATION (4 Strategic Words) ✅

**Cedric:** "Four words. React. Don't think."
**🌱 Pip:** "Finally! Something I'm built for — not thinking is kind of my whole thing."

**Mechanic:** Word appears LARGE centre → 0.5s pause → two option pills fade in LEFT and RIGHT at ~65% viewport height → tap → dissolves with particle burst → next word immediately. NO reactions between words. Silent focus.

**Layout:** Word at ~30% viewport height (large, glowing). Two wide pill buttons side by side at ~65%. Tap target is entire pill. A 5-year-old sees a big word and two buttons.

| Word | Left | Right | Probes |
|------|------|-------|--------|
| **POWER** | "Control" | "Freedom" | Authority orientation |
| **TOGETHER** | "Stronger" | "Slower" | Collaboration instinct (ideal social self trap) |
| **BUILD** | "New" | "Better" | Innovation vs optimisation |
| **RISK** | "Thrill" | "Calculated" | Risk relationship |

**Timer starts when OPTIONS appear (not when word appears).** Response time tracked in milliseconds — THE key implicit signal (Jung's insight: hesitation = emotional complex).

**After all 4:** Words briefly form constellation → dissolve inward.
**Cedric:** "The instincts don't lie. Even when we wish they would."
**🌱 Pip** *(breathless):* "That was FOUR words?! It felt like forty. My leaves are sweating."
**Cedric:** "Plants don't sweat, Pip."
**🌱 Pip:** "MINE DO."

**Auto-advance to S04.**

**Data captured:** `word_responses[4]`, `word_response_times[4]`
**Timing volatility signature:** Consistent fast = decisive. Consistent slow = deliberate. Fast-fast-fast-SLOW = the slow word hit a complex. Pattern feeds scoring confidence weights.
**16 binary combinations = 16 distinct founder profiles from 4 taps in 15 seconds.**

---

## S04 — INDUSTRY DISCOVERY (Hinge-Style Cards) ✅

**Cedric:** "Now I'm going to show you fifteen worlds. Some will pull you in. Some won't. Trust the pull — not the logic."
**🌱 Pip** *(zooming around excitedly):* "This is the fun part! It's like shopping but for your FUTURE."
**Cedric:** "...that's not entirely wrong, actually."

**Mechanic:** One card at a time in centre activity area. Hinge-profile format. Scroll within card frame (illustration pinned at top, prompts scroll beneath). Three floating action buttons always visible at bottom: ✕ Pass | ✓ Keep | ★ Edge (2 max, counter shows "2 left" → "1 left" → "Used")

**Card anatomy:**
- Clean minimal illustration (abstract, garden-themed, unique per industry)
- Industry name (bold, large)
- 3 prompts from the prompt bank (different combo per card — no two cards have same 3)
- Stats section at bottom (market size, growth, what's hot)

**Prompt bank (8 prompts, each card picks 3):**
1. "My biggest flex is..."
2. "I'm looking for someone who..."
3. "The honest truth is..."
4. "A fun fact about me..."
5. "Together we could..."
6. "My most controversial take..."
7. "I'll win you over when..."
8. "Green flag:"

**The 15 industries (in presentation order):**
1. AI & Machine Learning (I+E)
2. Health & Wellness (S+I)
3. Creator & Media (A+E)
4. Finance & Payments (E+C)
5. Education & Learning (S+A)
6. Food & Agriculture (R+E)
7. Climate & Energy (I+R)
8. Gaming & Entertainment (A+I)
9. Fashion & Beauty (A+E)
10. Sports & Fitness (R+E)
11. Community & Social Impact (S+E)
12. Real Estate & Home (R+C)
13. Logistics & Mobility (R+C)
14. Legal & Compliance (I+C)
15. Hardware & Robotics (R+I)

Each industry tagged with Holland RIASEC codes (invisible to user).

**Pip:** Occasionally adds tiny comment bubble on 2-3 random cards: "Ooh, I like this one" — NOT every card.

**After all 15:**
**Cedric:** "[X] worlds kept. [Y] edges marked. The garden is narrowing."
**🌱 Pip** *(surrounded by floating industry icons):* "I wanted to edge ALL of them. Cedric said that 'defeats the purpose.' Whatever that means."

**Data captured:** `industries_kept[]`, `industries_passed[]`, `industries_edged[]`, `industry_dwell_times[]`, `industry_expand_count`, `edge_order`, `swipe_speed_pattern`, `scroll_depth_per_card`
**Preloading:** After card 8, begin first scoring pass (domain matching on all 245 ideas)

---

## S05 — FOUNDER SCENARIOS (TAT-Inspired) ✅

**Cedric:** "You've seen the worlds. Now I need to see how you move through them."
**Cedric:** "Three moments every founder faces. No theory — just instinct."
**🌱 Pip:** "Okay I actually know the answer to one of these. Probably. Maybe."

**Mechanic:** 3 scenarios in Cedric's chat flow. Each: Cedric message (situation) → 4 options in 2×2 grid (same as inkblots — consistent pattern). No reactions between scenarios. Pip + Cedric react after all 3.

### SCENARIO 1 — "The Launch" (customer orientation + execution style)
**Cedric:** "Your product is ready. Day one. What's your first move?"

| Top-left | Top-right |
|----------|-----------|
| 📊 "Watch the dashboard — numbers tell the truth" | 📞 "Call my first 10 users personally" |
| **Bottom-left** | **Bottom-right** |
| 📢 "Share it everywhere and see what spreads" | 🔧 "Go back and make it better first" |

### SCENARIO 2 — "The Obstacle" (competitive psychology)
**Cedric:** "Your biggest competitor just launched something similar. What do you feel?"

| Top-left | Top-right |
|----------|-----------|
| 🎯 "Excited — the market is validated" | 🔍 "Time to find the angle they missed" |
| **Bottom-left** | **Bottom-right** |
| 🤝 "Doesn't matter — my people won't leave" | ⚡ "I'll outbuild them" |

### SCENARIO 3 — "The Resource" (resource philosophy, replaces killed S07 drag-to-rank)
**Cedric:** "Someone hands you $10,000 for your startup. No strings. First spend?"

| Top-left | Top-right |
|----------|-----------|
| 👤 "Hire someone brilliant" | 📈 "Acquire customers" |
| **Bottom-left** | **Bottom-right** |
| 💻 "Build the product" | 🔬 "Research before spending" |

**After all 3:**
**🌱 Pip:** "I would've picked all four on that last one. Is that an option?"
**Cedric:** "It is not."
**🌱 Pip:** "What if I start a startup that makes it an option?"
**Cedric:** "...we'll talk later. Moving on."

**Data captured:** `scenario_responses[3]`, `scenario_response_times[3]`
**Preloading:** Second scoring pass begins (execution fit, customer orientation)

---

## S06 — CRYSTAL SEED FORMATION ✅

**Quote (centred, fades in):** "The privilege of a lifetime is to become who you truly are" — Carl Jung

**Cedric:** "Everything so far has been instinct. This one is a choice. Eight essences. You can only carry three. Choose what defines you — not what sounds impressive."

**🌱 Pip** *(unusually quiet):* "This is the part where your seed takes shape. Even I know to shut up for this one."
**Cedric:** "...I'm genuinely moved, Pip."
**🌱 Pip:** "Don't ruin it."

**Layout:** Two rows of 4 orbs (grid, clean on mobile). Central formation point between/below the rows, glowing faintly.

### THE 8 ORBS:

| Orb | Icon | Colour | Description | DISC | Big Five | RIASEC |
|-----|------|--------|-------------|------|----------|--------|
| 🔥 Grit | Flame | Warm amber | Resilience, persistence, hustle | D | Conscientiousness | — |
| 💡 Vision | Lightbulb | Soft gold | Big-picture thinking, future sight | — | Openness | A |
| 🔧 Craft | Wrench | Bronze | Building, making, technical excellence | — | — | R |
| 🗣️ Influence | Megaphone | Purple | Persuasion, leadership, moving people | I | Extraversion | E |
| 💛 Empathy | Heart | Teal | Understanding people, emotional intelligence | S | Agreeableness | S |
| 📊 Analysis | Chart | Ice blue | Data, logic, pattern recognition | C | — | I |
| 🕊️ Freedom | Wing | Silver/white | Independence, autonomy, self-direction | — | — | — |
| 🛡️ Stability | Shield | Deep green | Security, consistency, sustainable growth | — | — | — |

**Pick 3 from 8.** Undo allowed before final lock.

**Selection flow:**
1. Tap orb → lifts and drifts to centre formation point
2. Absorbs → crystal begins forming (first face)
3. Second orb → crystal grows (second face)
4. Third orb → crystal completes unique geometry
5. Remaining 5 orbs fade to outlines

**20+ unique crystal geometries** based on combination. Crystal colour blends the 3 orb colours. Geometry reflects traits (angular/sharp for Grit/Craft, tall/reaching for Vision/Influence, symmetric for Empathy/Analysis, etc.)

Counter: "0 of 3 chosen" → updates

**After 3 selected:**
Crystal pulses fully formed. 3 trait names appear around it.
**Cedric:** "[Name]'s crystal is formed. It won't change — but it will grow."
**🌱 Pip** *(staring, awed):* "It's... actually beautiful. Does mine look like that?"
**Cedric:** "Yours is a pebble, Pip. But a very charming pebble."

**Pip evolution:** After crystal forms, Pip is subtly bigger with a glow matching crystal's colour palette.

**Crystal persistence:** Appears on S08 Forge (centred, transforming), S09 idea cards (small corner icon), S09b deep dive radar (centre), S10 sorting (floats near crests), S11 founder card (hero element).

**Data captured:** `crystal_orbs[3]`, `crystal_selection_order[3]` (first = strongest unconscious drive), `crystal_selection_times[3]`, `unchosen_orbs[5]` (negative weights)
**Preloading:** Third scoring pass (temperament matching via DISC)

---

## S07 — VERDANIA CHRONICLE + PRACTICAL CONSTRAINTS ✅

### SECTION A — Time Machine (Inshorts-style)

**Cedric:** "Fast-forward ten years. Four futures. Swipe through them — choose the one that makes your heart race."
**🌱 Pip:** "Choose the one that gave you goosebumps. Not the one that sounds responsible."

**Mechanic:** One card at a time, swipe horizontally. Each card is a mini newspaper front page styled as "The Verdania Chronicle." Illustration + headline + story + stats + attributed quote. "⭐ This Is My Future" button to select.

### Card 1 — ACHIEVEMENT (nAch)
**Headline:** "[Name]'s Company Crosses $100M Valuation"
**Story:** From zero to centaur in 6 years — the startup that nobody believed in rewrites the playbook.
**Stats:** 📊 $100M+ valuation · 👥 200-person team · 🌎 12 countries
**Quote:** "I didn't build this to prove anyone wrong. I built it to prove myself right." — [Name], Founder & CEO

### Card 2 — AUTONOMY
**Headline:** "[Name] Runs a Profitable Company From Anywhere in the World"
**Story:** No office. No investors. No permission. A one-person operation doing $2M/year.
**Stats:** 💰 $2M annual revenue · ⏰ 25 hours/week · ✈️ 11 countries this year
**Quote:** "Everyone told me to scale. I scaled my freedom instead." — [Name], Founder

### Card 3 — POWER / SCALE (nPow)
**Headline:** "[Name]'s Platform Reaches 10 Million Users Worldwide"
**Story:** What started as a side project now processes more daily active users than most countries have citizens.
**Stats:** 👥 10M+ active users · 📈 40% quarter/quarter growth · 🏆 #1 in category
**Quote:** "We didn't chase users. We built something they couldn't imagine living without." — [Name], CEO

### Card 4 — AFFILIATION / COMMUNITY (nAff)
**Headline:** "[Name]'s Community Helped 50,000 First-Time Founders Launch"
**Story:** The network that turned "I have an idea" into "I have a company" — for 50,000 people and counting.
**Stats:** 🤝 50,000 founders launched · 💬 300,000 community members · 🌱 92% still active after 1yr
**Quote:** "The best business model is one where your success is measured by other people's success." — [Name], Founder

### SECTION B — Practical Constraints

**Cedric:** "Last ones. Quick."

**Time commitment:** 4 pills in a row
`< 5h/week` | `5-15h` | `15-30h` | `30h+`

**Starting resources:** 3 pills
`Bootstrapping ($0-1K)` | `Small budget ($1-10K)` | `Funded ($10K+)`

### AFTER BOTH SECTIONS:

**Cedric:** "The garden has seen enough."

*(Silence. No Pip. 1-2 second pause. Screen dims. The Forge begins.)*

**Data captured:** `headline_choice`, `time_budget`, `resource_level`
**Preloading:** Final scoring pass — motive alignment, calibration, portfolio selection. By Forge start, only Claude API call remains.

---

## S08 — THE FORGE ✅

**Full-screen cinematic.** Crystal seed rises centre-screen, slowly rotating. Particles from journey (inkblot fragments, word echoes, industry icons) spiral inward. Crystal absorbs, pulses, transforms, grows complex, glows brighter.

**Cedric** *(typed letter by letter, slow):* "The garden has seen enough."

Long pause. No Pip. Crystal transforming.

**Cedric** *(after 5-6 seconds):* "Let's see what it found for you."

Crystal cracks open → light floods screen → white flash → transition to S09.

**🌱 Pip** *(barely visible in the light, whispering):* "...here we go."

**Duration:** 15-20 seconds. Preloading strategy ensures matching is 80%+ done before Forge starts. Only Claude API "Why You" text call (~2-5s) is real wait. If animation finishes before API returns, crystal keeps pulsing. If API returns first, hold for dramatic timing. User NEVER sees a loading spinner.

---

## S09 — IDEAS REVEALED ✅

**Light fades. Chat returns. Three cards stacked face-down in centre area.**

**Cedric:** "Three ideas. Matched to your instincts, not your assumptions."
**Cedric:** "The garden doesn't give you what you want. It gives you what fits."

Cards flip one at a time (500ms stagger). Each rotates, catches light, settles.

**🌱 Pip** *(bouncing between cards):* "WAIT. Are these... are these actually good?! These are actually good!"
**Cedric:** "Don't sound so surprised."

### For Path A users ("Find me an idea"):
- Card 1 → 🏠 **Nest** (safest, highest feasibility + fit)
- Card 2 → ✨ **Spark** (strongest overall match)
- Card 3 → 🌿 **Wildvine** (bold leap, different domain, highest novelty)

### For Path B users ("I already have one"):
- Card 1 → 🔥 **Your Idea** (their submitted idea, AI-generated deep dive, personality alignment %)
- Card 2 → ✨ **Spark** (library match their personality suits BETTER than their own idea)
- Card 3 → 🌿 **Wildvine** (unexpected match)

### Each card shows:
- Idea name (bold, large)
- One-line description
- Match % (calibrated: Nest 82-95%, Spark 75-90%, Wildvine 68-82%)
- Type badge (Nest / Spark / Wildvine / Your Idea)
- Crystal seed (small, corner)
- Category pill (e.g., "SaaS" · "B2C")

### Crown button visible in BOTH places:
- On the 3-card overview (below cards)
- Inside the deep dive (below tabs)

### Interaction: Tap any card → Deep Dive overlay (S09b)

---

## S09b — IDEA DEEP DIVE (Full Overlay) ✅

Full-screen overlay slides up. Back arrow returns to 3 cards. 5 tabs.

### TAB 1: THE IDEA
- Overview (1 paragraph)
- The Need
- Motivational Conflict (emotional tension in customer)
- AI Enhancement (specific, not generic)
- Why You (personalised 2-3 sentences from Claude API)
- Founder DNA Radar (user profile overlaid with idea requirements, crystal at centre)

### TAB 2: THE MARKET
- Market Size (TAM/SAM/SOM with concentric circle visual)
- Growth Rate (YoY with trend indicator)
- Sub-Segment Focus
- PESTLE Snapshot (2-3 most relevant)
- Consumer Behaviour (2-3 key insights)
- White Space / Blue Ocean
- Competitive Landscape (3-5 competitors with positioning map)

### TAB 3: THE NUMBERS
- Revenue Model
- Price Range
- Year 1 Earning Potential (honest range with assumptions)
- Gross Margin
- Effort Estimate (3 scenarios: solo bootstrapper, part-time w/ budget, full-time w/ team)
- Impact Potential
- Proof Point (one real-world validation)

### TAB 4: THE PLAYBOOK
- Target Customer (specific persona with name, job, pain)
- Positioning Statement (For [who] who [problem], [name] is...)
- 3 Questions to Validate First
- Trending GTM Approaches (2-3 specific tactics for THIS idea)
- Week 1 Action Plan (5 concrete steps)

### TAB 5: YOUR FUTURE (Verdania Chronicle — idea-specific)
Newspaper front page specific to THIS idea and THIS user. Personalised headline, story, stats, quote. Most shareable element for the specific idea.

### BELOW TABS — Crown + CTAs:
**"🌟 Crown This Idea — Make It Yours"**
On tap: Crystal absorbs idea's energy. Confirmation: "Your seed has chosen. [Idea Name] is yours."

After crowning: "Continue to Your Identity →" button.

---

## S10 — SORTING CEREMONY ✅

### Pre-ceremony:
**Cedric:** "You've chosen your idea. Now the garden chooses you."
**Cedric:** "Every founder belongs to a house. It's not about the idea — it's about how your mind works. The garden has been watching since your first tap."
**🌱 Pip:** "This is my favourite part. Don't tell Cedric."

### Narration:
**Cedric:** "Four houses. Each one has built empires, changed industries, redefined what's possible."
**Cedric:** "Only one speaks your language."

### Phase 1 — THE ARENA (15-20 seconds)
Full-screen cinematic (chat fades away). Crystal at centre. Four crests at four corners — gold, crimson, sapphire, emerald. Each emitting tendrils of coloured light reaching toward crystal — houses COMPETING to claim it.

**Elimination — 3 rounds, PURE SILENCE (no Pip, no Cedric, no text):**
- Round 1: Crystal pulses. One house's tendrils weaken, retract. Crest SHATTERS into particles. Shockwave ripple.
- Round 2: Stronger pulse. Another crest CRACKS like glass, fragments dissolve. Two remain, tendrils reaching more aggressively.
- Round 3: Final pulse (brightest). Third house extinguishes. One remains. Tendrils connect fully with crystal. Crystal glows house colour.

### Phase 2 — THE CLAIM (5-8 seconds)
Winning crest pulls to centre. Crystal + crest merge. Burst of house colour. Full-screen wash.

Crest appears LARGE, centred, detailed, glowing.

Letter by letter:
*"House of Architects"*

User's name, bold:
**A N I S H**

Tagline:
*"You see the blueprint before anyone else."*

**Cedric** *(genuine weight, first time truly warm):* "Welcome home."
**🌱 Pip:** "We did it! ...I mean YOU did it. But I was here!"

### Phase 3 — THE LINEAGE (Full-screen gallery, swipe)
**Cedric:** "You're not the first to walk this path. Let me show you who came before."

4 founders per house. FULL-SCREEN per person. Swipe horizontally.

Each screen:
- Full-screen stylised abstract portrait (artistic, house colour tones)
- "— HOUSE OF [NAME] —"
- Founder name (bold)
- What they built (1 line)
- Defining quote or moment (1-2 lines)
- "Like you, they led with [Crystal Trait 1] + [Crystal Trait 2]"
- Personalised connection line (e.g., "You both see the blueprint before anyone else can.")
- Progress dots: 1 of 4 ● ○ ○ ○

### THE FOUR HOUSES + LINEAGE:

**🟡 ARCHITECTS (Gold)** — "You see the blueprint before anyone else."
Lineage: Leonardo da Vinci, Nikola Tesla, A.R. Rahman, Jensen Huang

**🔴 VANGUARDS (Crimson)** — "You don't wait for permission."
Lineage: Sun Tzu, Nelson Mandela, Rihanna, Satya Nadella

**🔵 ALCHEMISTS (Sapphire)** — "You see connections no one else can."
Lineage: Rumi, Albert Einstein, Steve Jobs, Sam Altman

**🟢 PATHFINDERS (Emerald)** — "You find roads that don't exist yet."
Lineage: Amelia Earhart, Charles Darwin, Christopher Nolan, Elon Musk

**After lineage:**
**Cedric:** "They didn't know they were [House] either. Not at first. You'll grow into it."
**🌱 Pip:** "Does this mean I'm a [House] too?"
**Cedric:** "You're a plant, Pip. But... yes. Technically."
**🌱 Pip:** *(absolutely vibrating with joy)*

**"Meet Your Founder Card →"**

---

## S11 — FOUNDER PROFILE + CARD ✅

**Transition:** Chat returns. Entire colour scheme shifts to house colour (background accents, particles, subtle touches). The garden has permanently changed.

**Cedric:** "One last thing. The garden made this for you."

### THE SHAREABLE FOUNDER CARD (9:16 Instagram Story format)
Design: Dark, premium, house-coloured accents. Crystal seed is visual hero.

**Elements (top to bottom):**
- ✦ CATALST ✦ + verdania (subtle branding, top corners)
- Crystal seed (LARGE, glowing, unique geometry, house colour)
- House name (house colour italic)
- User's name (large, tracked spacing)
- 3 trait badges (from crystal orbs)
- Radar silhouette (personality shape only — no labels, no numbers, like a fingerprint)
- ✨ [X]% match found + 🤖 [Industry] (match % + industry tease, NO idea name)
- House tagline ("You see the blueprint before anyone else.")
- Lineage names (small, elegant, like engraved crest: Da Vinci · Tesla · Rahman · Huang)
- "Discover yours → catalst.app" (CTA for viewers)
- House crest seal (bottom corner)

**Key principle:** Tease without revealing. Shows house, crystal, traits, radar shape, match %, industry — but NOT the idea name, NOT full personality breakdown, NOT mirror pool text. Every element provokes curiosity in viewers.

### Actions below card:
- 🟡 "Download Founder Card"
- 🟡 "Share to Stories"

### Profile sections (scrollable below card):

**Mirror Pool Reflection:**
**Cedric:** "Here's what the garden sees in you."
2-3 paragraphs from Claude API — personalised founder psychology (drives, work style, blind spots, why their crowned idea fits).

**Founder DNA:**
Radar chart, all dimensions scored, crystal at centre.

**Your Matched Ideas:**
All 3 cards listed compact with match % and type badge. Crowned idea gold-bordered.

### PREMIUM CTA (garden-native, below profile):

**Cedric:** "The garden showed you the surface. There's a deeper reading — your full founder psychology, the real numbers behind your idea, and a path to your first ten customers."
**Cedric:** "When you're ready, I know someone who can walk you through it."

Premium block (house-coloured border, elegant):
- "Your deeper reading is waiting."
- 🔒 Your full psychology — what the garden saw that you didn't
- 🔒 The real numbers behind your matched idea
- 🔒 Your first 10 customers — who they are and how to reach them
- [💬 Continue on WhatsApp] button
- NO sales language, NO frameworks list, NO "call" mention

Pre-typed WhatsApp: "Hi! The garden matched me — I'm a [House] founder ([Trait 1] + [Trait 2] + [Trait 3]) with a [X]% match in [Industry]. I'd love to explore my deeper reading. 🌿"

### Journey Complete:
🏅 "Ideation Journey Complete · [House Name] · [Date]"

**Cedric** *(final line):* "The garden doesn't give you answers, [Name]. It gives you a mirror. What you build with it — that's entirely yours."

**🌱 Pip** *(evolved — bigger, house-coloured, tiny leaf/bloom):* "Go build something amazing. And come back and tell us about it. Please? I get bored."

---

## S12 — SETTINGS

Accessible from hamburger menu throughout.
- Account (name, restart journey)
- Share profile link
- About Catalst
- Privacy / Terms

Minimal. Lowest priority.

---

# SCORING ENGINE ARCHITECTURE

## Inputs (multi-framework triangulation):

| Input | Screen | Frameworks |
|-------|--------|------------|
| `blot_responses[3]` | S02 | Rorschach, McClelland, Big Five |
| `blot_response_times[3]` | S02 | Jung implicit, Neuroticism |
| `word_responses[4]` | S03 | Jung, McClelland, Big Five |
| `word_response_times[4]` | S03 | Jung implicit (key signal) |
| `industries_kept/passed/edged` | S04 | Holland RIASEC, Big Five Openness |
| `industry_dwell_times[]` | S04 | Implicit interest |
| `scroll_depth_per_card` | S04 | Decision style |
| `scenario_responses[3]` | S05 | TAT, McClelland, Effectuation/Causation |
| `scenario_response_times[3]` | S05 | Implicit |
| `crystal_orbs[3]` | S06 | DISC, Big Five, RIASEC |
| `crystal_selection_order[3]` | S06 | Priority ordering |
| `unchosen_orbs[5]` | S06 | Negative weights |
| `headline_choice` | S07 | McClelland (conscious) |
| `time_budget` | S07 | Practical constraint |
| `resource_level` | S07 | Practical constraint |
| `user_idea_text` | S01 | Semantic matching (Path B only) |

## Scoring Weights:

| Dimension | Weight | Fed by |
|-----------|--------|--------|
| Domain + RIASEC fit | 20% | Industries + Holland codes |
| McClelland Need Alignment | 15% | Inkblots + headlines + scenarios (triangulated) |
| Temperament / DISC fit | 15% | Crystal seed + word association |
| Problem Orientation | 12% | Scenarios + essence patterns |
| Execution Style | 10% | Effectuation/Causation + implicit timing + values |
| Big Five Compatibility | 10% | Aggregated from all implicit signals |
| Practical Feasibility | 8% | Time + budget + solo viability |
| Boldness / Risk Match | 5% | Risk word + Blot 3 + timing patterns |
| Wildcard / User Idea | 5% | Free text semantic match (Path B) or boldness bonus (Path A) |

## Ideal Social Self Override:
When conscious signals (values, headline) CONFLICT with unconscious (inkblots, word timing, scenarios):
- Unconscious: 60% weight
- Conscious: 40% weight
When they AGREE: 50/50 (higher confidence → higher displayed match %)

## Calibration:
- Nest: 82-95% displayed
- Spark: 75-90% displayed  
- Wildvine: 68-82% displayed

## Preloading Strategy:

| After | Begin |
|-------|-------|
| S00 | Industry card data, idea library index |
| S04 (card 8) | First scoring pass (domain matching on 245 ideas) |
| S05 | Second pass (execution fit, customer orientation) |
| S06 | Third pass (temperament matching via DISC) |
| S07 | Final pass (motive alignment, calibration, portfolio selection) |
| S08 Forge | ONLY: Claude API "Why You" text (~2-5s) |

---

# MONETISATION

## What everyone gets:
- Full journey (all 12 screens)
- 3 matched ideas with all 5 tabs visible
- House sorting + founder profile + shareable card
- Crystal seed

## Premium (gated behind WhatsApp CTA):
- Full psychology decoded
- Real numbers behind matched idea
- First 10 customers — who they are and how to reach them
- (Future: Financial projections, frameworks, investor pitch, unit economics)

## CTA: WhatsApp click-to-chat (manual consulting in v1)
Pre-typed message with house, traits, industry, match %

## Future premium tiers (post-MVP):
- Tier 1 ($9-19): Full deep dive unlock for 1 idea
- Tier 2 ($39-49): All 3 unlocked + AI action plan + PDF export
- Tier 3 ($149-199): Everything + 1-on-1 strategy call
- Re-cast ($4.99): Run journey again with fresh inputs

---

# WHAT'S NOT IN MVP (Explicitly Deferred)

- Pip evolution beyond colour change (visual stages)
- Video cutscenes
- Audio engine (Tone.js) — add after flow locked and tested
- Mana system — replaced by WhatsApp CTA
- World map — linear journey, no navigation needed
- Realm 2 (Validation) — future product
- Social features — future product
- Google/email auth — manual name entry for MVP
- Multiple re-casts — future premium
- Pip as a separate page/companion — stays as live UI element only

---

# EXECUTION PLAN (gstack pipeline)

## Phase 1: Scoring Engine Fix
Fix all broken dimensions, add multi-framework scoring, calibrate output.
Run `/review` on scoring.ts

## Phase 2: Flow Restructure
Implement new 12-screen order. Merge old screens, create new ones.
Run `/plan-eng-review` on architecture

## Phase 3: Screen-by-Screen Build
Build each screen to this spec. After each:
- Run `/design-review`
- Run `/review`

## Phase 4: Integration Testing
Run `/qa` on full flow with real browser.
Test: Path A + Path B, all 4 houses, edge cases.

## Phase 5: Production Readiness
- Run `/benchmark` for performance
- Run `/cso` for security audit
- Run `/ship` for test coverage + PR
