# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # tsc -b && vite build
npm run lint      # ESLint check (flat config v9+)
npm run preview   # Preview the production build
```

No test runner is configured.

## Architecture

**Stack:** React 19 + TypeScript 5.9 (strict) + Vite + MUI v6 + Emotion. No Redux — state is managed with plain React hooks and props.

**Routing:** React Router v7. Two pages: `/login` and `/dashboard`. Everything else redirects to `/login`.

**Layout shell:** `RenderPage` wraps authenticated pages with a top `Header` and a collapsible sidebar `Menu`. The main content area is rendered via `Content`.

**Theme:** Centralised in `src/theme.ts` — defines the MUI theme, a large named-colour palette (primary orange `#fb5103`), font families (Fira Sans / Inter / Outfit), and custom MUI shadows/overrides.

**Timeline system** (most complex part of the codebase):
- `TimeLine.tsx` — outer shell; camera selector, nav tabs, imperative handle via `forwardRef`
- `TimelineBody.tsx` — core canvas/row rendering; delegates to sub-components and hooks
- `src/components/timeline/` — co-located sub-components (ruler, rows, marker, dialogs) and hooks (`useTimelineBodyState`, `useTimelineKeyboard`, `usePopover`)
- `TimelineRenderer.ts` — low-level canvas renderer (ported from `migrate/component.js`); instantiated inside a `useEffect`, exposed via `TimeLineHandle.renderer`
- `src/migrate/moment.ts` — mutable dayjs shim that mirrors the moment.js API; used internally by `TimelineRenderer`

**UI component conventions:**
- Shared primitives live in `src/components/` (`Button`, `Card`, `Dialog`, `Tooltip`, `Divider`, `PopoverMenu`)
- Menus (Clock, AI, Keyboard, Notification, Event) all compose `PopoverMenu`

**Deployment:** Vercel SPA — all routes rewrite to `/index.html` (`vercel.json`).

**Git hooks:** Husky + lint-staged run ESLint on staged files before commits.
