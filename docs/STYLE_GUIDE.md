# DSTS Challenge Runs Style Guide

This style guide documents the UI/UX design system used in the DSTS Challenge Runs application, inspired by the visual aesthetics of Digimon Story Time Stranger (DSTS).

## Design Philosophy

The design aims for a **modern JRPG-inspired interface** with a dark, clean, and readable appearance. The UI emphasizes:

- Clean panel layouts with translucent backgrounds
- High contrast text for readability
- Subtle animations and transitions
- Pillish buttons with glow effects
- Consistent spacing and typography

## Color Palette

### Core Colors

| Color Name | Light Mode | Dark Mode | Usage |
|------------|------------|-----------|-------|
| Background | `#f8fafc` | `#050712` | Main page background |
| Foreground | `#1e293b` | `#f4f7ff` | Primary text color |
| Surface | `#ffffff` | `rgba(8, 14, 32, 0.80)` | Card/panel backgrounds |
| Muted | `#64748b` | `#a4b0d8` | Secondary text |
| Border | `#e2e8f0` | `#414c7a` | Card borders, dividers |
| Input | `#f1f5f9` | `#151a32` | Form input backgrounds |

### Accent Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary (Blue-Teal) | `#2ec3f6` / `#33b6f0` | Primary actions, links, highlights |
| Secondary (Soft Teal) | `#40e0d0` | Secondary actions, success states |
| Accent (Magenta) | `#f05bc8` | Special highlights, emphasis |

### Tailwind Color Classes

```ts
// tailwind.config.js
colors: {
  primary: {
    50: '#e6f9fd',
    500: '#2ec3f6',
    // ... full scale available
  },
  secondary: {
    400: '#40e0d0',
    // ... full scale available
  },
  accent: {
    500: '#f05bc8',
    // ... full scale available
  },
  surface: {
    DEFAULT: '#050712',
    100: '#151a32',
    200: '#0f1834',
    // ... for dark mode surfaces
  },
  muted: {
    DEFAULT: '#a4b0d8',
    50: '#f4f7ff',
    // ... for text colors
  }
}
```

## Typography

### Font Families

```css
font-family: 'Noto Sans', 'Open Sans', system-ui, sans-serif; /* Main */
font-family: 'Roboto Mono', monospace; /* Code/Labels */
```

### Font Sizes

| Size | Value | Usage |
|------|-------|-------|
| xs | 13px | Labels, tiny text |
| sm | 14px | Small text, descriptions |
| base | 15px | Body text (default) |
| lg | 17px | Emphasized text |
| xl | 19px | Subheadings |
| 2xl | 24px | Card headings |
| 3xl | 30px | Section headings |
| 4xl | 36px | Page titles |

## Components

### Card/Panel

Cards use translucent backgrounds with subtle borders and deep shadows:

```svelte
<div class="rounded-md border border-border-light dark:border-border 
            bg-white dark:bg-[rgba(8,14,32,0.80)] 
            backdrop-blur-sm p-6 
            shadow-panel-light dark:shadow-panel">
  <!-- Content -->
</div>
```

Key properties:
- Border radius: `0.4rem` (rounded-md)
- Border: `1px solid` with theme-appropriate color
- Background: White in light mode, translucent dark navy in dark mode
- Backdrop blur for depth
- Shadow: Lighter in light mode, deeper (0 18px 40px) in dark mode

### Buttons

#### Primary Button
```svelte
<button class="px-4 py-2 rounded-full font-medium
               bg-primary-500 hover:bg-primary-600 
               text-white dark:text-surface-500
               shadow-[0_4px_12px_rgba(46,195,246,0.3)]
               hover:shadow-[0_6px_16px_rgba(46,195,246,0.4)]">
  Action
</button>
```

#### Secondary Button
```svelte
<button class="px-4 py-2 rounded-full font-medium
               bg-secondary-400 hover:bg-secondary-500 
               text-surface-500
               shadow-[0_4px_12px_rgba(64,224,208,0.3)]">
  Secondary
</button>
```

#### Outline Button
```svelte
<button class="px-4 py-2 rounded-full font-medium
               bg-transparent hover:bg-primary-500/10 
               text-primary-500 
               border border-primary-500">
  Outline
</button>
```

### Theme Toggle

The header includes a theme toggle button:

```svelte
<button class="p-2 rounded-md border transition-colors">
  <!-- Sun icon for dark → light -->
  <!-- Moon icon for light → dark -->
</button>
```

## Spacing

Use Tailwind's default spacing scale:

| Class | Value | Usage |
|-------|-------|-------|
| p-2 | 0.5rem | Icon button padding |
| p-4 | 1rem | Small card padding |
| p-6 | 1.5rem | Standard card padding |
| gap-4 | 1rem | Grid gaps |
| gap-6 | 1.5rem | Section spacing |
| mb-4 | 1rem | Component margins |
| mb-6 | 1.5rem | Section margins |

## Shadows

### Light Mode
```css
box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); /* shadow-panel-light */
```

### Dark Mode
```css
box-shadow: 0 18px 40px rgba(0, 0, 0, 0.75); /* shadow-panel */
```

### Glow Effect (Primary)
```css
box-shadow: 0 0 20px rgba(46, 195, 246, 0.3); /* shadow-glow */
```

## Dark Mode Implementation

The app uses Tailwind's class-based dark mode (`darkMode: 'class'`).

### Theme Store

Located at `$lib/stores/theme.ts`:

```ts
import { themeStore } from '$lib/stores/theme';

// Toggle theme
themeStore.toggle();

// Set specific theme
themeStore.set('dark'); // 'light' | 'dark' | 'system'

// Get current effective theme
const theme = themeStore.getEffectiveTheme(); // 'light' | 'dark'
```

### CSS Variables

Theme colors are also available as CSS custom properties:

```css
:root {
  --color-background: #f8fafc;
  --color-foreground: #1e293b;
  /* ... */
}

.dark {
  --color-background: #050712;
  --color-foreground: #f4f7ff;
  /* ... */
}
```

## Accessibility

- All interactive elements have proper focus states
- Color contrast meets WCAG guidelines
- Theme toggle has aria-label for screen readers
- Semantic HTML structure maintained

## Animation & Transitions

Use subtle transitions for hover states and theme changes:

```css
transition-colors /* For color changes */
transition-all    /* For multiple property changes */
```

Duration: Tailwind's default `150ms` for most transitions, `200ms` for theme changes.

## Best Practices

1. **Always use dark mode variants**: Apply `dark:` prefix for theme-aware styling
2. **Prefer theme colors**: Use `text-gray-900 dark:text-muted-50` instead of hardcoded values
3. **Test both modes**: Verify designs work in both light and dark themes
4. **Use component classes**: Leverage `Card`, `Button` components for consistency
5. **Maintain contrast**: Ensure text remains readable on all backgrounds
