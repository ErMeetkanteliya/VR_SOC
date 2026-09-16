# VRSOC Phase 00 — Component Inventory

## 1. Reusable VRSOC UI Component Library

To achieve faithful visual parity, the target frontend will implement a standardized, reusable component system mirroring Base44 patterns.

---

### 1.1 Shell & Layout Components

| Component Name | Base44 Mapping | Props & Slots | Visual Specs |
|---|---|---|---|
| `AppShell` | `poe` | `children`, `sidebarContent`, `topbarContent` | Full-height layout (`flex h-screen bg-[#0A0A0A] overflow-hidden`). |
| `Sidebar` | `rde` renderer | `currentPath`, `navGroups`, `isCollapsed`, `onToggle` | Sticky left 240px container, glass finish, active route indicator with red left border. |
| `Topbar` | Topbar inside `poe` | `breadcrumbs`, `user`, `notificationsCount`, `onSearchClick` | Fixed 64px height, blurred glass, breadcrumbs flex container, profile menu. |
| `CommandPalette` | `CommandDialog` | `isOpen`, `onClose`, `onSelectAction` | Centered modal with search input, keyboard navigation (`Up`/`Down`/`Enter`), grouped shortcuts. |

---

### 1.2 Data Display & Card Components

| Component Name | Base44 Mapping | Props & Slots | Visual Specs |
|---|---|---|---|
| `GlassCard` | `mg` / `.glass` | `title`, `subtitle`, `actionSlot`, `children` | Rounded-xl (12px), background `#161616` (75% opacity), 1px border `rgba(255,255,255,0.06)`, backdrop-blur. |
| `MetricWidget` | Metric card in `dNe`/`vOe` | `label`, `value`, `change`, `isPositive`, `icon`, `color` | Compact glass card, 10px uppercase label, 24px font-bold value, trend indicator pill. |
| `DataTable` | Table in `YNe`/`QNe`/`hOe` | `columns`, `data`, `loading`, `emptyMessage`, `onRowClick` | Dark header with subtle border, alternating row hover (`hover:bg-white/[0.02]`), monospace numbers. |
| `SeverityBadge` | `ia` / `MI` | `severity` (`critical` \| `high` \| `medium` \| `low`) | Rounded pill with colored border, 15% alpha background fill, 10px bold text. |
| `StatusBadge` | Status pills in `YNe` | `status` (`online` \| `offline` \| `warning` \| `pending`) | Pulse dot indicator + capitalized status text. |
| `LogViewer` | `hOe` log container | `logs`, `highlightTerms`, `onSelectLog` | Monospace code block, timestamp column in cyan/muted, syntax colored log fields. |

---

### 1.3 Interactive & Action Components

| Component Name | Base44 Mapping | Props & Slots | Visual Specs |
|---|---|---|---|
| `ActionButton` | `Me` | `variant` (`default` \| `destructive` \| `outline` \| `ghost`), `size`, `loading` | Styled button with smooth hover scale and active pulse. |
| `SearchInput` | `pt` + icon | `value`, `onChange`, `placeholder` | Inset icon, dark background (`bg-white/5`), subtle border (`border-white/10`), focus ring. |
| `DrawerSheet` | `Fi` / `gi` | `isOpen`, `onClose`, `title`, `children` | Slide-in right panel (480px width), blurred backdrop, close icon, action footer. |
| `ConfirmModal` | Modal dialog in `bDe`/`_De` | `isOpen`, `onConfirm`, `onCancel`, `title`, `description` | Centered dialog, dark surface, cancel button (ghost), confirm button (red accent). |
| `TabGroup` | `$K` / `$2` / `Gf` | `tabs`, `activeTab`, `onTabChange` | Tab list with pill active background (`bg-white/10 text-white`), smooth indicator slide. |
| `LiveTerminal` | `PDe` execution stream | `events`, `autoScroll`, `onClear` | Dark slate terminal background (`#090D16`), streaming lines with timestamp badges. |
