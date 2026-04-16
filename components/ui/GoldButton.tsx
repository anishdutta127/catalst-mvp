'use client';

import { type ReactNode } from 'react';

interface GoldButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function GoldButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
}: GoldButtonProps) {
  const base = 'px-8 py-3 rounded-full font-semibold transition-all duration-200 cursor-pointer';
  const variants = {
    primary: disabled
      ? 'bg-gold/30 text-ivory/40 cursor-not-allowed'
      : 'bg-gold text-dark hover:bg-gold/90 hover:shadow-[0_0_8px_rgba(212,168,67,0.3)]',
    secondary: disabled
      ? 'border border-gold/20 text-ivory/30 cursor-not-allowed'
      : 'border border-gold/40 text-gold hover:border-gold/60 hover:bg-gold/10',
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
