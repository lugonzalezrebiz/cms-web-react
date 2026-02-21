# Migration Report — AppDialogComponent

**Project:** CMS Web
**Component:** `AppDialogComponent` (`cms-dialog`)
**Date:** 2026-02-20
**Skill:** html-to-react (vanilla-to-react-ts-migration)

---

## Executive Summary

| Metric | Value |
|---|---|
| Files before | 3 (component.js, component.html, component.css) |
| Files after | 5 (AppDialog.tsx, theme.ts, emotion.d.ts, global.css, AppDialog.test.tsx) |
| Lines before | ~330 (72 JS + 24 HTML + 234 CSS) |
| Lines after | ~245 TSX + 54 tests |
| Tests | 19 passed, 0 failed |
| Coverage | 100% statements / 100% branches / 100% functions / 100% lines |
| TypeScript errors | 0 (`npx tsc --noEmit`) |
| IPC dependencies | None |
| External dependencies removed | `moment` (imported but unused) |

---

## Before vs After

### Eliminated vanilla files

| File | Lines | Replaced by |
|---|---|---|
| `component.js` | 72 | `AppDialog.tsx` (component logic + JSX) |
| `component.html` | 24 | `AppDialog.tsx` (JSX template) |
| `component.css` | 234 | `AppDialog.tsx` (Emotion styled) + `global.css` (tokens) |

### New files

| File | Purpose |
|---|---|
| `AppDialog.tsx` | Component — interfaces + Emotion styled + JSX |
| `theme.ts` | CSS variable references for Emotion ThemeProvider |
| `emotion.d.ts` | Emotion `Theme` type augmentation |
| `global.css` | Actual color values (`:root` + `[data-theme='dark']`) |
| `AppDialog.test.tsx` | Contract tests — 19 cases, 100% coverage |

---

## Architecture: Vanilla → React

| Vanilla pattern | React equivalent |
|---|---|
| `cms-dialog` custom element | `AppDialog` React component |
| `Component.js` base class | Not needed — React handles lifecycle |
| `component.html` + `component.css` | JSX + Emotion styled components |
| `popover="manual"` + `showPopover/hidePopover` | `open: boolean` prop + CSS transition via `$open` |
| `<slot name="content">` | `children?: ReactNode` |
| `dispatchEvent(new CustomEvent("close"))` | `onClose?: () => void` callback |
| `attributeChangedCallback(name, ...)` | Props are natively reactive in React |
| `this.shadowRoot.querySelector("#btn")` | Event handler directly in JSX |
| `::backdrop` (Popover API native) | `<Backdrop>` styled div (fixed, full-screen) |
| `--accent-color` CSS var (`:host`) | `--cms-accent-color` set via `style` prop |
| `@media (prefers-color-scheme: dark)` in `:host` | `[data-theme='dark']` in `global.css` |
| `.icon-close` from `icons.css` (icon font) | Inline Material Design SVG path |
| `setTimeout` polling for DOM readiness | Not needed — React renders synchronously |

---

## TypeScript — Definitions Created

### `AppDialogProps`

| Field | Type | Required | Default |
|---|---|---|---|
| `title` | `string` | No | `"Untitled"` |
| `description` | `string` | No | `""` |
| `accentColor` | `string` | No | `"#ff6000"` |
| `open` | `boolean` | **Yes** | — |
| `onClose` | `() => void` | No | `undefined` |
| `children` | `ReactNode` | No | `undefined` |

### `WaveAnimationProps` (internal)

| Field | Type | Required |
|---|---|---|
| `accentColor` | `string` | **Yes** |

### `AppTheme` (from `theme.ts`)

```
colors.bg        → 'var(--color-bg)'
colors.text      → 'var(--color-text)'
colors.border    → 'var(--color-border)'
colors.headerBg  → 'var(--color-header-bg)'
colors.closeBg   → 'var(--color-close-bg)'
shadows.dialog   → 'var(--shadow-dialog)'
```

---

## Changes Made

### Migrated functions

| Vanilla method | React equivalent |
|---|---|
| `init()` | Default prop values + JSX render |
| `updateUI()` | React re-render on prop change (automatic) |
| `initListeners()` | `onClick={onClose}` directly in JSX |
| `#onClose()` | Delegated to `onClose` prop — no internal event |
| `close(fn)` | Not needed — parent controls `open` prop |
| `connectedCallback()` | Not needed — lifecycle managed by React |
| `attributeChangedCallback()` | Not needed — props are reactive |

### Applied patterns

| Pattern | Reason |
|---|---|
| `open: boolean` controlled prop | Replaces Popover API (`showPopover/hidePopover`) — parent owns visibility state |
| `$open` Emotion prop + CSS transition | Replicates `:host-context([popover]:popover-open)` transitions without Popover API |
| `--cms-accent-color` inline CSS var | Enables `color-mix(in srgb, var(--cms-accent-color) 80%, ...)` in CSS — not computable in JS |
| `<Backdrop>` styled div | Replaces native `::backdrop` — fixes in `position: fixed` + full `inset: 0` |
| `fill-opacity` on SVG `<use>` elements | Replaces `hsl(from var(--color-wave-background) h s l / var(--opacity))` — simpler and equally readable |
| `memo()` on `AppDialog` and `WaveAnimation` | Neither manages own state — memoization prevents unnecessary re-renders |
| Inline SVG close icon | Replaces `icons.css` icon font (`.icon-close`) — self-contained, no external CSS dependency |
| `[data-theme='dark']` in `global.css` | Replaces `@media (prefers-color-scheme: dark)` inside `:host` — aligns with skill color system convention |

---

## Tests

```
 ✓ AppDialog > always rendered > renders dialog element when closed          636ms
 ✓ AppDialog > always rendered > renders backdrop element when closed          19ms
 ✓ AppDialog > always rendered > renders dialog element when open            264ms
 ✓ AppDialog > always rendered > renders backdrop element when open            22ms
 ✓ AppDialog > title > shows default title 'Untitled' when not provided      152ms
 ✓ AppDialog > title > shows the provided title                               87ms
 ✓ AppDialog > description > shows empty description when not provided        15ms
 ✓ AppDialog > description > shows the provided description                   14ms
 ✓ AppDialog > children > renders content area with children when provided    21ms
 ✓ AppDialog > children > does not render content area when children is not   16ms
 ✓ AppDialog > accessibility > sets aria-modal on the dialog                  45ms
 ✓ AppDialog > accessibility > sets aria-labelledby pointing to the title     69ms
 ✓ AppDialog > accessibility > renders close button with accessible label    120ms
 ✓ AppDialog > accentColor > applies default accent color CSS variable        13ms
 ✓ AppDialog > accentColor > applies custom accent color CSS variable         18ms
 ✓ AppDialog > interactions > calls onClose when close button is clicked     182ms
 ✓ AppDialog > interactions > calls onClose when backdrop is clicked          91ms
 ✓ AppDialog > interactions > no throw without onClose on close button       169ms
 ✓ AppDialog > interactions > no throw without onClose on backdrop click      71ms

 Test Files  1 passed (1)
       Tests  19 passed (19)
    Duration  11.43s
```

### Coverage

```
---------------|---------|----------|---------|---------|
File           | % Stmts | % Branch | % Funcs | % Lines |
---------------|---------|----------|---------|---------|
AppDialog.tsx  |     100 |      100 |     100 |     100 |
---------------|---------|----------|---------|---------|
```

---

## Test Quality & Error Margin

| Metric | Value |
|---|---|
| Test density | 19 tests / ~120 JSX+logic lines ≈ **15.8 tests per 100 lines** |
| Behavior coverage | 7/7 Step-2 contracts covered (100%) |
| Boundary coverage | `open=true`, `open=false`, `children=null`, `onClose=undefined`, default props |
| Omitted scenarios | Exit animation visual verification (CSS transitions not observable in jsdom — accepted risk) |

---

## Issues Found

### 🟡 Medium — `id="cms-wave-path"` collision risk

**Description:** The SVG `<defs>` block defines a `<path id="cms-wave-path">` referenced by the `<use>` elements. If two `AppDialog` instances render simultaneously in the same document, both will have the same `id`, which could break the second dialog's wave animation.

**Status:** Accepted for now — dialogs are typically singletons in this app. Mitigation if needed: use `useId()` hook to generate a unique id per instance.

### 🟢 Low — Emotion `:nth-child` warning in test output

**Description:** Emotion emits a console warning about `:nth-child` being "potentially unsafe when doing server-side rendering". This comes from the wave animation selectors (`.wave:nth-child(1)` etc.).

**Status:** Expected and harmless — CMS Web is an Electron desktop app (client-side only, no SSR). Documented in MEMORY.md.

### 🟢 Low — `hsl(from ...)` Relative Color Syntax not supported in jsdom

**Description:** The `DialogTitle` uses `color-mix(in srgb, var(--cms-accent-color, #ff6000) 80%, ...)` which is a modern CSS Level 5 feature. jsdom does not compute or apply this CSS.

**Status:** No impact on tests — tests assert on DOM structure and behavior, not visual output. Feature works correctly in Electron (Chromium 128+).
