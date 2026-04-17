/**
 * INDUSTRY_STATS — curated India-focused company callouts per industry.
 *
 * Each industry has TWO companies:
 *   - trending: a currently-hot Indian company a founder would recognize
 *               in 2026 + a single-sentence stat that makes the case
 *   - watch:    one up-and-comer to keep an eye on + why it's interesting
 *
 * Surfaced on the S04 card front (Tile B + Tile C in the bento).
 *
 * Coverage: the 15 "core" industries from the Batch 2 enrichment. The other
 * 15 (pet_care, spirituality, space_tech, cybersecurity, dating, travel,
 * senior_care, parenting, cannabis, web3, saas_productivity, ecommerce_retail,
 * govtech_civic, mental_health, hrtech_future_work) fall back to FALLBACK_STAT.
 */

export const INDUSTRY_STATS: Record<string, {
  trending: { company: string; stat: string };
  watch: { company: string; why: string };
}> = {
  ai_ml: {
    trending: {
      company: 'Sarvam AI',
      stat: "Built India's first open sovereign LLM — raised $41M Series A from Peak XV + Lightspeed",
    },
    watch: {
      company: 'CoRover',
      why: 'Powering conversational AI for 1.3B+ users across Indian government and banking',
    },
  },
  health_wellness: {
    trending: {
      company: 'Even Healthcare',
      stat: 'Rebuilding Indian health insurance ground-up — $30M+ raised, 0 claim denials promise',
    },
    watch: {
      company: 'Alyve Health',
      why: 'Full-stack preventive care for corporates — scaling fast in tier-1 India',
    },
  },
  creator_media: {
    trending: {
      company: 'Rigi',
      stat: '30M+ paying community members, Creator-first SaaS — #2 globally after Patreon',
    },
    watch: {
      company: 'Kuku FM',
      why: "India's Spotify for audiobooks — 60M MAU, expanding to regional language originals",
    },
  },
  finance_payments: {
    trending: {
      company: 'Jar',
      stat: "Daily savings micro-app — 15M+ users, consumer fintech's quiet winner",
    },
    watch: {
      company: 'M2P Fintech',
      why: "Embedded finance rails — powering 90% of India's new fintech launches",
    },
  },
  education_learning: {
    trending: {
      company: 'PhysicsWallah',
      stat: "Hit profitability while BYJU's collapsed — ₹2,000Cr revenue, 10M students",
    },
    watch: {
      company: 'Camp K12',
      why: 'Teaching AI and coding to 100K+ Indian kids — AI curriculum spreading through schools',
    },
  },
  food_agriculture: {
    trending: {
      company: 'Licious',
      stat: 'Indian D2C meat delivery unicorn — $1.5B valuation, 2M+ recurring households',
    },
    watch: {
      company: 'String Bio',
      why: "Precision fermentation for dairy proteins — building India's alt-protein moat",
    },
  },
  climate_energy: {
    trending: {
      company: 'Euler Motors',
      stat: "Electric commercial vehicles for India's last mile — $500M order book, 4x revenue growth",
    },
    watch: {
      company: 'Hygenco',
      why: "Green hydrogen infra for heavy industry — India's energy transition dark horse",
    },
  },
  gaming_entertainment: {
    trending: {
      company: 'Winzo',
      stat: '100M+ players, vernacular-first gaming — raised $75M+ from Makers Fund + Griffin',
    },
    watch: {
      company: 'SuperGaming',
      why: 'Indian-built AAA mobile games — publishing internationally on PC/console next',
    },
  },
  fashion_beauty: {
    trending: {
      company: 'Foxtale',
      stat: 'D2C skincare doing ₹500Cr+ ARR in 4 years — clean-beauty winner against Mamaearth',
    },
    watch: {
      company: 'Pilgrim',
      why: 'World-inspired beauty brand — 3x YoY revenue, omnichannel play working',
    },
  },
  sports_fitness: {
    trending: {
      company: 'FITPASS',
      stat: 'Corporate wellness platform — 500+ enterprise clients, consistent profitability',
    },
    watch: {
      company: 'Ultrahuman',
      why: 'Smart ring + metabolic score — Indian wearable going global at Oura-level quality',
    },
  },
  community_social: {
    trending: {
      company: 'Rigi',
      stat: '30M paying members across creator communities — creator SaaS category leader',
    },
    watch: {
      company: 'Koo',
      why: 'Twitter alternative built in India — testing new monetization models post-pivot',
    },
  },
  real_estate_home: {
    trending: {
      company: 'Flipspaces',
      stat: 'Tech-enabled office interiors — $150M+ ARR, expanded to US and Middle East',
    },
    watch: {
      company: 'HomeCapital',
      why: 'Down-payment financing unlocking home ownership for millennials — fresh category',
    },
  },
  logistics_mobility: {
    trending: {
      company: 'Zepto',
      stat: "10-min delivery → $5B valuation in 3 years, India's fastest-scaling consumer co",
    },
    watch: {
      company: 'Porter',
      why: "On-demand intercity trucking — unlocking India's $200B logistics market, IPO path 2026",
    },
  },
  legal_compliance: {
    trending: {
      company: 'SpotDraft',
      stat: 'Contract AI for 10K+ legal teams — $30M+ raised from Sequoia + Prosus',
    },
    watch: {
      company: 'Provakil',
      why: "Litigation management for India's courts — digitizing a $50B legacy market",
    },
  },
  hardware_robotics: {
    trending: {
      company: 'ideaForge',
      stat: "India's defense drone leader — IPO'd at 13x oversubscribed, $2B+ export category",
    },
    watch: {
      company: 'Paperbag',
      why: 'Humanoid robots for Indian warehouses — pilots running with Flipkart & Amazon',
    },
  },
};

export const FALLBACK_STAT = {
  trending: {
    company: 'Fast movers',
    stat: 'Indian startups are scaling 2-3x faster in this space',
  },
  watch: {
    company: 'New entrants',
    why: 'Founders are actively shipping here right now',
  },
};
