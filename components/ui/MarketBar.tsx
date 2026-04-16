'use client';

interface MarketBarProps {
  tam: string;   // e.g. "$45B"
  sam: string;   // e.g. "$8B"
  som: string;   // e.g. "$400M"
}

/**
 * MarketBar — TAM → SAM → SOM as nested horizontal bars.
 * Gold color scheme, dark background, minimal labels.
 */
export function MarketBar({ tam, sam, som }: MarketBarProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono text-ivory/40 uppercase tracking-wider">Market size</p>
      {/* TAM */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-ivory/50 mb-0.5">
          <span>TAM</span><span className="text-gold/70">{tam}</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gold/30 rounded-full" style={{ width: '100%' }} />
        </div>
      </div>
      {/* SAM */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-ivory/50 mb-0.5">
          <span>SAM</span><span className="text-gold/70">{sam}</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gold/50 rounded-full" style={{ width: '60%' }} />
        </div>
      </div>
      {/* SOM */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-ivory/50 mb-0.5">
          <span>SOM</span><span className="text-gold">{som}</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gold rounded-full" style={{ width: '25%' }} />
        </div>
      </div>
    </div>
  );
}
