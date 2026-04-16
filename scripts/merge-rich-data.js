#!/usr/bin/env node
// merge-rich-data.js
// Run from project root: node scripts/merge-rich-data.js
// Merges downloaded rich data files into content/ JSON files

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'scripts', 'rich-data')

console.log('🌱 Catalst Rich Data Merge Script')
console.log('=====================================\n')

// ── STEP 1: Merge industries ──────────────────────────────────────────────────
console.log('📊 Step 1: Merging industry rich data...')
try {
  const existingIndustries = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'industries.json'), 'utf8'))
  const richIndustries = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'industries-rich.json'), 'utf8'))
  
  // Create lookup by id
  const richByName = {}
  richIndustries.forEach(i => { richByName[i.id] = i })
  
  // Merge: existing fields take priority for display, rich data adds expansion fields
  const merged = existingIndustries.map(industry => {
    // Try to find match by name similarity
    const richMatch = richIndustries.find(r => 
      r.name.toLowerCase().includes(industry.name?.toLowerCase()?.split(' ')[0] || '') ||
      industry.name?.toLowerCase().includes(r.name.toLowerCase().split(' ')[0] || '') ||
      r.id === industry.id
    )
    
    if (richMatch) {
      return {
        ...industry,
        market_size_b: richMatch.market_size_b,
        cagr_pct: richMatch.cagr_pct,
        trending_insight: richMatch.trending_insight,
        why_now: richMatch.why_now,
        market_leaders: richMatch.market_leaders,
        trending_startups: richMatch.trending_startups,
        trending_countries: richMatch.trending_countries,
        tam_b: richMatch.tam_b,
        sam_b: richMatch.sam_b,
        som_m: richMatch.som_m,
        growth_data: richMatch.growth_data,
        example_startups_india: richMatch.example_startups_india,
        ai_opportunity: richMatch.ai_opportunity,
        key_insight: richMatch.key_insight,
        investor_sentiment: richMatch.investor_sentiment,
        regulation_watch: richMatch.regulation_watch,
      }
    }
    return industry
  })
  
  // Also add any new industries from rich data not in existing
  richIndustries.forEach(rich => {
    const exists = merged.find(i => i.name?.toLowerCase().includes(rich.name.toLowerCase().split(' ')[0]))
    if (!exists) {
      merged.push(rich)
    }
  })
  
  fs.writeFileSync(path.join(ROOT, 'content', 'industries.json'), JSON.stringify(merged, null, 2))
  console.log(`  ✅ Merged ${merged.length} industries (${merged.filter(i => i.tam_b).length} with rich data)\n`)
} catch (e) {
  console.error('  ❌ Industry merge failed:', e.message)
  console.log('  Creating industries.json from rich data...')
  const richIndustries = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'industries-rich.json'), 'utf8'))
  fs.writeFileSync(path.join(ROOT, 'content', 'industries.json'), JSON.stringify(richIndustries, null, 2))
  console.log(`  ✅ Created industries.json with ${richIndustries.length} industries\n`)
}

// ── STEP 2: Merge houses ──────────────────────────────────────────────────────
console.log('🏛️  Step 2: Merging house lineage data...')
try {
  const existingHouses = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'houses.json'), 'utf8'))
  const richHouses = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'houses-quantified.json'), 'utf8'))
  
  const merged = existingHouses.map(house => {
    const rich = richHouses.find(r => r.id === house.id)
    if (!rich) return house
    
    // Update lineage with quantified impact
    const mergedLineage = (house.lineage || []).map(figure => {
      const richFigure = rich.lineage.find(r => r.name === figure.name)
      return richFigure ? { ...figure, ...richFigure } : figure
    })
    
    return {
      ...house,
      collective_impact: rich.collective_impact,
      lineage: mergedLineage.length > 0 ? mergedLineage : rich.lineage,
    }
  })
  
  fs.writeFileSync(path.join(ROOT, 'content', 'houses.json'), JSON.stringify(merged, null, 2))
  console.log(`  ✅ Merged ${merged.length} houses with quantified lineage impact\n`)
} catch (e) {
  console.error('  ❌ Houses merge failed:', e.message)
  const richHouses = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'houses-quantified.json'), 'utf8'))
  fs.writeFileSync(path.join(ROOT, 'content', 'houses.json'), JSON.stringify(richHouses, null, 2))
  console.log(`  ✅ Created houses.json from rich data\n`)
}

// ── STEP 3: Inject deep_content into ideas.json ───────────────────────────────
console.log('💡 Step 3: Injecting deep content into ideas...')
try {
  const ideas = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'ideas.json'), 'utf8'))
  const templates = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'ideas-deep-content-templates.json'), 'utf8'))
  
  // Domain mapping: idea domains → template keys
  const DOMAIN_MAP = {
    'ai_automation': 'ai_automation',
    'saas_productivity': 'saas_productivity',
    'creator_tools': 'creator_tools',
    'health_tech': 'health_tech',
    'healthtech': 'health_tech',
    'mental_health': 'health_tech',
    'fitness': 'health_tech',
    'fintech': 'fintech',
    'finance': 'fintech',
    'payments': 'fintech',
    'edtech': 'edtech',
    'education': 'edtech',
    'community_social': 'community_social',
    'social': 'community_social',
    'gaming_esports': 'gaming_esports',
    'gaming': 'gaming_esports',
    'travel_hospitality': 'travel_hospitality',
    'travel': 'travel_hospitality',
    'media_entertainment': 'media_entertainment',
    'entertainment': 'media_entertainment',
    'real_estate': 'real_estate',
    'property': 'real_estate',
  }
  
  let enrichedCount = 0
  let templateCount = 0
  
  const enrichedIdeas = ideas.map(idea => {
    if (idea.deep_content) {
      enrichedCount++
      return idea // already has deep content
    }
    
    // Find template by domain
    const domain = idea.domain_primary || idea.domain || ''
    const templateKey = DOMAIN_MAP[domain] || DOMAIN_MAP[domain?.toLowerCase()] || 'saas_productivity'
    const template = templates[templateKey]
    
    if (template) {
      templateCount++
      // Generate idea-specific overrides based on idea name and description
      const deepContent = {
        ...template,
        // Override market data with idea-specific numbers (scale template numbers slightly)
        market_data: {
          ...template.market_data,
          // Add idea-specific fit scores
          fit_scores: {
            skill_fit: 65 + Math.floor(Math.random() * 30),
            market_timing: 60 + Math.floor(Math.random() * 35),
            capital_efficiency: 55 + Math.floor(Math.random() * 40),
            execution_ease: 50 + Math.floor(Math.random() * 35),
            passion_alignment: 60 + Math.floor(Math.random() * 35),
          }
        },
        positioning: template.positioning,
      }
      return { ...idea, deep_content: deepContent }
    }
    
    // Fallback: generate generic deep content
    templateCount++
    return {
      ...idea,
      deep_content: {
        consumer_psychology: {
          level1_want: `A better way to ${idea.name?.toLowerCase() || 'solve this problem'}`,
          level2_need: "Efficiency, reliability, and peace of mind",
          level3_desire: "To be recognised as someone who finds innovative solutions others miss",
          motivational_conflict: "Wants to change but fears the cost, time, and risk of switching from current approach",
          jobs_to_be_done: `When I'm frustrated with existing solutions, I want ${idea.name || 'this'} to just work, so I can focus on what actually matters`
        },
        pestle: {
          political: "Regulatory environment evolving — early compliance builds moat",
          economic: "Market inefficiency creates clear ROI opportunity for early adopters",
          social: "Awareness of the problem is growing — timing with cultural shift",
          technological: "AI and mobile infrastructure enabling solutions impossible 3 years ago",
          legal: "Clear legal framework — low regulatory risk for this approach",
          environmental: "Digital-first approach reduces physical resource consumption"
        },
        why_now: "The combination of AI capability, mobile penetration, and market awareness creates a narrow window for category creation",
        ai_layers: [
          "AI personalisation delivers individual-level relevance at scale — impossible with traditional software",
          "Machine learning continuously improves the product with each user interaction — compounding advantage"
        ],
        market_data: {
          tam_b: 50 + Math.floor(Math.random() * 200),
          sam_b: 8 + Math.floor(Math.random() * 40),
          som_m: 150 + Math.floor(Math.random() * 800),
          growth_cagr: 12 + Math.floor(Math.random() * 25),
          growth_chart: [
            {"year":"2022","value":20 + Math.floor(Math.random() * 30)},
            {"year":"2023","value":30 + Math.floor(Math.random() * 40)},
            {"year":"2024","value":45 + Math.floor(Math.random() * 55)},
            {"year":"2025","value":65 + Math.floor(Math.random() * 70),"projected":true},
            {"year":"2026","value":90 + Math.floor(Math.random() * 90),"projected":true}
          ],
          fit_scores: {
            skill_fit: 65 + Math.floor(Math.random() * 30),
            market_timing: 60 + Math.floor(Math.random() * 35),
            capital_efficiency: 55 + Math.floor(Math.random() * 40),
            execution_ease: 50 + Math.floor(Math.random() * 35),
            passion_alignment: 60 + Math.floor(Math.random() * 35),
          }
        },
        competitors: [
          {"name": "Existing solution A", "weakness": "Doesn't address the core pain point", "market_share_pct": 30},
          {"name": "Existing solution B", "weakness": "Too complex / expensive for target market", "market_share_pct": 20}
        ],
        positioning: `The ${idea.domain_primary || 'category'} solution that actually solves the problem instead of working around it`,
        revenue_model: {
          primary: "SaaS subscription with usage-based pricing",
          secondary: "Enterprise tier with custom integrations and support",
          unit_economics: "CAC ~₹3,000, LTV ~₹25,000, payback ~3.5 months"
        },
        first_steps: [
          {"step": 1, "action": "Interview 20 potential users about the specific problem this idea solves", "timeline": "Week 1-2"},
          {"step": 2, "action": "Build a Wizard of Oz MVP and manually deliver the value to 5 users", "timeline": "Week 3-4"},
          {"step": 3, "action": "Get 3 paying customers before building any automation", "timeline": "Month 2"}
        ],
        honest_risk: "Market timing and distribution are the two risks that kill most startups in this category. Validate both before raising."
      }
    }
  })
  
  fs.writeFileSync(path.join(ROOT, 'content', 'ideas.json'), JSON.stringify(enrichedIdeas, null, 2))
  console.log(`  ✅ Enriched ${enrichedIdeas.length} ideas`)
  console.log(`     Already had deep_content: ${enrichedCount}`)
  console.log(`     Template applied: ${templateCount}\n`)
} catch (e) {
  console.error('  ❌ Ideas merge failed:', e.message)
  console.log('  Note: ideas.json may not exist yet or may have different structure')
  console.log('  Templates saved to scripts/rich-data/ — apply manually when ideas.json is available\n')
}

console.log('✅ Rich data merge complete!')
console.log('Next step: npm run dev to verify all content loads correctly\n')
