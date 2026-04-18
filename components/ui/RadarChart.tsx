'use client';

/**
 * components/ui/RadarChart.tsx — 6-axis founder radar.
 *
 * Custom SVG implementation (no recharts dep here) because we need full
 * control over the guide hexagons, axis labels, vertex dots, and the
 * draw-in motion. Recharts' RadarChart doesn't expose pathLength on the
 * data polygon.
 *
 * Axes: SCALE, IMPACT, CRAFT, EMPATHY, VISION, GRIT.
 * All scores 0–100; values outside the range are clamped.
 */

import { motion } from 'framer-motion';

export interface RadarScores {
  scale: number;
  impact: number;
  craft: number;
  empathy: number;
  vision: number;
  grit: number;
}

export interface RadarChartProps {
  scores: RadarScores;
  color: string;
  size?: number;
}

// Clockwise from 12 o'clock. Axis order locks the visual signature —
// if you rearrange, every export of the founder card changes shape.
const AXES: { key: keyof RadarScores; label: string }[] = [
  { key: 'scale', label: 'SCALE' },
  { key: 'impact', label: 'IMPACT' },
  { key: 'craft', label: 'CRAFT' },
  { key: 'empathy', label: 'EMPATHY' },
  { key: 'vision', label: 'VISION' },
  { key: 'grit', label: 'GRIT' },
];

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export function RadarChart({ scores, color, size = 200 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  // Leave room for labels that render outside the chart's data polygon.
  const outerR = size * 0.36;
  const labelR = size * 0.45;

  // Precompute vertex positions — 60° apart starting at -90° (12 o'clock).
  const angles = AXES.map((_, i) => (-90 + i * 60) * (Math.PI / 180));

  const guidePolygon = (radiusFactor: number) =>
    angles
      .map((a) => {
        const x = cx + Math.cos(a) * outerR * radiusFactor;
        const y = cy + Math.sin(a) * outerR * radiusFactor;
        return `${x},${y}`;
      })
      .join(' ');

  const dataPoints = AXES.map((axis, i) => {
    const v = clamp(scores[axis.key]) / 100;
    return {
      x: cx + Math.cos(angles[i]) * outerR * v,
      y: cy + Math.sin(angles[i]) * outerR * v,
      labelX: cx + Math.cos(angles[i]) * labelR,
      labelY: cy + Math.sin(angles[i]) * labelR,
      anchor: (() => {
        // Align label text-anchor to whichever side of the chart it sits on.
        const dx = Math.cos(angles[i]);
        if (Math.abs(dx) < 0.15) return 'middle';
        return dx > 0 ? 'start' : 'end';
      })() as 'start' | 'middle' | 'end',
      label: axis.label,
    };
  });

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="overflow-visible"
      aria-hidden
    >
      {/* Guide hexagons at 33%, 66%, 100% — thin white strokes. */}
      {[0.33, 0.66, 1.0].map((f) => (
        <polygon
          key={`guide-${f}`}
          points={guidePolygon(f)}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
      ))}

      {/* Axis spokes — faint radial lines from center to each vertex. */}
      {dataPoints.map((p, i) => {
        const x2 = cx + Math.cos(angles[i]) * outerR;
        const y2 = cy + Math.sin(angles[i]) * outerR;
        return (
          <line
            key={`spoke-${i}`}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.75"
          />
        );
      })}

      {/* Data polygon — draws in via pathLength. */}
      <motion.polygon
        points={dataPolygon}
        fill={color}
        fillOpacity={0.3}
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ pathLength: { duration: 0.8, ease: 'easeOut' }, opacity: { duration: 0.4 } }}
      />

      {/* Vertex dots — solid color, sit on the data polygon tips. */}
      {dataPoints.map((p, i) => (
        <motion.circle
          key={`dot-${i}`}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
        />
      ))}

      {/* Axis labels at the tips of each 100% guide. */}
      {dataPoints.map((p, i) => (
        <text
          key={`lbl-${i}`}
          x={p.labelX}
          y={p.labelY}
          textAnchor={p.anchor}
          dominantBaseline="middle"
          fontSize="9"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          letterSpacing="0.14em"
          fill="rgba(245,240,232,0.65)"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}
