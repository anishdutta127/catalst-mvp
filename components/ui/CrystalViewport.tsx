'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

export interface OrbDef {
  id: string;
  icon: string;
  colour: string;
  label: string;
}

interface CrystalViewportProps {
  allOrbs: OrbDef[];
  selectedOrbIds: string[]; // in selection order
  size?: number;
}

/**
 * CrystalViewport — the upper stage where the crystal forms.
 *
 * Visual stack (back to front):
 *   1. Dark radial vignette (sets focus center)
 *   2. Subtle trait radar (8-axis polygon) behind crystal — weights current selections
 *   3. Orbital ring — all 8 orbs arranged around center, rotating slowly
 *   4. Light trails from selected orbs → center
 *   5. Crystal — appears as selections complete:
 *        1 selected = vertex point
 *        2 selected = edge
 *        3 selected = triangle + facets spin
 *
 * Designed to sit in ~60% of activity zone. Orb dock goes BELOW this viewport.
 */
export function CrystalViewport({ allOrbs, selectedOrbIds, size = 320 }: CrystalViewportProps) {
  const count = selectedOrbIds.length;

  // Build orbital positions — 8 orbs in a ring
  const ringRadius = size * 0.42;
  const cx = size / 2;
  const cy = size / 2;

  const orbPositions = useMemo(
    () =>
      allOrbs.map((orb, i) => {
        const angle = (i / allOrbs.length) * Math.PI * 2 - Math.PI / 2;
        return {
          ...orb,
          angle,
          x: cx + Math.cos(angle) * ringRadius,
          y: cy + Math.sin(angle) * ringRadius,
        };
      }),
    [allOrbs, cx, cy, ringRadius],
  );

  // Triangle vertex positions for the 3 selected orbs (around center)
  const vertexDist = size * 0.15;
  const triangleVertices = useMemo(() => {
    const pts: { x: number; y: number }[] = [
      { x: cx, y: cy - vertexDist },
      { x: cx - vertexDist * 0.866, y: cy + vertexDist * 0.5 },
      { x: cx + vertexDist * 0.866, y: cy + vertexDist * 0.5 },
    ];
    return pts;
  }, [cx, cy, vertexDist]);

  const selectedColors = selectedOrbIds.map((id) => allOrbs.find((o) => o.id === id)?.colour || '#D4A843');
  const primaryColor = selectedColors[0] || '#D4A843';

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      data-testid="crystal-viewport"
    >
      {/* Dark radial vignette */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(12,14,18,0.85) 0%, rgba(12,14,18,0.5) 60%, rgba(12,14,18,0) 90%)`,
        }}
      />

      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Subtle background starfield */}
          <radialGradient id="cv-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Crystal facet gradient */}
          <linearGradient id="cv-facet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="50%" stopColor={primaryColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </linearGradient>

          <filter id="cv-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Starfield glow */}
        <circle cx={cx} cy={cy} r={size * 0.35} fill="url(#cv-bg)" />

        {/* Ring guide — faint circle connecting all orbs */}
        <circle
          cx={cx}
          cy={cy}
          r={ringRadius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
          strokeDasharray="3 6"
        />

        {/* 8-axis trait radar — subtle polygon, weights current selections */}
        {count > 0 && (
          <motion.polygon
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            points={orbPositions
              .map((pos) => {
                const isSelected = selectedOrbIds.includes(pos.id);
                const weight = isSelected ? 1 : 0.25;
                const px = cx + Math.cos(pos.angle) * ringRadius * 0.55 * weight;
                const py = cy + Math.sin(pos.angle) * ringRadius * 0.55 * weight;
                return `${px},${py}`;
              })
              .join(' ')}
            fill={primaryColor}
            opacity="0.15"
            stroke={primaryColor}
            strokeWidth="1"
          />
        )}

        {/* Light trails from selected orbs to center */}
        {orbPositions.map((pos) => {
          const selectedIdx = selectedOrbIds.indexOf(pos.id);
          if (selectedIdx < 0) return null;
          return (
            <motion.line
              key={`trail-${pos.id}`}
              x1={pos.x}
              y1={pos.y}
              x2={cx}
              y2={cy}
              stroke={pos.colour}
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 0.8, delay: selectedIdx * 0.15 }}
            />
          );
        })}

        {/* Orbital ring — all 8 orbs */}
        {orbPositions.map((pos) => {
          const isSelected = selectedOrbIds.includes(pos.id);
          const isFaded = count >= 3 && !isSelected;
          return (
            <motion.circle
              key={`ring-${pos.id}`}
              cx={pos.x}
              cy={pos.y}
              r={isSelected ? 12 : 6}
              fill={pos.colour}
              opacity={isFaded ? 0.15 : isSelected ? 0.9 : 0.5}
              animate={{
                r: isSelected ? [11, 14, 11] : 6,
                opacity: isFaded ? 0.15 : isSelected ? [0.7, 1, 0.7] : 0.5,
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              filter={isSelected ? 'url(#cv-glow)' : undefined}
            />
          );
        })}

        {/* CRYSTAL — grows with selections */}
        <AnimatePresence>
          {/* 1 selected: single glowing vertex at center */}
          {count === 1 && (
            <motion.circle
              key="v1"
              cx={cx}
              cy={cy}
              r={10}
              fill={selectedColors[0]}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0.9] }}
              transition={{ duration: 0.8 }}
              filter="url(#cv-glow)"
            />
          )}

          {/* 2 selected: edge connecting 2 vertices */}
          {count === 2 && (
            <>
              <motion.line
                key="edge"
                x1={triangleVertices[0].x}
                y1={triangleVertices[0].y}
                x2={triangleVertices[1].x}
                y2={triangleVertices[1].y}
                stroke={selectedColors[0]}
                strokeWidth="2.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7 }}
              />
              {triangleVertices.slice(0, 2).map((v, i) => (
                <motion.circle
                  key={`v2-${i}`}
                  cx={v.x}
                  cy={v.y}
                  r={10}
                  fill={selectedColors[i]}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  filter="url(#cv-glow)"
                />
              ))}
            </>
          )}

          {/* 3 selected: full triangle + facets + spin */}
          {count === 3 && (
            <motion.g
              key="v3"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [0.8, 1.1, 1],
                opacity: 1,
                rotate: [0, 360],
              }}
              transition={{
                scale: { duration: 0.8 },
                opacity: { duration: 0.4 },
                rotate: { duration: 18, repeat: Infinity, ease: 'linear' },
              }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              {/* Base triangle */}
              <polygon
                points={triangleVertices.map((v) => `${v.x},${v.y}`).join(' ')}
                fill="url(#cv-facet)"
                stroke={primaryColor}
                strokeWidth="1.5"
                opacity="0.7"
              />
              {/* Internal facet lines (3 from each vertex to center) */}
              {triangleVertices.map((v, i) => (
                <line
                  key={`facet-${i}`}
                  x1={v.x}
                  y1={v.y}
                  x2={cx}
                  y2={cy}
                  stroke="white"
                  strokeWidth="0.8"
                  opacity="0.4"
                />
              ))}
              {/* Vertex orbs */}
              {triangleVertices.map((v, i) => (
                <circle
                  key={`vtx-${i}`}
                  cx={v.x}
                  cy={v.y}
                  r={11}
                  fill={selectedColors[i]}
                  filter="url(#cv-glow)"
                />
              ))}
              {/* Pulsing core */}
              <motion.circle
                cx={cx}
                cy={cy}
                r={5}
                fill="white"
                animate={{
                  opacity: [0.4, 1, 0.4],
                  r: [4, 7, 4],
                }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* Center count label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {count === 0 && (
          <p className="text-[10px] font-mono text-ivory/30 uppercase tracking-widest">
            choose three essences
          </p>
        )}
      </div>
    </div>
  );
}
