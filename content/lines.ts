/**
 * lines.ts — ALL dialogue for Cedric & Pip across every screen.
 *
 * Cedric : Wise mentor, dry wit, funny father figure. Power distance through gravity & knowledge.
 * Pip    : Young, eager, excitable seedling companion. Says what the user thinks in a funny way.
 *
 * Dialogue is LOCKED from the build spec. Do not add or modify lines.
 */

export const lines = {
  s00: {
    subtitle: 'welcome to verdania, the enchanted startup garden',
    valueProp: '3 ideas matched to your personality in 5 min',
    nameLabel: 'enter your name',
    cta: 'Begin Your Journey',
    quotes: [
      { text: 'Knowing yourself is the beginning of all wisdom.', author: 'Aristotle' },
      { text: 'The privilege of a lifetime is to become who you truly are.', author: 'Carl Jung' },
      { text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson' },
    ],
  },

  s01: {
    cedric: {
      // Intro messages: establish Cedric's authority
      intro1: "Welcome to Verdania, the enchanted startup garden.",
      intro2: "I'll read your instincts. You just react.",
      welcome1: (name: string) => `${name}. Good. Sit close — this won't take long.`,
      welcome2: 'Most founders spend years circling what they\'re meant to build. We\'ll find yours in five minutes. Don\'t think — just react. Your instincts are faster than your reasoning.',
      pathA: {
        response: 'Good. Blank slates are underrated.',
        afterPip: 'That wasn\'t a compliment, Pip.',
      },
      pathB: {
        prompt: 'Alright, let\'s hear it. One sentence. No elevator pitch — just the raw thought.',
        afterSubmit: 'The garden will remember this. Let\'s see what your instincts say.',
      },
    },
    pip: {
      entrance: 'That\'s his way of saying welcome! I think.',
      pathA: 'I had an idea once! Cedric said it was \'adorable.\'',
      pathB: 'Don\'t stress about making it perfect — Cedric\'s going to pull it apart anyway.',
    },
    cards: {
      a: { emoji: '\ud83c\udf3f', title: 'Find me an idea', subtitle: 'Let the garden reveal what fits.' },
      b: { emoji: '\ud83d\udd25', title: 'I already have one', subtitle: 'I want to test it against my instincts.' },
    },
    ideaPlaceholder: 'e.g., An AI tool that helps restaurants manage food waste',
  },

  s02: {
    cedric: {
      intro: 'Three shapes. No right answers. Tell me what you see — not what it is.',
      afterBlot1: 'It means it\'s working. Next.',
      afterBlot2a: 'Nobody said you were, Pip.',
      afterAllBlots: 'Three instincts. The reading is taking shape. We\'re just getting started.',
      blot3Intro: null,  // silence before blot 3 — the blot just appears
      beforeBlot3Response: 'That\'s the point.',
    },
    pip: {
      intro: 'These things give me the creeps. But like... in a good way?',
      afterBlot1: 'Okay that was weirdly intense. Is it supposed to feel like that?',
      beforeBlot2: 'This one\'s... bigger.',
      afterBlot2a: 'I wasn\'t scared. Just so you know.',
      afterBlot2b: '...I\'m just saying.',
      beforeBlot3: 'I... I don\'t know what I see in this one.',
      afterAllBlots: 'I felt something shift. Did you feel that?',
    },
    blots: {
      blot1: {
        options: [
          { position: 'top-left', emoji: '\ud83d\udc65', label: 'Two people — hands touching' },
          { position: 'top-right', emoji: '\ud83e\udd8b', label: 'A butterfly mid-transformation' },
          { position: 'bottom-left', emoji: '\ud83d\udca5', label: 'A rocket launch — pure thrust' },
          { position: 'bottom-right', emoji: '\ud83e\ude78', label: 'Something wounded — but still alive' },
        ],
      },
      blot2: {
        options: [
          { position: 'top-left', emoji: '\ud83d\uddff', label: 'A giant — seen from below' },
          { position: 'top-right', emoji: '\ud83c\udf33', label: 'An ancient tree — roots and all' },
          { position: 'bottom-left', emoji: '\ud83d\udc62', label: 'Heavy boots — someone walking forward' },
          { position: 'bottom-right', emoji: '\ud83e\udd87', label: 'Wings spread wide — about to take off' },
        ],
      },
      blot3: {
        options: [
          { position: 'top-left', emoji: '\ud83c\udf0b', label: 'Fire and smoke — something burning' },
          { position: 'top-right', emoji: '\ud83c\udf3a', label: 'Flowers blooming — an explosion of life' },
          { position: 'bottom-left', emoji: '\ud83d\udc41\ufe0f', label: 'A face — something looking back at me' },
          { position: 'bottom-right', emoji: '\u2601\ufe0f', label: 'Honestly? Chaos. Beautiful chaos.' },
        ],
      },
    },
  },

  s03: {
    cedric: {
      intro: 'Four words. React. Don\'t think.',
      afterAll: 'The instincts don\'t lie. Even when we wish they would.',
      afterPip1: 'Plants don\'t sweat, Pip.',
    },
    pip: {
      intro: 'Finally! Something I\'m built for — not thinking is kind of my whole thing.',
      afterAll: 'That was FOUR words?! It felt like forty. My leaves are sweating.',
      afterCedric: 'MINE DO.',
    },
    words: [
      { word: 'POWER', left: 'Control', right: 'Freedom' },
      { word: 'TOGETHER', left: 'Stronger', right: 'Slower' },
      { word: 'BUILD', left: 'New', right: 'Better' },
      { word: 'RISK', left: 'Thrill', right: 'Calculated' },
    ],
  },

  s04: {
    cedric: {
      intro: 'Fifteen worlds. Some will pull. Some won\'t. Keep what pulls. Star what obsesses you — only two obsessions allowed.',
      afterPip: '...that\'s not entirely wrong, actually.',
      afterAll: (kept: number, edged: number) => `${kept} worlds kept. ${edged} edges marked. The garden is narrowing.`,
    },
    pip: {
      intro: 'This is the fun part! It\'s like shopping but for your FUTURE.',
      afterFirstKeep: 'Ooh, good one. I can feel that one\'s pulling.',
      afterFirstEdge: 'An obsession! That\'s a commitment, you know. Only two of those allowed.',
      atThreshold: 'Okay! Two worlds that pulled. You could stop here — or keep going and find the ones that OBSESS you.',
      afterAll: 'I wanted to edge ALL of them. Cedric said that \'defeats the purpose.\' Whatever that means.',
    },
  },

  s05: {
    cedric: {
      intro1: 'You\'ve seen the worlds. Now I need to see how you move through them.',
      intro2: 'Three moments every founder faces. No theory — just instinct.',
      scenario1: 'Your product is ready. Day one. What\'s your first move?',
      scenario2: 'Your biggest competitor just launched something similar. What do you feel?',
      scenario3: 'Someone hands you $10,000 for your startup. No strings. First spend?',
      afterPip2: 'It is not.',
      afterPip3: '...we\'ll talk later. Moving on.',
    },
    pip: {
      intro: 'Okay I actually know the answer to one of these. Probably. Maybe.',
      afterAll1: 'I would\'ve picked all four on that last one. Is that an option?',
      afterAll2: 'What if I start a startup that makes it an option?',
    },
    scenarios: {
      s1: {
        options: [
          { position: 'top-left', emoji: '\ud83d\udcca', label: 'Watch the dashboard — numbers tell the truth' },
          { position: 'top-right', emoji: '\ud83d\udcde', label: 'Call my first 10 users personally' },
          { position: 'bottom-left', emoji: '\ud83d\udce2', label: 'Share it everywhere and see what spreads' },
          { position: 'bottom-right', emoji: '\ud83d\udd27', label: 'Go back and make it better first' },
        ],
      },
      s2: {
        options: [
          { position: 'top-left', emoji: '\ud83c\udfaf', label: 'Excited — the market is validated' },
          { position: 'top-right', emoji: '\ud83d\udd0d', label: 'Time to find the angle they missed' },
          { position: 'bottom-left', emoji: '\ud83e\udd1d', label: 'Doesn\'t matter — my people won\'t leave' },
          { position: 'bottom-right', emoji: '\u26a1', label: 'I\'ll outbuild them' },
        ],
      },
      s3: {
        options: [
          { position: 'top-left', emoji: '\ud83d\udc64', label: 'Hire someone brilliant' },
          { position: 'top-right', emoji: '\ud83d\udcc8', label: 'Acquire customers' },
          { position: 'bottom-left', emoji: '\ud83d\udcbb', label: 'Build the product' },
          { position: 'bottom-right', emoji: '\ud83d\udd2c', label: 'Research before spending' },
        ],
      },
    },
  },

  s06: {
    quote: 'The privilege of a lifetime is to become who you truly are',
    quoteAttribution: 'Carl Jung',
    cedric: {
      intro: 'Everything so far has been instinct. This one is a choice. Eight essences. You can only carry three. Choose what defines you — not what sounds impressive.',
      afterPip: '...I\'m genuinely moved, Pip.',
      afterSelection: (name: string) => `${name}'s crystal is formed. It won't change — but it will grow.`,
      afterPip2: 'Yours is a pebble, Pip. But a very charming pebble.',
    },
    pip: {
      intro: 'This is the part where your seed takes shape. Even I know to shut up for this one.',
      afterCedric: 'Don\'t ruin it.',
      afterSelection: 'It\'s... actually beautiful. Does mine look like that?',
    },
    orbs: [
      { id: 'Grit', icon: '\ud83d\udd25', colour: '#D4A843', label: 'Resilience, persistence, hustle' },
      { id: 'Vision', icon: '\ud83d\udca1', colour: '#F0D060', label: 'Big-picture thinking, future sight' },
      { id: 'Craft', icon: '\ud83d\udd27', colour: '#CD7F32', label: 'Building, making, technical excellence' },
      { id: 'Influence', icon: '\ud83d\udde3\ufe0f', colour: '#9B59B6', label: 'Persuasion, leadership, moving people' },
      { id: 'Empathy', icon: '\ud83d\udc9b', colour: '#00D8B9', label: 'Understanding people, emotional intelligence' },
      { id: 'Analysis', icon: '\ud83d\udcca', colour: '#5DADE2', label: 'Data, logic, pattern recognition' },
      { id: 'Freedom', icon: '\ud83d\udd4a\ufe0f', colour: '#BDC3C7', label: 'Independence, autonomy, self-direction' },
      { id: 'Stability', icon: '\ud83d\udee1\ufe0f', colour: '#27AE60', label: 'Security, consistency, sustainable growth' },
    ],
  },

  s07: {
    cedric: {
      headlineIntro: 'Fast-forward ten years. Four futures. Swipe through them — choose the one that makes your heart race.',
      constraintsIntro: 'Last ones. Quick.',
      afterAll: 'The garden has seen enough.',
    },
    pip: {
      headlineIntro: 'Choose the one that gave you goosebumps. Not the one that sounds responsible.',
    },
    headlines: [
      {
        id: 'achievement',
        headline: (name: string) => `${name}'s Company Crosses $100M Valuation`,
        story: 'From zero to centaur in 6 years — the startup that nobody believed in rewrites the playbook.',
        stats: '\ud83d\udcca $100M+ valuation \u00b7 \ud83d\udc65 200-person team \u00b7 \ud83c\udf0e 12 countries',
        quote: (name: string) => `"I didn't build this to prove anyone wrong. I built it to prove myself right." — ${name}, Founder & CEO`,
      },
      {
        id: 'autonomy',
        headline: (name: string) => `${name} Runs a Profitable Company From Anywhere in the World`,
        story: 'No office. No investors. No permission. A one-person operation doing $2M/year.',
        stats: '\ud83d\udcb0 $2M annual revenue \u00b7 \u23f0 25 hours/week \u00b7 \u2708\ufe0f 11 countries this year',
        quote: (name: string) => `"Everyone told me to scale. I scaled my freedom instead." — ${name}, Founder`,
      },
      {
        id: 'power',
        headline: (name: string) => `${name}'s Platform Reaches 10 Million Users Worldwide`,
        story: 'What started as a side project now processes more daily active users than most countries have citizens.',
        stats: '\ud83d\udc65 10M+ active users \u00b7 \ud83d\udcc8 40% quarter/quarter growth \u00b7 \ud83c\udfc6 #1 in category',
        quote: (name: string) => `"We didn't chase users. We built something they couldn't imagine living without." — ${name}, CEO`,
      },
      {
        id: 'affiliation',
        headline: (name: string) => `${name}'s Community Helped 50,000 First-Time Founders Launch`,
        story: 'The network that turned "I have an idea" into "I have a company" — for 50,000 people and counting.',
        stats: '\ud83e\udd1d 50,000 founders launched \u00b7 \ud83d\udcac 300,000 community members \u00b7 \ud83c\udf31 92% still active after 1yr',
        quote: (name: string) => `"The best business model is one where your success is measured by other people's success." — ${name}, Founder`,
      },
    ],
    timeBudgets: ['< 5h/week', '5-15h', '15-30h', '30h+'],
    resourceLevels: ['Bootstrapping ($0-1K)', 'Small budget ($1-10K)', 'Funded ($10K+)'],
  },

  s08: {
    cedric: {
      line1: 'The garden has seen enough.',
      line2: 'Let\'s see what it found for you.',
    },
    pip: {
      whisper: '...here we go.',
    },
  },

  s09: {
    cedric: {
      reveal1: 'Three ideas. Matched to your instincts, not your assumptions.',
      reveal2: 'The garden doesn\'t give you what you want. It gives you what fits.',
      afterPip: 'Don\'t sound so surprised.',
    },
    pip: {
      reveal: 'WAIT. Are these... are these actually good?! These are actually good!',
    },
    tiers: {
      nest: { emoji: '\ud83c\udfe0', label: 'Nest', description: 'Safest, highest feasibility + fit' },
      spark: { emoji: '\u2728', label: 'Spark', description: 'Strongest overall match' },
      wildvine: { emoji: '\ud83c\udf3f', label: 'Wildvine', description: 'Bold leap, different domain, highest novelty' },
      yourIdea: { emoji: '\ud83d\udd25', label: 'Your Idea', description: 'Your submitted idea with personality alignment' },
    },
    crownConfirm: (name: string) => `Your seed has chosen. ${name} is yours.`,
    crownCta: 'Crown This Idea — Make It Yours',
  },

  s10: {
    cedric: {
      intro1: 'You\'ve chosen your idea. Now the garden chooses you.',
      intro2: 'Every founder belongs to a house. It\'s not about the idea — it\'s about how your mind works. The garden has been watching since your first tap.',
      narration1: 'Four houses. Each one has built empires, changed industries, redefined what\'s possible.',
      narration2: 'Only one speaks your language.',
      claim: 'Welcome home.',
      lineageIntro: 'You\'re not the first to walk this path. Let me show you who came before.',
      afterLineage: (house: string) => `They didn't know they were ${house} either. Not at first. You'll grow into it.`,
    },
    pip: {
      intro: 'This is my favourite part. Don\'t tell Cedric.',
      claim: 'We did it! ...I mean YOU did it. But I was here!',
      afterLineage1: (house: string) => `Does this mean I'm a ${house} too?`,
      // NOTE: afterLineage2 is actually Cedric's reply to Pip's question above,
      // placed here for conversation sequencing convenience.
      afterLineage2: 'You\'re a plant, Pip. But... yes. Technically.',
    },
    continueButton: 'Meet Your Founder Card \u2192',
  },

  s11: {
    cedric: {
      intro: 'One last thing. The garden made this for you.',
      mirrorPool: 'Here\'s what the garden sees in you.',
      premium1: 'The garden showed you the surface. There\'s a deeper reading — your full founder psychology, the real numbers behind your idea, and a path to your first ten customers.',
      premium2: 'When you\'re ready, I know someone who can walk you through it.',
      final: (name: string) => `The garden doesn't give you answers, ${name}. It gives you a mirror. What you build with it — that's entirely yours.`,
    },
    pip: {
      final: 'Go build something amazing. And come back and tell us about it. Please? I get bored.',
    },
    card: {
      download: 'Download Founder Card',
      share: 'Share to Stories',
    },
    premium: {
      headline: 'Your deeper reading is waiting.',
      items: [
        'Your full psychology — what the garden saw that you didn\'t',
        'The real numbers behind your matched idea',
        'Your first 10 customers — who they are and how to reach them',
      ],
      cta: 'Continue on WhatsApp',
      whatsappTemplate: (house: string, traits: string, matchPercent: number, industry: string) =>
        `Hi! The garden matched me — I'm a ${house} founder (${traits}) with a ${matchPercent}% match in ${industry}. I'd love to explore my deeper reading. \ud83c\udf3f`,
    },
    journeyComplete: (house: string) => `Ideation Journey Complete \u00b7 ${house}`,
  },
} as const;

/** Philosophy quotes — one per screen, reinforcing the emotional arc. */
export const QUOTES: Record<string, { text: string; author: string }> = {
  s00: { text: 'Knowing yourself is the beginning of all wisdom.', author: 'Aristotle' },
  s02: { text: 'The eye sees only what the mind is prepared to comprehend.', author: 'Robertson Davies' },
  s03: { text: 'Your first instinct is usually right. Your second instinct is fear.', author: 'Unknown' },
  s04: { text: 'You can tell a lot about a person by what they\'re excited about.', author: 'Unknown' },
  s06: { text: 'What you choose to carry reveals what you believe you\'ll need.', author: 'Unknown' },
  s07: { text: 'Constraints are the birthplace of creativity.', author: 'T.S. Eliot' },
  s08: { text: 'The garden does not judge. It only reveals.', author: 'Verdania Chronicle' },
  s09: { text: 'An idea that fits is not found. It is recognized.', author: 'Cedric' },
  s10: { text: 'You were always this. Now you have a name for it.', author: 'Verdania Chronicle' },
  s11: { text: 'The seed has become something worth planting.', author: 'Cedric' },
};
