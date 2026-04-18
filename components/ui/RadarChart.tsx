'use client';

import { motion } from 'framer-motion';

/**
 * 6-axis radar chart for the founder card. Axes: SCALE, IMPACT, CRAFT,
 * EMPATHY, VISION, GRIT. All scores 0-100.
 *
 * The polygon draws in via pathLength 0→1 over 900ms on mount. Data dots
 * appear at each vertex. Three concentric hexagonal guides at 33/66/100%.
 */

export interface RadarScores {
  scale: number;
  impact: number;
  craft: number;
  empathy: number;
  vision: number;
  grit: number;
}

export function RadarChart({ scores, color, size = 200 }: {
  scores: RadarScores;
  color: string;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  // 6 axes, starting from top, going clockwise
  const axes = ['scale', 'impact', 'craft', 'empathy', 'vision', 'grit'] as const;
  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / 6;

  // Guide hexagons at 33/66/100
  const ring = (pct: number) =>
    axes.map((_, i) => {
      const a = angleFor(i);
      return `${cx + Math.cos(a) * r * pct},${cy + Math.sin(a) * r * pct}`;
    }).join(' ');

  // Data polygon
  const dataPoints = axes.map((k, i) => {
    const v = Math.max(0, Math.min(100, scores[k])) / 100;
    const a = angleFor(i);
    return { x: cx + Math.cos(a) * r * v, y: cy + Math.sin(a) * r * v };
  });
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const labelFor = (i: number, label: string) => {
    const a = angleFor(i);
    const lr = r + 14;
    return {
      x: cx + Math.cos(a) * lr,
      y: cy + Math.sin(a) * lr,
      label,
    };
  };
  const labels = ['SCALE', 'IMPACT', 'CRAFT', 'EMPATHY', 'VISION', 'GRIT'].map((l, i) => labelFor(i, l));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {/* Guide rings */}
      {[0.33, 0.66, 1].map((pct) => (
        <polygon
          key={pct}
          points={ring(pct)}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
        />
      ))}

      {/* Axes */}
      {axes.map((_, i) => {
        const a = angleFor(i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(a) * r}
            y2={cy + Math.sin(a) * r}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon — draws in */}
      <motion.polygon
        points={dataPath}
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={1.75}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />

      {/* Vertex dots */}
      {dataPoints.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.9 + i * 0.05, type: 'spring', stiffness: 300 }}
        />
      ))}

      {/* Labels */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fill="rgba(255,255,255,0.65)"
          style={{ letterSpacing: '0.12em', fontWeight: 600 }}
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}
