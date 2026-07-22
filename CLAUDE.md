# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Web dev server (browser, proxies /api to VITE_HOST)
npm run dev

# Electron desktop app dev server
npm run electron:dev

# Type-check + build for web
npm run build

# Build Electron app (outputs to out/)
npm run electron:build

# Package as distributable installer (outputs to release/)
npm run dist

# Lint
npm run lint
```

There is no test suite.

## Environment

Copy `.env` and set at minimum:

| Variable                                                     | Purpose                                                    |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| `VITE_HOST`                                                  | Backend base URL (e.g. `https://cmsweb.rebiz.com/`)        |
| `VITE_URL_API`                                               | API path or full URL, defaults to `/api/`                  |
| `VITE_REVIEWER_ROLE` / `VITE_AGENT_ROLE` / `VITE_ADMIN_ROLE` | Role IDs decoded from the JWT                              |
| `VITE_MONITORING_ID`                                         | Default monitoring session for dev                         |
| `VITE_USE_STATIC_IDS`                                        | `true` to hard-code IDs instead of reading from URL params |
| `VITE_ASSIGNMENT_COMPLETED`                                  | Feature flag for completed-assignment UI                   |
| `VITE_PASSWORD_VALIDATION`                                   | Set to `false` to disable password strength rules          |
| `VITE_STRICT_GEOLOCATION`                                    | `true` to block login when lat/lon can't be obtained       |

In Electron, `.env` is also loaded by the main process via `dotenv`; `DVR_BASE` controls where local DVR files are read from.

## Architecture

This is a **dual-target app**: the same React source runs as a browser SPA (Vite dev server / Vercel) and as an Electron desktop app. The distinction is detected at runtime:

- `window.location.protocol === "file:"` → Electron (uses `HashRouter` and resolves API URLs against `VITE_HOST`).
- Otherwise → browser (uses `BrowserRouter`, Vite proxy handles `/api`).

### Directory layout

```
src/
  main.tsx          # Entry point; picks BrowserRouter vs HashRouter
  App.tsx           # Route definitions and role-based guards (ProtectedRole)
  theme.ts          # Colors, Fonts, Breakpoints constants — import from here, not inline
  config/
    index.ts        # All env vars exported as typed constants (URL_API, role IDs, feature flags)
    apiClient.ts    # Axios instance pointing at URL_API
  contexts/
    Auth.tsx        # AuthProvider — stores JWT in localStorage, decodes it with jwt-decode
    MonitorContext.tsx   # MonitorProvider — wraps /monitor route
    MonitorContexts.ts  # Raw context objects (MonitorStateContext, CameraGroupContext, etc.)
    useMonitorContext.ts # Convenience hooks (useMonitorState, useCameraGroup, useRegisterMonitorActions)
  hooks/
    useApi.ts       # All data-fetching primitives (useGet, usePost, usePatch, usePostQuery, etc.)
    useAuth.ts      # Reads from AuthContext
    use*.ts         # Feature-specific hooks (see below)
  components/       # Shared UI components
  sections/
    Header/         # MonitorHeader, AdminHeader, AssignmentsHeader
    Content.tsx
  pages/
    Login/          # Login page
    Monitor/        # Main monitoring view (index.tsx + hooks/ + components/)
    MonitorTimeline/
    Assignments/
    AdminForm/
  services/
    CrashLogger.ts  # Browser-side crash logging (installed in main.tsx)
electron/
  main.ts           # Electron main process (auto-updater, IPC, DVR file serving, crash log forwarding)
  preload.ts        # Contextbridge — exposes limited node APIs to renderer
```

### Data fetching

All API calls go through hooks in `src/hooks/useApi.ts` built on TanStack Query + the shared Axios instance:

- **`useGet(url, config?, options?)`** — GET, caches by URL.
- **`usePost(url, options?)`** — mutation (returns `useMutation`).
- **`usePatch(url, options?)`** — mutation with optional dynamic URL and body transform.
- **`usePostQuery(url, body, options?)`** — POST treated as a query (cached).
- **`usePostQueries(url, bodies[], options?)`** — parallel POST queries.
- **`useGetCallback / usePostCallback / useDeleteCallback`** — imperative versions (not reactive).

All hooks automatically inject `Authorization: Bearer <token>` from `AuthContext`. Query keys default to the URL (and body for POST queries).

### Auth

JWT stored in `localStorage` under `"token"`. `AuthProvider` decodes it with `jwt-decode` to expose `user` (id, roleID, username, email). `ProtectedRole` in `App.tsx` checks `authenticated` + `user.roleID` against allowed roles exported from `src/config/index.ts`.

### Monitor page data flow

The `/monitor` route is the core feature. Key concepts:

1. **`MonitorProvider`** (wraps the route) holds `cameraGroup` (which tracker grouping tab is active), `trackerOption`, and `customTrackerIDs` in context.

2. **`useTrackerGroupResolution`** (`pages/Monitor/hooks/`) derives all filtering flags from `cameraGroup`:

   - `"tracker"` → tracker tab, filtered further by `trackerOption`
   - `"__custom__"` → user-defined set of tracker/camera IDs
   - `"cam_<id>"` → a specific camera from a join-camera tracker
   - A numeric string → a tracker group ID; `joinCameraTrackerMap` decides if it's a join-camera tracker or a direct tracker

3. **`useMonitoring`** fetches the snapshot (timeline data, camera list, sessions).

4. **`useCameraEventPoints`** manages local event point state (add/remove/undo/redo).

5. **`useFilteredEventPoints`** applies the grouping resolution to produce only the event points relevant to the current view.

6. **`CameraLayout`** renders a grid of camera video feeds. Switches to a scrollable grid when > 16 cameras. Camera counts drive `getRowDistribution` for layout.

7. **`TimeLine`** renders the timeline with event points as draggable markers. Supports `"camera"` and `"activity"` view modes.

8. **`MonitorHeader`** renders the tracker grouping toggle (`ToggleButton`), surfaces the Done/Finalize button (wired through `useRegisterMonitorActions`/`MonitorStateContext`), and the CustomTrackerDialog for building ad-hoc groups.

### Tracker grouping model

`useTrackerGrouping` fetches `tracker/grouping/<companyID>/<locationID>`. Each item has:

- `id` — tracker ID
- `joinCamera: boolean` — if true, this tracker's cameras are shown as individual camera-group tabs rather than filtering by tracker ID
- `cameras[]` — cameras belonging to a join-camera tracker

`useTrackerGroupResolution` + `useFilteredEventPoints` + `useFilteredMenuItems` all read from this model to decide what cameras and event types to show.

### Styling

- MUI v6 (`@mui/material`, `@mui/system`) for layout primitives.
- `@emotion/styled` for custom styled components.
- `src/theme.ts` exports `Colors`, `Fonts`, `Breakpoints` — always import from there, never hardcode color values inline.
- No global CSS file; `document.body` styles set imperatively in `App.tsx`.

### Electron specifics

- `electron/main.ts` handles auto-update via `electron-updater`, DVR file serving over a custom `dvr://` protocol, and proxying crash logs to the backend.
- `electron/preload.ts` exposes `window.electron` (version info, update events, crash log IPC) via `contextBridge`.
- `src/electron.d.ts` types the `window.electron` API for the renderer.
- `UpdatePrompt` component in `components/UpdatePrompt.tsx` listens for update events from the main process and prompts the user.
