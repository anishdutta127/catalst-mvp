# Catalst Design System

Single source of truth for all visual decisions. Every component references these tokens.

## Colors

### Core Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--dark` | `#0C0E12` | Primary background |
| `--dark-surface` | `#14171E` | Card/panel surfaces |
| `--gold` | `#D4A843` | Primary accent, CTAs, selections |
| `--ivory` | `#FAF3E0` | Primary text on dark |
| `--ivory-muted` | `rgba(250,243,224,0.6)` | Secondary text |
| `--teal` | `#00D8B9` | Secondary accent, Pip |
| `--error` | `#E85D5D` | Error states |
| `--success` | `#5DE8A0` | Success states |

### House Colors

| House | Token | Hex |
|-------|-------|-----|
| Architects | `--house-architects` | `#D4A843` |
| Vanguards | `--house-vanguards` | `#C41E3A` |
| Alchemists | `--house-alchemists` | `#2853A1` |
| Pathfinders | `--house-pathfinders` | `#2E8B57` |

## Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-display` | `'Playfair Display', serif` | Headings, wordmark, ceremony text |
| `--font-body` | `'Inter', sans-serif` | Body text, UI elements |
| `--font-mono` | `'JetBrains Mono', monospace` | Data, scores, technical labels |

### Scale

| Level | Size | Weight | Font |
|-------|------|--------|------|
| Display | 32px / 2rem | 700 | Display |
| H1 | 24px / 1.5rem | 600 | Display |
| H2 | 20px / 1.25rem | 600 | Display |
| H3 | 16px / 1rem | 600 | Body |
| Body | 16px / 1rem | 400 | Body |
| Small | 14px / 0.875rem | 400 | Body |
| Caption | 12px / 0.75rem | 400 | Body |

Minimum body text: 16px. Never smaller on mobile (iOS zoom prevention).

## Spacing

4px base grid.

| Token | Value |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |

## Border Radii

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements, chips |
| `--radius-md` | 8px | Cards, panels |
| `--radius-lg` | 16px | Bottom sheets, modals |
| `--radius-full` | 9999px | Pills, orbs, avatars |

## Motion

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Exits, fades, dissolves |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Enters, bounces, reveals |
| `--duration-fast` | 200ms | Micro-interactions, hovers |
| `--duration-normal` | 300ms | Screen transitions, fades |
| `--duration-slow` | 500ms | Ceremony reveals, Forge phases |

### Reduced Motion

When `prefers-reduced-motion: reduce`:
- Disable word-by-word streaming (show text instantly)
- Disable background crossfade (hard cut)
- Disable selection dissolve animations
- Keep layout transitions (opacity only, no transforms)

## Surfaces

Cards and panels use **opaque dark surfaces**, not glass-morphism.

```css
/* Standard card */
background: var(--dark-surface);    /* #14171E */
border: 1px solid rgba(255,255,255,0.1);
border-radius: var(--radius-md);    /* 8px */

/* NO backdrop-blur. NO glass-morphism. */
```

## Layout

### Grid System

```
.journey-shell {
  display: grid;
  grid-template-rows: auto minmax(15dvh, 20dvh) 1fr auto auto;
  grid-template-areas:
    "header"
    "dialogue"
    "activity"
    "pip"
    "cta";
  height: 100dvh;
}
```

### Breakpoints

| Breakpoint | Content Width | Notes |
|-----------|--------------|-------|
| Mobile (< 640px) | 100% - 32px padding | Header 36px, single column |
| Tablet/Desktop (>= 640px) | max 720px centered | Header 48px, multi-column where appropriate |

### Zone Specs

| Zone | Mobile Height | Desktop Height |
|------|--------------|----------------|
| Header | 36px | 48px |
| Dialogue | 80px - 15dvh | 100px - 20dvh |
| Activity | flex (1fr) | flex (1fr) |
| Pip | auto (40px when visible) | auto (40px when visible) |
| CTA | 56px | 56px |

## Accessibility

- Touch targets: 44px minimum
- Body text contrast: ivory on dark = 15:1
- Gold on dark contrast: 8:1
- Muted text: verify >= 4.5:1
- `aria-live="polite"` on dialogue strip
- `prefers-reduced-motion` respected
- Keyboard navigable on all selection screens

## Colour Temperature Arc

The journey progresses from cool mystery to warm dawn:

| Screens | Temperature | Palette Emphasis |
|---------|-------------|-----------------|
| S00-S03 | Cool | Dark blues, silver, teal accents |
| S04-S07 | Warming | Amber entering, teal receding |
| S08 | Fire | Forge orange/gold, peak warmth |
| S09-S11 | Dawn | Warm gold, ivory, house accent colors |

## Visual Direction

Locked to Midjourney Bible Style B: cinematic concept art, prestige dark fantasy botanical garden. Backgrounds provide all visual richness. UI elements are minimal, opaque, and stay out of the way.
