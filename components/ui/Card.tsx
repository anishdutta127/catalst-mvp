'use client';

import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Card — opaque dark surface. No glass-morphism.
 * Uses #14171E background with subtle white border per DESIGN.md.
 */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-dark-surface border border-white/10 rounded-lg px-4 py-3 ${className}`}>
      {children}
    </div>
  );
}
