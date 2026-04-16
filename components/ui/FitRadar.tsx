'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

interface FitRadarProps {
  /** User's fit scores per dimension (0-100) */
  scores: {
    skill_fit: number;
    market_timing: number;
    capital_efficiency: number;
    execution_ease: number;
    passion_alignment: number;
  };
}

const LABELS: Record<string, string> = {
  skill_fit: 'Skill Fit',
  market_timing: 'Market Timing',
  capital_efficiency: 'Capital Efficiency',
  execution_ease: 'Execution Ease',
  passion_alignment: 'Passion Alignment',
};

/**
 * FitRadar — 5-axis radar chart showing personal fit.
 * Gold filled polygon for user, faint outline for average.
 * Dark background, minimal labels.
 */
export function FitRadar({ scores }: FitRadarProps) {
  const data = Object.entries(scores).map(([key, value]) => ({
    subject: LABELS[key] || key,
    user: value,
    average: 55, // baseline "average founder"
  }));

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(250,243,224,0.4)', fontSize: 10 }} />
          <Radar name="Average" dataKey="average" stroke="rgba(255,255,255,0.2)" fill="rgba(255,255,255,0.05)" />
          <Radar name="You" dataKey="user" stroke="#D4A843" fill="#D4A843" fillOpacity={0.2} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
