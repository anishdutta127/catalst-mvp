# CATALST v7 — FINAL FIX SPECIFICATION
## Every observation addressed. Nothing missed.

---

# SECTION 1: THE CHAT FOUNDATION (Most Critical)

The entire app needs to feel like a premium AI chat (Claude, ChatGPT) with an enchanted garden skin. Right now it feels like a slideshow with chat bubbles pasted on. These foundational fixes affect EVERY screen.

## 1A. Streaming text (word-by-word, not character-by-character)

Current: CedricBubble types character by character (like a typewriter)
Problem: Feels mechanical, outdated. Modern AI chats stream word-by-word.
Fix: Change CedricBubble typing to reveal WORD by WORD (split message by spaces, reveal next word every 40-60ms). This immediately feels like an LLM generating a response, which is exactly the association we want. The user subconsciously thinks "this was generated for me" rather than "this is pre-written text being typed out."

PipCompanion: Same word-by-word, but faster (30-40ms per word). Pip talks fast.

## 1B. Message lifecycle (appear → read → fade)

Current: All messages persist on screen, stacking up and causing scroll chaos.
Problem: Screen gets cluttered. User has to scroll up/down to follow the conversation. Pip and Cedric lines fight for space.

Fix: Implement a message lifecycle system:
- Message appears (word-by-word stream)
- Message holds for: message.length * 30ms + 2000ms (enough time to read)
- DIALOGUE messages (banter, reactions) FADE OUT after hold time (opacity 0, 300ms, then display none)
- INSTRUCTION messages (what to do next) PERSIST until the activity is complete
- ACTIVITY RESULTS (trait badges, summary lines) PERSIST until next screen

This means: at any given moment, the user sees ONLY the most recent dialogue exchange + any active instructions. Old banter disappears. The screen stays clean.

Categories for each message:
- 'dialogue': Cedric/Pip banter, reactions, comedy. FADES after reading time.
- 'instruction': "Three shapes. No right answers." PERSISTS during activity.
- 'result': "Three instincts. The reading is taking shape." PERSISTS until screen change.

## 1C. Visual hierarchy — 3 distinct zones

Current: Everything (dialogue, Pip comments, instructions, activities) lives in the same visual space with identical styling.
Problem: User can't instantly tell what's chat, what's instruction, what's interactive.

Fix: Define 3 clear zones in the layout:

**ZONE 1 — Dialogue strip (top 15-20% of content area):**
Where Cedric and Pip messages appear and cycle through. Subtle background tint (rgba(0,0,0,0.2)). Messages stream in, hold, fade out. This zone is like the "conversation" area. On desktop this could be above the activity area. On mobile it's the top section that dialogue scrolls through.

**ZONE 2 — Activity area (middle 55-65%):**
Where inkblots, word association, industry cards, crystal orbs, etc. appear. Clean, clear, focused. No text clutter from dialogue. The GardenTimer vine lives at the top edge of this zone.

**ZONE 3 — Pip's corner (bottom, persistent):**
Pip lives here with his side comments during activities. His game-time quips ("These things give me the creeps") appear as small speech bubbles near his sprite. This separates his gameplay commentary from the main dialogue flow above.

The CTA/continue buttons always appear at the very bottom of the viewport, below Zone 3.

## 1D. Cedric introduction

Current: Cedric jumps straight into "The garden recognized you..."
Problem: User doesn't know who Cedric is. No establishment of authority.

Fix: Add an introduction sequence after name entry:

Cedric: "I'm Cedric. I've guided thousands of founders through this garden."
Cedric: "I've studied the minds behind companies like Tesla, Airbnb, Stripe, and Duolingo. The patterns are clearer than you'd think."
Cedric: "What you're about to do, most people spend years circling it. We're going to cut through that noise in a few minutes. I'll read your instincts. You just react."

Then Pip entrance as normal.

This establishes: who Cedric is, his credibility (he's studied real founders), and the promise (cut through years of circling).

## 1E. Smooth transitions between screens

Current: Screens transition with jank, content jumps, scroll position issues.
Fix: Every screen transition should use the same pattern:
- Current screen content fades out (opacity 0, 300ms)
- 100ms gap (brief dark moment)
- New screen content fades in from slight below (opacity 0 → 1, y: 10 → 0, 400ms)
- Activity area and dialogue zone animate independently (dialogue slides in from top, activity fades in at centre)

---

# SECTION 2: TIMER ON EVERYTHING

Current: Timer only on inkblots, words, scenarios.
Problem: Inconsistency. Some screens have urgency, others don't. Feels arbitrary.

Fix: GardenTimer on ALL activity screens:
- S02 Inkblots: 8s per blot (existing)
- S03 Words: 4s per word (existing)
- S04 Industry: 5s per card if expanded (optional — only starts when a card is expanded). Not for browsing.
- S05 Scenarios: 6s per scenario (existing)
- S06 Crystal: 20s total (soft timer — vine grows very slowly, doesn't auto-select, just provides gentle visual pressure)
- S07 Headlines: 12s per card (gentle — these are worth reading)
- S07 Constraints: no timer (these are practical, not instinct)
- S07 Competitive advantage: no timer (free text input)

---

# SECTION 3: PROGRESS BAR WITH MILESTONE BADGES

Current: Plain thin progress bar that fills from left to right. No context.
Problem: User doesn't know where they are in the journey or what's coming.

Fix: Replace the thin bar with a milestone-based progress track:

```
[🌱]---[🧠]---[🌍]---[⚡]---[💎]---[🔥]---[💡]---[🏠]
 Gate   Mind    World   Test   Crystal  Forge  IDEAS  Home
```

- 8 milestone dots connected by a thin line
- Current milestone is gold and pulsing, completed ones are filled gold, upcoming are muted outlines
- The IDEAS milestone (💡) should be visually special — slightly larger, with a subtle glow. This is the carrot.
- On mobile: show only the current milestone + the next 2 (don't try to fit all 8)
- The milestone names aren't shown by default — just the icons. Tap to see the name.

---

# SECTION 4: ACTIVITY SCREENS — SPECIFIC FIXES

## S02 Inkblots

Selection animation fix:
- Selected option: golden border glow (2px solid #d4a853, box-shadow 0 0 12px rgba(212,168,83,0.4)), scale(1.02), holds for 500ms
- Unselected options: clean dissolve (NOT shatter — user said "clean break and dissolve"). Each unselected card: opacity 0, scale(0.95), 300ms ease-out, staggered 60ms. Feels like they gently fade and shrink away, not violently shatter.
- After dissolve: the selected option also fades (200ms) as the blot transitions

Between-blot flow:
- Pip's comment appears in Zone 3 (his corner, bottom) — NOT in the main dialogue area
- Cedric's response appears in Zone 1 (dialogue strip, top) — brief, fades after reading
- These happen SIMULTANEOUSLY with the blot transition, not sequentially. The blot dissolves, Pip quips, Cedric responds, next blot appears — all overlapping. Saves 2-3 seconds per transition.

Post-blot-3 constellation: Show it WHILE Cedric/Pip dialogue types. Not after. Concurrent, not sequential.

## S03 Words

Timer smoothness: The depleting vine animation must be buttery smooth. If it's janky, switch from setInterval (60ms) to requestAnimationFrame for the width interpolation. RAF gives browser-synced 60fps updates.

Selection animation: Same clean dissolve as inkblots. Selected pill glows gold, other pill fades to opacity 0, scale 0.95.

Post-game dialogue: Pip's "FOUR words?!" exchange should start typing WHILE the word constellation animation plays. Not after.

## S04 Industry — MAJOR REWORK

### Layout overhaul:

**Top: Filter chips (horizontal scroll)**
Categories: All | Tech | Creative | Impact | Commerce | Lifestyle | Science
Default: "All" selected

**Middle: Scrollable card list**
Cards in collapsed state by default. User scrolls vertically. Tap to expand one card (collapses previous).

**Bottom: Persistent action bar (ALWAYS visible, never scrolls away)**
Three buttons in Hinge order:
- LEFT: ✕ (pass/dislike) — 48px, muted, subtle red on tap
- CENTRE: ★ (edge/superlike) — 56px, bright gold, the special action, counter badge "2 left"
- RIGHT: ✓ (like/keep) — 48px, gold outline

Below the buttons: counter "3 liked · 1 edged"
Below counter: "Continue →" button — GREYED OUT until 2+ likes. Shows "Like at least 2 to continue" when disabled. Shows "Continue with [X] industries →" when enabled.

The user can Continue at ANY time after 2 likes. They do NOT have to see all cards.

### New industries to add (expand from 15 to 25):

16. 🐾 Pet Care & Animal Tech
17. 🧘 Spirituality & Mindfulness  
18. 🚀 Space Tech & Aerospace
19. 🔒 Cybersecurity
20. 💕 Dating & Relationships
21. ✈️ Travel & Hospitality
22. 👴 Senior Care & Aging
23. 👶 Parenting & Family
24. 🌿 Cannabis & Alt Wellness
25. ⛓️ Web3 & Blockchain

Each needs: id, name, icon, riasec codes, hookLine, 3 prompts from the bank, stats with market size + growth + whatsHot tags.

### Card content redesign:

Collapsed card (default):
```
🤖 AI & Machine Learning                    →
   $200B+ market · 36% CAGR · 🔥 Trending
```
One line: emoji + name + key stat + trending indicator + expand arrow.

Expanded card:
```
🤖 AI & Machine Learning
   $200B+ market by 2030 · Growing 36% YoY

   "My biggest flex is..."
   94 AI startups hit $1B+ last year.
   
   📊 $200B+ TAM  |  📈 36% CAGR  |  🌍 Global
   
   "The honest truth is..."
   90% of AI startups fail because they solve
   tech problems, not human problems.
   
   🔥 Trending ideas: AI agents, vertical SaaS
   🌍 Hot in: US, India, UK, Singapore
   
   "Together we could..."
   Build the infrastructure every company needs.
```

Key changes from current:
- Stats (big numbers) are INTERLEAVED with prompts, not hidden at the bottom
- "Trending ideas" and "Hot in" sections added to each card
- Shorter prompt answers (2 lines max)
- More visual, less wall-of-text

### Edge explanation:
First time user taps Edge (★), show a tiny tooltip: "Edge = your top pick. Use wisely — only 2 allowed."

## S05 Scenarios

Consider: if user finds these forced, we could make them optional. But they provide critical scoring data (customer orientation, competitive psychology, resource philosophy). 

Keep them but make them FAST: 5s timer instead of 6s. Concurrent Pip comments (Zone 3) during selection, not after.

## S06 Crystal

Good as is, but:
- Add the GardenTimer (20s, slow vine) for gentle pressure
- Cedric/Pip lines in their proper zones (dialogue strip + Pip corner)

## S07 Headlines — Inshorts quality

Research Inshorts card layout. The key elements that make Inshorts work:
- Bold, punchy headline (18-20px, max 2 lines)
- Clean colour-coded category strip at top
- Crisp stat numbers as the visual anchor
- Brief story text (3-4 lines max, 14px)
- Share/react buttons at bottom
- Card-to-card swipe animation (smooth, spring physics)

Our Verdania Chronicle cards need to match this standard:
- Taller gradient header with grain texture (already added)
- Headline in serif font, bold, 20px, max 2 lines
- Story in sans, 14px, 3-4 lines, generous line-height
- Stats as LARGE NUMBERS inline, not small pills at the bottom
- Quote section with decorative quotation marks
- Smooth horizontal swipe between cards (framer-motion drag with snap points)

## S07 Competitive Advantage — Auto-fill tags

Below the text input, show tappable suggestion tags:
"Technical skills" | "Industry experience" | "Large audience" | "Domain expertise" | "Network/connections" | "Unique perspective" | "Capital access" | "Geographic advantage"

Tapping a tag fills it into the textarea (appends with comma separation if text already exists). This helps users who don't know what counts as a competitive advantage.

---

# SECTION 5: IDEAS NOT LOADING — ROOT CAUSE INVESTIGATION

The ideas still don't load. The Forge runs. The scoring engine was verified to produce results in simulation. But in the actual browser, S09 shows nothing.

Possible causes:
1. Zustand store field name mismatch (matched_ideas vs matchedIdeas)
2. The scoring engine import of ideas.json fails silently at runtime
3. The Forge's useEffect doesn't fire (React strict mode, dependency issue)
4. S09 mounts before the Forge's scoring completes (race condition)
5. A runtime error in the scoring engine that only happens with real (not simulated) profile data

Debug approach:
- Add a visible (not console-only) debug indicator on S09: a small red/green dot that shows whether matchedIdeas has data
- If the Forge scoring engine errors, catch it and display the error message on screen (dev mode only)
- Add a "Retry Matching" button on S09 that manually re-runs the scoring pipeline with whatever data is in the store
- Check if Ollama connection attempts are causing timeouts (the user mentioned Ollama was installed for the old project — is there any fetch() call trying to reach localhost:11434 that hangs?)

---

# SECTION 6: REMAINING ITEMS

- Remove all console.logs before deploy
- Ensure production build (npm run build) passes clean
- Test WhatsApp URLs with real data
- Test founder card download
- Test idea markdown download
- Verify all 25 industries have valid data in industries.json
- Verify DOMAIN_TO_INDUSTRY mapping includes new industries
- Verify scoring engine handles new industry IDs
