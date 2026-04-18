/**
 * lib/archetypes.ts
 * ─────────────────
 * The 16 founder-archetype lookup table. Keyed by `${houseSlug}-${dominantEssenceSlug}`
 * where houseSlug is one of architects/vanguards/alchemists/pathfinders and
 * dominantEssenceSlug is one of grit/vision/craft/influence/empathy/analysis/freedom/stability
 * (lowercased). The dominant essence is always the user's first-picked orb.
 *
 * Each archetype carries:
 *   - name         — the identity label ("The Insurgent")
 *   - pullQuote    — level-3 psychology one-liner for the founder card
 *   - twinGlobal   — a major international founder whose DNA matches
 *   - twinIndian   — the Indian analogue (local relevance matters on share)
 *   - signatureMove — what this archetype does best, stated tersely
 *   - kryptonite   — self-aware blind spot (adds texture, not judgement)
 *
 * Fallback: if a (house, essence) pair isn't mapped, `getArchetype` returns
 * an "unclaimed" generic instead of crashing. We still log a console.warn
 * so we can catch bad mappings in dev.
 */

export interface FounderTwin {
  name: string;
  company: string;
  whyQuote: string;
  initials: string;
}

export interface Archetype {
  name: string;
  pullQuote: string;
  twinGlobal: FounderTwin;
  twinIndian: FounderTwin;
  signatureMove: string;
  kryptonite: string;
}

const t = (
  name: string,
  company: string,
  whyQuote: string,
): FounderTwin => ({
  name,
  company,
  whyQuote,
  initials: name
    .split(' ')
    .filter((p) => p.length > 0)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase(),
});

const ARCHETYPES: Record<string, Archetype> = {
  // ── Architects ──────────────────────────────────────────────
  'architects-craft': {
    name: 'The Master Builder',
    pullQuote: 'You ship because the work outlasts the applause.',
    twinGlobal: t('Jensen Huang', 'NVIDIA', 'Builds chips others can only describe'),
    twinIndian: t('Sridhar Vembu', 'Zoho', 'Builds in villages while Silicon Valley burns cash'),
    signatureMove: 'First-principles rebuilds',
    kryptonite: "Perfectionism's gravity",
  },
  'architects-analysis': {
    name: 'The Systems Philosopher',
    pullQuote: 'You see the lattice others miss.',
    twinGlobal: t('Satya Nadella', 'Microsoft', 'Refactors culture like it were code'),
    twinIndian: t('Nikhil Kamath', 'Zerodha / True Beacon', 'Architects wealth through patient structure'),
    signatureMove: 'Elegant architectures',
    kryptonite: 'Analysis paralysis',
  },
  'architects-vision': {
    name: 'The Blueprinter',
    pullQuote: 'You draw in decades, not quarters.',
    twinGlobal: t('Demis Hassabis', 'DeepMind', 'Plans research arcs longer than markets tolerate'),
    twinIndian: t('Bhavish Aggarwal', 'Ola / Krutrim', 'Stacks ambitions from mobility to silicon'),
    signatureMove: 'Long-horizon bets',
    kryptonite: 'Impatience with the present',
  },
  'architects-grit': {
    name: 'The Long-Game Player',
    pullQuote: 'You compound when others quit.',
    twinGlobal: t('Jeff Bezos', 'Amazon', 'Ten-year arcs as default unit'),
    twinIndian: t('Deepinder Goyal', 'Zomato', 'Outlasted a decade of food-tech skepticism'),
    signatureMove: '10-year arcs',
    kryptonite: 'Forgetting to celebrate wins',
  },

  // ── Vanguards ───────────────────────────────────────────────
  'vanguards-influence': {
    name: 'The Rally-Caller',
    pullQuote: 'You turn rooms into movements.',
    twinGlobal: t('Rihanna', 'Fenty', 'Converts cultural gravity into category power'),
    twinIndian: t('Falguni Nayar', 'Nykaa', 'Rallied an industry around Indian beauty'),
    signatureMove: 'Narrative warfare',
    kryptonite: 'Needing the crowd',
  },
  'vanguards-craft': {
    name: 'The Insurgent',
    pullQuote: 'You turn systems against themselves.',
    twinGlobal: t('Brian Chesky', 'Airbnb', 'Slipped under a $100B hotel industry'),
    twinIndian: t('Kunal Shah', 'CRED', 'Built the rebel product for the top 1%'),
    signatureMove: 'Stealth disruption',
    kryptonite: "Burning bridges you'll need",
  },
  'vanguards-vision': {
    name: 'The Movement Starter',
    pullQuote: "You don't build companies, you build flags.",
    twinGlobal: t('Elon Musk', 'SpaceX / X', 'Plants flags at the edge of the possible'),
    twinIndian: t('Ritesh Agarwal', 'OYO', 'Moved fast enough to scale before categories formed'),
    signatureMove: 'Audacious timelines',
    kryptonite: 'Believing your own hype',
  },
  'vanguards-grit': {
    name: 'The Unstoppable',
    pullQuote: 'You break doors others knock on.',
    twinGlobal: t('Travis Kalanick', 'Uber', 'Forced cities to rewrite their rules'),
    twinIndian: t('Vijay Shekhar Sharma', 'Paytm', 'Out-hustled both regulators and incumbents'),
    signatureMove: 'Brute-force execution',
    kryptonite: 'The scar tissue accumulates',
  },

  // ── Alchemists ──────────────────────────────────────────────
  'alchemists-empathy': {
    name: 'The Soul Reader',
    pullQuote: "You build for feelings others can't name.",
    twinGlobal: t('Melanie Perkins', 'Canva', 'Named the feeling of "I wish I could design that"'),
    twinIndian: t('Ghazal Alagh', 'Mamaearth', 'Read Indian parents before market research did'),
    signatureMove: 'Emotional product design',
    kryptonite: 'Taking criticism personally',
  },
  'alchemists-vision': {
    name: 'The Reality Bender',
    pullQuote: 'You make the impossible feel inevitable.',
    twinGlobal: t('Sam Altman', 'OpenAI', "Reframed AGI from sci-fi to next quarter's roadmap"),
    twinIndian: t('Aravind Srinivas', 'Perplexity', 'Rewired what "search" can mean'),
    signatureMove: 'Reframe-then-ship',
    kryptonite: 'Mistaking vision for traction',
  },
  'alchemists-craft': {
    name: 'The Inventor-Poet',
    pullQuote: 'You build tools that feel like spells.',
    twinGlobal: t('Steve Jobs', 'Apple', "Made the machine feel like it was reading your mind"),
    twinIndian: t('Pranav Mistry', 'TWO.AI', "Turned research demos into things that felt like the future"),
    signatureMove: 'Taste as strategy',
    kryptonite: 'Dismissing good-enough',
  },
  'alchemists-freedom': {
    name: 'The Wanderer-Sage',
    pullQuote: 'You build best when nobody owns you.',
    twinGlobal: t('Naval Ravikant', 'AngelList', 'Built leverage without structure'),
    twinIndian: t('Kailash Katkar', 'Quick Heal', "Built India's antivirus from a repair shop"),
    signatureMove: 'Async / remote leverage',
    kryptonite: 'Allergic to structure',
  },

  // ── Pathfinders ─────────────────────────────────────────────
  'pathfinders-freedom': {
    name: 'The Unclaimed',
    pullQuote: 'You map territory others abandon.',
    twinGlobal: t('Patrick Collison', 'Stripe', "Walked into payments when everyone called it a solved problem"),
    twinIndian: t('Nithin Kamath', 'Zerodha', "Built India's retail broker without a sales team"),
    signatureMove: 'Wandering into whitespace',
    kryptonite: 'Shipping before naming',
  },
  'pathfinders-vision': {
    name: 'The Mapmaker',
    pullQuote: "You see the path before it's a path.",
    twinGlobal: t('Daniel Ek', 'Spotify', 'Saw streaming when everyone else saw piracy'),
    twinIndian: t("Byju Raveendran", "Byju's", "Created a category from a tutoring practice"),
    signatureMove: 'Category creation',
    kryptonite: "Leading people who can't see yet",
  },
  'pathfinders-grit': {
    name: 'The Expedition Leader',
    pullQuote: 'You plant flags in places nobody went.',
    twinGlobal: t('Elon Musk', 'Tesla', 'Took on the automakers at their own game'),
    twinIndian: t('Sachin Bansal', 'Flipkart / Navi', "Pushed India's e-commerce frontier first"),
    signatureMove: 'Brutal terrain pioneering',
    kryptonite: 'Outrunning your team',
  },
  'pathfinders-analysis': {
    name: 'The Pattern Hunter',
    pullQuote: 'You find the signal in the static.',
    twinGlobal: t('Palmer Luckey', 'Anduril', 'Read the defense market while legacy players read memos'),
    twinIndian: t('Kunal Bahl', 'Snapdeal / Titan Capital', 'Reads early-stage India the way others read screens'),
    signatureMove: 'Pattern-matching at scale',
    kryptonite: 'Seeing ghosts',
  },
};

const UNCLAIMED: Archetype = {
  name: 'The Unclaimed',
  pullQuote: 'You move between archetypes — the journey hasn\'t named you yet.',
  twinGlobal: t('Your Own', 'TBD', "Your shape is still forming"),
  twinIndian: t('Your Own', 'TBD', "The archetype hasn't caught up to you yet"),
  signatureMove: 'Shape-shifting',
  kryptonite: "Being hard to pin down",
};

/**
 * Returns the matched archetype or an "unclaimed" fallback.
 *
 * - Accepts house + dominant essence in either case. Normalizes to lowercase.
 * - Strips a trailing plural `s` for the Indian-English variant ("architect"
 *   vs. "architects") so callers don't have to worry about the house-slug
 *   canonical form.
 * - Logs a console.warn (dev only) when falling back, so missing mappings
 *   surface during QA instead of silently degrading.
 */
export function getArchetype(
  houseSlug: string | null | undefined,
  dominantEssenceSlug: string | null | undefined,
): Archetype {
  if (!houseSlug || !dominantEssenceSlug) return UNCLAIMED;
  const h = houseSlug.toLowerCase().trim();
  const e = dominantEssenceSlug.toLowerCase().trim();
  const hNormal = h.endsWith('s') ? h : `${h}s`;
  const key = `${hNormal}-${e}`;
  const match = ARCHETYPES[key];
  if (!match) {
    if (typeof console !== 'undefined') {
      console.warn(`[archetypes] no match for "${key}" — returning UNCLAIMED fallback`);
    }
    return UNCLAIMED;
  }
  return match;
}

export { UNCLAIMED };
