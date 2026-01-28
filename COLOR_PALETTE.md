# 🎨 Color Palette & Design System

## Design Philosophy

Our design system focuses on creating an **engaging, accessible, and modern** learning experience. We use vibrant colors to maintain energy and motivation while ensuring readability and WCAG AA compliance.

## Color Palette

### Primary Colors

```css
--primary-50: #EEF2FF;   /* Lightest blue - backgrounds */
--primary-100: #E0E7FF;  /* Light blue - hover states */
--primary-200: #C7D2FE;  /* Soft blue - borders */
--primary-300: #A5B4FC;  /* Medium blue - inactive states */
--primary-400: #818CF8;  /* Vibrant blue - interactive elements */
--primary-500: #6366F1;  /* Main brand color */
--primary-600: #4F46E5;  /* Hover state for buttons */
--primary-700: #4338CA;  /* Active state */
--primary-800: #3730A3;  /* Dark blue - text on light */
--primary-900: #312E81;  /* Darkest blue - headers */
```

**Usage**: Navigation, CTAs, links, progress indicators

### Secondary Colors (Success/Completion)

```css
--success-50: #F0FDF4;
--success-100: #DCFCE7;
--success-500: #22C55E;  /* Completion checkmarks */
--success-600: #16A34A;  /* Hover state */
--success-700: #15803D;  /* Active state */
```

**Usage**: Completed lessons, achievements, positive feedback

### Accent Colors

#### Reading Module
```css
--reading-primary: #EC4899;    /* Pink */
--reading-light: #FCE7F3;
--reading-dark: #BE185D;
```

#### Listening Module
```css
--listening-primary: #8B5CF6;  /* Purple */
--listening-light: #EDE9FE;
--listening-dark: #6D28D9;
```

#### Writing Module
```css
--writing-primary: #F59E0B;    /* Amber */
--writing-light: #FEF3C7;
--writing-dark: #D97706;
```

#### Speaking Module
```css
--speaking-primary: #06B6D4;   /* Cyan */
--speaking-light: #CFFAFE;
--speaking-dark: #0891B2;
```

### Neutral Colors

```css
--gray-50: #F9FAFB;      /* Page background */
--gray-100: #F3F4F6;     /* Card backgrounds */
--gray-200: #E5E7EB;     /* Borders */
--gray-300: #D1D5DB;     /* Disabled states */
--gray-400: #9CA3AF;     /* Placeholder text */
--gray-500: #6B7280;     /* Secondary text */
--gray-600: #4B5563;     /* Body text */
--gray-700: #374151;     /* Headings */
--gray-800: #1F2937;     /* Dark text */
--gray-900: #111827;     /* Almost black */
```

### Semantic Colors

#### Error/Warning
```css
--error-50: #FEF2F2;
--error-500: #EF4444;     /* Error messages */
--error-600: #DC2626;     /* Error hover */
--warning-500: #F59E0B;   /* Warnings */
--warning-600: #D97706;
```

#### Info
```css
--info-50: #EFF6FF;
--info-500: #3B82F6;      /* Info messages */
--info-600: #2563EB;
```

## Typography

### Font Families

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-display: 'Poppins', 'Inter', sans-serif;  /* Headings */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;  /* Code */
```

### Font Sizes

```css
--text-xs: 0.75rem;      /* 12px - Labels, captions */
--text-sm: 0.875rem;     /* 14px - Body text small */
--text-base: 1rem;       /* 16px - Body text */
--text-lg: 1.125rem;     /* 18px - Large body */
--text-xl: 1.25rem;      /* 20px - Small headings */
--text-2xl: 1.5rem;      /* 24px - Section headings */
--text-3xl: 1.875rem;    /* 30px - Page headings */
--text-4xl: 2.25rem;     /* 36px - Hero headings */
--text-5xl: 3rem;        /* 48px - Large hero */
```

### Font Weights

```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Line Heights

```css
--leading-tight: 1.25;    /* Headings */
--leading-snug: 1.375;    /* Subheadings */
--leading-normal: 1.5;    /* Body text */
--leading-relaxed: 1.625; /* Large text blocks */
--leading-loose: 2;       /* Spaced content */
```

## Spacing System

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

## Border Radius

```css
--radius-sm: 0.25rem;    /* 4px - Small elements */
--radius-md: 0.5rem;     /* 8px - Buttons, inputs */
--radius-lg: 0.75rem;    /* 12px - Cards */
--radius-xl: 1rem;       /* 16px - Large cards */
--radius-2xl: 1.5rem;    /* 24px - Hero sections */
--radius-full: 9999px;   /* Pills, avatars */
```

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

## Animation

```css
--transition-fast: 150ms ease-in-out;
--transition-base: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;
--transition-slower: 500ms ease-in-out;
```

### Animation Presets

```css
/* Hover lift effect */
.hover-lift {
  transition: transform var(--transition-base);
}
.hover-lift:hover {
  transform: translateY(-2px);
}

/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale bounce */
@keyframes scaleBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

## Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large */
```

## Usage Examples

### Module Cards
- Background: `var(--gray-100)`
- Border: `var(--gray-200)`
- Hover: `var(--gray-50)` background + `var(--shadow-md)`
- Icon background: Module-specific color (light variant)
- Icon color: Module-specific color (primary variant)

### Buttons

#### Primary Button
```css
background: var(--primary-500);
color: white;
border-radius: var(--radius-md);
padding: var(--space-3) var(--space-6);
font-weight: var(--font-semibold);
transition: var(--transition-base);

&:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

#### Secondary Button
```css
background: white;
color: var(--primary-600);
border: 2px solid var(--primary-200);
```

### Progress Bars
- Track: `var(--gray-200)`
- Fill: Gradient from module color to lighter variant
- Height: `8px` or `var(--space-2)`
- Border radius: `var(--radius-full)`

## Accessibility

- All color combinations meet WCAG AA standards (4.5:1 contrast ratio minimum)
- Interactive elements have clear focus states
- Error states include both color and icons
- Motion respects `prefers-reduced-motion` media query

## Implementation

All design tokens are defined in `/frontend/src/styles/tokens.css` and can be imported into any CSS module:

```css
@import '../styles/tokens.css';

.myComponent {
  background: var(--primary-500);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}
```

---

**Note**: This design system is a living document. Propose changes via pull requests with visual examples.
