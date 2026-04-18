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
        // NEW v8 — dry undercut to Pip's pathB_submitReaction. Fires right before
        // afterSubmit lands so the banter pair plays first, then the ritual line.
        submitReply: 'Pip. "Vibed" is not a methodology.',
      },
    },
    pip: {
      entrance: 'That\'s his way of saying welcome! I think.',
      pathA: 'I had an idea once! Cedric said it was \'adorable.\'',
      pathB: 'Don\'t stress about making it perfect — Cedric\'s going to pull it apart anyway.',
      // NEW v8 — Path B submit reaction. Pip vulnerable → Cedric dry.
      pathB_submitReaction: "Ooh you wrote it down. Bold. I'd have just vibed.",
    },
    cards: {
      a: { emoji: '\ud83c\udf3f', title: 'Find me an idea', subtitle: 'Let the garden reveal what fits.' },
      b: { emoji: '\ud83d\udd25', title: 'I already have one', subtitle: 'I want to test it against my instincts.' },
    },
    ideaPlaceholder: 'e.g., An AI tool that helps restaurants manage food waste',
  },

  s01_llm: {
    pip: {
      entrance: 'Okay quick version. He says trust the machine. I say trust me. Same thing.',
    },
  },

  /**
   * Ambient Pip lines — fire after ~15s of dwell on a screen if Pip hasn't
   * said anything else recently. Short, cheeky, teasing. Per-screen bank.
   * Accessed via the useAmbientPipLine hook (lib/ambient-pip.ts).
   */
  ambientPip: {
    s02: [
      "What? Don't look at me. I'm just observing.",
      "I already know what you're going to pick.",
    ],
    s03: [
      'Four words and somehow still stressful.',
      'Your instincts are ratting you out.',
    ],
    s05: [
      'Awkward silence — say SOMETHING.',
      'I can see you overthinking.',
    ],
    s06: [
      "You're picking the ones that sound cool, aren't you.",
      'I picked mine in 2 seconds. Just saying.',
    ],
    s07: [
      'Future you is judging your choice.',
      'Pick the one that gave you goosebumps. Trust me.',
    ],
    s09: [
      "Don't pretend you don't have a favorite.",
      "You're peeking at all three. We see you.",
    ],
  } as Record<string, string[]>,

  s02: {
    cedric: {
      intro: 'Three shapes. No right answers. Tell me what you see — not what it is.',
      afterBlot1: 'It means it\'s working. Next.',
      afterBlot2a: 'Nobody said you were, Pip.',
      afterAllBlots: 'Three instincts. The reading is taking shape. We\'re just getting started.',
      blot3Intro: null,  // silence before blot 3 — the blot just appears
      beforeBlot3Response: 'That\'s the point.',
      // NEW v8 — dry reply to Pip's entrance. Banter pair on mount.
      entrance_reply: 'There is no wrong answer.',
    },
    pip: {
      intro: 'These things give me the creeps. But like... in a good way?',
      afterBlot1: 'Okay that was weirdly intense. Is it supposed to feel like that?',
      beforeBlot2: 'This one\'s... bigger.',
      afterBlot2a: 'I wasn\'t scared. Just so you know.',
      afterBlot2b: '...I\'m just saying.',
      beforeBlot3: 'I... I don\'t know what I see in this one.',
      afterAllBlots: 'I felt something shift. Did you feel that?',
      // NEW v8 — entrance beat that Cedric undercuts with entrance_reply.
      entrance: 'Okay, shapes. Just point at what your gut says. No wrong answer. I think.',
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
      // NEW v8 — reply to Pip's entrance. The first word is the honest one.
      entrance_reply: 'The first word is the honest one.',
    },
    pip: {
      intro: 'Finally! Something I\'m built for — not thinking is kind of my whole thing.',
      afterAll: 'That was FOUR words?! It felt like forty. My leaves are sweating.',
      afterCedric: 'MINE DO.',
      // NEW v8 — entrance beat, Cedric undercuts with entrance_reply.
      entrance: 'Four words. Not four essays. I know you want to explain.',
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
      afterFirstKeep: 'Ooh. That one\'s pulling.',
      afterFirstEdge: 'Whoa — an obsession. Only two of those allowed.',
      atThreshold: 'You could stop here. Or keep going and find the OBSESSIONS.',
      afterAll: 'I wanted to edge ALL of them. Cedric said that \'defeats the purpose.\' Whatever that means.',
      // Idle-dwell bank — one fires if the user sits on a card for 12s without
      // swiping. Industry-specific first, general fallback if no match.
      idleByIndustry: {
        ai_ml: [
          'Still reading? The model finished training already.',
          'At this rate, GPT-7 will ship before you swipe.',
        ],
        health_wellness: [
          'Don\'t think too long — you\'ll lose a healthspan year.',
          'Your smart ring is judging this dwell time.',
        ],
        creator_media: [
          'Attention spans are 8 seconds now. What\'s yours?',
          'You could\'ve made a Reel in the time you\'ve been staring.',
        ],
        finance_payments: [
          'Compound interest waits for no one.',
          'Every second you read, Razorpay processes ₹50 crore.',
        ],
        education_learning: [
          'You\'re literally learning about learning right now.',
          'Khan Academy finished explaining this 3 times over.',
        ],
        food_agriculture: [
          'A startup just raised a seed round in the time you\'ve been here.',
          'Somewhere, a tomato has ripened.',
        ],
        climate_energy: [
          'The planet doesn\'t have time for this.',
          'A solar panel generated 3Wh while you were staring.',
        ],
        gaming_entertainment: [
          'This card has been watching you for longer than most NPCs.',
          'Achievement unlocked: Dwell Time +100.',
        ],
        fashion_beauty: [
          'The trend cycle is shorter than your reading time.',
          'In the time you took, Foxtale dropped 2 new SKUs.',
        ],
        sports_fitness: [
          'You\'ve burned 0.6 calories reading this. Keep scrolling for a workout.',
        ],
        community_social: [
          'Real communities keep moving. Swipe or join.',
        ],
        real_estate_home: [
          'While you read, rent in Bangalore went up 4%.',
        ],
        logistics_mobility: [
          'Zepto could\'ve delivered groceries in the time you took.',
        ],
        legal_compliance: [
          'Even lawyers are faster than this. Well. Some of them.',
        ],
        hardware_robotics: [
          'A Figure robot folded 80 shirts while you decided.',
        ],
      } as Record<string, string[]>,
      idleGeneral: [
        'Still reading? The garden\'s patient. I\'m less so.',
        'Cedric says "the best founders decide fast." I\'m just passing that along.',
        'Window shopping the future? Me too honestly.',
        'This card isn\'t going anywhere. But the founders of this space are.',
        'I\'d make a joke but you\'ve been reading for a while.',
      ] as string[],
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
      // NEW v8 — standalone reaction beat after scene loads. No Cedric reply.
      reaction: "Oh we're doing a memory. Stay with it. He's about to say something profound.",
    },
    headlines: [
      {
        id: 'achievement',
        theme: {
          category: 'LEGACY',
          icon: '\ud83d\udc51',
          color_primary: '#D4A843',
          color_secondary: '#6B3F07',
        },
        headline: (name: string) => `${name}'s Company Crosses $100M Valuation`,
        featured_stat: {
          value: '$100M+',
          context: 'valuation hit in year six — Forbes 30u30, Series C closed at $40M',
        },
        lead: 'From zero to centaur in six years. The startup nobody believed in rewrites the playbook for what\u2019s possible in this category.',
        pull_quote: {
          text: 'I didn\u2019t build this to prove anyone wrong. I built it to prove myself right.',
          attribution: (name: string) => `${name}, Founder & CEO`,
        },
        support_stats: [
          { icon: '\ud83d\udc65', text: '200-person team' },
          { icon: '\ud83c\udf0d', text: '12 countries' },
          { icon: '\ud83d\udcc8', text: 'Series C' },
        ],
      },
      {
        id: 'autonomy',
        theme: {
          category: 'FREEDOM',
          icon: '\ud83d\udd4a\ufe0f',
          color_primary: '#0EA5E9',
          color_secondary: '#0C4A6E',
        },
        headline: (name: string) => `${name} Runs a Profitable Company From Anywhere in the World`,
        featured_stat: {
          value: '$2M',
          context: 'annual revenue — twenty-five hours a week, one person, eleven countries last year',
        },
        lead: 'No office. No investors. No permission. A one-person operation running lean in a category that everyone assumed needed scale.',
        pull_quote: {
          text: 'Everyone told me to scale. I scaled my freedom instead.',
          attribution: (name: string) => `${name}, Founder`,
        },
        support_stats: [
          { icon: '\u23f0', text: '25h/week' },
          { icon: '\u2708\ufe0f', text: '11 countries' },
          { icon: '\ud83d\udcb0', text: 'Fully bootstrapped' },
        ],
      },
      {
        id: 'power',
        theme: {
          category: 'SCALE',
          icon: '\u26a1',
          color_primary: '#9333EA',
          color_secondary: '#4C1D95',
        },
        headline: (name: string) => `${name}'s Platform Reaches 10 Million Users Worldwide`,
        featured_stat: {
          value: '10M+',
          context: 'active users in fourteen months — faster than most unicorns',
        },
        lead: 'What started as a side project now processes more daily active users than most countries have citizens.',
        pull_quote: {
          text: 'I signed up thinking it was a demo. Three months later my whole team runs on it.',
          attribution: () => 'Priya Menon, Engineering Lead at a Fortune 500',
        },
        support_stats: [
          { icon: '\ud83d\udcc8', text: '40% QoQ growth' },
          { icon: '\ud83c\udfc6', text: '#1 in category' },
          { icon: '\ud83c\udf10', text: '47 countries' },
        ],
      },
      {
        id: 'affiliation',
        theme: {
          category: 'COMMUNITY',
          icon: '\ud83c\udf31',
          color_primary: '#EC4899',
          color_secondary: '#831843',
        },
        headline: (name: string) => `${name}'s Community Helped 50,000 First-Time Founders Launch`,
        featured_stat: {
          value: '50,000',
          context: 'founders launched through the network — 80+ YC-accepted, 92% still active after a year',
        },
        lead: 'The network that turned "I have an idea" into "I have a company" — for fifty thousand people, and counting.',
        pull_quote: {
          text: 'This community didn\u2019t just teach me how to build. It taught me I belonged in the room.',
          attribution: () => 'Arjun M., fintech founder, Series A closed last month',
        },
        support_stats: [
          { icon: '\ud83d\udcac', text: '300K members' },
          { icon: '\ud83c\udf31', text: '92% retention' },
          { icon: '\ud83c\udfc5', text: '80+ YC launches' },
        ],
      },
    ],
    timeBudgets: ['< 5h/week', '5-15h', '15-30h', '30h+'],
    resourceLevels: ['Bootstrapping ($0-1K)', 'Small budget ($1-10K)', 'Funded ($10K+)'],

    // The Three Vows — replaces the old pill-form constraint copy. The scoring
    // engine recognises both the legacy pill values (above) and these new
    // vow values, so data captured on either UI version is score-compatible.
    vows: {
      intro:
        'Before the match. Three vows. What you can give, what you can risk, what only you carry. Tell me honestly — the match only works if the vows are true.',
      header: 'The Vows',
      sealCta: 'Seal your vows',
      sealCtaIdle: 'Speak all three first',

      hours: {
        label: 'Hours',
        question: 'How many hours per week will you give this?',
        choices: [
          { value: '5-10 hrs', flavor: 'the after-work founder' },
          { value: '10-20 hrs', flavor: 'the serious side-hustler' },
          { value: '20-40 hrs', flavor: 'the half-committed' },
          { value: 'Full-time', flavor: 'all in' },
        ],
      },
      coin: {
        label: 'Coin',
        question: 'What treasure do you carry into this?',
        choices: [
          { value: 'Bootstrap', flavor: 'savings + sweat' },
          { value: '< ₹8L', flavor: 'seed from friends & family' },
          { value: '₹8L - ₹80L', flavor: 'angel / pre-seed raised or saved' },
          { value: '₹80L+', flavor: 'well-funded or institutionally backed' },
        ],
      },
      edge: {
        label: 'Edge',
        question: "What's the one thing YOU can do that nobody else in this match can? Don't be modest — be specific.",
        placeholders: [
          'I speak 4 languages fluently.',
          "I've spent 8 years in K-12 schools.",
          'I can cold-email any CEO and get a reply.',
        ],
        maxLength: 140,
        minStrong: 20,
      },

      cedricBeats: {
        afterFirst: 'One down. The next is heavier.',
        afterSecond: 'Two in. The last one matters most — the one you almost want to hide.',
        afterThird: "That's rare. Now I have what I need.",
      },
      pip: {
        ambient:
          "He's being dramatic about 'vows' but honestly the edge one is hard. Take your time.",
        afterEdge:
          "Oh that's a GOOD one. Cedric's impressed. He doesn't show it.",
      },
    },
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
      // NEW v8 — dry reply to Pip's nudge about sharing the founder card.
      nudge_reply: 'It was not up to you, Pip.',
    },
    pip: {
      intro: 'This is my favourite part. Don\'t tell Cedric.',
      claim: 'We did it! ...I mean YOU did it. But I was here!',
      afterLineage1: (house: string) => `Does this mean I'm a ${house} too?`,
      // NOTE: afterLineage2 is actually Cedric's reply to Pip's question above,
      // placed here for conversation sequencing convenience.
      afterLineage2: 'You\'re a plant, Pip. But... yes. Technically.',
      // NEW v8 — challenge/share nudge; Cedric undercuts with nudge_reply.
      nudge: "Share it. Don't share it. Up to you. I say share it.",
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
