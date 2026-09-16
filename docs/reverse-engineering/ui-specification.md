# VRSOC Phase 00 — UI Specification & Visual Design System

## 1. Design Philosophy & Visual Tokens

The VRSOC interface is engineered as an ultra-premium, dark-mode cybersecurity command center with glassmorphism, subtle micro-animations, and high-contrast telemetry indicators.

### 1.1 Color Palette Tokens

```css
:root {
  /* Brand Core Colors */
  --vr-bg: #0A0A0A;                  /* Main application canvas background */
  --vr-card: #161616;                /* Card & panel background fill */
  --vr-card-hover: #1C1C1C;          /* Card interactive hover fill */
  --vr-primary-dark: #5B0A0A;        /* Deep Blood Burgundy (Brand mark) */
  --vr-primary: #B71C1C;             /* Crimson Red */
  --vr-accent: #E53935;              /* Vibrant Red Accent / Primary CTAs */
  --vr-accent-hover: #D32F2F;        /* CTA Hover state */

  /* Surface & Border Glass Effects */
  --vr-border-subtle: rgba(255, 255, 255, 0.05);
  --vr-border-card: rgba(255, 255, 255, 0.08);
  --vr-border-focus: rgba(229, 57, 53, 0.5);

  /* Typography Colors */
  --vr-text-primary: #FFFFFF;
  --vr-text-secondary: rgba(255, 255, 255, 0.7);
  --vr-text-muted: rgba(255, 255, 255, 0.4);
  --vr-text-faint: rgba(255, 255, 255, 0.2);

  /* Status & Severity Color Matrix */
  --vr-severity-critical: #EF4444;    /* Critical Red */
  --vr-severity-high: #F97316;        /* High Orange */
  --vr-severity-medium: #F59E0B;      /* Medium Amber */
  --vr-severity-low: #3B82F6;         /* Low Blue */
  --vr-severity-info: #06B6D4;        /* Info Cyan */

  --vr-status-success: #22C55E;       /* Online / Healthy Green */
  --vr-status-warning: #EAB308;       /* Warning Yellow */
  --vr-status-error: #EF4444;         /* Error / Offline Red */
}
```

---

### 1.2 Glassmorphism & Shadow Utilities

- **Glass Card Class (`.glass`)**:
  ```css
  .glass {
    background: rgba(22, 22, 22, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  .glass-hover:hover {
    background: rgba(28, 28, 28, 0.85);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }
  ```

---

### 1.3 Severity Badge Utility Classes

| Severity | Tailwind Composite Classes |
|---|---|
| **Critical** | `bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-semibold uppercase px-2 py-0.5 rounded` |
| **High** | `bg-orange-500/15 text-orange-400 border border-orange-500/30 text-[10px] font-semibold uppercase px-2 py-0.5 rounded` |
| **Medium** | `bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-semibold uppercase px-2 py-0.5 rounded` |
| **Low** | `bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-semibold uppercase px-2 py-0.5 rounded` |

---

### 1.4 Typography Hierarchy

- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Code / Telemetry Font**: JetBrains Mono, Fira Code, Menlo, Consolas, monospace.
- **Scale**:
  - `Display / Page Title`: `24px` (`text-2xl`), `font-bold` (`700`), `tracking-tight`, color `#FFFFFF`
  - `Section / Card Header`: `16px` (`text-base`) or `14px` (`text-sm`), `font-semibold` (`600`), color `#FFFFFF`
  - `Subtitles & Helpers`: `12px` (`text-xs`) or `14px` (`text-sm`), `font-normal`, color `rgba(255, 255, 255, 0.4)`
  - `Table Data & Form Inputs`: `13px` or `14px`, color `rgba(255, 255, 255, 0.9)`
  - `Badges, Chips, Metadata, Timestamps`: `10px` or `11px`, `font-mono`, `uppercase`, `tracking-wider`

---

### 1.5 Spacing & Component Dimensions

- **Sidebar Width**: `240px` (desktop), collapsed to `0px` with overlay drawer on mobile.
- **Topbar Height**: `64px` (`4rem` / `h-16`), fixed at top with `backdrop-blur-md`.
- **Card Padding**: Standard `p-5` (`20px`), compact `p-3` (`12px`), metric card `p-4` (`16px`).
- **Card Border Radius**: `rounded-xl` (`12px`) or `rounded-lg` (`8px`).
- **Button Heights**: Standard `h-9` (`36px`), Large `h-11` (`44px`), Small `h-8` (`32px`).
- **Transitions**: `transition-all duration-200 ease-in-out` on all interactive states.
