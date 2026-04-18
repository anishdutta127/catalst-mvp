/**
 * CATALST — EXPANDED IDEA REPOSITORY v2
 * ─────────────────────────────────────────────────────────
 * ~450 startup ideas across 150+ industries.
 * Every idea tied to a real-world analog or trending startup.
 *
 * FIELDS (infer-then-adjust):
 *   domain         → must match industries.ts Industry.id
 *   tags           → for filter pills (2-4 tags each)
 *   orbWeights     → essence match (1-5 scale; only include essences that score)
 *   motive         → single primary motive this idea satisfies
 *   houses         → 1-3 founder houses that fit (rank order)
 *   analog         → real company this evokes
 *   stage          → established | emerging | frontier
 *   bharatFlavor   → set true if India-first framing
 *   aiAngle        → optional: the AI disruption thesis
 *
 * MATCHING ALGO NOTES (Anish):
 *   - No idea has more than 3 houses, so multi-house bias is capped
 *   - Essence weights: keep at most 4 essences scoring on any idea
 *     (forces discrimination between ideas)
 *   - Motive is single-valued (status | belonging | stability | mastery | freedom)
 *   - If your engine uses different essence slugs, find-replace these 8:
 *     grit, vision, stability, freedom, craft, analysis, influence, empathy
 */

export type Essence = 'grit' | 'vision' | 'stability' | 'freedom' | 'craft' | 'analysis' | 'influence' | 'empathy';
export type Motive = 'status' | 'belonging' | 'stability' | 'mastery' | 'freedom';
export type House = 'architects' | 'vanguards' | 'alchemists' | 'pathfinders';
export type Stage = 'established' | 'emerging' | 'frontier';

export interface Idea {
  id: string;
  title: string;
  tagline: string;
  pitch: string;
  domain: string;
  tags: string[];
  orbWeights: Partial<Record<Essence, number>>;
  motive: Motive;
  houses: House[];
  analog?: string;
  stage: Stage;
  bharatFlavor?: boolean;
  aiAngle?: string;
}

export const IDEAS: Idea[] = [

  // ══════════════════════════════════════════════════════════
  // PLAY › GAMING › SOCIAL & IRL
  // ══════════════════════════════════════════════════════════
  {
    id: 'play-social-1', title: 'PitchUp',
    tagline: 'Skip the group chat. Just play.',
    pitch: 'Real-time pickup sports app where verified players within 3km get a single notification — if 6 say yes in 15 mins, the match happens. Auto-books the turf, splits the bill, syncs to calendars.',
    domain: 'gaming-social', tags: ['social', 'sports', 'hyperlocal'],
    orbWeights: { influence: 4, empathy: 3, vision: 2 }, motive: 'belonging',
    houses: ['vanguards', 'pathfinders'], analog: 'Playo (but instant)', stage: 'emerging',
    bharatFlavor: true,
  },
  {
    id: 'play-social-2', title: 'LeagueStack',
    tagline: 'Your corporate cricket league as a service.',
    pitch: 'White-label corporate sports leagues — box cricket, badminton, chess. Companies onboard, we handle scheduling, scorekeeping, stats, photography, and year-end finals. Ops becomes a subscription.',
    domain: 'gaming-social', tags: ['b2b', 'corporate', 'sports'],
    orbWeights: { craft: 3, stability: 3, analysis: 3 }, motive: 'stability',
    houses: ['architects', 'pathfinders'], analog: 'Hudle × corp league', stage: 'emerging',
    bharatFlavor: true,
  },
  {
    id: 'play-social-3', title: 'Rookiz',
    tagline: 'Adult beginner leagues for scared grownups.',
    pitch: 'Learn-a-sport leagues for working 25–40yo who always wanted to play tennis/boxing/football but never did. 6-week structured beginner cohorts → graduation to rec leagues. Community > competition.',
    domain: 'gaming-social', tags: ['community', 'learning', 'sports'],
    orbWeights: { empathy: 4, influence: 3, grit: 2 }, motive: 'belonging',
    houses: ['alchemists', 'vanguards'], analog: 'Timeleft × Playo', stage: 'emerging',
  },

  // PLAY › GAMING › HYPERCASUAL
  {
    id: 'play-hypercasual-1', title: 'DrillDown',
    tagline: 'Skill-based 10-second games for ₹10 each.',
    pitch: 'Ultra-short, ultra-skill games you can win at in 10 seconds. Tournament structure, daily leaderboards, micro-wagering. Target: commuters, break-time employees. WinZO but faster.',
    domain: 'gaming-hypercasual', tags: ['rmg', 'mobile', 'bharat'],
    orbWeights: { craft: 3, analysis: 3, grit: 2 }, motive: 'mastery',
    houses: ['vanguards', 'architects'], analog: 'WinZO', stage: 'emerging',
    bharatFlavor: true,
  },
  {
    id: 'play-hypercasual-2', title: 'RhythmHeist',
    tagline: 'Rhythm game × heist narrative.',
    pitch: 'Mobile rhythm game where each song is a heist level. Tap-to-the-beat to crack safes, dodge guards. Global leaderboard. Indian classical / Bollywood pack as differentiator.',
    domain: 'gaming-hypercasual', tags: ['music', 'mobile', 'casual'],
    orbWeights: { craft: 4, vision: 3 }, motive: 'mastery',
    houses: ['alchemists', 'pathfinders'], analog: 'Friday Night Funkin\' × Subway Surfers', stage: 'emerging',
  },

  // PLAY › GAMING › INDIE
  {
    id: 'play-indie-1', title: 'SmolPub',
    tagline: 'Shopify for indie game devs.',
    pitch: 'One-tool stack for indie devs: landing page, Steam key distribution, Discord bot, newsletter, playtest signup. Replaces the 6-tool patchwork solo devs cobble together.',
    domain: 'gaming-indie', tags: ['tooling', 'saas', 'creator'],
    orbWeights: { craft: 4, analysis: 3, freedom: 2 }, motive: 'freedom',
    houses: ['architects', 'alchemists'], analog: 'itch.io × Shopify', stage: 'emerging',
  },
  {
    id: 'play-indie-2', title: 'PlaytestDAO',
    tagline: 'Paid playtesters for indie games in 48hr.',
    pitch: 'Marketplace where indie devs get structured playtest feedback (videos, heatmaps, surveys) from 50 real target-persona players within 48 hours. Currently indies beg on Twitter.',
    domain: 'gaming-indie', tags: ['marketplace', 'research', 'indie'],
    orbWeights: { empathy: 3, analysis: 4, influence: 2 }, motive: 'belonging',
    houses: ['vanguards', 'alchemists'], analog: 'UserTesting for games', stage: 'emerging',
  },

  // PLAY › GAMING › ESPORTS
  {
    id: 'play-esports-1', title: 'ScrimRoom',
    tagline: 'Esports scrim marketplace for rising teams.',
    pitch: 'Semi-pro esports teams need practice matches. We match teams by ELO, schedule scrims, record VODs, auto-generate scrim reports. Like a dating app but for rivals.',
    domain: 'gaming-esports', tags: ['esports', 'marketplace', 'tier2'],
    orbWeights: { analysis: 3, grit: 3, influence: 3 }, motive: 'mastery',
    houses: ['vanguards', 'pathfinders'], analog: 'Scrim.gg + analytics', stage: 'emerging',
  },
  {
    id: 'play-esports-2', title: 'KingdomStack',
    tagline: 'Esports org OS for India.',
    pitch: 'Tooling for 500+ Indian esports orgs: contracts, salary, travel, sponsor CRM, content calendar. S8UL/GodLike operate on WhatsApp groups right now. Formalize the backend.',
    domain: 'gaming-esports', tags: ['saas', 'esports', 'india'],
    orbWeights: { craft: 3, analysis: 4, stability: 3 }, motive: 'stability',
    houses: ['architects', 'pathfinders'], stage: 'emerging', bharatFlavor: true,
  },

  // PLAY › GAMING › DEV TOOLS
  {
    id: 'play-dev-tools-1', title: 'NPC.ai',
    tagline: 'AI NPCs that actually feel alive.',
    pitch: 'Drop-in NPC SDK where every character has memory, goals, and LLM-driven dialogue tuned to stay in-world. Unreal/Unity plugins. The missing layer between Inworld and actual game integration.',
    domain: 'gaming-dev-tools', tags: ['ai', 'gamedev', 'sdk'],
    orbWeights: { craft: 4, vision: 4, analysis: 3 }, motive: 'mastery',
    houses: ['architects', 'alchemists'], analog: 'Inworld + Convai', stage: 'frontier',
    aiAngle: 'LLM-powered NPCs unlock entirely new game genres',
  },
  {
    id: 'play-dev-tools-2', title: 'AssetLoom',
    tagline: 'Text-to-3D game-ready assets.',
    pitch: 'Indie game devs type "medieval tavern chair, low-poly, stylized" and get Unity-ready 3D assets with LODs, UVs, materials. Cut 3 days of Blender per asset.',
    domain: 'gaming-dev-tools', tags: ['ai', 'gamedev', '3d'],
    orbWeights: { craft: 4, freedom: 3 }, motive: 'freedom',
    houses: ['alchemists', 'architects'], analog: 'Scenario × Luma', stage: 'frontier',
    aiAngle: 'Gen-AI for 3D removes the solo-dev bottleneck',
  },

  // PLAY › GAMING › CLOUD
  {
    id: 'play-cloud-1', title: 'PlayAnywhere.in',
    tagline: 'Cloud gaming for Indian GPUs and Indian bandwidth.',
    pitch: 'India-first cloud gaming: edge servers in Mumbai/Bangalore/Delhi, ₹299/month, optimized for Jio 5G, games priced in INR. GeForce Now doesn\'t work reliably in India.',
    domain: 'gaming-cloud', tags: ['cloud', 'infra', 'india'],
    orbWeights: { vision: 4, craft: 3, stability: 2 }, motive: 'freedom',
    houses: ['pathfinders', 'architects'], stage: 'emerging', bharatFlavor: true,
  },

  // PLAY › GAMING › WEB3
  {
    id: 'play-web3-1', title: 'FieldOfPlay',
    tagline: 'True ownership of in-game items across games.',
    pitch: 'Cross-game inventory where your cosmetics in Game A work in Game B. Solves the trust problem via on-chain provenance. Start with indie Unity devs on Solana.',
    domain: 'gaming-web3', tags: ['web3', 'interop', 'indie'],
    orbWeights: { vision: 4, freedom: 3, craft: 3 }, motive: 'freedom',
    houses: ['pathfinders', 'alchemists'], analog: 'Immutable × Ronin', stage: 'frontier',
  },

  // PLAY › GAMING › STREAMER TOOLS
  {
    id: 'play-streamer-1', title: 'ClipMint',
    tagline: 'AI that turns your stream into 30 shorts.',
    pitch: 'Plug in Twitch/YouTube Live. AI auto-detects highlights (kills, fails, funny reactions), cuts vertical clips with subtitles + facecam layout, posts to TikTok/Reels/Shorts while you\'re still streaming.',
    domain: 'gaming-streamer-tools', tags: ['ai', 'creator', 'video'],
    orbWeights: { craft: 4, influence: 3 }, motive: 'status',
    houses: ['alchemists', 'vanguards'], analog: 'Opus Clip for gaming', stage: 'emerging',
    aiAngle: 'AI highlight detection compounds creator output 10x',
  },

  // PLAY › GAMING › FANTASY
  {
    id: 'play-fantasy-1', title: 'Probe11',
    tagline: 'Fantasy cricket for cricket nerds, not casuals.',
    pitch: 'Dream11 for power users: deeper stats, custom scoring, private leagues with buy-ins up to ₹1L, VOD review, coach-AI that explains why your picks underperformed.',
    domain: 'gaming-fantasy', tags: ['fantasy', 'cricket', 'india'],
    orbWeights: { analysis: 5, grit: 2, influence: 2 }, motive: 'mastery',
    houses: ['architects', 'vanguards'], analog: 'Dream11 Pro-mode', stage: 'emerging',
    bharatFlavor: true,
  },

  // PLAY › GAMING › KIDS
  {
    id: 'play-kids-1', title: 'Firstborn',
    tagline: 'Roblox for parents who actually read the guidelines.',
    pitch: 'Kid gaming platform with mandatory parent dashboard: screen-time limits, social audit trail, zero predatory monetization, educational overlays. Indian parents first — they want this.',
    domain: 'gaming-kids', tags: ['kids', 'safety', 'india'],
    orbWeights: { empathy: 4, stability: 4, craft: 3 }, motive: 'stability',
    houses: ['architects', 'alchemists'], analog: 'Roblox safe-mode', stage: 'emerging',
    bharatFlavor: true,
  },

  // PLAY › GAMING › TABLETOP
  {
    id: 'play-tabletop-1', title: 'DungeonDM',
    tagline: 'Your AI D&D dungeon master.',
    pitch: 'AI runs a D&D-style campaign for you and your friends over voice. Handles NPCs, narration, rules, dice. Players use their phone. The "can\'t find a DM" problem solved.',
    domain: 'gaming-tabletop', tags: ['ai', 'rpg', 'social'],
    orbWeights: { craft: 4, empathy: 3, vision: 3 }, motive: 'belonging',
    houses: ['alchemists', 'pathfinders'], stage: 'frontier',
    aiAngle: 'LLMs can finally run open-ended RPG narration',
  },

  // ══════════════════════════════════════════════════════════
  // PLAY › CREATOR TOOLS
  // ══════════════════════════════════════════════════════════
  {
    id: 'play-short-video-1', title: 'RepurposeOS',
    tagline: 'One long video → 20 formats, 20 platforms.',
    pitch: 'Podcast or webinar in → TikTok clips, Twitter threads, LinkedIn posts, Instagram carousels, YouTube shorts, blog post — all out, with platform-tuned hooks. One API call per asset.',
    domain: 'creator-short-video', tags: ['ai', 'creator', 'saas'],
    orbWeights: { craft: 4, analysis: 3, freedom: 3 }, motive: 'freedom',
    houses: ['alchemists', 'architects'], analog: 'Opus Clip + Descript', stage: 'emerging',
    aiAngle: 'Multi-modal AI collapses 5 tools into one',
  },
  {
    id: 'play-short-video-2', title: 'Subtitlr',
    tagline: 'Subtitles that don\'t look like every other creator\'s.',
    pitch: 'AI subtitles with 200+ creator-designed style packs, word-level timing, mouth-sync, custom emoji animations. Opinionated style > generic templates.',
    domain: 'creator-short-video', tags: ['ai', 'design', 'creator'],
    orbWeights: { craft: 5, influence: 2 }, motive: 'mastery',
    houses: ['alchemists'], analog: 'Submagic with taste', stage: 'emerging',
  },
  {
    id: 'play-newsletter-1', title: 'Byline',
    tagline: 'Substack for creators who hate writing.',
    pitch: 'Record a 5-min voice note → AI drafts a newsletter in your style, you tweak, publish. For creators who have takes but no time to type. Monetize with paid subs.',
    domain: 'creator-newsletter', tags: ['ai', 'writing', 'creator'],
    orbWeights: { craft: 3, influence: 4, freedom: 3 }, motive: 'freedom',
    houses: ['alchemists', 'vanguards'], analog: 'Substack × voice-first', stage: 'emerging',
    aiAngle: 'Voice-to-essay unlocks non-writer creators',
  },
  {
    id: 'play-podcasting-1', title: 'Castable',
    tagline: 'Riverside, but made for Indian internet.',
    pitch: 'Podcast recording platform optimized for flaky 4G connections. Local-first recording, delta-sync on reconnect, Indic language transcription baked in.',
    domain: 'creator-podcasting', tags: ['podcast', 'infra', 'india'],
    orbWeights: { craft: 4, stability: 3 }, motive: 'stability',
    houses: ['architects'], analog: 'Riverside × India', stage: 'emerging', bharatFlavor: true,
  },
  {
    id: 'play-ai-content-1', title: 'Cinemate',
    tagline: 'Generate a full 30s ad from a single brief.',
    pitch: 'Brand inputs product + audience → AI generates storyboard, voiceover, music, editing, final 30-sec ad for Reels/TikTok. Under $10 per ad. Existing ad agencies = 5 weeks and $50K.',
    domain: 'creator-ai-content', tags: ['ai', 'ads', 'video'],
    orbWeights: { vision: 5, craft: 4, influence: 3 }, motive: 'status',
    houses: ['alchemists', 'vanguards'], analog: 'Runway × Arcads', stage: 'frontier',
    aiAngle: 'Generative video replaces the ad agency mid-market',
  },
  {
    id: 'play-monetization-1', title: 'Superfan',
    tagline: 'Subscription tiers your top 1% will actually pay for.',
    pitch: 'Creators define exclusive perks — monthly AMA, private Discord, merch drops, first-dibs on new content. We handle payments, access control, churn analytics. 15% take, no platform lock-in.',
    domain: 'creator-monetization', tags: ['creator', 'payments', 'saas'],
    orbWeights: { influence: 4, empathy: 3, craft: 2 }, motive: 'belonging',
    houses: ['vanguards', 'alchemists'], analog: 'Patreon × Passes', stage: 'emerging',
  },
  {
    id: 'play-fan-platforms-1', title: 'OrbitApp',
    tagline: 'Your own branded app, no code.',
    pitch: 'Creators launch a dedicated iOS/Android app (not another Discord) for their community: content, events, chat, payments, merch. Launches in a day. For creators past 100K followers.',
    domain: 'creator-fan-platforms', tags: ['community', 'creator', 'mobile'],
    orbWeights: { craft: 4, influence: 3, vision: 3 }, motive: 'belonging',
    houses: ['architects', 'alchemists'], analog: 'Geneva × Circle', stage: 'emerging',
  },

  // ══════════════════════════════════════════════════════════
  // PLAY › SOCIAL
  // ══════════════════════════════════════════════════════════
  {
    id: 'play-social-niche-1', title: 'Tribes.app',
    tagline: 'Reddit-shaped communities, Instagram-native UI.',
    pitch: 'Interest-graph social network: join tribes (sourdough, climbing, K-drama, motherhood), get a single feed. No algorithm manipulation, just chronological posts from your tribes.',
    domain: 'social-niche', tags: ['social', 'community', 'consumer'],
    orbWeights: { empathy: 4, freedom: 3, influence: 2 }, motive: 'belonging',
    houses: ['alchemists', 'pathfinders'], analog: 'Reddit × Circle × IG', stage: 'emerging',
  },
  {
    id: 'play-anti-1', title: 'UnscrollMe',
    tagline: 'The app that hides your other apps.',
    pitch: 'You set daily time budgets. App hides doomscroll apps via VPN magic + app icon obscuring + hard friction (30-sec breathing exercise before unlock). Family plans are the wedge.',
    domain: 'social-anti', tags: ['wellness', 'focus', 'consumer'],
    orbWeights: { stability: 4, empathy: 3, craft: 2 }, motive: 'stability',
    houses: ['architects', 'alchemists'], analog: 'Opal + Brick', stage: 'emerging',
  },
  {
    id: 'play-dating-1', title: 'Shaadi.vc',
    tagline: 'Matrimonial app for startup founders.',
    pitch: 'Niche dating/matrimonial app for founders, VCs, operators. Filters on stage, risk tolerance, "willing to move for your partner\'s next company". India + diaspora.',
    domain: 'social-dating', tags: ['dating', 'niche', 'community'],
    orbWeights: { influence: 3, empathy: 3, vision: 3 }, motive: 'belonging',
    houses: ['vanguards', 'alchemists'], stage: 'emerging', bharatFlavor: true,
  },
  {
    id: 'play-dating-2', title: 'Slow',
    tagline: 'Dating, but you get 3 matches a week.',
    pitch: 'Anti-swipe app: algorithm gives you 3 deeply-compatible matches per week, each has to respond with a voice note. Less volume, more signal. For people burnt out on Hinge.',
    domain: 'social-dating', tags: ['dating', 'wellness', 'consumer'],
    orbWeights: { empathy: 4, craft: 3 }, motive: 'belonging',
    houses: ['alchemists'], analog: 'Hinge × S\'More', stage: 'emerging',
  },
  {
    id: 'play-local-1', title: 'BlockParty',
    tagline: 'Party with your building\'s neighbors.',
    pitch: 'Hyperlocal app scoped to your apartment complex or 500m radius. Sunday brunches, dog playdates, tool sharing, emergency network. Nextdoor for Indian apartments.',
    domain: 'social-local', tags: ['hyperlocal', 'community', 'bharat'],
    orbWeights: { empathy: 4, influence: 3 }, motive: 'belonging',
    houses: ['vanguards', 'alchemists'], analog: 'Nextdoor × MyGate', stage: 'emerging',
    bharatFlavor: true,
  },
  {
    id: 'play-local-2', title: 'Timebound',
    tagline: 'Dinner with 5 strangers at 7pm tonight.',
    pitch: 'You sign up by 3pm, we match you with 5 strangers in your city for dinner at 7pm. Algorithm optimizes for interesting conversations. Users pay for the curation, restaurant splits the bill.',
    domain: 'social-local', tags: ['ugc', 'community', 'urban'],
    orbWeights: { empathy: 3, vision: 3, influence: 3 }, motive: 'belonging',
    houses: ['alchemists', 'pathfinders'], analog: 'Timeleft', stage: 'emerging',
  },

  // ══════════════════════════════════════════════════════════
  // PLAY › SPORTS
  // ══════════════════════════════════════════════════════════
  {
    id: 'play-sports-analytics-1', title: 'FilmStudy',
    tagline: 'Hudl for the next 1000 cricket academies.',
    pitch: 'Affordable video analytics for Tier 2/3 coaching academies. Upload practice footage, AI tags deliveries, bat angles, footwork. Coach gets a report, player gets a highlight.',
    domain: 'sports-analytics', tags: ['sports', 'ai', 'bharat'],
    orbWeights: { analysis: 4, craft: 3, empathy: 2 }, motive: 'mastery',
    houses: ['architects', 'pathfinders'], analog: 'Hudl × cricket', stage: 'emerging',
    bharatFlavor: true,
  },
  {
    id: 'play-sports-fan-1', title: 'StadiumOS',
    tagline: 'In-seat food, AR cam angles, and live stats.',
    pitch: 'Super-app for stadium fans: AR overlays on live camera, order food to seat, real-time stats, replay any moment. IPL teams + local soccer clubs.',
    domain: 'sports-fan', tags: ['sports', 'ar', 'consumer'],
    orbWeights: { craft: 4, vision: 3, influence: 2 }, motive: 'belonging',
    houses: ['alchemists', 'architects'], analog: 'StubHub × Niantic', stage: 'emerging',
  },
  {
    id: 'play-sports-training-1', title: 'MirrorRep',
    tagline: 'Phone-camera form check for any lift.',
    pitch: 'Record yourself squatting/deadlifting on your phone — AI compares to ideal form using pose estimation, flags knee tracking, hip hinge, bar path. Cheaper than a trainer.',
    domain: 'sports-training', tags: ['ai', 'fitness', 'vision'],
    orbWeights: { analysis: 4, craft: 3, grit: 3 }, motive: 'mastery',
    houses: ['architects', 'alchemists'], stage: 'emerging',
    aiAngle: 'Mobile pose estimation replaces $100/session coaches',
  },
  {
    id: 'play-sports-betting-1', title: 'Probo+',
    tagline: 'Prediction market for cricket, not just elections.',
    pitch: 'Event contracts on IPL outcomes: which player, which over, which side wins toss. Differentiated from Dream11 (fantasy) and Probo (opinion). Indian reg fit critical.',
    domain: 'sports-betting', tags: ['fintech', 'sports', 'india'],
    orbWeights: { analysis: 4, grit: 3, vision: 3 }, motive: 'mastery',
    houses: ['vanguards', 'architects'], analog: 'Polymarket × cricket', stage: 'frontier',
    bharatFlavor: true,
  },

  // ══════════════════════════════════════════════════════════
  // PLAY › MUSIC
  // ══════════════════════════════════════════════════════════
  {
    id: 'play-music-ai-gen-1', title: 'Rinse',
    tagline: 'Hum a melody, get a full song.',
    pitch: 'You hum into the mic. AI extracts your melody, asks you the vibe (bollywood/trap/lofi), produces a 2-min song with instruments, vocals, mixing. Post to Instagram in 60 seconds.',
    domain: 'music-ai-gen', tags: ['ai', 'music', 'consumer'],
    orbWeights: { craft: 5, vision: 4, freedom: 3 }, motive: 'mastery',
    houses: ['alchemists', 'architects'], analog: 'Suno × voice-first', stage: 'frontier',
    aiAngle: 'Humming is the next prompt interface',
  },
  {
    id: 'play-music-distro-1', title: 'Rehaan',
    tagline: 'DistroKid for regional Indian music.',
    pitch: 'Indie musicians distributing Bhojpuri, Tamil, Punjabi music to Spotify/YT/Jio Saavn. Royalty tracking in INR, sync-licensing for reels/ads, UPI payouts. Local-language UI.',
    domain: 'music-distribution', tags: ['music', 'india', 'creator'],
    orbWeights: { craft: 3, freedom: 3, influence: 3 }, motive: 'freedom',
    houses: ['alchemists', 'pathfinders'], analog: 'DistroKid × Bharat', stage: 'emerging',
    bharatFlavor: true,
  },
  {
    id: 'play-music-edu-1', title: 'RaagAI',
    tagline: 'AI Hindustani classical tutor.',
    pitch: 'Learn sitar/flute/vocal via real-time AI feedback on your recordings. Teaches ragas, taal, alankars. Currently: gurus in one city or YouTube. Democratizes classical training.',
    domain: 'music-education', tags: ['music', 'ai', 'education'],
    orbWeights: { empathy: 3, craft: 4, analysis: 3 }, motive: 'mastery',
    houses: ['alchemists', 'pathfinders'], analog: 'Trala × Hindustani', stage: 'emerging',
    bharatFlavor: true,
    aiAngle: 'Audio ML can assess raga accuracy',
  },

  // ══════════════════════════════════════════════════════════
  // PLAY › HOBBIES
  // ══════════════════════════════════════════════════════════
  {
    id: 'play-collectibles-1', title: 'Relic',
    tagline: 'StockX for Indian collectibles.',
    pitch: 'Authenticated marketplace for trading Indian cricket memorabilia, coins, stamps, vintage film posters, comic books. Authentication + escrow + grading. Whatnot-style live auctions.',
    domain: 'hobbies-collectibles', tags: ['marketplace', 'consumer', 'india'],
    orbWeights: { craft: 3, analysis: 3, influence: 3 }, motive: 'status',
    houses: ['vanguards', 'alchemists'], analog: 'StockX × Whatnot', stage: 'emerging',
    bharatFlavor: true,
  },
  {
    id: 'play-maker-1', title: 'Kitstack',
    tagline: 'Arduino kits delivered with AI-video tutor.',
    pitch: 'Subscription electronics kits for hobbyists — monthly project (drone, alarm, bot). AI tutor assists via camera when you\'re stuck soldering. Hardware-native GPT wrapper done right.',
    domain: 'hobbies-maker', tags: ['hardware', 'ai', 'education'],
    orbWeights: { craft: 4, grit: 3, freedom: 2 }, motive: 'mastery',
    houses: ['architects', 'pathfinders'], analog: 'Adafruit × KiwiCo', stage: 'emerging',
  },
  {
    id: 'play-reading-1', title: 'Bookloop',
    tagline: 'Goodreads, but your friends actually show up.',
    pitch: 'Social reading app where you create reading-pact groups with friends ("we\'ll all read Dune by March 1st"). Nightly progress pings. Streak = peer pressure done well.',
    domain: 'hobbies-reading', tags: ['social', 'reading', 'consumer'],
    orbWeights: { empathy: 3, stability: 3, influence: 2 }, motive: 'belonging',
    houses: ['alchemists', 'architects'], analog: 'Fable × Duolingo', stage: 'emerging',
  },

  // ══════════════════════════════════════════════════════════
  // BUILD › AI
  // ══════════════════════════════════════════════════════════
  {
    id: 'build-ai-agents-1', title: 'OpsAgent',
    tagline: 'The AI that actually does your ops work.',
    pitch: 'Autonomous agent for small ops teams: reconciles invoices, chases vendor replies, books travel, updates spreadsheets. Give it email + Slack access, watch it work.',
    domain: 'ai-agents', tags: ['ai', 'agents', 'ops'],
    orbWeights: { craft: 4, analysis: 4, vision: 3 }, motive: 'mastery',
    houses: ['architects', 'alchemists'], analog: 'Cognition × Adept', stage: 'frontier',
    aiAngle: 'Multi-tool agents finally reliable enough for back-office',
  },
  {
    id: 'build-ai-agents-2', title: 'AgentMesh',
    tagline: 'Let agents call each other — with audit logs.',
    pitch: 'Infra layer where specialist agents (billing-agent, support-agent, dev-agent) call each other via typed interfaces. Enterprises get observability + rollback when an agent goes rogue.',
    domain: 'ai-agents', tags: ['ai', 'agents', 'infra'],
    orbWeights: { craft: 5, analysis: 4, vision: 3 }, motive: 'mastery',
    houses: ['architects'], stage: 'frontier',
    aiAngle: 'Agent-to-agent protocols are the new microservices',
  },
  {
    id: 'build-ai-agents-3', title: 'RecoverAI',
    tagline: 'Agents that fight on your behalf.',
    pitch: 'Consumer agent that disputes credit card charges, files airline refund claims, argues with gym memberships, cancels hidden subscriptions. You authorize, it fights.',
    domain: 'ai-agents', tags: ['ai', 'consumer', 'money'],
    orbWeights: { grit: 4, analysis: 3, empathy: 3 }, motive: 'freedom',
    houses: ['vanguards', 'alchemists'], analog: 'DoNotPay (successor)', stage: 'frontier',
  },
  {
    id: 'build-ai-llm-1', title: 'Probe',
    tagline: 'LLM observability for teams shipping fast.',
    pitch: 'Eval + monitoring + regression testing for LLM features in production. When a user complains "it hallucinated", you can reproduce, diff against baseline, ship a fix in an hour.',
    domain: 'ai-llm-tooling', tags: ['ai', 'infra', 'devtools'],
    orbWeights: { analysis: 5, craft: 4 }, motive: 'mastery',
    houses: ['architects'], analog: 'Braintrust × Humanloop', stage: 'emerging',
  },
  {
    id: 'build-ai-llm-2', title: 'RAG.dev',
    tagline: 'Production RAG in 10 lines of code.',
    pitch: 'Managed RAG pipeline as a service: upload docs, get an API. Handles chunking strategies, reranking, evals, versioning. Replaces 6-week LangChain build.',
    domain: 'ai-llm-tooling', tags: ['ai', 'saas', 'devtools'],
    orbWeights: { craft: 4, analysis: 3, freedom: 3 }, motive: 'freedom',
    houses: ['architects', 'alchemists'], stage: 'emerging',
  },
  {
    id: 'build-ai-voice-1', title: 'Vaani',
    tagline: 'Voice AI that speaks 22 Indian languages.',
    pitch: 'Build voice agents for Indian customer support, healthcare, banking in Hindi/Tamil/Marathi/etc. Accent-robust ASR, Indic TTS with emotional range, dialect awareness.',
    domain: 'ai-voice', tags: ['ai', 'voice', 'india'],
    orbWeights: { craft: 4, vision: 4, empathy: 3 }, motive: 'mastery',
    houses: ['architects', 'alchemists'], analog: 'Sarvam × Retell', stage: 'frontier',
    bharatFlavor: true,
    aiAngle: 'Indic voice AI unlocks 600M non-English-speaking users',
  },
  {
    id: 'build-ai-voice-2', title: 'Tone',
    tagline: 'Voice agents for US front desks, operated from India.',
    pitch: 'Voice AI for dental offices, medical clinics, hotels — books appointments, reschedules, follows up. US-grade English. Build in Bangalore, serve SMB America.',
    domain: 'ai-voice', tags: ['ai', 'voice', 'b2b'],
    orbWeights: { craft: 4, influence: 3, vision: 3 }, motive: 'mastery',
    houses: ['architects', 'vanguards'], analog: 'Retell × PolyAI', stage: 'frontier',
  },
  {
    id: 'build-ai-vision-1', title: 'ShelfSight',
    tagline: 'Phone camera → instant shelf audit.',
    pitch: 'FMCG field reps point phone at a store shelf — AI returns share-of-shelf, planogram compliance, competitor pricing. Replaces 2-hour manual audit with 2-minute scan.',
    domain: 'ai-vision', tags: ['ai', 'cpg', 'vision'],
    orbWeights: { analysis: 4, craft: 3 }, motive: 'mastery',
    houses: ['architects', 'pathfinders'], stage: 'emerging', bharatFlavor: true,
  },
  {
    id: 'build-ai-video-gen-1', title: 'Avatarcast',
    tagline: 'Your AI avatar on 20 videos a day.',
    pitch: 'Train once with 2 mins of video. Script in, avatar-video out. For LinkedIn influencers, sales reps, coaches. 100x creator output without 100x recording time.',
    domain: 'ai-video-gen', tags: ['ai', 'video', 'creator'],
    orbWeights: { vision: 4, influence: 4, craft: 3 }, motive: 'status',
    houses: ['alchemists', 'vanguards'], analog: 'HeyGen × Synthesia', stage: 'frontier',
  },
  {
    id: 'build-ai-coding-1', title: 'PatchPilot',
    tagline: 'AI that handles your Jira bug backlog.',
    pitch: 'Connect GitHub + Jira. AI claims bugs, writes fix, opens PR, responds to review comments. Ships 80% of "small tickets" autonomously. Engineering gets to focus on real work.',
    domain: 'ai-coding', tags: ['ai', 'devtools', 'agents'],
    orbWeights: { craft: 5, analysis: 4 }, motive: 'mastery',
    houses: ['architects'], analog: 'Cognition × Codegen', stage: 'frontier',
    aiAngle: 'Agentic PRs reliable for <100 LOC diffs in 2025',
  },
  {
    id: 'build-ai-coding-2', title: 'Oracle',
    tagline: 'AI code reviewer that actually gets your codebase.',
    pitch: 'Reads your repo, your conventions, your ADRs. Reviews PRs like a senior engineer at your company: flags security, performance, convention drift, not just linting noise.',
    domain: 'ai-coding', tags: ['ai', 'devtools', 'security'],
    orbWeights: { craft: 4, analysis: 5, stability: 2 }, motive: 'mastery',
    houses: ['architects'], stage: 'emerging',
  },
  {
    id: 'build-ai-enterprise-search-1', title: 'Archive',
    tagline: 'Chat with every doc your company ever made.',
    pitch: 'Unifies Notion, Drive, Slack, GitHub, Salesforce. New-hire onboarding goes from 3 weeks to 3 days. Quarterly report drafting goes from 5 days to 5 hours.',
    domain: 'ai-enterprise-search', tags: ['ai', 'b2b', 'saas'],
    orbWeights: { analysis: 4, craft: 3, vision: 3 }, motive: 'mastery',
    houses: ['architects'], analog: 'Glean', stage: 'emerging',
  },
  {
    id: 'build-ai-hosting-1', title: 'Anyscale',
    tagline: 'Fine-tune and serve a model in 10 minutes.',
    pitch: 'Drop training data, pick a base model, hit deploy. Handles GPU orchestration, versioning, cold-start, autoscaling. Open-source model deployment without the ops.',
    domain: 'ai-model-hosting', tags: ['ai', 'infra', 'devtools'],
    orbWeights: { craft: 4, vision: 3, freedom: 3 }, motive: 'freedom',
    houses: ['architects', 'pathfinders'], analog: 'Replicate × Modal', stage: 'emerging',
  },
  {
    id: 'build-ai-labeling-1', title: 'HumanLoop',
    tagline: 'Crowd-sourced preference labels for every LLM.',
    pitch: 'Platform connecting AI labs to Indian labelers for RLHF, red-teaming, factuality checks. Structured tasks, fair pay, skill tiers. India as the new Mechanical Turk for AI.',
    domain: 'ai-data-labeling', tags: ['ai', 'data', 'marketplace'],
    orbWeights: { craft: 3, analysis: 3, influence: 3 }, motive: 'belonging',
    houses: ['pathfinders', 'vanguards'], analog: 'Scale AI × India', stage: 'emerging',
    bharatFlavor: true,
  },
  {
    id: 'build-ai-safety-1', title: 'Haize',
    tagline: 'Red-team AI before it red-teams you.',
    pitch: 'Automated jailbreak + adversarial prompt testing for enterprise LLM apps. Weekly scan + report. For banks, hospitals, gov deploying AI who can\'t afford a public failure.',
    domain: 'ai-safety', tags: ['ai', 'security', 'b2b'],
    orbWeights: { analysis: 5, grit: 3, vision: 3 }, motive: 'mastery',
    houses: ['architects', 'vanguards'], analog: 'Haize Labs × Lakera', stage: 'frontier',
  },

  // BUILD › DEVTOOLS
  {
    id: 'build-dev-ide-1', title: 'Keel',
    tagline: 'IDE for distributed teams, built on CRDTs.',
    pitch: 'Real-time collab IDE where conflicts are impossible (not just rare). Pair programming, live debugging, shared terminal. Replit-grade DX + enterprise-grade self-host.',
    domain: 'devtools-ide', tags: ['devtools', 'collab', 'saas'],
    orbWeights: { craft: 5, vision: 3 }, motive: 'mastery',
    houses: ['architects'], analog: 'Zed × Replit', stage: 'emerging',
  },
  {
    id: 'build-dev-obs-1', title: 'Tracepoint',
    tagline: 'LLM-era observability: logs + traces + prompts.',
    pitch: 'Observability tool purpose-built for apps that include LLM calls. Shows prompt latency, token cost, hallucination signals alongside standard request traces. Datadog doesn\'t do this.',
    domain: 'devtools-observability', tags: ['devtools', 'ai', 'saas'],
    orbWeights: { analysis: 5, craft: 4 }, motive: 'mastery',
    houses: ['architects'], stage: 'emerging',
  },
  {
    id: 'build-dev-cicd-1', title: 'Shipwright',
    tagline: 'Zero-config deploy for non-Vercel stacks.',
    pitch: 'Deploy Python, Go, Rust services with Vercel-grade DX. Preview envs per PR, branch deploys, rollbacks, custom domains. For teams past the Vercel stack.',
    domain: 'devtools-cicd', tags: ['devtools', 'infra', 'saas'],
    orbWeights: { craft: 4, freedom: 3 }, motive: 'freedom',
    houses: ['architects', 'alchemists'], analog: 'Vercel for everything', stage: 'emerging',
  },
  {
    id: 'build-dev-api-1', title: 'Basis',
    tagline: 'Postgres that scales to zero and back to infinity.',
    pitch: 'Neon-style Postgres with instant branching, auto-pause when idle, fast cold-start. Target: hobbyist + SMB SaaS that can\'t pay $200/mo for RDS.',
    domain: 'devtools-api', tags: ['devtools', 'infra', 'database'],
    orbWeights: { craft: 5, analysis: 3 }, motive: 'mastery',
    houses: ['architects'], analog: 'Neon × Supabase', stage: 'emerging',
  },
  {
    id: 'build-dev-dx-1', title: 'PaperDocs',
    tagline: 'AI that writes your API docs from your code.',
    pitch: 'Connect GitHub. AI reads source, generates developer docs with examples, updates them on every merge. Developers hate writing docs; now they don\'t have to.',
    domain: 'devtools-dx', tags: ['ai', 'devtools', 'documentation'],
    orbWeights: { craft: 4, analysis: 3 }, motive: 'mastery',
    houses: ['architects', 'alchemists'], analog: 'Mintlify × AI', stage: 'emerging',
  },
  {
    id: 'build-dev-testing-1', title: 'FlakeHunter',
    tagline: 'Find and fix flaky tests automatically.',
    pitch: 'AI monitors your test suite, identifies flakes vs real failures, proposes fixes. Most dev teams accept 5-10% flake rate; we get to <1%.',
    domain: 'devtools-testing', tags: ['ai', 'devtools', 'testing'],
    orbWeights: { analysis: 4, craft: 3, grit: 3 }, motive: 'mastery',
    houses: ['architects'], stage: 'emerging',
  },

  // BUILD › CYBERSEC
  {
    id: 'build-cyber-zerotrust-1', title: 'KeyRing',
    tagline: '1Password for small teams with compliance needs.',
    pitch: 'Password + secret + SSH key manager for 10–100 person teams. Built-in SOC2 audit trail, device trust, granular sharing. Target: series A/B startups who\'ve outgrown Bitwarden.',
    domain: 'cybersec-zerotrust', tags: ['security', 'saas', 'b2b'],
    orbWeights: { stability: 4, craft: 3, analysis: 3 }, motive: 'stability',
    houses: ['architects'], analog: '1Password Business', stage: 'established',
  },
  {
    id: 'build-cyber-offensive-1', title: 'Pentest.io',
    tagline: 'Continuous pentesting as a subscription.',
    pitch: 'Instead of annual $50K pentest reports, get continuous automated pentesting + monthly human red-team exercises. SMB-friendly pricing. Compliance-as-a-service angle.',
    domain: 'cybersec-offensive', tags: ['security', 'saas', 'b2b'],
    orbWeights: { grit: 4, analysis: 4 }, motive: 'mastery',
    houses: ['vanguards', 'architects'], analog: 'Horizon3 × HackerOne', stage: 'emerging',
  },
  {
    id: 'build-cyber-compliance-1', title: 'DPDP.ai',
    tagline: 'Vanta for India\'s DPDP Act.',
    pitch: 'India\'s new data protection law requires compliance workflows most SMBs don\'t have. Automated policy drafting, consent mgmt, breach reporting, audit trail. First-mover in a new regulated space.',
    domain: 'cybersec-compliance', tags: ['security', 'compliance', 'india'],
    orbWeights: { analysis: 4, craft: 3, vision: 3 }, motive: 'mastery',
    houses: ['architects', 'pathfinders'], stage: 'emerging', bharatFlavor: true,
  },
  {
    id: 'build-cyber-ai-threats-1', title: 'DeepScan',
    tagline: 'Deepfake detection for KYC and court evidence.',
    pitch: 'API + web app: upload a video/audio clip, get a confidence score that it\'s authentic. For banks doing video-KYC, lawyers vetting evidence, media verifying sources.',
    domain: 'cybersec-ai-threats', tags: ['ai', 'security', 'b2b'],
    orbWeights: { analysis: 5, craft: 4, vision: 3 }, motive: 'mastery',
    houses: ['architects', 'vanguards'], analog: 'Reality Defender', stage: 'frontier',
  },

  // BUILD › ROBOTICS
  {
    id: 'build-robot-humanoid-1', title: 'Nirmaan',
    tagline: 'Humanoid robots for Indian manufacturing.',
    pitch: 'Bipedal robots optimized for Indian factory floors (narrow aisles, mixed-SKU lines). Price target: ₹40L (vs Figure\'s ₹1Cr+). Backed by PLI scheme.',
    domain: 'robotics-humanoid', tags: ['robotics', 'manufacturing', 'india'],
    orbWeights: { vision: 5, craft: 4, grit: 4 }, motive: 'mastery',
    houses: ['architects', 'pathfinders'], analog: 'Figure × Unitree for Bharat', stage: 'frontier',
    bharatFlavor: true,
  },
  {
    id: 'build-robot-industrial-1', title: 'PickPal',
    tagline: 'Vision-guided picking arms for Indian 3PLs.',
    pitch: 'Retrofit-able robot arm + vision stack for warehouses. Pick any SKU without reprogramming. Indian e-commerce warehouse labor is getting expensive fast; automation window is now.',
    domain: 'robotics-industrial', tags: ['robotics', 'logistics', 'india'],
    orbWeights: { craft: 4, analysis: 4, vision: 3 }, motive: 'mastery',
    houses: ['architects', 'pathfinders'], analog: 'Covariant × GreyOrange', stage: 'emerging',
    bharatFlavor: true,
  },
  {
    id: 'build-robot-consumer-1', title: 'Pantry',
    tagline: 'A robot for your kitchen that actually works.',
    pitch: 'Counter-top robot that chops, sautés, mixes basic Indian dishes. Target: working-couple households. Price target: ₹50K. Not "complete autonomy", just the 10 things people cook weekly.',
    domain: 'robotics-consumer', tags: ['robotics', 'consumer', 'food'],
    orbWeights: { craft: 4, empathy: 3, vision: 3 }, motive: 'freedom',
    houses: ['alchemists', 'architects'], stage: 'frontier',
  },
  {
    id: 'build-robot-surgical-1', title: 'Minima',
    tagline: 'Surgical robots at 1/10th the cost of da Vinci.',
    pitch: 'Single-purpose surgical robots for high-volume procedures (hernia, gallbladder, bariatric). Ships to Tier 2/3 Indian hospitals. Intuitive is too expensive for 90% of the world.',
    domain: 'robotics-surgical', tags: ['robotics', 'healthcare', 'india'],
    orbWeights: { craft: 5, vision: 4, empathy: 3 }, motive: 'mastery',
    houses: ['architects', 'alchemists'], analog: 'SS Innovations × Distalmotion', stage: 'frontier',
    bharatFlavor: true,
  },
  {
    id: 'build-robot-agri-1', title: 'Khet.ai',
    tagline: 'Autonomous weeder for 2-acre Indian farms.',
    pitch: 'Small-footprint solar-charged robot that patrols fields, identifies and removes weeds without chemicals. Rented by the week via FPOs (farmer producer orgs).',
    domain: 'robotics-agri', tags: ['robotics', 'agri', 'india'],
    orbWeights: { vision: 4, craft: 3, empathy: 3 }, motive: 'mastery',
    houses: ['pathfinders', 'architects'], analog: 'Carbon Robotics × Bharat', stage: 'frontier',
    bharatFlavor: true,
  },
  {
    id: 'build-robot-drones-1', title: 'Pravah',
    tagline: 'Autonomous drones for Indian pesticide spraying.',
    pitch: 'Drone-as-a-service for farmers: spray your 5 acres for ₹300. Operated by trained local operators. 10x faster + 70% less chemical than manual.',
    domain: 'robotics-drones', tags: ['drones', 'agri', 'india'],
    orbWeights: { craft: 3, vision: 4, grit: 3 }, motive: 'mastery',
    houses: ['pathfinders', 'vanguards'], analog: 'Garuda × DJI Agras', stage: 'emerging',
    bharatFlavor: true,
  },

  // BUILD › SEMI
  {
    id: 'build-semi-chip-1', title: 'Silic',
    tagline: 'AI chip design from Bangalore.',
    pitch: 'Indian fabless startup building AI inference accelerators. Leverage India\'s 20% of global chip designers. Target: edge inference < 10W power envelope.',
    domain: 'semi-chip-design', tags: ['hardware', 'ai', 'india'],
    orbWeights: { craft: 5, vision: 5, grit: 4 }, motive: 'mastery',
    houses: ['architects'], analog: 'Etched × India fabless', stage: 'frontier',
    bharatFlavor: true,
  },

  // BUILD › XR
  {
    id: 'build-xr-ar-1', title: 'ChemLab AR',
    tagline: 'AR chemistry experiments for Indian schools.',
    pitch: 'Smartphone AR for chem/bio/physics labs. Schools that can\'t afford real equipment get equivalent experiential learning. Curriculum-aligned. Govt procurement the GTM.',
    domain: 'xr-ar', tags: ['ar', 'education', 'india'],
    orbWeights: { craft: 4, empathy: 3, vision: 3 }, motive: 'mastery',
    houses: ['alchemists', 'architects'], stage: 'emerging', bharatFlavor: true,
  },
  {
    id: 'build-xr-vr-1', title: 'RiggedUp',
    tagline: 'VR training for oil-rig, mining, heavy machinery.',
    pitch: 'VR simulations for high-risk vocational training — crane operation, oil rig, underground mining. ROI: saves lives, cuts training time 40%. Enterprise sales, PSU anchor clients.',
    domain: 'xr-vr', tags: ['vr', 'training', 'b2b'],
    orbWeights: { craft: 4, stability: 3, vision: 3 }, motive: 'stability',
    houses: ['architects', 'pathfinders'], analog: 'Mursion × industrial', stage: 'emerging',
    bharatFlavor: true,
  },

  // BUILD › BCI
  {
    id: 'build-bci-1', title: 'Signal',
    tagline: 'Non-invasive BCI for ALS patients first.',
    pitch: 'EEG + EMG headset enabling typing/computer control for locked-in patients. Medical-grade, FDA pathway. Later expands to consumer productivity.',
    domain: 'bci', tags: ['bci', 'healthcare', 'frontier'],
    orbWeights: { craft: 5, vision: 5, empathy: 4 }, motive: 'mastery',
    houses: ['architects', 'alchemists'], analog: 'Synchron × Neurable', stage: 'frontier',
  },

  // BUILD › IOT
  {
    id: 'build-iot-industrial-1', title: 'MillSense',
    tagline: 'Retrofit IoT for Indian factories.',
    pitch: 'Clip-on vibration + temperature sensors for old CNC machines. Predicts failure 2 weeks out, saves 30% unplanned downtime. Works in factories built in 1985.',
    domain: 'iot-industrial', tags: ['iot', 'manufacturing', 'india'],
    orbWeights: { craft: 4, analysis: 4, stability: 3 }, motive: 'stability',
    houses: ['architects', 'pathfinders'], analog: 'Samsara × Infinite Uptime', stage: 'emerging',
    bharatFlavor: true,
  },
  {
    id: 'build-iot-home-1', title: 'Desi Home',
    tagline: 'Smart home that works on flaky power and wifi.',
    pitch: 'India-first smart home: works through power cuts (UPS-aware), flaky wifi (local fallback), voice commands in 10 Indian languages. Alexa is built for American suburbia.',
    domain: 'iot-home', tags: ['iot', 'consumer', 'india'],
    orbWeights: { craft: 3, empathy: 3, vision: 3 }, motive: 'stability',
    houses: ['architects', 'alchemists'], stage: 'emerging', bharatFlavor: true,
  },

  // BUILD › BLOCKCHAIN
  {
    id: 'build-chain-l2-1', title: 'Pulse',
    tagline: 'Ethereum L2 optimized for payments, not DeFi.',
    pitch: 'L2 where stablecoin payments are 1c and confirm in 2 seconds. Explicit design choice: boring, compliant, enterprise-friendly. The "SWIFT killer" angle.',
    domain: 'blockchain-l1', tags: ['crypto', 'infra', 'payments'],
    orbWeights: { craft: 4, vision: 4, stability: 3 }, motive: 'mastery',
    houses: ['architects'], analog: 'Base × Plasma', stage: 'frontier',
  },
  {
    id: 'build-depin-1', title: 'Wifinet',
    tagline: 'Helium-style hotspot network for Indian towns.',
    pitch: 'Residents mount wifi hotspots, earn tokens proportional to usage. Solves rural connectivity without govt telco subsidy. DePIN-native business model.',
    domain: 'blockchain-depin', tags: ['depin', 'infra', 'india'],
    orbWeights: { vision: 4, freedom: 4, grit: 3 }, motive: 'freedom',
    houses: ['pathfinders'], analog: 'Helium × Bharat', stage: 'frontier',
    bharatFlavor: true,
  },

];

// NOTE: This is part 1 of the ideas file.
// Continues in additional sections for MONEY, HEALTH, LEARN, WORK, MOVE, EARTH, LIFE, FRONTIER, BHARAT.
// See ideas-part-2.ts for continuation.
