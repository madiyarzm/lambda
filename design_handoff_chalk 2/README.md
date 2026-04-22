# Design Handoff: Chalk — Collaborative Coding Classroom

## Overview
This package contains high-fidelity HTML design prototypes for **Chalk**, a real-time collaborative Python coding classroom platform. The designs cover the full product: marketing landing page, teacher dashboard, student dashboard (gamified), classroom management, IDE editor, and submission review.

The goal is to **recreate these designs in your existing React + TypeScript + Tailwind CSS codebase** (the Lambda project), replacing the current frontend with these updated designs. Do not ship the HTML files directly — use them as pixel-accurate visual and behavioral references.

---

## Fidelity
**High-fidelity.** All screens are pixel-precise with final colors, typography, spacing, animations, and interactions. Recreate them as close as possible using your existing stack (React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide icons).

---

## Design Files
All files in this folder are **design references only**:

| File | Contains |
|------|----------|
| `Chalk.html` | Main entry point — open this in a browser to see the full prototype |
| `components.jsx` | Shared primitives: Logo, Avatar, Badge, Button, Card, Sidebar, PresenceBar + all mock data |
| `landing.jsx` | Animated landing page (Arc-style with scroll reveals) |
| `screens.jsx` | Teacher dashboard, Student dashboard (Steam-like), Classroom view, Submissions view |
| `editor.jsx` | Full IDE: chapter file tree, code editor, terminal, right panel, confetti, drawing board |

To view: open `Chalk.html` in a browser. Use the **Tweaks panel** (bottom-right ✦ button or toolbar) to switch between light/dark theme, student/teacher editor role, and jump to any screen.

---

## Brand & Design Tokens

### Brand
- **Name:** Chalk
- **Logo:** 4-pointed star/spark SVG mark in a rounded-9 indigo square (`oklch(0.52 0.26 265)`), wordmark in Plus Jakarta Sans 800
- **Tagline:** "Where code meets classroom."

### Colors
```css
/* Primary */
--indigo:       oklch(0.520 0.260 265);   /* #4f46e5 approx */
--indigo-hover: oklch(0.468 0.268 265);
--indigo-10:    oklch(0.960 0.048 265);   /* tint bg */
--indigo-20:    oklch(0.920 0.078 265);   /* tint border */

/* Semantic */
--mint:         oklch(0.720 0.155 162);   /* success / live / online */
--mint-10:      oklch(0.950 0.050 162);
--amber:        oklch(0.775 0.155 75);    /* warning / streak */
--amber-10:     oklch(0.960 0.045 75);
--rose:         oklch(0.650 0.178 15);    /* error / failed */
--rose-10:      oklch(0.960 0.040 15);

/* Light theme neutrals */
--bg:    oklch(0.990 0.007 265);   /* near-white, indigo-tinted */
--bg-2:  oklch(0.966 0.013 265);
--bg-3:  oklch(0.940 0.019 265);
--border:  oklch(0.882 0.022 265);
--border-2:oklch(0.820 0.030 265);
--text:    oklch(0.175 0.038 265);   /* near-black */
--text-2:  oklch(0.420 0.055 265);   /* secondary */
--text-3:  oklch(0.620 0.038 265);   /* tertiary/muted */

/* Dark theme overrides */
--bg:    oklch(0.130 0.038 265);
--bg-2:  oklch(0.168 0.048 265);
--bg-3:  oklch(0.210 0.055 265);
--border:  oklch(0.275 0.065 265);
--text:    oklch(0.960 0.012 265);
--text-2:  oklch(0.720 0.038 265);
--text-3:  oklch(0.510 0.038 265);

/* IDE / Editor surface (always dark regardless of theme) */
--editor-bg:      #0d1117
--editor-bg-2:    #080d14
--editor-bg-3:    #0a0f1a
--editor-border:  #1a2235
--editor-border-2:#2d3a52
--editor-text:    #e2e8f0
--editor-muted:   #475569
--editor-faint:   #334155
```

### Typography
```
Headings:   Plus Jakarta Sans, weights 700–800
Body:       Plus Jakarta Sans, weights 400–600
Code/mono:  DM Mono, weights 400–500
```

### Spacing / Radius
```
--r:    10px   (default card/button radius)
--r-lg: 16px   (larger cards)
--r-xl: 24px   (hero sections, modals)
Buttons: borderRadius 10–14px depending on size
```

### Shadows
```
--shadow-sm: 0 1px 4px oklch(0.52 0.26 265 / 0.06)
--shadow:    0 4px 16px oklch(0.52 0.26 265 / 0.10)
--shadow-lg: 0 12px 40px oklch(0.52 0.26 265 / 0.15)
```

---

## Screens & Components

### 1. Landing Page (`landing.jsx` → `LandingPage.tsx`)

**Layout:** Full-viewport sections, max-width 1280px centered, 56px horizontal padding.

**Sections (top to bottom):**

#### Nav
- Sticky, `backdrop-filter: blur(12px)`, border-bottom
- Left: `<ChalkLogo>`, Right: two buttons (secondary "Student sign-in" + primary "Start teaching →")

#### Hero Section (100vh)
- Background: 3 radial gradient orbs, animated with `@keyframes orbFloat` (8–12s alternate, translateY -30px)
- Grid: `1fr 1fr`, gap 80px, align-items center
- **Left column:**
  - Pill badge (indigo-10 bg, pulsing mint dot): "Real-time collaborative coding classroom"
  - `h1` 62px / 800 weight / -0.04em tracking, gradient text on second line: `linear-gradient(125deg, indigo, oklch(0.60 0.22 308))`
  - Body 18px / color text-2 / lineHeight 1.65
  - Two CTA buttons (primary lg + secondary lg), borderRadius 12px
  - Social proof strip: AvatarStack + "500+ students coding right now"
- **Right column:** `<HeroMockup>` — a dark browser window (`#0d1117`, borderRadius 16, shadow 40px) showing syntax-highlighted Python with 2 animated cursors. Cursors drift via `setInterval` every 1.8s. A "typing" animation appends chars to line 5 every 80ms.
- **Scroll indicator:** Animated mouse icon at bottom center.

**Entrance animations:** Use `IntersectionObserver` (threshold 0.12) for all non-hero sections. Hero animates on mount with 80ms delay. Each element uses `opacity 0→1` + `translateY 28px→0` with staggered `transition-delay` (0, 100ms, 200ms, 300ms, 400ms steps).

#### How It Works (4 cards grid)
- 4-col grid, gap 20px
- Each card: white bg, border, borderRadius 20, padding 28px
- Monospace number badge (40×40, borderRadius 12), title 15px/700, desc 13px/text-3
- Stagger reveal delay: 100ms steps

#### Live Collaboration Showcase
- `bg-2` background, 2-col grid
- Left: feature list with colored bullet dots
- Right: two dark cards showing presence avatars + activity bar chart

#### For Teachers / For Students
- 2-col grid, each card: `bg-2`, borderRadius 20, padding 36px
- Colored top-left badge, checkmark list, full-width CTA button

#### CTA Section
- `linear-gradient(135deg, indigo → oklch(0.48 0.27 265) → oklch(0.55 0.22 308))`
- White radial glow overlay
- White primary button + ghost secondary button
- Hover: `translateY(-2px)` on buttons

---

### 2. Sidebar Navigation (`components.jsx` → `Sidebar.tsx`)

**Width:** 220px, sticky, full-height, `bg` + right border.

**Structure (top to bottom):**
- Logo section (padding-bottom 18px, border-bottom)
- Nav items (2px gap): icon (SVG, 16×16) + label, active state: `indigo-10` bg + indigo text + 600 weight; hover: `bg-2`
- Flex spacer
- Role switcher: `bg-2` card with segmented control (teacher/student toggle, pill style with `bg-3` track)
- User row: Avatar (32px, pulse dot) + name + role

**Icons:** Use Lucide React equivalents for: Home, BookOpen, ClipboardCheck, Code, ArrowLeft.

---

### 3. Teacher Dashboard (`screens.jsx` → `TeacherDashboard.tsx`)

**Layout:** `bg-2` scroll container, 32px padding.

**Header:** h1 26px/800 greeting + date subtitle. Right: "+ New classroom" primary button.

**Stats row:** 4-col grid, gap 16px. Each card:
- `bg` + border + borderRadius r-lg + padding 22px
- Label 13px/text-3, icon 36×36 rounded-10 with color tint bg
- Value 32px/800/text, optional `<Badge type="live">` inline

**Classrooms grid:** 3-col, gap 16px. Each card (`<Card onClick>`):
- 46×46 rounded-14 colored icon block (initials in DM Mono)
- Live badge (top-right)
- Name 15px/700, code 12px/DM Mono/text-3
- Progress bar (h:4, bg-3 track, colored fill = active/total %)
- Footer: students count + assignments count

---

### 4. Student Dashboard — Steam-style (`screens.jsx` → `StudentDashboard.tsx`)

**Profile Hero (min-height 220px):**
- Background: customizable gradient (user-selected from shop)
- Overlay: subtle radial gradients + CSS grid pattern (`rgba(255,255,255,0.03)`, 40px cells)
- Avatar: 96px circle with colored border (frame cosmetic), level badge bottom-right (`--indigo`, 10px/800, "LV12")
- Username 24px/800/white, achievement emoji row
- XP bar: custom `<XpBar>` — white-on-transparent track, glow `box-shadow`, 320px max-width
- "✦ Customize" button: `rgba(255,255,255,0.12)` bg, white text, `backdrop-filter: blur(8px)`

**Cosmetics Shop (collapsible, `fadeIn` animation):**
- Tabs: Frames | Backgrounds
- **Frames:** 5 tiers (Default free, Bronze 100XP, Silver 250XP, Gold 500XP, Cosmic 1000XP). Each tile: 80px wide, shows mini avatar preview with the frame applied. Click to equip if XP ≥ cost.
- **Backgrounds:** 5 gradient presets priced in XP. Tile shows 44px gradient swatch.
- XP balance shown in header: `⬡ 2,847 XP`

**Stats grid (4-col):**
- XP (indigo), Lines Written (purple), Submissions (mint), Streak (amber)
- Each: value in accent color 28px/800, label, sub-note, background orb

**Achievements grid (4-col):**
- 8 badges: icon + name + rarity color border
- Locked: `opacity 0.45`, `filter: grayscale(1)`
- Unlocked: hover `scale(1.05)`
- Rarity colors: common `#94a3b8`, rare `#818cf8`, epic `oklch(0.60 0.22 308)`, legendary `#fbbf24`

**Activity heatmap:**
- Dark card (`#0d1117`), 15-week grid, 10×10px cells, gap 3px
- 5 color stops: transparent → `#1e3a5f` → `#1d4ed8` → `#3b82f6` → `#818cf8`

---

### 5. Classroom View (`screens.jsx` → `ClassroomView.tsx`)

**Header:** breadcrumb, classroom name + invite code chip (DM Mono), live badge. Tab bar: Students | Assignments.

**Students tab:** `<Card>` list. Each row: Avatar (36px, pulse if live) + name + current file + live/offline badge. Teacher sees "View editor" button on live students.

**Assignments tab:** Cards with title, due date, status badge. Teacher sees submission count + progress bar.

---

### 6. IDE Editor (`editor.jsx` → `EditorPage.tsx`)

**Overall layout:** Dark surface (`#0d1117`), 3-column, flexbox.

#### Top Bar (height 50px, `#080d14`)
- Back button → Classroom (ghost, hover bg `#1a2235`)
- Breadcrumb: Classroom › Assignment › filename
- PresenceBar (right-aligned): pulsing dot + "N live" + AvatarStack (overlapping, 26px)
- `✏ Draw` toggle button (active: `#818cf820` bg + `#818cf840` border + indigo text)
- `▶ Run` button: `#1a2235` bg, border `#2d3a52`, hover border indigo
- `⬆ Submit` button: indigo bg → `#0d2218` + mint text after submission
- All buttons: borderRadius 7px, Plus Jakarta Sans 12px/700

#### File Explorer (width 220px, `#0a0f1a`, right border `#1a2235`)
Tree structure:
```
📚 Chapter 1: Fundamentals
  ▶ Session 1 · Apr 14
  ▶ Session 2 · Apr 16
📚 Chapter 2: Functions
  ▼ Session 3 · Apr 21    ← open
    📄 worksheet.py       [shared] badge
    👤 alex.py
    👤 jordan.py
    👤 sam.py
    👤 maya.py
    👤 ethan.py
📚 Chapter 3: Data Structures
```
- Chapters toggle with animated `▶` arrow (rotate 90° when open)
- Sessions toggle the same way
- Active file: `#1e2a3a` bg
- `worksheet.py` has an indigo `[shared]` tag chip
- All hover: `#111827` bg

#### Code Editor (flex:1)
- Tabs bar: `#080d14`, DM Mono 11.5px, active: `#0d1117` bg + indigo bottom border
- Line numbers: 46px wide, `#080d14`, DM Mono 11.5px, active cursor lines in indigo
- Syntax highlighting (applied via `dangerouslySetInnerHTML` over a transparent `<textarea>`):
  - Keywords: `#818cf8` italic
  - Functions: `#34d399`
  - Strings: `#fbbf24`
  - Numbers: `#c084fc`
  - Comments: `#475569`
  - Default: `#e2e8f0`
- **Collaboration cursors:** 2px wide colored vertical line + floating name label above (9px/700, color matches user). Implement with absolute positioning on each line div.
- `<textarea>`: `color: transparent`, `caretColor: #e2e8f0`, syncs scroll to highlight layer

#### Terminal (height 200px, `#080d14`, border-top)
- Tabs: Output | Tests (uppercase 10.5px/700, active: indigo bottom border)
- "running…" pulse animation while executing
- Output colors: info `#818cf8`, ok `#34d399`, err `#f87171`, out `#94a3b8`
- Run: simulates output lines appearing 300ms apart
- Submit: 1.5s delay then shows 4 test results + score line

#### Right Panel (width 270px, `#080d14`, left border)
- **Students tab (teacher only):** List of users with live dot indicator, current line number
- **Submissions tab:** Per-submission rows (avatar, name, time, status badge, score%). Click to expand inline test results. Teacher sees all; student sees own only.

#### Confetti (`@keyframes confettiFall`)
On successful submit: 90 pieces fly from top. Shapes: circles, squares, rectangles. Colors: `#818cf8`, `#34d399`, `#f472b6`, `#fbbf24`, `#60a5fa`, `#fb923c`, `#a78bfa`. Random x position, size 5–14px, duration 1.2–2.6s, staggered delay 0–0.6s. Show centered popup card: "🎉 All tests passed! · 4/4 · Score: 100% · +200 XP" (white card, indigo border, `@keyframes popIn`).

#### Drawing Board (`@keyframes slideInRight`)
Toggle via `✏ Draw` button. Slides in from right as a 340×480px panel (or fullscreen overlay).
- Toolbar: tool selector (pen ✏ / eraser ◻) + 8 color swatches + range slider for brush size + Clear + fullscreen toggle + close
- Shared indicator bar: pulsing mint dot + "Session 3 · Apr 21 — shared with class" + presence avatars
- Canvas: HTML5 `<canvas>`, dark bg `#1a1f2e`, subtle CSS grid overlay (`rgba(255,255,255,0.02)`, 24px)
- Fullscreen: fixed overlay covering full viewport, canvas resizes to `window.innerWidth × (innerHeight - 80)`
- Drawing: `mousedown/mousemove/mouseup` with `ctx.lineTo` + `lineCap: round` + `lineJoin: round`
- Eraser: draws in `#1a1f2e` (background color) at 4× brush size

#### Status Bar (height 24px, `#060a10`)
DM Mono 10.5px: Due date · Python 3.12 · line count · N live collaborators · cursor position

---

### 7. Submissions View (`screens.jsx` → `SubmissionsPage.tsx`)

**Layout:** 2-column split. Left: 290px submission list. Right: detail panel.

**Left panel:** Each row: Avatar (34px) + name + time + status badge + score%. Active row: `indigo-10` bg + 3px indigo left border.

**Right panel:** Selected submission header (avatar 40px with ring, name, time, score %, badge). Code block: dark surface (`#0f1117`), syntax highlighted, line numbers. Test results card: ✓/✗ per test in DM Mono 12px.

---

## Interactions & Animations

### Key CSS Keyframes to implement
```css
@keyframes pulseDot    { /* scale + opacity pulse, 2s infinite */ }
@keyframes blink       { /* cursor blink, 1.2s infinite */ }
@keyframes orbFloat    { /* translateY -30px + scale 1.04, 8–12s alternate */ }
@keyframes scrollDot   { /* scroll indicator, 1.6s ease-in-out */ }
@keyframes confettiFall{ /* translateY 105vh + rotate 720deg, cubic-bezier */ }
@keyframes popIn       { /* scale 0.6→1.05→1 + opacity, 0.4s */ }
@keyframes slideInRight{ /* translateX 100%→0, 0.2s ease */ }
@keyframes fadeIn      { /* translateY 8px→0 + opacity, 0.18–0.2s */ }
```

### Scroll reveals
Use `IntersectionObserver` (threshold 0.12) to add a `.revealed` class to sections. Default state: `opacity: 0; transform: translateY(28px)`. Revealed: `opacity: 1; transform: none; transition: 0.7s ease`. Stagger children with `transition-delay`.

### Framer Motion candidates (already in your stack)
- Landing section entrances → `motion.div` with `initial/animate/whileInView`
- Confetti pieces → `AnimatePresence` + exit animations
- Drawing panel slide → `motion.div` with `x` animation
- Card hover lift → `whileHover={{ y: -2 }}`
- Submit button state change → `animate` on layout change

---

## XP & Gamification System

### XP Sources
| Action | XP |
|--------|----|
| Successful submission (100%) | +200 |
| Partial submission (per test passed) | +40 |
| Lines of code written | ~0.5/line |
| Daily login streak | +50/day |

### Level Thresholds (implement as a utility function)
| Level | Name | XP Required |
|-------|------|-------------|
| 1–3 | Novice | 0–299 |
| 4–6 | Apprentice | 300–999 |
| 7–9 | Coder | 1000–1999 |
| 10–12 | Developer | 2000–2999 |
| 13–15 | Engineer | 3000–4999 |
| 16–19 | Architect | 5000–9999 |
| 20 | Legend | 10000+ |

### Cosmetics to store in DB
Add a `cosmetics` JSONB column to the `users` table:
```json
{ "frame": "gold", "background": "cosmic", "equippedBadges": ["first","streak7","perfect10"] }
```

---

## Component Mapping (Design → Your Codebase)

| Design component | Implement as |
|-----------------|--------------|
| `<ChalkLogo>` | `components/Logo.tsx` |
| `<Avatar>` | `components/Avatar.tsx` (extend existing if any) |
| `<AvatarStack>` | `components/AvatarStack.tsx` |
| `<Badge>` | `components/Badge.tsx` |
| `<Btn>` | Extend existing button component |
| `<Card>` | `components/Card.tsx` |
| `<Sidebar>` | `components/layout/Sidebar.tsx` |
| `<PresenceBar>` | `components/collab/PresenceBar.tsx` |
| `<HeroMockup>` | `components/landing/AnimatedIDE.tsx` |
| `<FileTree>` | `components/editor/FileTree.tsx` |
| `<DrawingBoard>` | `components/editor/DrawingBoard.tsx` |
| `<Confetti>` | `components/Confetti.tsx` |
| `<XpBar>` | `components/student/XpBar.tsx` |
| `<ActivityGraph>` | `components/student/ActivityGraph.tsx` |

---

## New API Endpoints Needed

The designs imply these additional backend endpoints beyond what already exists:

```
GET  /api/v1/users/me/cosmetics           — fetch equipped cosmetics
PUT  /api/v1/users/me/cosmetics           — update equipped frame/background
GET  /api/v1/users/me/xp                  — total XP, level, achievements
GET  /api/v1/users/me/activity            — contribution heatmap data (last 90 days)
GET  /api/v1/assignments/{id}/cursors     — active cursor positions (WebSocket preferred)
GET  /api/v1/classrooms/{id}/sessions     — chapter/session tree for file explorer
POST /api/v1/sessions/{id}/worksheet      — create/update shared worksheet
```

---

## Tailwind Config Additions

Add to `tailwind.config.ts`:
```ts
theme: {
  extend: {
    colors: {
      indigo: { DEFAULT: 'oklch(0.52 0.26 265)', 10: 'oklch(0.96 0.048 265)', 20: 'oklch(0.92 0.078 265)' },
      mint:   { DEFAULT: 'oklch(0.72 0.155 162)', 10: 'oklch(0.95 0.05 162)' },
      chalk: {
        bg:      'oklch(0.990 0.007 265)',
        'bg-2':  'oklch(0.966 0.013 265)',
        'bg-3':  'oklch(0.940 0.019 265)',
        border:  'oklch(0.882 0.022 265)',
        text:    'oklch(0.175 0.038 265)',
        'text-2':'oklch(0.420 0.055 265)',
        'text-3':'oklch(0.620 0.038 265)',
      }
    },
    fontFamily: {
      sans: ['Plus Jakarta Sans', 'sans-serif'],
      mono: ['DM Mono', 'monospace'],
    },
    borderRadius: {
      DEFAULT: '10px', lg: '16px', xl: '24px'
    },
    keyframes: {
      pulseDot:     { '0%,100%': { opacity:'1', transform:'scale(1)' }, '50%': { opacity:'0.6', transform:'scale(0.85)' } },
      orbFloat:     { '0%': { transform:'translateY(0) scale(1)' }, '100%': { transform:'translateY(-30px) scale(1.04)' } },
      confettiFall: { '0%': { transform:'translateY(0) rotate(0deg)', opacity:'1' }, '100%': { transform:'translateY(105vh) rotate(720deg)', opacity:'0' } },
      popIn:        { '0%': { transform:'scale(0.6)', opacity:'0' }, '60%': { transform:'scale(1.05)', opacity:'1' }, '100%': { transform:'scale(1)', opacity:'1' } },
      slideInRight: { from:{ transform:'translateX(100%)', opacity:'0' }, to:{ transform:'translateX(0)', opacity:'1' } },
    },
    animation: {
      'pulse-dot':  'pulseDot 2s infinite',
      'orb-float':  'orbFloat 8s ease-in-out infinite alternate',
      'confetti':   'confettiFall 1.8s cubic-bezier(.25,.46,.45,.94) forwards',
      'pop-in':     'popIn 0.4s ease forwards',
      'slide-right':'slideInRight 0.2s ease',
    }
  }
}
```

---

## Google Fonts
Add to your HTML `<head>` or import in your CSS entry:
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
```

---

## Implementation Order (Recommended)

1. **Design tokens** — add colors, fonts, keyframes to Tailwind config
2. **Shared primitives** — Logo, Avatar, AvatarStack, Badge, Button, Card
3. **Layout shell** — Sidebar + top bar
4. **Landing page** — static first, then add scroll animations
5. **Teacher dashboard** — stat cards + classroom grid
6. **Student dashboard** — profile hero + stats (no shop yet)
7. **Classroom view** — student list + assignment tabs
8. **Editor** — file tree + syntax editor + terminal + right panel
9. **Confetti + drawing** — add as enhancements
10. **Cosmetics shop** — add XP system + shop last (requires new DB columns)
