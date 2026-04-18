/**
 * CATALST — EXPANDED INDUSTRY TAXONOMY v2
 * ------------------------------------------------------------
 * 10 tabs × parent categories × niche sub-industries
 * 150+ industry slugs. Every slug is a valid filter target.
 *
 * FORMAT NOTE (Anish):
 *   If your existing content uses different key names (e.g. `id` vs `slug`,
 *   `emoji` vs `icon`), do a global find-replace. The shape below is
 *   inferred — not guaranteed to match. Flag in integration step.
 */

export type IndustryTab =
  | 'play'
  | 'build'
  | 'money'
  | 'health'
  | 'learn'
  | 'work'
  | 'move'
  | 'earth'
  | 'life'
  | 'frontier'
  | 'bharat';

export interface Industry {
  id: string;                    // unique slug — must match ideas[].domain
  name: string;
  emoji: string;
  tab: IndustryTab;
  parent?: string;               // parent industry slug (for sub-industries)
  blurb: string;                 // one-line description for UI
  marketSize?: string;           // rough TAM note for mini-dashboard
  trending?: string[];           // 3-6 real companies making moves
  indianPlayers?: string[];      // companies visible to Indian users
  globalPlayers?: string[];
  heat?: 'established' | 'emerging' | 'frontier';  // trend signal
}

export const TABS: { id: IndustryTab; label: string; emoji: string; blurb: string }[] = [
  { id: 'play',     label: 'Play',     emoji: '🎮', blurb: 'Games, content, sports, entertainment' },
  { id: 'build',    label: 'Build',    emoji: '🔧', blurb: 'AI, dev tools, robotics, hardware, infra' },
  { id: 'money',    label: 'Money',    emoji: '💸', blurb: 'Fintech, investing, insurance, crypto' },
  { id: 'health',   label: 'Health',   emoji: '🩺', blurb: 'Medical, mental, longevity, wellness' },
  { id: 'learn',    label: 'Learn',    emoji: '📚', blurb: 'Education, skilling, tutoring, parenting' },
  { id: 'work',     label: 'Work',     emoji: '💼', blurb: 'Productivity, HR, sales, legal, ops' },
  { id: 'move',     label: 'Move',     emoji: '🚀', blurb: 'Mobility, logistics, travel, drones' },
  { id: 'earth',    label: 'Earth',    emoji: '🌱', blurb: 'Climate, energy, agri, space, materials' },
  { id: 'life',     label: 'Life',     emoji: '🏡', blurb: 'Consumer, fashion, food, home, pets' },
  { id: 'frontier', label: 'Frontier', emoji: '✨', blurb: 'Defense, synbio, neuro, grief, fringe' },
  { id: 'bharat',   label: 'Bharat',   emoji: '🇮🇳', blurb: 'India-first: rural, vernacular, informal' },
];

export const INDUSTRIES: Industry[] = [
  // ═══════════════════════════════════════════════════════════
  // TAB: PLAY — Games, Content, Sports, Social
  // ═══════════════════════════════════════════════════════════
  {
    id: 'gaming-social', tab: 'play', emoji: '🤾', heat: 'emerging',
    name: 'Social & IRL Gaming', parent: 'gaming',
    blurb: 'Pickup sports, gaming meetups, real-world play',
    indianPlayers: ['Playo', 'Hudle', 'KheloMore'], globalPlayers: ['Meetup', 'GoodGym'],
    trending: ['Playo', 'Hudle'],
  },
  {
    id: 'gaming-hypercasual', tab: 'play', emoji: '📱', heat: 'established',
    name: 'Hypercasual & Real-Money', parent: 'gaming',
    blurb: 'Quick-session mobile games, skill-based cash play',
    indianPlayers: ['WinZO', 'MPL', 'Dream11', 'Gameskraft'], globalPlayers: ['Voodoo', 'Lion Studios'],
    marketSize: 'India RMG ~$2.8B',
  },
  {
    id: 'gaming-indie', tab: 'play', emoji: '🎮', heat: 'emerging',
    name: 'Indie Games & Publishing', parent: 'gaming',
    blurb: 'Small studios, self-publishing tools, itch.io-style ecosystems',
    globalPlayers: ['Devolver Digital', 'Annapurna Interactive', 'itch.io'],
  },
  {
    id: 'gaming-esports', tab: 'play', emoji: '🏆', heat: 'established',
    name: 'Esports & Competitive', parent: 'gaming',
    blurb: 'Tournament orgs, team platforms, betting, fan tools',
    indianPlayers: ['Nodwin', 'S8UL', 'GodLike Esports'], globalPlayers: ['FaZe', 'Team Liquid'],
  },
  {
    id: 'gaming-dev-tools', tab: 'play', emoji: '🛠️', heat: 'emerging',
    name: 'Game Dev Tooling', parent: 'gaming',
    blurb: 'Engines, asset marketplaces, AI NPC, playtesting',
    trending: ['Rosebud AI', 'Inworld', 'Scenario', 'Convai'],
  },
  {
    id: 'gaming-cloud', tab: 'play', emoji: '☁️', heat: 'emerging',
    name: 'Cloud & Streaming Gaming', parent: 'gaming',
    blurb: 'Play-anywhere streaming, low-latency infra',
    globalPlayers: ['GeForce Now', 'Xbox Cloud', 'Boosteroid'],
  },
  {
    id: 'gaming-web3', tab: 'play', emoji: '🎲', heat: 'frontier',
    name: 'Web3 & Blockchain Games', parent: 'gaming',
    blurb: 'On-chain ownership, play-to-own, digital collectibles',
    globalPlayers: ['Axie Infinity', 'Immutable', 'Ronin'],
  },
  {
    id: 'gaming-streamer-tools', tab: 'play', emoji: '📺', heat: 'emerging',
    name: 'Streamer & Creator Tools', parent: 'gaming',
    blurb: 'OBS alternatives, overlays, donations, clip tools',
    trending: ['Streamlabs', 'Lightstream', 'Kick'],
  },
  {
    id: 'gaming-fantasy', tab: 'play', emoji: '🎯', heat: 'established',
    name: 'Fantasy & Sports Prediction', parent: 'gaming',
    blurb: 'Daily fantasy, prediction markets, skill-prediction',
    indianPlayers: ['Dream11', 'My11Circle', 'MPL'], globalPlayers: ['DraftKings', 'FanDuel'],
  },
  {
    id: 'gaming-kids', tab: 'play', emoji: '🧸', heat: 'emerging',
    name: 'Kids & Family Gaming', parent: 'gaming',
    blurb: 'Safe multiplayer, parental controls, edu-play blend',
    globalPlayers: ['Roblox', 'Toca Boca'], indianPlayers: ['Apnaklub Kids'],
  },
  {
    id: 'gaming-tabletop', tab: 'play', emoji: '🎲', heat: 'emerging',
    name: 'Tabletop & Board Game Tech', parent: 'gaming',
    blurb: 'Digital companions, AR boards, game-finding',
    globalPlayers: ['BoardGameArena', 'Tabletop Simulator'],
  },

  {
    id: 'creator-short-video', tab: 'play', emoji: '🎬', heat: 'established',
    name: 'Short-Form Video Creation', parent: 'creator',
    blurb: 'Editing, captioning, auto-repurpose for reels/shorts',
    trending: ['Captions', 'Opus Clip', 'Submagic', 'Descript'],
  },
  {
    id: 'creator-newsletter', tab: 'play', emoji: '✉️', heat: 'emerging',
    name: 'Newsletters & Writing', parent: 'creator',
    blurb: 'Substack-like platforms, writer tools, paid subs',
    globalPlayers: ['Substack', 'Beehiiv', 'Ghost'], indianPlayers: ['Revue alt', 'TheMorningContext'],
  },
  {
    id: 'creator-podcasting', tab: 'play', emoji: '🎙️', heat: 'emerging',
    name: 'Podcasting Tech', parent: 'creator',
    blurb: 'Recording, editing, transcription, distribution',
    trending: ['Riverside', 'Descript', 'Spotify for Creators'],
  },
  {
    id: 'creator-ai-content', tab: 'play', emoji: '🤖', heat: 'frontier',
    name: 'AI-Generated Content', parent: 'creator',
    blurb: 'AI video, image, voice, music for creators',
    trending: ['Sora', 'Runway', 'ElevenLabs', 'Suno', 'HeyGen'],
  },
  {
    id: 'creator-monetization', tab: 'play', emoji: '💰', heat: 'emerging',
    name: 'Creator Monetization', parent: 'creator',
    blurb: 'Memberships, tipping, paid DMs, brand deals',
    trending: ['Patreon', 'Kajabi', 'Passes', 'Fourthwall'],
  },
  {
    id: 'creator-fan-platforms', tab: 'play', emoji: '💌', heat: 'emerging',
    name: 'Fan Platforms & Communities', parent: 'creator',
    blurb: 'Superfan tools, direct-to-fan, community apps',
    trending: ['Circle', 'Geneva', 'Passes', 'Fanfix'],
  },

  {
    id: 'social-niche', tab: 'play', emoji: '👥', heat: 'emerging',
    name: 'Niche Social Communities',
    blurb: 'Sub-reddit-for-X, interest-graph social networks',
    trending: ['Geneva', 'Circle', 'Discord servers'],
  },
  {
    id: 'social-anti', tab: 'play', emoji: '🌿', heat: 'emerging',
    name: 'Anti-Social & Digital Wellness',
    blurb: 'Minimalist phones, focus apps, screen-time tools',
    trending: ['Opal', 'Brick', 'Light Phone', 'Unpluq'],
  },
  {
    id: 'social-dating', tab: 'play', emoji: '💘', heat: 'established',
    name: 'Dating & Relationships',
    blurb: 'Matchmaking, niche apps, post-match tools',
    globalPlayers: ['Hinge', 'Bumble', 'Feeld'], indianPlayers: ['Aisle', 'Truly Madly'],
  },
  {
    id: 'social-local', tab: 'play', emoji: '📍', heat: 'emerging',
    name: 'Hyperlocal Social',
    blurb: 'Neighborhood apps, local events, IRL friend-making',
    trending: ['Timeleft', 'Partiful', 'Nextdoor'],
  },

  {
    id: 'sports-analytics', tab: 'play', emoji: '📊', heat: 'emerging',
    name: 'Sports Analytics', parent: 'sports',
    blurb: 'Video analysis, scouting, biomechanics',
    globalPlayers: ['Hudl', 'Second Spectrum', 'Catapult'],
  },
  {
    id: 'sports-fan', tab: 'play', emoji: '🎟️', heat: 'emerging',
    name: 'Fan Engagement & Tickets', parent: 'sports',
    blurb: 'Super-apps for fans, second-screen, AR in stadium',
    trending: ['Socios', 'StubHub', 'SeatGeek'],
  },
  {
    id: 'sports-training', tab: 'play', emoji: '🏋️', heat: 'emerging',
    name: 'Athlete Training Tech', parent: 'sports',
    blurb: 'AI coaching, sensor-based feedback, recovery',
    trending: ['Whoop', 'Catapult', 'Output Sports'],
  },
  {
    id: 'sports-betting', tab: 'play', emoji: '🎰', heat: 'established',
    name: 'Sportsbooks & Prediction', parent: 'sports',
    blurb: 'Licensed sportsbooks, prop markets, prediction exchanges',
    globalPlayers: ['DraftKings', 'FanDuel', 'Polymarket'],
  },

  {
    id: 'music-ai-gen', tab: 'play', emoji: '🎵', heat: 'frontier',
    name: 'AI Music Generation', parent: 'music',
    blurb: 'Text-to-song, sample generation, songwriter AI',
    trending: ['Suno', 'Udio', 'Stable Audio', 'Lyria'],
  },
  {
    id: 'music-distribution', tab: 'play', emoji: '💿', heat: 'established',
    name: 'Music Distribution & Royalties', parent: 'music',
    blurb: 'Indie distribution, neighbouring rights, sync licensing',
    globalPlayers: ['DistroKid', 'TuneCore', 'Stem'], indianPlayers: ['TuneHub', 'OKListen'],
  },
  {
    id: 'music-education', tab: 'play', emoji: '🎹', heat: 'emerging',
    name: 'Music Education & Coaching', parent: 'music',
    blurb: 'AI tutors for instruments, practice apps, lesson platforms',
    trending: ['Simply Piano', 'Yousician', 'Trala'],
  },

  {
    id: 'hobbies-collectibles', tab: 'play', emoji: '🃏', heat: 'emerging',
    name: 'Collectibles & Trading',
    blurb: 'Cards, sneakers, toys, memorabilia marketplaces',
    trending: ['StockX', 'Whatnot', 'Collectors Universe'],
  },
  {
    id: 'hobbies-maker', tab: 'play', emoji: '🔨', heat: 'emerging',
    name: 'DIY & Maker Platforms',
    blurb: 'Project-sharing, hardware kits, maker community',
    globalPlayers: ['Hackster', 'Instructables', 'Adafruit'],
  },
  {
    id: 'hobbies-reading', tab: 'play', emoji: '📖', heat: 'emerging',
    name: 'Reading & Bookish Tech',
    blurb: 'Social reading, book clubs, audiobook platforms',
    globalPlayers: ['Fable', 'Storygraph', 'Audible'],
  },

  // ═══════════════════════════════════════════════════════════
  // TAB: BUILD — AI, Dev Tools, Robotics, Infra, Frontier Tech
  // ═══════════════════════════════════════════════════════════
  {
    id: 'ai-agents', tab: 'build', emoji: '🤖', heat: 'frontier',
    name: 'AI Agents & Autonomous Systems', parent: 'ai',
    blurb: 'Multi-step reasoning agents, agent frameworks, AutoGPT-style',
    trending: ['Claude Code', 'Cognition (Devin)', 'Adept', 'Multi-on', 'Manus'],
  },
  {
    id: 'ai-llm-tooling', tab: 'build', emoji: '🧠', heat: 'emerging',
    name: 'LLM Tooling & Orchestration', parent: 'ai',
    blurb: 'RAG pipelines, fine-tuning platforms, eval, observability',
    trending: ['LangChain', 'LlamaIndex', 'Weights & Biases', 'Braintrust', 'Humanloop'],
  },
  {
    id: 'ai-voice', tab: 'build', emoji: '🗣️', heat: 'frontier',
    name: 'Voice AI & Speech', parent: 'ai',
    blurb: 'TTS, STT, voice agents, cloning, dubbing',
    trending: ['ElevenLabs', 'Deepgram', 'PlayAI', 'Bland', 'Retell'],
    indianPlayers: ['Sarvam AI', 'Gnani.ai', 'Observe.ai'],
  },
  {
    id: 'ai-vision', tab: 'build', emoji: '👁️', heat: 'emerging',
    name: 'Computer Vision', parent: 'ai',
    blurb: 'Object detection, OCR, visual search, pose estimation',
    trending: ['Roboflow', 'Scale AI', 'CynLr'],
  },
  {
    id: 'ai-video-gen', tab: 'build', emoji: '🎥', heat: 'frontier',
    name: 'Generative Video', parent: 'ai',
    blurb: 'Text-to-video, video-to-video, avatars, lip-sync',
    trending: ['Sora', 'Runway', 'Pika', 'Luma', 'HeyGen', 'Synthesia'],
  },
  {
    id: 'ai-coding', tab: 'build', emoji: '💻', heat: 'frontier',
    name: 'AI Coding & Developer Copilots', parent: 'ai',
    blurb: 'IDE copilots, agentic coding, code-search, debug-AI',
    trending: ['Cursor', 'Windsurf', 'Bolt.new', 'Lovable', 'v0', 'Claude Code'],
  },
  {
    id: 'ai-enterprise-search', tab: 'build', emoji: '🔍', heat: 'emerging',
    name: 'Enterprise AI Search', parent: 'ai',
    blurb: 'Internal knowledge search, RAG-over-docs, chat-with-company',
    trending: ['Glean', 'Dust', 'Mendable'],
  },
  {
    id: 'ai-model-hosting', tab: 'build', emoji: '🧮', heat: 'emerging',
    name: 'Model Hosting & Inference', parent: 'ai',
    blurb: 'GPU orchestration, serverless inference, fine-tune hosting',
    trending: ['Replicate', 'Modal', 'Together AI', 'Fireworks', 'Baseten'],
  },
  {
    id: 'ai-data-labeling', tab: 'build', emoji: '🏷️', heat: 'established',
    name: 'Data Labeling & RLHF', parent: 'ai',
    blurb: 'Human-in-loop annotation, preference data, eval ops',
    trending: ['Scale AI', 'Surge', 'Labelbox', 'Invisible'],
  },
  {
    id: 'ai-safety', tab: 'build', emoji: '🛡️', heat: 'frontier',
    name: 'AI Safety & Alignment', parent: 'ai',
    blurb: 'Red-teaming, interpretability, guardrails, jailbreak defense',
    trending: ['Haize Labs', 'Lakera', 'Robust Intelligence'],
  },

  {
    id: 'devtools-ide', tab: 'build', emoji: '✍️', heat: 'emerging',
    name: 'IDEs & Code Editors', parent: 'devtools',
    blurb: 'Next-gen editors, cloud IDEs, collaborative coding',
    trending: ['Cursor', 'Zed', 'Replit', 'Windsurf'],
  },
  {
    id: 'devtools-observability', tab: 'build', emoji: '📈', heat: 'established',
    name: 'Observability & Monitoring', parent: 'devtools',
    blurb: 'Logs, traces, metrics, application monitoring',
    globalPlayers: ['Datadog', 'Grafana', 'Honeycomb', 'Sentry'],
  },
  {
    id: 'devtools-cicd', tab: 'build', emoji: '🔄', heat: 'established',
    name: 'CI/CD & Release Tooling', parent: 'devtools',
    blurb: 'Build pipelines, deployment, feature flags',
    globalPlayers: ['Vercel', 'LaunchDarkly', 'GitHub Actions'],
  },
  {
    id: 'devtools-api', tab: 'build', emoji: '🔌', heat: 'emerging',
    name: 'API & Backend Platforms', parent: 'devtools',
    blurb: 'BaaS, API design, gateway, managed databases',
    trending: ['Supabase', 'Neon', 'Hasura', 'PlanetScale'],
  },
  {
    id: 'devtools-dx', tab: 'build', emoji: '🎨', heat: 'emerging',
    name: 'Developer Experience', parent: 'devtools',
    blurb: 'Onboarding, docs-as-code, dev portals, CLI tools',
    trending: ['Mintlify', 'ReadMe', 'Warp'],
  },
  {
    id: 'devtools-testing', tab: 'build', emoji: '🧪', heat: 'emerging',
    name: 'Testing & QA Automation', parent: 'devtools',
    blurb: 'Visual regression, end-to-end, AI test generation',
    trending: ['Playwright', 'Cypress', 'Reflect', 'BrowserStack'],
    indianPlayers: ['BrowserStack', 'LambdaTest'],
  },

  {
    id: 'cybersec-zerotrust', tab: 'build', emoji: '🔐', heat: 'established',
    name: 'Zero-Trust & Identity', parent: 'cybersec',
    blurb: 'IAM, MFA, passwordless, device trust',
    globalPlayers: ['Okta', 'Cloudflare', '1Password'],
  },
  {
    id: 'cybersec-offensive', tab: 'build', emoji: '⚔️', heat: 'emerging',
    name: 'Offensive Security & Pentesting', parent: 'cybersec',
    blurb: 'Attack surface mgmt, red-team-as-a-service, bug bounty',
    globalPlayers: ['HackerOne', 'Bishop Fox', 'Horizon3'],
  },
  {
    id: 'cybersec-compliance', tab: 'build', emoji: '📋', heat: 'emerging',
    name: 'Compliance Automation', parent: 'cybersec',
    blurb: 'SOC2, ISO, HIPAA, DPDP compliance tooling',
    globalPlayers: ['Vanta', 'Drata', 'Secureframe'],
  },
  {
    id: 'cybersec-ai-threats', tab: 'build', emoji: '🎯', heat: 'frontier',
    name: 'AI-Era Threat Defense', parent: 'cybersec',
    blurb: 'Deepfake detection, prompt-injection defense, AI-DLP',
    trending: ['Reality Defender', 'Protect AI', 'HiddenLayer'],
  },

  {
    id: 'robotics-humanoid', tab: 'build', emoji: '🧍', heat: 'frontier',
    name: 'Humanoid Robotics', parent: 'robotics',
    blurb: 'General-purpose bipedal robots for labor',
    trending: ['Figure', '1X', 'Agility', 'Apptronik', 'Unitree'],
  },
  {
    id: 'robotics-industrial', tab: 'build', emoji: '🏭', heat: 'emerging',
    name: 'Industrial & Warehouse Robotics', parent: 'robotics',
    blurb: 'Pick-and-place, AGVs, cobots, palletizing',
    globalPlayers: ['Covariant', 'Symbotic'], indianPlayers: ['GreyOrange', 'Addverb', 'SkyServe'],
  },
  {
    id: 'robotics-consumer', tab: 'build', emoji: '🏡', heat: 'emerging',
    name: 'Consumer & Home Robotics', parent: 'robotics',
    blurb: 'Robot vacuums, lawn, cooking, companion bots',
    trending: ['iRobot', 'Matic', 'Labrador Systems'],
  },
  {
    id: 'robotics-surgical', tab: 'build', emoji: '🏥', heat: 'emerging',
    name: 'Surgical & Medical Robotics', parent: 'robotics',
    blurb: 'Robotic surgery, rehab exoskeletons, micro-bots',
    globalPlayers: ['Intuitive', 'CMR', 'Distalmotion'], indianPlayers: ['SS Innovations'],
  },
  {
    id: 'robotics-agri', tab: 'build', emoji: '🚜', heat: 'emerging',
    name: 'Agricultural Robotics', parent: 'robotics',
    blurb: 'Autonomous tractors, weeding bots, harvest robots',
    trending: ['Monarch', 'Farm-ng', 'Carbon Robotics'],
  },
  {
    id: 'robotics-drones', tab: 'build', emoji: '🛸', heat: 'emerging',
    name: 'Drones & Autonomous Flight', parent: 'robotics',
    blurb: 'Delivery, surveillance, agri-spray, inspection',
    indianPlayers: ['ideaForge', 'Garuda Aerospace', 'ThrottleAerospace'],
  },

  {
    id: 'semi-chip-design', tab: 'build', emoji: '🔬', heat: 'frontier',
    name: 'Chip Design & EDA', parent: 'semiconductors',
    blurb: 'AI-accelerated chip design, custom silicon, open-source EDA',
    trending: ['Rain AI', 'Lightmatter', 'Groq', 'Etched', 'Cerebras'],
  },
  {
    id: 'semi-fab', tab: 'build', emoji: '🏗️', heat: 'frontier',
    name: 'Fab & Manufacturing Tech', parent: 'semiconductors',
    blurb: 'Yield optimization, metrology, packaging innovation',
    indianPlayers: ['Tata Electronics (Fab)', 'Vedanta-Foxconn'],
  },

  {
    id: 'xr-ar', tab: 'build', emoji: '🥽', heat: 'frontier',
    name: 'AR & Mixed Reality', parent: 'xr',
    blurb: 'Smart glasses, industrial AR, retail AR, enterprise MR',
    trending: ['Meta Orion', 'Vision Pro', 'Snap Spectacles', 'XREAL'],
  },
  {
    id: 'xr-vr', tab: 'build', emoji: '🎮', heat: 'emerging',
    name: 'VR Experiences & Training', parent: 'xr',
    blurb: 'Immersive training, location-based VR, simulation',
    globalPlayers: ['Sandbox VR', 'Meta Quest', 'Varjo'],
  },
  {
    id: 'xr-spatial', tab: 'build', emoji: '🌐', heat: 'frontier',
    name: 'Spatial Computing & Interfaces', parent: 'xr',
    blurb: 'Spatial OS, gesture control, room-scale apps',
    trending: ['Apple Vision', 'Magic Leap', 'Niantic Lightship'],
  },

  {
    id: 'quantum-hw', tab: 'build', emoji: '⚛️', heat: 'frontier',
    name: 'Quantum Hardware', parent: 'quantum',
    blurb: 'Qubits, annealers, photonic, trapped-ion',
    globalPlayers: ['IBM Quantum', 'PsiQuantum', 'IonQ', 'Quantinuum'],
  },
  {
    id: 'quantum-sw', tab: 'build', emoji: '💠', heat: 'frontier',
    name: 'Quantum Algorithms & SDKs', parent: 'quantum',
    blurb: 'Quantum SDKs, hybrid-classical, quantum ML',
    globalPlayers: ['Classiq', 'Zapata', 'Quantum Machines'],
  },

  {
    id: 'bci', tab: 'build', emoji: '🧠', heat: 'frontier',
    name: 'Brain-Computer Interfaces',
    blurb: 'Non-invasive + invasive neural interfaces, mind-typing',
    trending: ['Neuralink', 'Synchron', 'Blackrock Neurotech', 'Neurable'],
  },
  {
    id: 'iot-industrial', tab: 'build', emoji: '📡', heat: 'emerging',
    name: 'Industrial IoT', parent: 'iot',
    blurb: 'Sensor networks, predictive maintenance, asset tracking',
    globalPlayers: ['Samsara', 'Augury'], indianPlayers: ['Infinite Uptime', 'Altizon'],
  },
  {
    id: 'iot-home', tab: 'build', emoji: '💡', heat: 'established',
    name: 'Smart Home & Consumer IoT', parent: 'iot',
    blurb: 'Voice assistants, smart lighting, security, kitchen',
    globalPlayers: ['Amazon Echo', 'Google Nest'], indianPlayers: ['Wipro Smart Home', 'Syska Smart'],
  },

  {
    id: 'blockchain-l1', tab: 'build', emoji: '⛓️', heat: 'frontier',
    name: 'L1s, L2s & Rollups', parent: 'blockchain',
    blurb: 'Base-layer chains, scaling, modular blockchain',
    globalPlayers: ['Ethereum', 'Solana', 'Base', 'Celestia'],
  },
  {
    id: 'blockchain-depin', tab: 'build', emoji: '🛰️', heat: 'frontier',
    name: 'DePIN & Physical Infra', parent: 'blockchain',
    blurb: 'Decentralized wifi, compute, storage, mapping',
    trending: ['Helium', 'Hivemapper', 'IO.NET', 'Render'],
  },

  // ═══════════════════════════════════════════════════════════
  // TAB: MONEY — Fintech, Investing, Insurance, Crypto
  // ═══════════════════════════════════════════════════════════
  {
    id: 'fintech-payments', tab: 'money', emoji: '💳', heat: 'established',
    name: 'Payments & Checkout', parent: 'fintech',
    blurb: 'Gateways, wallets, UPI stack, checkout infrastructure',
    indianPlayers: ['Razorpay', 'PhonePe', 'Cashfree', 'Juspay'], globalPlayers: ['Stripe', 'Adyen'],
  },
  {
    id: 'fintech-neobank', tab: 'money', emoji: '🏦', heat: 'emerging',
    name: 'Neobanks', parent: 'fintech',
    blurb: 'Digital-native banking for consumers & SMBs',
    indianPlayers: ['Jupiter', 'Fi', 'Niyo', 'FamPay', 'Open'], globalPlayers: ['Revolut', 'Chime', 'Mercury'],
  },
  {
    id: 'fintech-wealth', tab: 'money', emoji: '📊', heat: 'established',
    name: 'Wealthtech & Investing', parent: 'fintech',
    blurb: 'Discount brokers, robo-advisory, PMS, smallcase-style',
    indianPlayers: ['Zerodha', 'Groww', 'Upstox', 'Smallcase', 'Dezerv'], globalPlayers: ['Robinhood', 'Wealthfront'],
  },
  {
    id: 'fintech-lending', tab: 'money', emoji: '💰', heat: 'established',
    name: 'Digital Lending & BNPL', parent: 'fintech',
    blurb: 'Instant loans, BNPL, co-lending, invoice discounting',
    indianPlayers: ['KreditBee', 'MoneyView', 'Kissht', 'Lendingkart', 'Yubi'],
  },
  {
    id: 'fintech-insurance', tab: 'money', emoji: '🛡️', heat: 'emerging',
    name: 'Insurtech', parent: 'fintech',
    blurb: 'Distribution, underwriting AI, claims automation, micro-insurance',
    indianPlayers: ['ACKO', 'Digit', 'PolicyBazaar'], globalPlayers: ['Lemonade', 'Next Insurance'],
  },
  {
    id: 'fintech-crypto-cefi', tab: 'money', emoji: '🪙', heat: 'frontier',
    name: 'Crypto Exchanges & CeFi', parent: 'fintech',
    blurb: 'On-ramps, custody, CEX, institutional crypto',
    indianPlayers: ['CoinDCX', 'CoinSwitch', 'WazirX'], globalPlayers: ['Coinbase', 'Kraken'],
  },
  {
    id: 'fintech-defi', tab: 'money', emoji: '🔗', heat: 'frontier',
    name: 'DeFi & On-chain Finance', parent: 'fintech',
    blurb: 'DEXs, lending protocols, stablecoins, yield',
    globalPlayers: ['Uniswap', 'Aave', 'Morpho'],
  },
  {
    id: 'fintech-cross-border', tab: 'money', emoji: '🌍', heat: 'emerging',
    name: 'Cross-Border & Remittance', parent: 'fintech',
    blurb: 'B2B FX, diaspora remittance, stablecoin corridors',
    indianPlayers: ['Skydo', 'Salt', 'Bookeeping'], globalPlayers: ['Wise', 'Nium', 'Airwallex'],
  },
  {
    id: 'fintech-sme', tab: 'money', emoji: '🧾', heat: 'emerging',
    name: 'SME Finance & Accounting', parent: 'fintech',
    blurb: 'SME banking, invoice ops, GST, treasury',
    indianPlayers: ['Open', 'Razorpay Rize', 'RecurClub'], globalPlayers: ['Brex', 'Ramp'],
  },
  {
    id: 'fintech-regtech', tab: 'money', emoji: '⚖️', heat: 'emerging',
    name: 'RegTech & KYC', parent: 'fintech',
    blurb: 'KYC, AML, fraud detection, video-KYC',
    indianPlayers: ['HyperVerge', 'Signzy', 'Bureau'], globalPlayers: ['Persona', 'Alloy'],
  },
  {
    id: 'fintech-embedded', tab: 'money', emoji: '🧩', heat: 'emerging',
    name: 'Embedded Finance', parent: 'fintech',
    blurb: 'APIs that let any app become a bank/insurer',
    indianPlayers: ['Setu', 'Decentro', 'M2P', 'Zwitch'], globalPlayers: ['Unit', 'Synctera'],
  },
  {
    id: 'fintech-prediction-markets', tab: 'money', emoji: '🔮', heat: 'frontier',
    name: 'Prediction Markets & Events', parent: 'fintech',
    blurb: 'Event contracts, prediction exchanges, opinion markets',
    indianPlayers: ['Probo'], globalPlayers: ['Polymarket', 'Kalshi'],
  },
  {
    id: 'fintech-alt-assets', tab: 'money', emoji: '💎', heat: 'emerging',
    name: 'Alternative Assets & Fractional', parent: 'fintech',
    blurb: 'Fractional real estate, art, startup equity, SGB',
    indianPlayers: ['GripInvest', 'Strata', 'Jiraaf', 'Wint Wealth'],
  },

  // ═══════════════════════════════════════════════════════════
  // TAB: HEALTH
  // ═══════════════════════════════════════════════════════════
  {
    id: 'health-telemed', tab: 'health', emoji: '📞', heat: 'established',
    name: 'Telemedicine & Digital Clinics', parent: 'health',
    blurb: 'Online consults, e-prescriptions, condition clinics',
    indianPlayers: ['Practo', 'Mfine', 'Tata 1mg', 'DocsApp'], globalPlayers: ['Teladoc', 'Ro', 'Hims'],
  },
  {
    id: 'health-mental', tab: 'health', emoji: '🧘', heat: 'emerging',
    name: 'Mental Health Platforms', parent: 'health',
    blurb: 'Therapy marketplaces, self-guided CBT, workplace mental health',
    indianPlayers: ['Amaha (InnerHour)', 'Wysa', 'YourDOST'], globalPlayers: ['BetterHelp', 'Headspace', 'Calm'],
  },
  {
    id: 'health-femtech', tab: 'health', emoji: '🌸', heat: 'emerging',
    name: 'Femtech & Women\'s Health', parent: 'health',
    blurb: 'Cycle tracking, fertility, menopause, pelvic health',
    indianPlayers: ['Proactive For Her', 'Gytree', 'Nua'], globalPlayers: ['Maven', 'Tia', 'Flo', 'Elvie'],
  },
  {
    id: 'health-menshealth', tab: 'health', emoji: '🧔', heat: 'emerging',
    name: "Men's Health", parent: 'health',
    blurb: 'Sexual health, hair loss, testosterone, prostate',
    indianPlayers: ['Mosaic Wellness', 'Bold Care', 'Misters'], globalPlayers: ['Hims', 'Roman'],
  },
  {
    id: 'health-pediatric', tab: 'health', emoji: '👶', heat: 'emerging',
    name: 'Pediatric & Family Health', parent: 'health',
    blurb: 'Baby health, vaccination reminders, pediatric tele-care',
    indianPlayers: ['BabyChakra', 'Mylo'], globalPlayers: ['Summer Health', 'Brave Care'],
  },
  {
    id: 'health-longevity', tab: 'health', emoji: '⏳', heat: 'frontier',
    name: 'Longevity & Biohacking', parent: 'health',
    blurb: 'Lifespan clinics, epigenetic testing, senolytics',
    globalPlayers: ['Function Health', 'Human Longevity Inc', 'Fountain Life', 'Neko'],
  },
  {
    id: 'health-wearables', tab: 'health', emoji: '⌚', heat: 'emerging',
    name: 'Wearables & Continuous Monitoring', parent: 'health',
    blurb: 'CGMs, rings, patches, longitudinal health data',
    globalPlayers: ['Oura', 'Whoop', 'Levels', 'Abbott'],
    indianPlayers: ['Fire-Boltt', 'Noise'],
  },
  {
    id: 'health-diagnostics', tab: 'health', emoji: '🧬', heat: 'emerging',
    name: 'Diagnostics & Imaging', parent: 'health',
    blurb: 'At-home tests, AI radiology, point-of-care imaging',
    indianPlayers: ['Qure.ai', 'Niramai', 'SigTuple'], globalPlayers: ['Everlywell', 'Butterfly'],
  },
  {
    id: 'health-pharmacy', tab: 'health', emoji: '💊', heat: 'established',
    name: 'E-Pharmacy & Meds', parent: 'health',
    blurb: 'Prescription delivery, adherence, chronic care',
    indianPlayers: ['Tata 1mg', 'PharmEasy', 'Apollo 24/7'], globalPlayers: ['Capsule', 'Amazon Pharmacy'],
  },
  {
    id: 'health-drug-discovery', tab: 'health', emoji: '🧪', heat: 'frontier',
    name: 'AI Drug Discovery & Biotech', parent: 'health',
    blurb: 'AI-first therapeutics, protein design, clinical trial AI',
    globalPlayers: ['Recursion', 'Insitro', 'Isomorphic Labs', 'Xaira'],
  },
  {
    id: 'health-elder', tab: 'health', emoji: '👴', heat: 'emerging',
    name: 'Elder Care & Aging-in-Place', parent: 'health',
    blurb: 'Home care, fall detection, caregiver tools, cognitive',
    indianPlayers: ['Emoha', 'Khyaal', 'GoodLives'], globalPlayers: ['Papa', 'Honor'],
  },
  {
    id: 'health-nutrition', tab: 'health', emoji: '🥗', heat: 'emerging',
    name: 'Nutrition & Personalized Diet', parent: 'health',
    blurb: 'CGM-driven meal plans, gut health, supplements',
    indianPlayers: ['HealthifyMe', 'Cure.fit Eat.fit'], globalPlayers: ['Zoe', 'Nutrisense'],
  },
  {
    id: 'health-sleep', tab: 'health', emoji: '😴', heat: 'emerging',
    name: 'Sleep Tech', parent: 'health',
    blurb: 'Sleep trackers, apnea, circadian, smart beds',
    globalPlayers: ['Eight Sleep', 'ResMed'], indianPlayers: ['Wakefit (data product)'],
  },
  {
    id: 'health-chronic', tab: 'health', emoji: '🩸', heat: 'emerging',
    name: 'Chronic Disease Management', parent: 'health',
    blurb: 'Diabetes, hypertension, cardiac, NAFLD digital care',
    indianPlayers: ['BeatO', 'Fitterfly', 'BlueSemi'], globalPlayers: ['Livongo', 'Virta'],
  },
  {
    id: 'health-dental', tab: 'health', emoji: '🦷', heat: 'emerging',
    name: 'Dental Tech', parent: 'health',
    blurb: 'Clear aligners, dental AI, tele-dentistry',
    indianPlayers: ['Clove Dental', 'toothsi'], globalPlayers: ['SmileDirectClub (successor)', 'Pearl'],
  },
  {
    id: 'health-dermatology', tab: 'health', emoji: '🧴', heat: 'emerging',
    name: 'Dermatology & Aesthetic', parent: 'health',
    blurb: 'Skin AI, tele-derm, aesthetic med-spas, injectables routing',
    indianPlayers: ['Oliva', 'Kaya', 'CureSkin'], globalPlayers: ['Ro Derm', 'Curology'],
  },

  // ═══════════════════════════════════════════════════════════
  // TAB: LEARN — Education
  // ═══════════════════════════════════════════════════════════
  {
    id: 'edu-k12', tab: 'learn', emoji: '🎒', heat: 'established',
    name: 'K-12 EdTech', parent: 'education',
    blurb: 'After-school, curriculum-aligned, school SaaS',
    indianPlayers: ['BYJU\'S', 'PhysicsWallah', 'Vedantu', 'Classplus'], globalPlayers: ['Khan Academy', 'Synthesis'],
  },
  {
    id: 'edu-test-prep', tab: 'learn', emoji: '📝', heat: 'established',
    name: 'Test Prep & Competitive Exams', parent: 'education',
    blurb: 'JEE, NEET, UPSC, GRE, GMAT platforms',
    indianPlayers: ['Unacademy', 'Allen', 'PhysicsWallah', 'Testbook'],
  },
  {
    id: 'edu-skilling', tab: 'learn', emoji: '🎯', heat: 'emerging',
    name: 'Vocational Skilling & Upskilling', parent: 'education',
    blurb: 'Future-of-work skilling, coding, data, AI bootcamps',
    indianPlayers: ['Masai', 'Scaler', 'Newton School', 'upGrad'], globalPlayers: ['Coursera', 'Udacity'],
  },
  {
    id: 'edu-ai-tutor', tab: 'learn', emoji: '🧑‍🏫', heat: 'frontier',
    name: 'AI Tutors & Personalized Learning', parent: 'education',
    blurb: '1:1 AI tutors, adaptive paths, socratic AI',
    trending: ['Khanmigo', 'Synthesis', 'Merlyn Mind', 'MagicSchool'],
    indianPlayers: ['Uolo', 'MyGuru'],
  },
  {
    id: 'edu-language', tab: 'learn', emoji: '🌐', heat: 'established',
    name: 'Language Learning', parent: 'education',
    blurb: 'Apps, AI conversation, accent coaching',
    globalPlayers: ['Duolingo', 'Cambly', 'Speak'], indianPlayers: ['EngVarta'],
  },
  {
    id: 'edu-corporate', tab: 'learn', emoji: '🏢', heat: 'emerging',
    name: 'Corporate L&D', parent: 'education',
    blurb: 'Workplace training, compliance, skills analytics',
    globalPlayers: ['Guild', 'Coursera for Biz', 'Pluralsight'],
    indianPlayers: ['upGrad for Business', 'Simplilearn'],
  },
  {
    id: 'edu-study-abroad', tab: 'learn', emoji: '🎓', heat: 'emerging',
    name: 'Study Abroad & Admissions', parent: 'education',
    blurb: 'University placement, visas, loans, SOPs, student housing',
    indianPlayers: ['Leap', 'ApplyBoard', 'GradRight', 'Eduvanz', 'Amber'],
  },
  {
    id: 'edu-parenting', tab: 'learn', emoji: '🤱', heat: 'emerging',
    name: 'Parenting & Early Childhood', parent: 'education',
    blurb: 'Newborn-to-6 content, milestone tracking, parent community',
    indianPlayers: ['FirstCry Intellitots', 'Flintobox', 'KinderPass'], globalPlayers: ['Lovevery', 'Tinybeans'],
  },
  {
    id: 'edu-school-saas', tab: 'learn', emoji: '🏫', heat: 'emerging',
    name: 'School & Institution SaaS', parent: 'education',
    blurb: 'ERP, admissions, fee collection, parent communication',
    indianPlayers: ['LEAD', 'Next Education', 'Classplus', 'Teachmint'],
  },

  // ═══════════════════════════════════════════════════════════
  // TAB: WORK — Productivity, B2B, Professional
  // ═══════════════════════════════════════════════════════════
  {
    id: 'work-prod', tab: 'work', emoji: '📝', heat: 'established',
    name: 'Productivity & Docs', parent: 'work',
    blurb: 'Docs, wikis, task mgmt, note-taking',
    globalPlayers: ['Notion', 'Linear', 'ClickUp', 'Coda', 'Obsidian'],
  },
  {
    id: 'work-sales', tab: 'work', emoji: '💼', heat: 'emerging',
    name: 'Sales Tech', parent: 'work',
    blurb: 'CRM AI, outbound, deal intelligence, revenue ops',
    trending: ['Apollo', 'Clay', 'Clari', 'Gong', 'Cresta'],
  },
  {
    id: 'work-marketing', tab: 'work', emoji: '📢', heat: 'emerging',
    name: 'Marketing & MarTech', parent: 'work',
    blurb: 'Campaign AI, SEO, content, attribution, CRM',
    globalPlayers: ['HubSpot', 'Jasper', 'AdCreative.ai', 'Attio'],
  },
  {
    id: 'work-hr', tab: 'work', emoji: '👥', heat: 'emerging',
    name: 'HR Tech & Future of Work', parent: 'work',
    blurb: 'Payroll, performance, engagement, comp, EOR',
    globalPlayers: ['Deel', 'Rippling', 'Lattice'], indianPlayers: ['Keka', 'RazorpayX Payroll', 'Zimyo'],
  },
  {
    id: 'work-recruiting', tab: 'work', emoji: '🎯', heat: 'emerging',
    name: 'Recruiting & Assessment', parent: 'work',
    blurb: 'AI sourcing, interview intelligence, assessments',
    globalPlayers: ['HireVue', 'Ashby', 'Gem', 'Metaview'], indianPlayers: ['HirePro', 'HackerEarth'],
  },
  {
    id: 'work-support', tab: 'work', emoji: '🎧', heat: 'emerging',
    name: 'Customer Support', parent: 'work',
    blurb: 'AI copilots, ticketing, CSAT analytics, self-serve',
    globalPlayers: ['Intercom', 'Ada', 'Decagon', 'Sierra'],
  },
  {
    id: 'work-legal', tab: 'work', emoji: '⚖️', heat: 'emerging',
    name: 'Legal Tech', parent: 'work',
    blurb: 'Contract AI, e-discovery, compliance, LegalGPT',
    globalPlayers: ['Harvey', 'Ironclad', 'Evisort', 'Spellbook'], indianPlayers: ['SpotDraft', 'LegitQuest'],
  },
  {
    id: 'work-finance-ops', tab: 'work', emoji: '📑', heat: 'emerging',
    name: 'Finance Ops & Accounting', parent: 'work',
    blurb: 'AP/AR, bookkeeping AI, FP&A, close',
    globalPlayers: ['Mercury', 'Ramp', 'Puzzle'], indianPlayers: ['Refyne', 'Zoho Books'],
  },
  {
    id: 'work-freelance', tab: 'work', emoji: '🧑‍💻', heat: 'emerging',
    name: 'Freelance & Gig Platforms', parent: 'work',
    blurb: 'Marketplaces, invoicing, curated talent',
    globalPlayers: ['Upwork', 'Fiverr', 'Contra', 'Braintrust'], indianPlayers: ['Refrens', 'Flexiple'],
  },
  {
    id: 'work-design-tools', tab: 'work', emoji: '🖌️', heat: 'emerging',
    name: 'Design & Creative Tools', parent: 'work',
    blurb: 'Design AI, collaborative canvases, brand systems',
    globalPlayers: ['Figma', 'Canva', 'Linear', 'Framer', 'Galileo AI'],
  },
  {
    id: 'work-meeting-ai', tab: 'work', emoji: '📞', heat: 'emerging',
    name: 'Meeting AI & Async Collab', parent: 'work',
    blurb: 'Transcription, summaries, action items, async video',
    trending: ['Otter', 'Fireflies', 'Granola', 'Loom', 'Tl;dv'],
  },

  // ═══════════════════════════════════════════════════════════
  // TAB: MOVE — Mobility, Logistics, Travel
  // ═══════════════════════════════════════════════════════════
  {
    id: 'move-ev-2w', tab: 'move', emoji: '🛵', heat: 'established',
    name: 'Electric 2-Wheelers', parent: 'mobility',
    blurb: 'Scooters, motorcycles, battery-swap, subsidies',
    indianPlayers: ['Ola Electric', 'Ather', 'TVS iQube', 'Bajaj Chetak', 'Ultraviolette'],
  },
  {
    id: 'move-ev-3w', tab: 'move', emoji: '🛺', heat: 'emerging',
    name: 'Electric 3-Wheelers & Last-Mile', parent: 'mobility',
    blurb: 'Cargo 3Ws, passenger e-auto, last-mile EVs',
    indianPlayers: ['Euler', 'Mahindra Electric', 'Piaggio', 'Altigreen'],
  },
  {
    id: 'move-ev-4w', tab: 'move', emoji: '🚗', heat: 'established',
    name: 'Electric Cars & Trucks', parent: 'mobility',
    blurb: 'Passenger EVs, commercial EVs',
    globalPlayers: ['Tesla', 'BYD', 'Rivian'], indianPlayers: ['Tata.ev', 'Mahindra', 'IPLTech'],
  },
  {
    id: 'move-charging', tab: 'move', emoji: '🔌', heat: 'emerging',
    name: 'EV Charging & Battery Swap', parent: 'mobility',
    blurb: 'Charging networks, swap stations, smart charging',
    indianPlayers: ['Battery Smart', 'Statiq', 'ChargeZone'], globalPlayers: ['ChargePoint', 'Ionna'],
  },
  {
    id: 'move-battery', tab: 'move', emoji: '🔋', heat: 'emerging',
    name: 'Battery Tech & Recycling', parent: 'mobility',
    blurb: 'Cells, BMS, second-life, recycling, solid-state',
    globalPlayers: ['CATL', 'QuantumScape', 'Redwood Materials'],
    indianPlayers: ['Log9', 'Exponent', 'Lohum', 'Attero'],
  },
  {
    id: 'move-autonomous', tab: 'move', emoji: '🤖', heat: 'frontier',
    name: 'Autonomous Vehicles', parent: 'mobility',
    blurb: 'Self-driving, robotaxi, trucking, ADAS',
    globalPlayers: ['Waymo', 'Cruise (+zoox)', 'Tesla FSD', 'Aurora', 'Kodiak'],
    indianPlayers: ['Swaayatt Robots', 'Minus Zero'],
  },
  {
    id: 'move-micromobility', tab: 'move', emoji: '🛴', heat: 'emerging',
    name: 'Micromobility', parent: 'mobility',
    blurb: 'E-bikes, e-scooters, shared fleets',
    globalPlayers: ['Lime', 'Bird', 'VanMoof successors'], indianPlayers: ['Yulu', 'Bounce'],
  },
  {
    id: 'move-logistics-b2b', tab: 'move', emoji: '📦', heat: 'emerging',
    name: 'B2B Logistics & Trucking', parent: 'logistics',
    blurb: 'FTL/LTL marketplaces, freight digitization',
    indianPlayers: ['Rivigo', 'Blackbuck', 'Porter', 'Locus'], globalPlayers: ['Flexport', 'Convoy successors'],
  },
  {
    id: 'move-last-mile', tab: 'move', emoji: '🛵', heat: 'emerging',
    name: 'Last-Mile & Quick Commerce', parent: 'logistics',
    blurb: '10-min delivery, dark stores, gig fleets',
    indianPlayers: ['Zepto', 'Blinkit', 'Swiggy Instamart', 'Shadowfax', 'Dunzo'],
  },
  {
    id: 'move-warehouse', tab: 'move', emoji: '🏬', heat: 'emerging',
    name: 'Warehousing & Fulfillment', parent: 'logistics',
    blurb: 'WMS, 3PL, micro-fulfillment, robot warehouses',
    indianPlayers: ['Delhivery', 'GreyOrange', 'Unicommerce', 'Stockarea'],
  },
  {
    id: 'move-drone-delivery', tab: 'move', emoji: '🛸', heat: 'frontier',
    name: 'Drone Delivery & Air Mobility', parent: 'move',
    blurb: 'Medical drones, last-mile drones, eVTOL',
    globalPlayers: ['Zipline', 'Joby', 'Wisk', 'Archer'],
    indianPlayers: ['Skye Air', 'TSAW', 'Garuda'],
  },
  {
    id: 'move-travel', tab: 'move', emoji: '✈️', heat: 'emerging',
    name: 'Travel Tech', parent: 'travel',
    blurb: 'Booking AI, itinerary, business travel, loyalty',
    indianPlayers: ['MakeMyTrip', 'Cleartrip', 'ixigo'], globalPlayers: ['Hopper', 'Navan', 'Mindtrip'],
  },
  {
    id: 'move-hospitality', tab: 'move', emoji: '🏨', heat: 'emerging',
    name: 'Hospitality Tech', parent: 'travel',
    blurb: 'Hotel tech, short stays, ops automation',
    indianPlayers: ['OYO', 'Treebo', 'Zostel'], globalPlayers: ['Sonder', 'Selina'],
  },
  {
    id: 'move-aviation', tab: 'move', emoji: '🛫', heat: 'emerging',
    name: 'Aviation & Airline Tech', parent: 'travel',
    blurb: 'Ops AI, MRO, crew tools, private aviation',
    globalPlayers: ['JetBlack', 'FlyNow'], indianPlayers: ['FlyBig', 'BadalCloud'],
  },

  // ═══════════════════════════════════════════════════════════
  // TAB: EARTH — Climate, Energy, Agri, Space
  // ═══════════════════════════════════════════════════════════
  {
    id: 'earth-solar', tab: 'earth', emoji: '☀️', heat: 'established',
    name: 'Solar & Distributed Energy', parent: 'energy',
    blurb: 'Rooftop solar, community solar, solar financing',
    indianPlayers: ['Freyr Energy', 'Orb Energy', 'SolarSquare'], globalPlayers: ['Sunrun', 'Enphase'],
  },
  {
    id: 'earth-wind', tab: 'earth', emoji: '💨', heat: 'emerging',
    name: 'Wind & Ocean Energy', parent: 'energy',
    blurb: 'Onshore/offshore wind, tidal, wave energy',
    globalPlayers: ['Ørsted', 'Vestas', 'Bombora'],
  },
  {
    id: 'earth-nuclear', tab: 'earth', emoji: '☢️', heat: 'frontier',
    name: 'Nuclear & SMRs', parent: 'energy',
    blurb: 'Small modular reactors, advanced fission, fuel cycle',
    globalPlayers: ['NuScale', 'X-energy', 'Oklo', 'Kairos'],
  },
  {
    id: 'earth-fusion', tab: 'earth', emoji: '⚛️', heat: 'frontier',
    name: 'Fusion Energy', parent: 'energy',
    blurb: 'Tokamaks, stellarators, inertial, Z-pinch',
    globalPlayers: ['Commonwealth Fusion', 'Helion', 'TAE', 'Zap', 'Tokamak Energy'],
  },
  {
    id: 'earth-grid', tab: 'earth', emoji: '⚡', heat: 'emerging',
    name: 'Grid Tech & Storage', parent: 'energy',
    blurb: 'Grid orchestration, long-duration storage, transmission',
    globalPlayers: ['Form Energy', 'ESS', 'Octopus Energy', 'Base Power'],
  },
  {
    id: 'earth-vpp', tab: 'earth', emoji: '🏠', heat: 'emerging',
    name: 'Virtual Power Plants & Demand Response', parent: 'energy',
    blurb: 'Aggregate home batteries/EVs to act as power plants',
    globalPlayers: ['Tesla VPP', 'Sunrun VPP', 'AutoGrid', 'Voltus'],
  },

  {
    id: 'earth-carbon-removal', tab: 'earth', emoji: '🌫️', heat: 'frontier',
    name: 'Carbon Removal & DAC', parent: 'climate',
    blurb: 'Direct air capture, mineralization, enhanced weathering',
    globalPlayers: ['Climeworks', 'Charm Industrial', 'Heirloom', 'Terraform Industries'],
  },
  {
    id: 'earth-carbon-markets', tab: 'earth', emoji: '📈', heat: 'emerging',
    name: 'Carbon Markets & MRV', parent: 'climate',
    blurb: 'Carbon credits, monitoring, verification, registries',
    globalPlayers: ['Pachama', 'Sylvera', 'CTrees', 'Patch'],
  },
  {
    id: 'earth-climate-risk', tab: 'earth', emoji: '🌪️', heat: 'emerging',
    name: 'Climate Risk & Adaptation', parent: 'climate',
    blurb: 'Flood/fire/heat risk modeling, insurance, adaptation',
    globalPlayers: ['One Concern', 'Jupiter Intelligence', 'Kettle'],
  },
  {
    id: 'earth-circular', tab: 'earth', emoji: '♻️', heat: 'emerging',
    name: 'Circular Economy & Recycling', parent: 'climate',
    blurb: 'Plastic, textile, e-waste, battery recycling',
    indianPlayers: ['Attero', 'RecycleKaro', 'Saahas Zero Waste'],
    globalPlayers: ['Li-Cycle', 'Ambercycle'],
  },

  {
    id: 'earth-precision-agri', tab: 'earth', emoji: '🌾', heat: 'emerging',
    name: 'Precision Agriculture', parent: 'agri',
    blurb: 'Satellite + AI crop advisory, soil testing, yield optimization',
    indianPlayers: ['Cropin', 'DeHaat', 'AgNext', 'Fasal', 'Niqo Robotics'],
    globalPlayers: ['Climate FieldView', 'Indigo Ag'],
  },
  {
    id: 'earth-vertical-farm', tab: 'earth', emoji: '🏢', heat: 'emerging',
    name: 'Vertical & Controlled Environment Farming', parent: 'agri',
    blurb: 'Indoor vertical farms, hydroponics, urban ag',
    globalPlayers: ['Plenty', 'Bowery', 'Little Leaf'],
    indianPlayers: ['Clover', 'Urban Farms Co'],
  },
  {
    id: 'earth-alt-protein', tab: 'earth', emoji: '🌱', heat: 'emerging',
    name: 'Alternative Proteins', parent: 'agri',
    blurb: 'Plant-based, cultivated meat, precision fermentation',
    globalPlayers: ['Impossible', 'Perfect Day', 'Upside Foods'],
    indianPlayers: ['GoodDot', 'Shaka Harry', 'Greenest'],
  },
  {
    id: 'earth-farmer-fintech', tab: 'earth', emoji: '🧑‍🌾', heat: 'emerging',
    name: 'Farmer Finance & Inputs', parent: 'agri',
    blurb: 'Farm loans, input delivery, produce aggregation',
    indianPlayers: ['DeHaat', 'AgroStar', 'BigHaat', 'Ninjacart', 'Jai Kisan'],
  },
  {
    id: 'earth-aquaculture', tab: 'earth', emoji: '🐟', heat: 'emerging',
    name: 'Aquaculture & Blue Economy', parent: 'agri',
    blurb: 'Fish farming tech, shrimp, seaweed, ocean data',
    indianPlayers: ['Aquaconnect', 'Captain Fresh'],
    globalPlayers: ['Aquabyte', 'Running Tide'],
  },

  {
    id: 'earth-water', tab: 'earth', emoji: '💧', heat: 'emerging',
    name: 'Water Tech', parent: 'earth',
    blurb: 'Desalination, purification, atmospheric water, leak detection',
    indianPlayers: ['DrinkPrime', 'Swajal', 'WEGoT'],
    globalPlayers: ['Gradiant', 'Source Global'],
  },

  {
    id: 'earth-space-launch', tab: 'earth', emoji: '🚀', heat: 'frontier',
    name: 'Space Launch & Vehicles', parent: 'space',
    blurb: 'Small-sat launch, reusable rockets, space planes',
    indianPlayers: ['Skyroot', 'Agnikul', 'Bellatrix'],
    globalPlayers: ['SpaceX', 'Rocket Lab', 'Relativity', 'Stoke'],
  },
  {
    id: 'earth-space-satellites', tab: 'earth', emoji: '🛰️', heat: 'emerging',
    name: 'Satellites & Earth Observation', parent: 'space',
    blurb: 'Imagery, hyperspectral, IoT sat, connectivity',
    indianPlayers: ['Pixxel', 'Dhruva Space', 'KaleidEO', 'Galaxeye'],
    globalPlayers: ['Planet', 'Capella', 'Starlink'],
  },
  {
    id: 'earth-space-station', tab: 'earth', emoji: '🏗️', heat: 'frontier',
    name: 'In-Space Manufacturing & Stations', parent: 'space',
    blurb: 'Space pharma, microgravity manufacturing, stations',
    globalPlayers: ['Varda', 'Axiom', 'Vast'],
  },

  {
    id: 'earth-mining', tab: 'earth', emoji: '⛏️', heat: 'emerging',
    name: 'Critical Minerals & Mining Tech', parent: 'earth',
    blurb: 'Lithium, nickel, rare-earths; autonomous mining',
    globalPlayers: ['KoBold Metals', 'Lilac Solutions', 'Eurasian Resources'],
  },
  {
    id: 'earth-materials', tab: 'earth', emoji: '🧬', heat: 'frontier',
    name: 'Materials Science & Composites', parent: 'earth',
    blurb: 'Novel cement, bio-materials, carbon-neutral concrete',
    globalPlayers: ['Sublime Systems', 'Brimstone', 'Modern Meadow'],
  },

  // ═══════════════════════════════════════════════════════════
  // TAB: LIFE — Consumer, Services, Home, Daily
  // ═══════════════════════════════════════════════════════════
  {
    id: 'life-d2c-beauty', tab: 'life', emoji: '💄', heat: 'established',
    name: 'Beauty & Personal Care D2C', parent: 'consumer',
    blurb: 'Skincare, haircare, color cosmetics',
    indianPlayers: ['Mamaearth', 'SUGAR', 'Plum', 'MyGlamm', 'Foxtale', 'Minimalist'],
  },
  {
    id: 'life-d2c-food', tab: 'life', emoji: '🥣', heat: 'established',
    name: 'Food & Beverage D2C', parent: 'consumer',
    blurb: 'Healthy snacks, specialty beverages, staples',
    indianPlayers: ['Licious', 'Country Delight', 'Slurrp Farm', 'The Whole Truth', 'Blue Tokai'],
  },
  {
    id: 'life-d2c-fashion', tab: 'life', emoji: '👕', heat: 'established',
    name: 'Fashion & Apparel D2C', parent: 'consumer',
    blurb: 'Modern ethnic, innerwear, athleisure, accessories',
    indianPlayers: ['Bewakoof', 'Libas', 'FabAlley', 'SuperBottoms', 'Rare Rabbit'],
  },
  {
    id: 'life-d2c-home', tab: 'life', emoji: '🛋️', heat: 'emerging',
    name: 'Home & Living D2C', parent: 'consumer',
    blurb: 'Furniture, decor, kitchen, bedding',
    indianPlayers: ['Pepperfry', 'Urban Ladder', 'Wakefit', 'The Sleep Company'],
  },
  {
    id: 'life-d2c-baby', tab: 'life', emoji: '👶', heat: 'emerging',
    name: 'Baby & Mom D2C', parent: 'consumer',
    blurb: 'Diapers, organic baby care, maternity',
    indianPlayers: ['FirstCry', 'Mylo', 'SuperBottoms', 'BabyChakra'],
  },
  {
    id: 'life-pets', tab: 'life', emoji: '🐾', heat: 'emerging',
    name: 'Pet Tech & Pet Care', parent: 'consumer',
    blurb: 'Pet food D2C, telemed, boarding, wearables',
    indianPlayers: ['Heads Up for Tails', 'Dogsee Chew', 'Supertails'],
    globalPlayers: ['Chewy', 'Fi', 'Rover'],
  },

  {
    id: 'life-resale', tab: 'life', emoji: '🔄', heat: 'emerging',
    name: 'Resale & Second-Hand',
    blurb: 'Luxury resale, refurbished electronics, thrift',
    globalPlayers: ['Vinted', 'Depop', 'StockX', 'Poshmark'],
    indianPlayers: ['Cashify', 'Yaantra', 'Confidential Couture'],
  },
  {
    id: 'life-rental', tab: 'life', emoji: '📦', heat: 'emerging',
    name: 'Rental & Subscription Consumer',
    blurb: 'Furniture rental, clothing rental, appliance subs',
    indianPlayers: ['Furlenco', 'Rentomojo'], globalPlayers: ['Rent the Runway'],
  },

  {
    id: 'life-proptech', tab: 'life', emoji: '🏘️', heat: 'emerging',
    name: 'PropTech & Real Estate', parent: 'life',
    blurb: 'Rental discovery, co-living, broker-AI, facility mgmt',
    indianPlayers: ['NoBroker', 'NestAway', 'Stanza Living', 'Magicbricks'],
    globalPlayers: ['Opendoor', 'Redfin'],
  },
  {
    id: 'life-services', tab: 'life', emoji: '🔧', heat: 'established',
    name: 'Home Services & Handyman', parent: 'life',
    blurb: 'Salon, cleaning, repairs, AMCs',
    indianPlayers: ['Urban Company', 'Housejoy', 'Snabbit'],
    globalPlayers: ['TaskRabbit', 'Thumbtack'],
  },
  {
    id: 'life-weddings', tab: 'life', emoji: '💒', heat: 'emerging',
    name: 'Weddings & Events', parent: 'life',
    blurb: 'Wedding planning, registries, vendor marketplaces',
    indianPlayers: ['WedMeGood', 'Shaadisaga', 'Betterhalf'],
    globalPlayers: ['Zola', 'Joy'],
  },
  {
    id: 'life-events', tab: 'life', emoji: '🎉', heat: 'emerging',
    name: 'Events & Ticketing', parent: 'life',
    blurb: 'Discovery, ticketing, corporate events, DJ/artist booking',
    indianPlayers: ['BookMyShow', 'District', 'Zomato Live'],
    globalPlayers: ['DICE', 'Partiful'],
  },
  {
    id: 'life-restaurant-tech', tab: 'life', emoji: '🍽️', heat: 'emerging',
    name: 'Restaurant Tech', parent: 'life',
    blurb: 'POS, inventory, loyalty, cloud-kitchen SaaS',
    indianPlayers: ['Petpooja', 'Dotpe', 'Rebel Foods'], globalPlayers: ['Toast', 'Square'],
  },

  // ═══════════════════════════════════════════════════════════
  // TAB: FRONTIER — Niche, Emerging, Fringe
  // ═══════════════════════════════════════════════════════════
  {
    id: 'frontier-defense', tab: 'frontier', emoji: '🛡️', heat: 'frontier',
    name: 'Defense Tech',
    blurb: 'Autonomous weapons, ISR, counter-drone, dual-use',
    globalPlayers: ['Anduril', 'Shield AI', 'Palantir', 'Saronic'],
    indianPlayers: ['ideaForge', 'NewSpace Research', 'Tonbo Imaging'],
  },
  {
    id: 'frontier-govtech', tab: 'frontier', emoji: '🏛️', heat: 'emerging',
    name: 'GovTech & Civic',
    blurb: 'Gov workflow AI, citizen services, procurement',
    globalPlayers: ['Palantir', 'Nava', 'GovWell'],
    indianPlayers: ['Jhatka (concept)', 'Sarvam.ai for Gov'],
  },
  {
    id: 'frontier-smart-cities', tab: 'frontier', emoji: '🌆', heat: 'emerging',
    name: 'Smart Cities & Urban',
    blurb: 'Traffic AI, waste, public safety, digital twins',
    globalPlayers: ['Sidewalk Labs successors', 'Replica'], indianPlayers: ['CitiusTech', 'Loginware'],
  },
  {
    id: 'frontier-synbio', tab: 'frontier', emoji: '🧫', heat: 'frontier',
    name: 'Synthetic Biology',
    blurb: 'Programmable cells, biomanufacturing, designer microbes',
    globalPlayers: ['Ginkgo', 'Colossal', 'Strand Therapeutics'],
  },
  {
    id: 'frontier-neuro', tab: 'frontier', emoji: '🧠', heat: 'frontier',
    name: 'Neuroscience & Mental Performance',
    blurb: 'Nootropics, neurofeedback, focus tech, psychedelics-adjacent',
    globalPlayers: ['Compass Pathways', 'Neurable', 'Muse'],
  },
  {
    id: 'frontier-psychedelics', tab: 'frontier', emoji: '🍄', heat: 'frontier',
    name: 'Psychedelic-Assisted Therapy',
    blurb: 'Clinical psychedelics, ketamine clinics, MDMA therapy',
    globalPlayers: ['MindMed', 'atai', 'Compass Pathways'],
  },
  {
    id: 'frontier-grief', tab: 'frontier', emoji: '🕊️', heat: 'emerging',
    name: 'Grief & Legacy Tech',
    blurb: 'Digital legacy, grief counseling, AI-of-deceased, memorials',
    globalPlayers: ['HereAfter AI', 'Empathy', 'Everdays'],
  },
  {
    id: 'frontier-death', tab: 'frontier', emoji: '⚱️', heat: 'emerging',
    name: 'Death Tech & End-of-Life',
    blurb: 'Estate planning, end-of-life care, funeral planning',
    globalPlayers: ['Trust & Will', 'Cake', 'Farewill'],
  },
  {
    id: 'frontier-divorce', tab: 'frontier', emoji: '💔', heat: 'emerging',
    name: 'Divorce & Separation Tech',
    blurb: 'Online divorce filing, custody coordination, mediation',
    globalPlayers: ['Hello Divorce', 'OurFamilyWizard'], indianPlayers: ['LegitQuest'],
  },
  {
    id: 'frontier-religion', tab: 'frontier', emoji: '🕉️', heat: 'emerging',
    name: 'Religion & Spirituality Tech',
    blurb: 'Prayer apps, temple tech, astro, meditation, sermons',
    indianPlayers: ['AppsForBharat (Sri Mandir)', 'Kutumb', 'AstroTalk'],
    globalPlayers: ['Hallow', 'Pray.com'],
  },
  {
    id: 'frontier-astrology', tab: 'frontier', emoji: '🔮', heat: 'emerging',
    name: 'Astrology & Divination Apps',
    blurb: 'Astro consults, natal charts, tarot, numerology',
    indianPlayers: ['AstroTalk', 'AstroSage', 'Astroyogi'],
  },
  {
    id: 'frontier-fractional', tab: 'frontier', emoji: '🎨', heat: 'emerging',
    name: 'Fractional Ownership',
    blurb: 'Fractional art, real estate, watches, cars, jets',
    globalPlayers: ['Masterworks', 'Otis', 'Rally'],
    indianPlayers: ['Strata', 'Rooh Collective', 'GripInvest'],
  },
  {
    id: 'frontier-creator-adult', tab: 'frontier', emoji: '🔞', heat: 'emerging',
    name: 'Adult Creator Economy',
    blurb: 'Creator-direct platforms, payments infra, safety tech',
    globalPlayers: ['OnlyFans', 'Passes', 'Fanvue'],
  },
  {
    id: 'frontier-privacy', tab: 'frontier', emoji: '🕵️', heat: 'emerging',
    name: 'Privacy & Data Rights',
    blurb: 'Data deletion, consumer privacy, PII brokers',
    globalPlayers: ['DeleteMe', 'Aura', 'Incogni'],
  },
  {
    id: 'frontier-digital-twin', tab: 'frontier', emoji: '👤', heat: 'frontier',
    name: 'Digital Twins & AI Personas',
    blurb: 'AI clones of people, companion AIs, virtual influencers',
    globalPlayers: ['Character.ai', 'Delphi', 'Replika'],
  },
  {
    id: 'frontier-longevity-clinic', tab: 'frontier', emoji: '🧪', heat: 'frontier',
    name: 'Longevity Clinics & Biomarker',
    blurb: 'Bryan Johnson-ification of health',
    globalPlayers: ['Function Health', 'Ezra', 'Prenuvo', 'Superpower'],
  },

  // ═══════════════════════════════════════════════════════════
  // TAB: BHARAT — India-first, Vernacular, Informal, Rural
  // ═══════════════════════════════════════════════════════════
  {
    id: 'bharat-rural-commerce', tab: 'bharat', emoji: '🛒', heat: 'emerging',
    name: 'Rural & Tier 3+ Commerce', parent: 'bharat',
    blurb: 'Reselling, social commerce, kirana tech',
    indianPlayers: ['Meesho', 'DealShare', 'ElasticRun', 'Jumbotail', 'Citykart'],
  },
  {
    id: 'bharat-vernacular', tab: 'bharat', emoji: '🗣️', heat: 'emerging',
    name: 'Vernacular AI & Content', parent: 'bharat',
    blurb: 'Indic LLMs, regional content, IVR AI',
    indianPlayers: ['Sarvam AI', 'Krutrim', 'Ola Krutrim', 'ShareChat', 'Josh', 'Kuku FM'],
  },
  {
    id: 'bharat-kirana', tab: 'bharat', emoji: '🏪', heat: 'emerging',
    name: 'Kirana & Small Retailer SaaS', parent: 'bharat',
    blurb: 'POS, credit, inventory, B2B supply to kiranas',
    indianPlayers: ['Khatabook', 'OkCredit', 'Dukaan', 'Dotpe', 'Apnaklub'],
  },
  {
    id: 'bharat-informal-workforce', tab: 'bharat', emoji: '🛠️', heat: 'emerging',
    name: 'Informal & Blue-Collar Workforce', parent: 'bharat',
    blurb: 'Job discovery, earned wage, identity, upskilling',
    indianPlayers: ['Apna', 'Vahan', 'WorkIndia', 'Refyne', 'Rozgar'],
  },
  {
    id: 'bharat-gig', tab: 'bharat', emoji: '🏍️', heat: 'emerging',
    name: 'Gig Worker Services', parent: 'bharat',
    blurb: 'Insurance, loans, tools, grievance for delivery/cab gig',
    indianPlayers: ['Refyne', 'Sarvagram', 'Walrus'],
  },
  {
    id: 'bharat-microinsurance', tab: 'bharat', emoji: '🧩', heat: 'emerging',
    name: 'Microinsurance & Inclusive Finance', parent: 'bharat',
    blurb: 'Tiny-ticket insurance, group savings, NBFC tech',
    indianPlayers: ['Riskcovry', 'Toffee', 'SarvaGram'],
  },
  {
    id: 'bharat-dpi', tab: 'bharat', emoji: '🧱', heat: 'emerging',
    name: 'DPI & Public Digital Rails', parent: 'bharat',
    blurb: 'Building on UPI, ONDC, DigiLocker, Account Aggregator',
    indianPlayers: ['Setu', 'Sahamati', 'Perfios', 'FinBox', 'ONDC ecosystem'],
  },
  {
    id: 'bharat-ondc', tab: 'bharat', emoji: '📡', heat: 'emerging',
    name: 'ONDC-Native Commerce', parent: 'bharat',
    blurb: 'ONDC buyer/seller apps, logistics nodes, niches',
    indianPlayers: ['Mystore', 'Sellerapp', 'ShopAlyst (seller)', 'Pincode (Paytm/Google style)'],
  },
  {
    id: 'bharat-agri-bharat', tab: 'bharat', emoji: '🌾', heat: 'emerging',
    name: 'Farmer-First Agritech', parent: 'bharat',
    blurb: 'Voice-first, Indic-UI, district-level agritech',
    indianPlayers: ['DeHaat', 'Cropin', 'Jai Kisan', 'Gramophone', 'Kisan Network'],
  },
  {
    id: 'bharat-edu-bharat', tab: 'bharat', emoji: '📕', heat: 'emerging',
    name: 'Bharat-First EdTech', parent: 'bharat',
    blurb: 'Vernacular edtech, affordable skilling, small-town tutors',
    indianPlayers: ['PhysicsWallah', 'Classplus', 'Teachmint', 'Entri', 'Testbook'],
  },
  {
    id: 'bharat-msme-credit', tab: 'bharat', emoji: '💳', heat: 'emerging',
    name: 'MSME & Small Business Credit', parent: 'bharat',
    blurb: 'Credit underwriting, invoice factoring, GST-based lending',
    indianPlayers: ['Lendingkart', 'Yubi', 'Progcap', 'Credflow', 'ePayLater'],
  },
];

export const INDUSTRIES_BY_TAB: Record<IndustryTab, Industry[]> = TABS.reduce((acc, tab) => {
  acc[tab.id] = INDUSTRIES.filter(i => i.tab === tab.id);
  return acc;
}, {} as Record<IndustryTab, Industry[]>);

export const INDUSTRY_BY_ID: Record<string, Industry> = INDUSTRIES.reduce((acc, i) => {
  acc[i.id] = i;
  return acc;
}, {} as Record<string, Industry>);
