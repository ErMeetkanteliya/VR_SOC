# VRSOC Phase 00 — Responsive Behavior & Viewport Breakpoints

## 1. Breakpoint Definitions & Grid Rules

VRSOC employs standard Tailwind CSS breakpoints:
- `sm`: `640px`
- `md`: `768px`
- `lg`: `1024px`
- `xl`: `1280px`
- `2xl`: `1536px`

---

## 2. Component Adaptations by Viewport

### 2.1 Desktop & Ultrawide (>= 1280px)
- **Sidebar**: Fixed 240px width with full icon + label display, categorized headers.
- **Top Metrics Grid**: 4 columns (`grid grid-cols-4 gap-4`).
- **Charts Row**: 2 side-by-side columns (`grid grid-cols-2 gap-4`).
- **MITRE Matrix**: Full 12-column horizontal scrollable matrix grid.
- **Data Tables**: All columns visible (Hostname, IP, OS, CPU, RAM, Disk, Last Seen, Actions).

### 2.2 Laptop (1024px - 1279px)
- **Sidebar**: Remains docked at 240px or compact 64px icon-only rail.
- **Top Metrics Grid**: 2x2 grid (`grid-cols-2 lg:grid-cols-4`).
- **Charts Row**: Stacks or fits side-by-side with compressed chart margins.
- **Data Tables**: Secondary columns (e.g. OS build version) collapsed or hidden behind expand row.

### 2.3 Tablet (768px - 1023px)
- **Sidebar**: Hidden by default; toggled via hamburger menu button in topbar into a slide-over sheet drawer (`w-72`).
- **Top Metrics Grid**: 2 columns (`grid-cols-2 gap-3`).
- **Charts**: Single column stack (`grid-cols-1`).
- **Tables**: Horizontal scrolling enabled with sticky action column.
- **Visual Playbook Builder**: Touch pan/zoom enabled with mini-map overview.

### 2.4 Mobile (< 768px)
- **Sidebar**: Off-canvas slide-out drawer with backdrop blur overlay.
- **Topbar**: Compact header with logo mark, title truncated, hamburger icon, search icon (expands full screen), and profile avatar.
- **Top Metrics Grid**: 2 columns compact or 1 column carousel (`grid-cols-2 gap-2` with `text-lg` numbers).
- **Cards & Feeds**: Tables convert to card stacks with badge headers and stacked metadata.
- **Modals & Drawers**: Full-screen bottom sheets (`h-full` or `rounded-t-2xl bottom-0`).
- **AI Assistant**: Chat message input fixed to bottom with mobile virtual keyboard safe area adjustments.
