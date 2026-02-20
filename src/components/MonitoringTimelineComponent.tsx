// MonitoringTimelineComponent.tsx
// React + TypeScript migration of <cms-monitoring-timeline> (Shadow DOM + Canvas).
// Architecture: Stateful component. All canvas drawing is imperative via refs.
// IPC subscriptions via window.timeline.subscribe() in useEffect.

import { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import styled from "@emotion/styled";
import AppStorage from "../storage/AppStorage.js";
import type { ScopedStorage } from "../storage/AppStorage.js";
import type {
  TLTrack,
  TLSession,
  TLMarker,
  TLTimes,
  TLUiState,
  TLSelection,
  TimelineSnapshot,
  UiPatch,
  AddMarkerPayload,
  EventSubscriber,
} from "../types/electron.js";

// ─── Re-export public interfaces ───────────────────────────────────────────────

export type {
  TLTrack,
  TLSession,
  TLMarker,
  TLTimes,
  TLUiState,
  TLSelection,
  TimelineSnapshot,
};

export interface SessionBound {
  x: number;
  y: number;
  width: number;
  height: number;
  start: string;
  end: string;
  over: boolean;
  track: TLTrack;
  previewStart?: string;
  previewEnd?: string;
}

export interface SessionMetrics {
  inPair: boolean;
  orphanedIn: string | null;
  absoluteLast: boolean;
  sessionBounds: SessionBound[];
}

export interface TimelineChangeDetail {
  offset: number;
  markerVisible: boolean;
  patchAvailable: boolean;
  cutAvailable: boolean;
  selectedTrack: TLTrack | null;
  selectedSession: null;
}

export interface MarkersDetail {
  current: string | null;
  trackId: number | null;
  markers: TLMarker[];
}

export interface MonitoringTimelineProps {
  /** Initial category. Defaults to "employees". */
  category?: string;
  /** Whether the component is displayed as a tear-out window (hides border/shadow). */
  detached?: boolean;
}

// Internal only — drives React re-renders for toolbar HTML
interface ToolbarState {
  torn: boolean;
  playback: boolean;
  currentTime: string;
  trackSelected: boolean;
  cutAvailable: boolean;
  patchAvailable: boolean;
  hasNoTracks: boolean;
}

interface TimelineMetrics {
  start: moment.Moment;
  visibleStart: moment.Moment;
  secPerPx: number;
  width: number;
}

interface PathParams {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

// ─── Module-level constants ─────────────────────────────────────────────────────

const DPR = window.devicePixelRatio || 1;
const ZOOM_MIN = 0.8;
const ZOOM_MAX = 3.0;
const MIN_LABEL_PX = 70;
const MIN_TICK_PX = 25;
const MIN_SUBLABEL_PX = 54;
const MIN_SUBLABEL_FINE_PX = 44;
const DEFAULT_CATEGORY = "employees";

// Module-level AppStorage instance (shared, scoped per component instance via .location())
const appStorage = new AppStorage();

// ─── Pure utility functions ─────────────────────────────────────────────────────

function clamp(
  value: number,
  min: number,
  max: number,
  fallback = min,
): number {
  if (typeof value !== "number" || isNaN(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

function toSec(hms: string | null | undefined): number {
  if (!hms) return 0;
  const [h, m, s] = hms.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function sortSessions(a: TLSession, b: TLSession): number {
  const t1 = a.timestamp;
  const t2 = b.timestamp;
  if (t1 === t2) {
    if (a.type === "out" && b.type === "in") return -1;
    if (a.type === "in" && b.type === "out") return 1;
    return 0;
  }
  return t1 < t2 ? -1 : 1;
}

function pairSessions(
  sessions: TLSession[],
  pairs: [string, string][] = [["in", "out"]],
): [string, string, string?][] {
  const startToEnd = new Map<string, string>();
  const endToStart = new Map<string, string>();
  for (const [start, end] of pairs) {
    startToEnd.set(start, end);
    endToStart.set(end, start);
  }
  const chronological = [...sessions].sort(sortSessions);
  const paired: [string, string, string?][] = [];
  const stacks: Record<string, TLSession[]> = Object.create(null);
  const pushSingleton = (type: string, t: string) => paired.push([t, t, type]);

  for (const s of chronological) {
    const t = s.timestamp;
    const ty = s.type;
    if (startToEnd.has(ty)) {
      const stack = (stacks[ty] ??= []);
      if (stack.length > 0) {
        const orphan = stack.pop()!;
        paired.push([orphan.timestamp, orphan.timestamp]);
      }
      stack.push(s);
    } else if (endToStart.has(ty)) {
      const startType = endToStart.get(ty)!;
      const stack = (stacks[startType] ??= []);
      const start = stack.pop();
      if (start) paired.push([start.timestamp, t]);
      else pushSingleton(ty, t);
    } else pushSingleton(ty, t);
  }

  for (const startType in stacks) {
    const stack = stacks[startType];
    while (stack.length) {
      const orphan = stack.pop()!;
      paired.push([orphan.timestamp, orphan.timestamp]);
    }
  }
  return paired;
}

function getRoundedRectPath(params: PathParams): Path2D {
  const { x, y, width, height, radius } = params;
  const path = new Path2D();
  path.moveTo(x + radius, y);
  path.lineTo(x + width - radius, y);
  path.quadraticCurveTo(x + width, y, x + width, y + radius);
  path.lineTo(x + width, y + height - radius);
  path.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  path.lineTo(x + radius, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - radius);
  path.lineTo(x, y + radius);
  path.quadraticCurveTo(x, y, x + radius, y);
  path.closePath();
  return path;
}

const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// ─── Styled components ─────────────────────────────────────────────────────────

const Root = styled.div`
  /* ── Dimension variables ── */
  --scrollbar-size: 10px;
  --canvas-track-height: 32px;
  --session-bar-height: 14px;
  --border-radius-session: 4px;

  /* ── Color variables ── */
  --color-business-hours: #ff6e1666;
  --color-actual-hours: #66cc6699;
  --color-scrollbar-gutter: #111;
  --color-scrollbar-thumb: #555;
  --color-canvas-background: #111;
  --color-canvas-background-dark: #1a1a1a55;
  --color-canvas-labels-background: #2226;
  --color-canvas-labels-background-hover: #222a;
  --color-canvas-labels-background-selected: #ff6e16;
  --color-canvas-sessions-background: #212121;
  --color-canvas-border: #3334;
  --color-canvas-text: #eee;
  --color-canvas-text-hover: #ff6000;
  --color-text-hover: #ff6000;
  --color-canvas-text-selected: #fff;
  --color-time-labels-hours: #ddd;
  --color-time-labels-minutes: #888;
  --color-times-opacity: 0.85;
  --color-times-spread: 40%;
  --color-ordinal-background: #1a1a1a;
  --color-ordinal-background-hover: #161616;
  --color-ordinal-background-selected: #ff6000;
  --color-ordinal-text: #ccc;
  --color-ordinal-text-hover: #fff;
  --color-ordinal-text-selected: #fff;
  --color-marker: #ff6000aa;
  --color-session-background: #333;
  --color-session-range-background: #ff7f4d;
  --color-session-single-background: #d16aff;
  --color-session-hover-border: #111;
  --color-session-range-hover-border: #d2541e;
  --color-session-single-hover-border: #a136d1;
  --color-session-selected-background: color-mix(in srgb, #111, red 40%);
  --color-session-range-selected-background: color-mix(
    in srgb,
    #d2541e,
    red 40%
  );
  --color-session-single-selected-background: color-mix(
    in srgb,
    #a136d1,
    red 40%
  );
  --color-session-hint-background: #222;
  --color-session-hint-text: #999;

  /* ── Layout ── */
  display: grid;
  grid-template-rows: 32px auto;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-block-start: solid 2px #3336;
  box-shadow: 0 0 30px #000a;
  font-size: 14px;
  color: #eee;

  /* ── Scrollbars ── */
  ::-webkit-scrollbar {
    width: var(--scrollbar-size);
    height: var(--scrollbar-size);
  }
  ::-webkit-scrollbar-thumb {
    background: var(--color-scrollbar-thumb);
    border-radius: 4px;
    border: solid 2px var(--color-scrollbar-gutter);
  }
  ::-webkit-scrollbar-track {
    background: var(--color-scrollbar-gutter);
  }

  &[data-detached="true"] {
    border-block-start: 0;
    box-shadow: none;
  }

  &[data-torn="true"] .timeline-actions > button:not(.btn-tear) {
    opacity: 0;
    pointer-events: none;
    transition: none;
  }

  &[data-torn="true"] .ui-wrapper {
    display: none;
  }
`;

const UiControls = styled.div`
  background: #0e0e0e88;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: center;

  & > div {
    display: flex;
    align-items: center;
    gap: 0.25em;
  }
  & > div:nth-of-type(1) {
    justify-self: start;
  }
  & > div:nth-of-type(2) {
    justify-self: center;
  }
  & > div:nth-of-type(3) {
    justify-self: end;
  }

  button {
    background: transparent;
    border: none;
    font-size: 1.25em;
    padding-inline: 0.5em;
    display: flex;
    place-items: center;
    height: 1.75em;
    color: #fff;
    cursor: pointer;
    transition: background 250ms ease-in-out;
    &:hover {
      background: #3336;
    }
    &:disabled {
      opacity: 0.1;
      pointer-events: none;
    }
  }
`;

const TimeDisplay = styled.div`
  display: flex;
  align-items: center;
  background: #111a;
  padding-inline: 0.25em;
  border-radius: 1em;
  scale: 0.9;
  gap: 0.25em;
  height: 28px;

  .time-text {
    padding-inline: 1em;
    width: 90px;
    text-align: center;
    font-size: inherit;
  }

  button {
    border-radius: 3em;
    width: 2em;
    height: 2em;
    scale: 0.8;
  }
`;

const UiWrapper = styled.div`
  display: grid;
  grid-template-rows: auto;
  height: 100%;
  position: relative;
  overflow: hidden;
  overflow-y: auto;
`;

const CanvasMainWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
  z-index: 9;
`;

const CanvasMain = styled.canvas`
  background: var(--color-canvas-background);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  font-size: 0.9em;
`;

const CanvasTimes = styled.canvas`
  position: absolute;
  top: 0;
  left: var(--timeline-labels-width);
  right: var(--scrollbar-size);
  width: calc(100% - var(--scrollbar-size) - var(--timeline-labels-width));
  height: var(--canvas-track-height);
  background: linear-gradient(
    to bottom,
    hsl(from var(--color-canvas-background) h s l / var(--color-times-opacity))
      var(--color-times-spread),
    transparent
  );
  z-index: 10;
  font-size: 0.8em;
`;

const CanvasMarker = styled.canvas`
  position: absolute;
  top: calc(var(--canvas-track-height) - 1px);
  left: var(--timeline-labels-width);
  width: calc(100% - var(--timeline-labels-width) - var(--scrollbar-size));
  height: calc(100% - var(--canvas-track-height) + 1px);
  pointer-events: none;
  z-index: 20;
`;

const EmptyPlaceholder = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--timeline-labels-width);
  padding: var(--canvas-track-height) 1em 0 1em;
  color: var(--color-session-hint-text);
  font-size: 0.9em;
  display: ${({ $visible }) => ($visible ? "block" : "none")};
`;

// ─── Component ─────────────────────────────────────────────────────────────────

export function MonitoringTimeline({
  category: categoryProp,
  detached = false,
}: MonitoringTimelineProps) {
  // ── React state (causes re-renders; drives toolbar HTML) ────────────────────
  const [toolbar, setToolbar] = useState<ToolbarState>({
    torn: false,
    playback: false,
    currentTime: "-",
    trackSelected: false,
    cutAvailable: false,
    patchAvailable: false,
    hasNoTracks: false,
  });

  // ── Canvas element refs ─────────────────────────────────────────────────────
  const rootRef = useRef<HTMLDivElement>(null);
  const cnvMainRef = useRef<HTMLCanvasElement>(null);
  const cnvTimesRef = useRef<HTMLCanvasElement>(null);
  const cnvMarkerRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // ── Mutable state refs (avoid stale closures in event handlers) ─────────────
  const storageRef = useRef<ScopedStorage | null>(null);
  const snapshotRef = useRef<TimelineSnapshot | null>(null);
  const uiRef = useRef<TLUiState>({
    panOffsetSec: 0,
    zoom: 1,
    category: categoryProp ?? DEFAULT_CATEGORY,
    playback: false,
  });
  const tornRef = useRef(false);
  const markingRef = useRef(false);
  const markingReadyRef = useRef(false);
  const markingInfoRef = useRef<{
    trackId: number;
    timestamp: string;
    cameraId: string;
  } | null>(null);
  const pointOverRef = useRef<{ x: number; y: number } | null>(null);
  const sessionOverRef = useRef<SessionBound | null>(null);
  const intentsRef = useRef({
    "timeline.labels.over": false,
    "timeline.labels.resize": false,
  });
  const sizesRef = useRef({ timeline: { labels: { width: 280 } } });
  const trackHeightRef = useRef(32);
  const lastRenderedTrackCountRef = useRef(-1);
  const lastUiKeyRef = useRef("");
  const lastMarkersKeyRef = useRef("");
  const lastMarkerContextKeyRef = useRef("");
  const animatingLocateRef = useRef(false);
  const ctrlPressedRef = useRef(false);

  // Gutter resize
  const isResizingRef = useRef(false);
  const resizePointerIdRef = useRef<number | null>(null);
  const boundRef = useRef<DOMRect | null>(null);

  // Panning
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, offsetSec: 0 });

  // Marker drag
  const isDraggingMarkerRef = useRef(false);
  const dragMarkerPointerIdRef = useRef<number | null>(null);
  const markerGrabDxRef = useRef(0);

  // Session resize
  const isResizingSessionRef = useRef(false);
  const resizeSideRef = useRef<"start" | "end" | null>(null);
  const resizeTrackIdRef = useRef<number | null>(null);
  const resizeBoundRef = useRef<SessionBound | null>(null);
  const resizeStartXRef = useRef(0);
  const resizeOrigStartRef = useRef<moment.Moment | null>(null);
  const resizeOrigEndRef = useRef<moment.Moment | null>(null);

  // IPC throttling
  const uiRafRef = useRef(0);
  const uiPatchRef = useRef<UiPatch | null>(null);
  const gotoRafRef = useRef(0);
  const pendingGotoRef = useRef<string | null>(null);

  // ── Derived helpers (read from refs) ────────────────────────────────────────

  const getSnapshot = () => snapshotRef.current;
  const getTimes = () => snapshotRef.current?.timeline?.times ?? null;
  const getTracks = () => snapshotRef.current?.timeline?.tracks ?? [];
  const getUi = () => uiRef.current;
  const getSelection = (): TLSelection =>
    uiRef.current.selection ?? { trackId: null, sessionKeys: [] };
  const getCategory = () => uiRef.current.category ?? DEFAULT_CATEGORY;
  const getDisplayedTracks = () =>
    getTracks().filter((t: TLTrack) => t.category === getCategory());

  const getStyles = () => {
    if (!rootRef.current) return null;
    return getComputedStyle(rootRef.current);
  };

  const cssVar = (name: string, fallback = ""): string => {
    const s = getStyles();
    if (!s) return fallback;
    return s.getPropertyValue(name).trim() || fallback;
  };

  // ── IPC throttle helpers ────────────────────────────────────────────────────

  const setUiThrottled = useCallback((patch: UiPatch) => {
    uiRef.current = { ...uiRef.current, ...patch };
    uiPatchRef.current = { ...(uiPatchRef.current ?? {}), ...patch };
    if (uiRafRef.current) return;
    uiRafRef.current = requestAnimationFrame(() => {
      uiRafRef.current = 0;
      const p = uiPatchRef.current;
      uiPatchRef.current = null;
      if (p) window.timeline.setUi(p);
    });
  }, []);

  const gotoThrottled = useCallback((timeStr: string) => {
    pendingGotoRef.current = timeStr;
    if (gotoRafRef.current) return;
    gotoRafRef.current = requestAnimationFrame(() => {
      gotoRafRef.current = 0;
      const t = pendingGotoRef.current;
      pendingGotoRef.current = null;
      if (t) window.timeline.goto(t);
    });
  }, []);

  // ── Timeline metrics ────────────────────────────────────────────────────────

  const dayStart = () => moment("00:00:00", "HH:mm:ss");
  const dayEnd = () => dayStart().clone().add(24, "hours");

  const getWindowBounds = () => {
    const t = getTimes();
    if (!t) return { start: dayStart(), end: dayEnd() };
    return {
      start: moment(t.start, "HH:mm:ss"),
      end: moment(t.end, "HH:mm:ss"),
    };
  };

  const clampToWindow = (ts: moment.Moment) => {
    const { start, end } = getWindowBounds();
    if (ts.isBefore(start)) return start.clone();
    if (ts.isAfter(end)) return end.clone();
    return ts;
  };

  const snapToInterval = (ts: moment.Moment) => {
    const t = getTimes();
    const step = t?.interval ?? 60;
    const start = moment(t?.start ?? "00:00:00", "HH:mm:ss");
    const sec = ts.diff(start, "seconds");
    const snapped = Math.round(sec / step) * step;
    return start.clone().add(snapped, "seconds");
  };

  const clampVisibleStart = (start: moment.Moment, spp: number, w: number) => {
    const [ds, de, ws] = [dayStart(), dayEnd(), spp * w];
    const ls = de.clone().subtract(ws, "seconds");
    return start.isBefore(ds) ? ds : start.isAfter(ls) ? ls : start;
  };

  const getTimelineMetrics = useCallback((): TimelineMetrics => {
    const t = getTimes();
    const c2 = cnvTimesRef.current;
    if (!t || !c2) {
      return {
        start: dayStart(),
        visibleStart: dayStart(),
        secPerPx: 1,
        width: 1,
      };
    }
    const { start, end, buffer } = t;
    const zoom = clamp(getUi()?.zoom ?? 1, ZOOM_MIN, ZOOM_MAX);
    const panOffsetSec = getUi()?.panOffsetSec ?? 0;
    const bs = moment(start, "HH:mm:ss").subtract(buffer, "seconds");
    const be = moment(end, "HH:mm:ss").add(buffer, "seconds");
    const totalSeconds = be.diff(bs, "seconds");
    const width = c2.width / DPR;
    const secPerPx = totalSeconds / width / zoom;
    let visibleStart = bs.clone().add(panOffsetSec, "seconds");
    const clamped = clampVisibleStart(visibleStart, secPerPx, width);
    if (!clamped.isSame(visibleStart)) {
      const newOffset = clamped.diff(bs, "seconds");
      setUiThrottled({ panOffsetSec: newOffset });
      visibleStart = clamped;
    }
    return { start: bs, visibleStart, secPerPx, width };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUiThrottled]);

  const getMarkerGeometry = useCallback(() => {
    const t = getTimes();
    const c2 = cnvTimesRef.current;
    const empty = {
      x: 0,
      rectX: 0,
      rectY: 0,
      rectWidth: 20,
      rectHeight: 10,
      rectRadius: 5,
      height: 0,
      width: 0,
      secPerPx: 1,
      visibleStart: dayStart(),
    };
    if (!t || !c2) return empty;
    const { visibleStart, secPerPx, width } = getTimelineMetrics();
    const height = c2.height / DPR;
    const current = moment(t.current, "HH:mm:ss");
    const x = current.diff(visibleStart, "seconds") / secPerPx;
    const rectWidth = 20,
      rectHeight = 10,
      rectRadius = 5;
    const rectX = x - rectWidth / 2;
    const rectY = height - rectHeight - 4;
    return {
      x,
      rectX,
      rectY,
      rectWidth,
      rectHeight,
      rectRadius,
      height,
      width,
      secPerPx,
      visibleStart,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTimelineMetrics]);

  // ── Availability checks ─────────────────────────────────────────────────────

  const hasCutAvailable = useCallback(() => {
    const t = getTimes();
    if (!t) return false;
    const sel = getSelection();
    if (sel.trackId == null) return false;
    const track = getDisplayedTracks().find(
      (x: TLTrack) => x.id === sel.trackId,
    );
    if (!track) return false;
    const cp = pairSessions(track.sessions, [["in", "out"]]);
    const cur = moment(t.current, "HH:mm:ss");
    for (const [s, e] of cp) {
      if (
        s !== e &&
        cur.isBetween(moment(s, "HH:mm:ss"), moment(e, "HH:mm:ss"), null, "()")
      )
        return true;
    }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPatchAvailable = useCallback(() => {
    const t = getTimes();
    if (!t) return false;
    const sel = getSelection();
    if (sel.trackId == null) return false;
    const track = getDisplayedTracks().find(
      (x: TLTrack) => x.id === sel.trackId,
    );
    if (!track) return false;
    const sessionMap = new Map<string, Set<string>>();
    for (const s of track.sessions) {
      if (!sessionMap.has(s.timestamp)) sessionMap.set(s.timestamp, new Set());
      sessionMap.get(s.timestamp)!.add(s.type);
    }
    const types = sessionMap.get(t.current);
    return !!types && types.has("in") && types.has("out");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMarkerVisible = useCallback(() => {
    const t = getTimes();
    if (!t) return false;
    const current = moment(t.current, "HH:mm:ss");
    const { visibleStart, secPerPx, width } = getTimelineMetrics();
    const visibleEnd = visibleStart.clone().add(secPerPx * width, "seconds");
    return current.isBetween(visibleStart, visibleEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTimelineMetrics]);

  // ── Session metrics ─────────────────────────────────────────────────────────

  const getSessionMetrics = useCallback(
    (track: TLTrack): SessionMetrics => {
      const times = getTimes();
      if (!times)
        return {
          inPair: false,
          orphanedIn: null,
          absoluteLast: false,
          sessionBounds: [],
        };

      const cp = pairSessions(track.sessions, [["in", "out"]]);
      const cur = moment(times.current, "HH:mm:ss");
      let inPair = false;
      for (const [s, e] of cp) {
        if (
          s !== e &&
          cur.isBetween(
            moment(s, "HH:mm:ss"),
            moment(e, "HH:mm:ss"),
            null,
            "(]",
          )
        ) {
          inPair = true;
          break;
        }
      }

      const { visibleStart, secPerPx } = getTimelineMetrics();
      const sessionBounds: SessionBound[] = [];
      const po = pointOverRef.current;
      const ox = sizesRef.current.timeline.labels.width;
      const dispTracks = getDisplayedTracks();
      const trackIndex = dispTracks.indexOf(track);
      const th = trackHeightRef.current;
      const y = th + th * trackIndex + 8;
      const s = getStyles();
      const height =
        parseFloat(s?.getPropertyValue("--session-bar-height") ?? "14") ||
        th / 2;

      for (const [start, end] of cp) {
        const x1 =
          ox +
          Math.max(
            0,
            moment(start, "HH:mm:ss").diff(visibleStart, "seconds") / secPerPx,
          );
        const x2 =
          ox +
          Math.max(
            0,
            moment(end, "HH:mm:ss").diff(visibleStart, "seconds") / secPerPx,
          );
        const width = Math.max((times.interval ?? 60) / secPerPx, x2 - x1);
        const over =
          !!po &&
          po.x >= x1 &&
          po.x <= x1 + width &&
          po.y >= y &&
          po.y <= y + height;
        sessionBounds.push({
          x: x1,
          y,
          width,
          height,
          start,
          end,
          over,
          track,
        });
      }

      let last: string | null = null;
      track.sessions
        .slice()
        .sort(sortSessions)
        .forEach((s: TLSession) => {
          const tt = moment(s.timestamp, "HH:mm:ss");
          if (tt.isBefore(cur)) {
            if (s.type === "in") last = s.timestamp;
            else if (s.type === "out") last = null;
          }
        });
      const sorted = track.sessions.slice().sort(sortSessions);
      const absoluteLast = sorted.length
        ? moment(sorted[sorted.length - 1].timestamp, "HH:mm:ss").isBefore(cur)
        : false;

      return {
        inPair,
        orphanedIn: !inPair && last ? last : null,
        absoluteLast,
        sessionBounds,
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [getTimelineMetrics],
  );

  // ── Active markers ──────────────────────────────────────────────────────────

  const getActiveMarkers = useCallback(
    ({
      trackId = null,
      current = null,
      tolerance = 0.4,
    }: {
      trackId?: number | null;
      current?: string | null;
      tolerance?: number;
    } = {}): TLMarker[] => {
      const effectiveTrackId = trackId ?? getSelection().trackId;
      if (effectiveTrackId == null) return [];
      const track = getTracks().find((t: TLTrack) => t.id === effectiveTrackId);
      if (!track || !Array.isArray(track.markers)) return [];
      const now =
        typeof current === "number"
          ? current
          : toSec(current ?? getTimes()?.current);
      if (!Number.isFinite(now)) return [];
      return track.markers.filter((m: TLMarker) => {
        const ts = m?.ts ?? (m?.timestamp ? toSec(m.timestamp) : NaN);
        return Number.isFinite(ts) && Math.abs(ts - now) <= tolerance;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const emitActiveMarkers = useCallback(() => {
    const current = getTimes()?.current ?? null;
    const trackId = getSelection().trackId;
    if (!current || trackId == null) {
      rootRef.current?.dispatchEvent(
        new CustomEvent("markers", {
          detail: { current, trackId, markers: [] },
          bubbles: true,
        }),
      );
      return;
    }
    const markers = getActiveMarkers({ trackId, current });
    const key = markers
      .map(
        (m) =>
          m.id ??
          `${m.cameraId ?? ""}@${m.timestamp ?? ""}@${m.cx ?? ""}@${m.cy ?? ""}`,
      )
      .join("|");
    if (key === lastMarkersKeyRef.current) return;
    lastMarkersKeyRef.current = key;
    rootRef.current?.dispatchEvent(
      new CustomEvent("markers", {
        detail: { current, trackId, markers },
        bubbles: true,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getActiveMarkers]);

  // ── triggerChange ───────────────────────────────────────────────────────────

  const triggerChange = useCallback(() => {
    const sel = getSelection();
    const selectedTrack =
      getDisplayedTracks().find((t: TLTrack) => t.id === sel.trackId) ?? null;
    rootRef.current?.dispatchEvent(
      new CustomEvent("timeline:change", {
        detail: {
          offset: getUi()?.panOffsetSec ?? 0,
          markerVisible: isMarkerVisible(),
          patchAvailable: hasPatchAvailable(),
          cutAvailable: hasCutAvailable(),
          selectedTrack,
          selectedSession: null,
        },
        bubbles: true,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMarkerVisible, hasPatchAvailable, hasCutAvailable]);

  // ── Canvas drawing ──────────────────────────────────────────────────────────

  const drawMarker = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const t = getTimes();
      if (!t) return;
      const { x } = getMarkerGeometry();
      ctx.strokeStyle = cssVar("--color-marker", "#ff6000aa");
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height / DPR);
      ctx.closePath();
      ctx.stroke();

      if (markingRef.current) {
        const text = "MARKING… click & drag on a camera";
        ctx.save();
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        const s = getStyles();
        const fontSize = Math.max(
          11,
          (parseFloat(s?.fontSize ?? "12") || 12) * 0.85,
        );
        ctx.font = `600 ${fontSize}px ${s?.fontFamily ?? "sans-serif"}`;
        const padX = 10,
          padY = 6;
        const w = ctx.measureText(text).width + padX * 2;
        const h = 22;
        const x0 = canvas.width / DPR - w - 10;
        const y0 = 10;
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = "#ff2a2a";
        ctx.beginPath();
        const r = 8;
        ctx.moveTo(x0 + r, y0);
        ctx.lineTo(x0 + w - r, y0);
        ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
        ctx.lineTo(x0 + w, y0 + h - r);
        ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
        ctx.lineTo(x0 + r, y0 + h);
        ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
        ctx.lineTo(x0, y0 + r);
        ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(text, x0 + padX, y0 + h / 2);
        ctx.restore();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [getMarkerGeometry],
  );

  const drawTimes = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const times = getTimes();
      if (!times) return;
      const startBase = moment(times.start, "HH:mm:ss").subtract(
        times.buffer,
        "seconds",
      );
      const endBase = moment(times.end, "HH:mm:ss").add(
        times.buffer,
        "seconds",
      );
      const current = moment(times.current, "HH:mm:ss");
      const width = canvas.width / DPR;
      const height = canvas.height / DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const zoom = clamp(getUi()?.zoom ?? 1, ZOOM_MIN, ZOOM_MAX);
      const totalSeconds = endBase.diff(startBase, "seconds");
      const secPerPx = totalSeconds / width / zoom;
      let visibleStart = startBase
        .clone()
        .add(getUi()?.panOffsetSec ?? 0, "seconds");
      const clamped = clampVisibleStart(visibleStart, secPerPx, width);
      if (!clamped.isSame(visibleStart)) {
        setUiThrottled({ panOffsetSec: clamped.diff(startBase, "seconds") });
        visibleStart = clamped;
      }
      const visibleEnd = visibleStart.clone().add(secPerPx * width, "seconds");

      const candidates = [
        { sec: 14400 },
        { sec: 7200 },
        { sec: 3600 },
        { sec: 1800 },
        { sec: 900 },
      ];
      let labelStep = candidates[0].sec;
      for (const c of candidates) {
        if (c.sec / secPerPx >= MIN_LABEL_PX) {
          labelStep = c.sec;
          break;
        }
      }
      let tickStep = candidates[candidates.length - 1].sec;
      for (let i = candidates.length - 1; i >= 0; i--) {
        if (candidates[i].sec / secPerPx >= MIN_TICK_PX) {
          tickStep = candidates[i].sec;
          break;
        }
      }
      tickStep = Math.max(tickStep, 900);

      const colorText = cssVar("--color-canvas-text", "#eee");
      const colorBorder = cssVar("--color-canvas-border", "#3334");
      const colorAccent = cssVar("--color-text-hover", "#ff6000");
      const colorHours = cssVar("--color-time-labels-hours", colorText);
      const colorMinutes = cssVar("--color-time-labels-minutes", colorText);

      ctx.save();
      ctx.translate(0.5, 0.5);
      ctx.strokeStyle = colorBorder;
      ctx.fillStyle = colorText;
      const cnvFont = cnvTimesRef.current
        ? window.getComputedStyle(cnvTimesRef.current).font
        : "";
      ctx.font = cnvFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";

      const LABEL_TOP = 2;
      const LABEL_BAND_H = Math.min(14, height - 2);
      const LABEL_BASELINE_Y = LABEL_TOP + LABEL_BAND_H;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.stroke();

      let yBar = 1;
      const barH = 2;
      const businessStart = moment(times.businessStart, "HH:mm:ss");
      const businessEnd = moment(times.businessEnd, "HH:mm:ss");
      const bx1 = businessStart.isBefore(visibleStart)
        ? 0
        : businessStart.diff(visibleStart, "seconds") / secPerPx;
      const bx2 = businessEnd.isAfter(visibleEnd)
        ? width
        : businessEnd.diff(visibleStart, "seconds") / secPerPx;
      ctx.fillStyle = cssVar("--color-business-hours", "#ff6e1666");
      ctx.fillRect(bx1, yBar, bx2 - bx1, barH);

      yBar += barH + 1;
      if (times.actualStart && times.actualEnd) {
        const actualStart = moment(times.actualStart, "HH:mm:ss");
        const actualEnd = moment(times.actualEnd, "HH:mm:ss");
        const ax1 = actualStart.isBefore(visibleStart)
          ? 0
          : actualStart.diff(visibleStart, "seconds") / secPerPx;
        const ax2 = actualEnd.isAfter(visibleEnd)
          ? width
          : actualEnd.diff(visibleStart, "seconds") / secPerPx;
        ctx.fillStyle = cssVar("--color-actual-hours", "#66cc6699");
        ctx.fillRect(ax1, yBar, ax2 - ax1, barH);
      }

      const MAJOR_H = Math.min(12, height - 2);
      const MINOR_H = Math.min(7, height - 2);

      const pxPer4h = 14400 / secPerPx,
        pxPer2h = 7200 / secPerPx;
      const pxPer1h = 3600 / secPerPx,
        pxPer30 = 1800 / secPerPx,
        pxPer15 = 900 / secPerPx;

      const allow4h = pxPer4h >= MIN_LABEL_PX;
      const allow2h = pxPer2h >= MIN_LABEL_PX;
      const allow1h = pxPer1h >= MIN_LABEL_PX;
      const allow30m = pxPer30 >= MIN_SUBLABEL_PX;
      const allow15m = pxPer15 >= MIN_SUBLABEL_FINE_PX;

      let lastLabelRight = -Infinity;

      const pickLabelLevel = (tUnix: number): number | null => {
        if (allow4h && tUnix % 14400 === 0) return 0;
        if (allow2h && tUnix % 7200 === 0) return 1;
        if (allow1h && tUnix % 3600 === 0) return 2;
        if (allow30m && tUnix % 1800 === 0) return 3;
        if (allow15m && tUnix % 900 === 0) return 4;
        return null;
      };

      const levelTickH = [MAJOR_H, MAJOR_H, MAJOR_H, MINOR_H, MINOR_H];
      const levelFontScale = [1.0, 1.0, 1.0, 0.95, 0.9];
      const levelAlpha = [1.0, 0.975, 0.95, 0.925, 0.9];
      const baseFont = ctx.font;
      const alignTo = tickStep;
      const startUnix = visibleStart.unix();
      const firstTickUnix = Math.floor(startUnix / alignTo) * alignTo + alignTo;
      let tick = moment.unix(firstTickUnix);

      for (
        ;
        tick.isBefore(visibleEnd.clone().add(alignTo, "seconds"));
        tick.add(tickStep, "seconds")
      ) {
        const x = tick.diff(visibleStart, "seconds") / secPerPx;
        const isLabelCandidate = tick.unix() % labelStep === 0;
        const tickH = isLabelCandidate ? MAJOR_H : MINOR_H;
        ctx.strokeStyle = colorBorder;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, tickH);
        ctx.stroke();

        const level = pickLabelLevel(tick.unix());
        if (level == null) continue;
        if (tick.minutes() % 15 !== 0) continue;

        const isHourLevel = level <= 2;
        const text = tick.format("HH:mm");
        const scale = levelFontScale[level];
        const alpha = levelAlpha[level];

        const cs = cnvTimesRef.current
          ? window.getComputedStyle(cnvTimesRef.current)
          : null;
        const fontSizePx = cs ? +cs.fontSize || 12 : 12;
        const family = cs?.fontFamily ?? "sans-serif";
        const fontSize = ~~(fontSizePx * scale);
        ctx.font = `${fontSize}px ${family}`;

        const halfW = ctx.measureText(text).width / 2;
        const leftX = x - halfW;
        const rightX = x + halfW;
        const PAD = 6;

        if (leftX <= 0 || rightX >= width) {
          ctx.font = baseFont;
          continue;
        }
        if (leftX <= lastLabelRight + PAD) {
          ctx.font = baseFont;
          continue;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = isHourLevel ? colorHours : colorMinutes;
        ctx.fillText(text, x, LABEL_BASELINE_Y);
        ctx.restore();
        lastLabelRight = rightX;
        ctx.font = baseFont;
      }

      if (current.isBetween(visibleStart, visibleEnd, null, "[]")) {
        const x = current.diff(visibleStart, "seconds") / secPerPx;
        ctx.strokeStyle = colorAccent;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        const rW = 20,
          rH = 10,
          rR = 5;
        const rX = x - rW / 2,
          rY = height - rH - 4;
        ctx.beginPath();
        ctx.moveTo(rX + rR, rY);
        ctx.lineTo(rX + rW - rR, rY);
        ctx.quadraticCurveTo(rX + rW, rY, rX + rW, rY + rR);
        ctx.lineTo(rX + rW, rY + rH - rR);
        ctx.quadraticCurveTo(rX + rW, rY + rH, rX + rW - rR, rY + rH);
        ctx.lineTo(rX + rR, rY + rH);
        ctx.quadraticCurveTo(rX, rY + rH, rX, rY + rH - rR);
        ctx.lineTo(rX, rY + rR);
        ctx.quadraticCurveTo(rX, rY, rX + rR, rY);
        ctx.closePath();
        ctx.fillStyle = colorAccent;
        ctx.fill();
        ctx.stroke();
        ctx.save();
        ctx.strokeStyle = "#fff6";
        ctx.lineWidth = 1.5;
        const gripGap = 4,
          gripHeight = 4;
        for (let i = -1; i <= 1; i++) {
          const gx = x + i * gripGap;
          ctx.beginPath();
          ctx.moveTo(gx, rY + (rH - gripHeight) / 2);
          ctx.lineTo(gx, rY + (rH - gripHeight) / 2 + gripHeight);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [setUiThrottled],
  );

  const drawLabel = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      bounds: { x: number; y: number; width: number; height: number },
      track: TLTrack,
      ordinal: number,
      index: number,
    ) => {
      const sel = getSelection();
      const isSelected = sel.trackId === track.id;
      const po = pointOverRef.current;
      const th = trackHeightRef.current;
      const isHovered = (() => {
        if (!po) return false;
        if (po.x > bounds.x + bounds.width) return false;
        const y0 = th + th * index;
        return po.y >= y0 && po.y <= y0 + th;
      })();

      ctx.fillStyle = isSelected
        ? cssVar("--color-canvas-labels-background-selected", "#ff6e16")
        : isHovered
          ? cssVar("--color-canvas-labels-background-hover", "#222a")
          : cssVar("--color-canvas-labels-background", "#2226");
      ctx.fillRect(bounds.x - 1, bounds.y, bounds.width, bounds.height);

      ctx.fillStyle = isSelected
        ? cssVar("--color-canvas-text-selected", "#fff")
        : isHovered
          ? cssVar("--color-canvas-text-hover", "#ff6000")
          : cssVar("--color-canvas-text", "#eee");

      const s = getStyles();
      ctx.font = s?.font ?? "14px sans-serif";
      const fm = ctx.measureText(track.name);
      ctx.textBaseline = "top";
      ctx.textAlign = "left";

      if (fm.width > bounds.width - 44) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(
          bounds.x + 44,
          bounds.y + 8,
          bounds.width - 44 - 10,
          fm.actualBoundingBoxAscent + fm.actualBoundingBoxDescent + 6,
        );
        ctx.clip();
        ctx.fillText(track.name, bounds.x + 44, bounds.y + 8);
        ctx.restore();
      } else {
        ctx.fillText(track.name, bounds.x + 44, bounds.y + 8);
      }

      const ordinalPath = getRoundedRectPath({
        x: bounds.x + 6,
        y: bounds.y + 6,
        width: 32,
        height: fm.actualBoundingBoxAscent + fm.actualBoundingBoxDescent + 6,
        radius: 4,
      });

      ctx.fillStyle = isSelected
        ? cssVar("--color-ordinal-background-selected", "#ff6000")
        : isHovered
          ? cssVar("--color-ordinal-background-hover", "#161616")
          : cssVar("--color-ordinal-background", "#1a1a1a");
      ctx.fill(ordinalPath);

      ctx.fillStyle = isSelected
        ? cssVar("--color-ordinal-text-selected", "#fff")
        : isHovered
          ? cssVar("--color-ordinal-text-hover", "#fff")
          : cssVar("--color-ordinal-text", "#ccc");

      ctx.globalAlpha = 0.8;
      const fontSize = parseFloat(s?.fontSize ?? "14") * 0.7;
      ctx.font = `${fontSize}px ${s?.fontFamily ?? "sans-serif"}`;
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText(ordinal.toString(), bounds.x + 30, bounds.y + 10, 20);
      ctx.globalAlpha = 1.0;

      ctx.save();
      ctx.strokeStyle = cssVar("--color-canvas-border", "#3334");
      ctx.beginPath();
      ctx.moveTo(bounds.x, bounds.y);
      ctx.lineTo(bounds.x + bounds.width, bounds.y);
      ctx.moveTo(bounds.x, bounds.y + bounds.height);
      ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const drawSessions = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      bounds: { x: number; y: number; width: number; height: number },
      track: TLTrack,
    ) => {
      ctx.save();
      const sel = getSelection();
      const selKeys = new Set(sel.sessionKeys);
      const isTrackSelected = sel.trackId === track.id;

      const hintPairs: [string, [string, string]][] = [
        ["employees", ["punch this employee in", "punch this employee out"]],
        [
          "compliances",
          ["add when violation started", "add when violation ended"],
        ],
        [
          "activities",
          ["add when activity started", "add when activity ended"],
        ],
      ];
      let sessionHints = hintPairs.find(
        (pair) => pair[0] === getCategory(),
      )?.[1] ?? ["add a session here", "close a session here"];

      ctx.strokeStyle = cssVar("--color-canvas-border", "#3334");
      if (isTrackSelected) {
        ctx.fillStyle = cssVar("--color-canvas-background-dark", "#1a1a1a55");
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }

      const chronologicalPairs = pairSessions(track.sessions, [["in", "out"]]);
      const { visibleStart, secPerPx } = getTimelineMetrics();
      const s = getStyles();
      const sessionBarH =
        parseFloat(s?.getPropertyValue("--session-bar-height") ?? "14") ||
        bounds.height / 2;
      const borderRadiusSession =
        parseFloat(s?.getPropertyValue("--border-radius-session") ?? "4") || 4;
      const times = getTimes();

      let hintText = `Press 'o' to ${sessionHints[1]}`;

      if (isTrackSelected && times) {
        const ct = moment(times.current ?? "00:00:00", "HH:mm:ss");
        const { inPair, orphanedIn, absoluteLast } = getSessionMetrics(track);

        if (orphanedIn) {
          ctx.fillStyle = cssVar("--color-session-hint-background", "#222");
          const tO = moment(orphanedIn, "HH:mm:ss");
          const xO =
            bounds.x + Math.max(0, tO.diff(visibleStart, "seconds") / secPerPx);
          const h = sessionBarH;
          const y = bounds.y + 8;
          const w = Math.max(1, ct.diff(tO, "seconds") / secPerPx);
          let radius = borderRadiusSession;
          if (w < radius * 2) radius = w / 2;
          ctx.fill(
            getRoundedRectPath({ x: xO, y, width: w, height: h, radius }),
          );

          if (absoluteLast) {
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = cssVar("--color-session-hint-text", "#999");
            const fontSize = parseFloat(s?.fontSize ?? "14");
            ctx.font = `${fontSize * 0.8}px ${s?.fontFamily ?? "sans-serif"}`;
            const fm = ctx.measureText(hintText);
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            const ty =
              y +
              (h - (fm.actualBoundingBoxAscent + fm.actualBoundingBoxDescent)) /
                2;
            ctx.fillText(hintText, xO + w + 4, ty);
            ctx.globalAlpha = 1.0;
          }
        }

        if (track.sessions.length === 0) {
          hintText = `Press 'i' to ${sessionHints[0]}`;
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = cssVar("--color-session-hint-text", "#999");
          const fontSize = parseFloat(s?.fontSize ?? "14");
          ctx.font = `${fontSize * 0.8}px ${s?.fontFamily ?? "sans-serif"}`;
          const fm = ctx.measureText(hintText);
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          const x =
            bounds.x +
            Math.max(0, ct.diff(visibleStart, "seconds") / secPerPx) +
            4;
          const ty =
            bounds.y +
            (bounds.height -
              (fm.actualBoundingBoxAscent + fm.actualBoundingBoxDescent)) /
              2;
          ctx.fillText(hintText, x, ty);
          ctx.globalAlpha = 1.0;
        }
      }

      chronologicalPairs.forEach(([start, end, type]) => {
        const isSingle = start === end;
        let startDraw = start;
        let endDrawKey = end;
        let endDraw = end;

        if (
          isResizingSessionRef.current &&
          resizeTrackIdRef.current === track.id &&
          resizeBoundRef.current &&
          start === resizeBoundRef.current.start &&
          end === resizeBoundRef.current.end
        ) {
          if (resizeBoundRef.current.previewStart)
            startDraw = resizeBoundRef.current.previewStart;
          if (resizeBoundRef.current.previewEnd)
            endDraw = resizeBoundRef.current.previewEnd;
        }

        const intervalSec = times?.interval ?? 60;
        if (isSingle) {
          endDraw = moment(startDraw, "HH:mm:ss")
            .add(intervalSec, "seconds")
            .format("HH:mm:ss");
        }

        const isSelection =
          isTrackSelected &&
          ((isSingle &&
            (selKeys.has(`in@${start}`) || selKeys.has(`out@${start}`))) ||
            (!isSingle &&
              selKeys.has(`in@${start}`) &&
              selKeys.has(`out@${endDrawKey}`)));

        const isSelectionLenient =
          isTrackSelected &&
          (selKeys.has(`in@${start}`) ||
            selKeys.has(`out@${endDrawKey}`) ||
            (isSingle &&
              (selKeys.has(`in@${start}`) || selKeys.has(`out@${start}`))));

        const t1 = moment(startDraw, "HH:mm:ss");
        const t2 = moment(endDraw, "HH:mm:ss");

        if (
          t2.isBefore(visibleStart) ||
          t1.isAfter(
            visibleStart.clone().add(bounds.width * secPerPx, "seconds"),
          )
        )
          return;

        const x1 = Math.max(0, t1.diff(visibleStart, "seconds") / secPerPx);
        const x2 = Math.min(
          bounds.width,
          t2.diff(visibleStart, "seconds") / secPerPx,
        );
        let x = bounds.x + x1;
        const h = sessionBarH;
        const y = bounds.y + 8;
        const w = Math.max(1, x2 - x1);
        let radius = isSingle ? 2 : borderRadiusSession;
        if (w < radius * 2) radius = w / 2;

        ctx.save();

        const fillCSS = isTrackSelected
          ? isSingle && type !== undefined
            ? "--color-session-single-background"
            : "--color-session-range-background"
          : "--color-session-background";
        ctx.fillStyle = cssVar(fillCSS, "#333");
        ctx.fill(getRoundedRectPath({ x, y, width: w, height: h, radius }));

        const surroundPath = getRoundedRectPath({
          x: x - 4,
          y: y - 4,
          width: w + 8,
          height: h + 8,
          radius: radius + 4,
        });

        const over = sessionOverRef.current;
        if (
          over &&
          over.track === track &&
          over.start === start &&
          over.end === endDrawKey
        ) {
          const strokeCSS = isTrackSelected
            ? isSingle && type !== undefined
              ? "--color-session-single-hover-border"
              : "--color-session-range-hover-border"
            : "--color-session-hover-border";
          ctx.strokeStyle = cssVar(strokeCSS, "#111");
          ctx.lineWidth = 1;
          ctx.stroke(getRoundedRectPath({ x, y, width: w, height: h, radius }));
        }

        const handleRadius = 4;
        const triangleSize = 8;

        if (w > (handleRadius + 3) * 2 + triangleSize || isSingle) {
          const selFillCSS = isTrackSelected
            ? isSingle && type !== undefined
              ? "--color-session-single-selected-background"
              : "--color-session-range-selected-background"
            : "--color-session-selected-background";
          ctx.fillStyle = cssVar(selFillCSS, "#333");
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = 1;

          if (isSelectionLenient) {
            ctx.stroke(surroundPath);
            ctx.strokeStyle = cssVar("--color-canvas-background", "#111");
            const tX = x + w / 2;
            const tY = y + h + triangleSize - 1;
            ctx.beginPath();
            ctx.moveTo(tX - triangleSize / 2, tY);
            ctx.lineTo(tX + triangleSize / 2, tY);
            ctx.lineTo(tX, tY - triangleSize + 2);
            ctx.closePath();
            ctx.fill();
            ctx.save();
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(tX - triangleSize / 2 - 1, tY + 0.5);
            ctx.lineTo(tX + triangleSize / 2 + 1, tY + 0.5);
            ctx.lineTo(tX, tY - triangleSize + 1.5);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
          }

          if (!isSingle && isSelection) {
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(
              x + handleRadius + 2,
              y + h / 2,
              handleRadius,
              0,
              Math.PI * 2,
            );
            ctx.arc(
              x + w - handleRadius - 2,
              y + h / 2,
              handleRadius,
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = cssVar(selFillCSS, "#333");
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }

          if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            ctx.shadowColor = "#0004";
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.strokeStyle = "#0004";
            ctx.globalCompositeOperation = "color-dodge";
            ctx.stroke(
              getRoundedRectPath({ x, y, width: w, height: h, radius }),
            );
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = "#fff1";
            ctx.stroke(
              getRoundedRectPath({
                x: x + 1,
                y: y + 1,
                width: w - 2,
                height: h - 2,
                radius,
              }),
            );
          }
        }
        ctx.restore();
      });

      if (
        isTrackSelected &&
        Array.isArray(track.markers) &&
        track.markers.length
      ) {
        const dotY = bounds.y + 8 + sessionBarH / 2;
        ctx.save();
        ctx.fillStyle = "#ff2a2a";
        ctx.globalAlpha = 0.95;
        for (const m of track.markers) {
          if (!m || !m.timestamp) continue;
          const tm = moment(m.timestamp, "HH:mm:ss");
          const mx =
            bounds.x + Math.max(0, tm.diff(visibleStart, "seconds") / secPerPx);
          if (mx < bounds.x || mx > bounds.x + bounds.width) continue;
          ctx.beginPath();
          ctx.arc(mx, dotY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.beginPath();
      ctx.moveTo(bounds.x, bounds.y);
      ctx.lineTo(bounds.x + bounds.width, bounds.y);
      ctx.moveTo(bounds.x, bounds.y + bounds.height);
      ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getTimelineMetrics, getSessionMetrics],
  );

  const drawTracks = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      bounds: { x: number; y: number; width: number; height: number },
    ) => {
      const th = trackHeightRef.current;
      const intents = intentsRef.current;
      ctx.fillStyle = cssVar("--color-canvas-labels-background", "#2226");
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

      let ordinal = 1;
      let y = bounds.y + th;
      const tracks = getDisplayedTracks();

      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        ctx.strokeStyle = cssVar("--color-canvas-border", "#3334");
        const b1 = { x: bounds.x, y, width: bounds.width, height: th };
        const b2 = {
          x: bounds.x + bounds.width,
          y,
          width: canvas.width / DPR - bounds.width,
          height: th,
        };
        drawLabel(ctx, b1, t, ordinal, i);
        drawSessions(ctx, b2, t);
        y += th;
        ordinal++;
      }

      ctx.beginPath();
      ctx.strokeStyle = intents["timeline.labels.resize"]
        ? cssVar("--color-text-hover", "#ff6000")
        : cssVar("--color-canvas-border", "#3334");
      ctx.moveTo(bounds.x + bounds.width - 1, bounds.y);
      ctx.lineTo(bounds.x + bounds.width - 1, bounds.y + bounds.height);
      ctx.closePath();
      ctx.stroke();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawLabel, drawSessions],
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(0.5, 0.5);

      if (canvas.id === "cnvMain") {
        ctx.fillStyle = cssVar("--color-canvas-background", "#111");
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const lw = sizesRef.current.timeline.labels.width / DPR;
        const bounds = { x: 0, y: 0, width: lw, height: canvas.height / DPR };
        drawTracks(ctx, canvas, bounds);
      } else if (canvas.id === "cnvTimes") {
        drawTimes(ctx, canvas);
      } else if (canvas.id === "cnvMarker") {
        drawMarker(ctx, canvas);
      }

      ctx.translate(-0.5, -0.5);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawTracks, drawTimes, drawMarker],
  );

  // ── invalidate + invalidateCanvas ───────────────────────────────────────────

  const invalidate = useCallback(() => {
    const c1 = cnvMainRef.current,
      c2 = cnvTimesRef.current,
      c3 = cnvMarkerRef.current;
    if (!c1 || !c2 || !c3) return;
    const ctx1 = c1.getContext("2d"),
      ctx2 = c2.getContext("2d"),
      ctx3 = c3.getContext("2d");
    if (ctx1) draw(ctx1, c1);
    if (ctx2) draw(ctx2, c2);
    if (ctx3) draw(ctx3, c3);

    const hasTracks = getTracks().length > 0;
    const playback = !!uiRef.current.playback;
    setToolbar((prev) => {
      const next = { ...prev, hasNoTracks: !hasTracks, playback };
      return JSON.stringify(next) !== JSON.stringify(prev) ? next : prev;
    });

    if (playback) {
      rootRef.current?.dispatchEvent(
        new CustomEvent("playback", { bubbles: true }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw]);

  const invalidateCanvas = useCallback(async () => {
    const c1 = cnvMainRef.current,
      c2 = cnvTimesRef.current,
      c3 = cnvMarkerRef.current;
    if (!c1 || !c2 || !c3 || !storageRef.current) return;

    const th = trackHeightRef.current;
    const width = c1.clientWidth;
    const height = c1.parentElement?.getBoundingClientRect().height ?? 0;
    const trackCount = getDisplayedTracks().length;
    const preferredHeight = th + th * trackCount * DPR;

    c1.width = width * DPR;
    c1.height = Math.max(preferredHeight, height * DPR);
    c1.getContext("2d")?.setTransform(DPR, 0, 0, DPR, 0, 0);

    c2.width = c2.clientWidth * DPR;
    c2.height = c2.clientHeight * DPR;
    c2.getContext("2d")?.setTransform(DPR, 0, 0, DPR, 0, 0);

    c3.width = c3.clientWidth * DPR;
    c3.height = c3.clientHeight * DPR;
    c3.getContext("2d")?.setTransform(DPR, 0, 0, DPR, 0, 0);

    if (!sizesRef.current.timeline.labels.width) {
      const stored =
        parseFloat(
          String(
            await storageRef.current.get("monitoring.timeline.labels.width"),
          ),
        ) || 280;
      sizesRef.current.timeline.labels.width = stored;
    }
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidate]);

  // ── invalidateUI ─────────────────────────────────────────────────────────────

  const invalidateUI = useCallback(() => {
    const sel = getSelection();
    const trackId = sel.trackId;
    const current = getTimes()?.current ?? "";
    const sessionKeysCount = sel.sessionKeys.length;
    const torn = tornRef.current;
    const playback = !!uiRef.current.playback;

    const uiKey = `${trackId}|${sessionKeysCount}|${torn ? 1 : 0}|${playback ? 1 : 0}`;
    const cutAvailable = hasCutAvailable();
    const patchAvailable = hasPatchAvailable();

    setToolbar((prev) => {
      const next: ToolbarState = {
        ...prev,
        torn,
        playback,
        trackSelected: trackId != null,
        cutAvailable,
        patchAvailable,
      };
      return JSON.stringify(next) !== JSON.stringify(prev) ? next : prev;
    });

    if (uiKey !== lastUiKeyRef.current) {
      lastUiKeyRef.current = uiKey;
    }

    const markerCtxKey = `${trackId}|${current}`;
    if (markerCtxKey !== lastMarkerContextKeyRef.current) {
      lastMarkerContextKeyRef.current = markerCtxKey;
    }
    emitActiveMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCutAvailable, hasPatchAvailable, emitActiveMarkers]);

  // ── invalidateSnapshot ──────────────────────────────────────────────────────

  const invalidateSnapshot = useCallback(
    async (snapshot: TimelineSnapshot | null) => {
      if (snapshot) snapshotRef.current = snapshot;
      else snapshotRef.current = (await window.timeline.snapshot()) ?? null;

      const snap = snapshotRef.current;
      const snapUi = snap?.ui ?? {};
      const pending = uiPatchRef.current;

      uiRef.current = { ...uiRef.current, ...snapUi };
      if (pending) uiRef.current = { ...uiRef.current, ...pending };

      tornRef.current = snap?.torn === true;
      const newTorn = tornRef.current;

      const newCount = getDisplayedTracks().length;
      if (newCount !== lastRenderedTrackCountRef.current) {
        lastRenderedTrackCountRef.current = newCount;
        invalidateUI();
        await invalidateCanvas();
        return;
      }

      const currentTime = snap?.timeline?.times?.current ?? "";
      const playback = !!snap?.ui?.playback;
      uiRef.current.playback = playback;

      setToolbar((prev) => ({
        ...prev,
        torn: newTorn,
        playback,
        currentTime: currentTime || "-",
        hasNoTracks: getDisplayedTracks().length === 0,
      }));

      if (playback && !isMarkerVisible()) scrollToMarkerFn();
      invalidate();
      invalidateUI();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [invalidateCanvas, invalidate, invalidateUI, isMarkerVisible],
  );

  // ── Scroll helpers ──────────────────────────────────────────────────────────

  const centerOnCurrentTime = useCallback(() => {
    const t = getTimes();
    if (!t) return;
    const current = moment(t.current, "HH:mm:ss");
    const { start, secPerPx } = getTimelineMetrics();
    const w = rootRef.current?.getBoundingClientRect().width ?? 0;
    const leftOffset = sizesRef.current.timeline.labels.width;
    const halfWindowSec = (w / 2 - leftOffset) * secPerPx;
    const desiredStart = current.clone().subtract(halfWindowSec, "seconds");
    const clamped = clampVisibleStart(desiredStart, secPerPx, w);
    const targetOffsetSec = clamped.diff(start, "seconds");
    const startOffsetSec = uiRef.current?.panOffsetSec ?? 0;
    const diff = targetOffsetSec - startOffsetSec;

    if (Math.abs(diff) < 0.1) {
      setUiThrottled({ panOffsetSec: targetOffsetSec });
      invalidate();
      triggerChange();
      animatingLocateRef.current = false;
      return;
    }
    if (animatingLocateRef.current) return;
    animatingLocateRef.current = true;
    const DURATION_MS = 700;
    const startTime = performance.now();
    const tick = (now: number) => {
      const r = Math.min(1, (now - startTime) / DURATION_MS);
      setUiThrottled({
        panOffsetSec: startOffsetSec + diff * easeInOutCubic(r),
      });
      invalidate();
      if (r < 1) requestAnimationFrame(tick);
      else {
        setUiThrottled({ panOffsetSec: targetOffsetSec });
        invalidate();
        triggerChange();
        animatingLocateRef.current = false;
      }
    };
    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTimelineMetrics, setUiThrottled, invalidate, triggerChange]);

  const scrollToSelectedTrack = useCallback(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;
    const sel = getSelection();
    const selectedIndex = getDisplayedTracks().findIndex(
      (t: TLTrack) => t.id === sel.trackId,
    );
    if (selectedIndex < 0) return;
    const th = trackHeightRef.current;
    const targetScrollTop = selectedIndex * th;
    const startScrollTop = wrapper.scrollTop;
    const diff = targetScrollTop - startScrollTop;
    if (Math.abs(diff) < 1) return;
    const DURATION_MS = 600;
    const startTime = performance.now();
    const tick = (now: number) => {
      const r = Math.min(1, (now - startTime) / DURATION_MS);
      wrapper.scrollTop = startScrollTop + diff * easeInOutCubic(r);
      if (r < 1) requestAnimationFrame(tick);
      else wrapper.scrollTop = targetScrollTop;
    };
    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToMarkerFn = useCallback(() => {
    const t = getTimes();
    if (!t) return;
    const { visibleStart: vs, secPerPx: spp, width: w } = getTimelineMetrics();
    const ve = vs.clone().add(spp * w, "s");
    const c = moment(t.current, "HH:mm:ss");
    if (c.isBefore(vs) || c.isAfter(ve)) centerOnCurrentTime();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTimelineMetrics, centerOnCurrentTime, invalidate]);

  // ── Selection helpers ───────────────────────────────────────────────────────

  const findSelectedRange = useCallback(
    (track: TLTrack) => {
      const keys = new Set(getSelection().sessionKeys);
      if (keys.size < 2) return null;
      const { sessionBounds } = getSessionMetrics(track);
      const picked = sessionBounds.find((b) => {
        if (b.start === b.end) return false;
        return keys.has(`in@${b.start}`) && keys.has(`out@${b.end}`);
      });
      if (!picked) return null;
      return { bound: picked };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [getSessionMetrics],
  );

  const isOnHandle = (
    px: number,
    py: number,
    cx: number,
    cy: number,
    r = 6,
  ) => {
    const dx = px - cx,
      dy = py - cy;
    return dx * dx + dy * dy <= r * r;
  };

  const dxToSnappedSeconds = useCallback(
    (dxCSS: number) => {
      const { secPerPx } = getTimelineMetrics();
      const rawSec = dxCSS * secPerPx;
      const step = getTimes()?.interval ?? 60;
      return Math.round(rawSec / step) * step;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [getTimelineMetrics],
  );

  // ── Timeline operations ─────────────────────────────────────────────────────

  const tear = useCallback(async () => {
    const isTorn = await window.timeline.torn();
    if (isTorn) window.timeline.attach();
    else window.timeline.detach();
  }, []);

  const moveForward = useCallback(() => void window.timeline.next(), []);
  const moveBackward = useCallback(() => void window.timeline.back(), []);
  const moveToFirst = useCallback(() => void window.timeline.first(), []);
  const moveToLast = useCallback(() => void window.timeline.last(), []);

  const play = useCallback(() => void window.timeline.play(), []);
  const pause = useCallback(() => void window.timeline.pause(), []);
  const togglePlay = useCallback(() => {
    if (uiRef.current.playback) pause();
    else play();
  }, [play, pause]);

  const addTrack = useCallback(async () => {
    const cat = getCategory();
    const names: [string, string][] = [
      ["employees", "Unidentified employee"],
      ["compliances", "Unnamed compliance"],
      ["activities", "Unclassified activity"],
    ];
    const name = names.find((n) => n[0] === cat)?.[1] ?? "Track";
    const id =
      getDisplayedTracks().reduce(
        (maxId: number, t: TLTrack) => Math.max(maxId, t.id || 0),
        0,
      ) + 1;
    await window.timeline.addTrack({ category: cat, id, name, sessions: [] });
    setUiThrottled({ selection: { trackId: id, sessionKeys: [] } });
    const snap = await window.timeline.snapshot();
    await invalidateSnapshot(snap);
    scrollToSelectedTrack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUiThrottled, invalidateSnapshot, scrollToSelectedTrack]);

  const removeTrack = useCallback(async () => {
    const trackId = getSelection().trackId;
    if (trackId == null) return;
    try {
      await window.timeline.removeTrack(trackId);
    } catch {
      /* ignored */
    }
    setUiThrottled({ selection: { trackId: null, sessionKeys: [] } });
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUiThrottled, invalidate]);

  const addSession = useCallback(async (type: "in" | "out") => {
    const t = getTimes();
    const trackId = getSelection().trackId;
    if (!t || trackId == null) return;
    await window.timeline.addSession(trackId, { type, timestamp: t.current });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteSession = useCallback(async () => {
    const sel = getSelection();
    const trackId = sel.trackId;
    const sessionKeys = sel.sessionKeys;
    if (trackId == null || sessionKeys.length === 0) return;
    for (const k of sessionKeys) {
      const [type, timestamp] = String(k).split("@");
      if (!type || !timestamp) continue;
      await window.timeline.deleteSession(trackId, { type, timestamp });
    }
    setUiThrottled({ selection: { trackId, sessionKeys: [] } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUiThrottled]);

  const cut = useCallback(async () => {
    const t = getTimes();
    const trackId = getSelection().trackId;
    if (!t || trackId == null || !hasCutAvailable()) return;
    await window.timeline.cut(trackId, null, t.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCutAvailable]);

  const patch = useCallback(async () => {
    const t = getTimes();
    const trackId = getSelection().trackId;
    if (!t || trackId == null || !hasPatchAvailable()) return;
    await window.timeline.patch(trackId, null, t.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPatchAvailable]);

  const unmarkAtCurrent = useCallback(async () => {
    const trackId = getSelection().trackId;
    const timestamp = getTimes()?.current ?? null;
    if (trackId == null || !timestamp) return;
    try {
      await window.timeline.clearMarkersAt(trackId, {
        timestamp,
        tolerance: 0.4,
      });
    } catch {
      /* ignored */
    }
    const s = await window.timeline.snapshot();
    await invalidateSnapshot(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidateSnapshot]);

  // ── Pointer / mouse handlers ─────────────────────────────────────────────────

  const handlePointerDownTimes = useCallback(
    (e: PointerEvent) => {
      if (!getTimes()) return;
      const g = getMarkerGeometry();
      const rect = cnvTimesRef.current!.getBoundingClientRect();
      const ox = e.clientX - rect.left,
        oy = e.clientY - rect.top;
      const capHit =
        ox >= g.rectX &&
        ox <= g.rectX + g.rectWidth &&
        oy >= g.rectY &&
        oy <= g.rectY + g.rectHeight;

      if (capHit) {
        isDraggingMarkerRef.current = true;
        dragMarkerPointerIdRef.current = e.pointerId;
        markerGrabDxRef.current = ox - g.x;
        cnvTimesRef.current?.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }
      if (oy > (cnvTimesRef.current?.height ?? 0) / DPR / 2) return;
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX,
        offsetSec: uiRef.current?.panOffsetSec ?? 0,
      };
      cnvTimesRef.current?.setPointerCapture(e.pointerId);
      e.preventDefault();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [getMarkerGeometry],
  );

  const handlePointerMoveTimes = useCallback(
    (e: PointerEvent) => {
      if (!getTimes()) return;
      const rect = cnvTimesRef.current?.getBoundingClientRect();
      if (!rect) return;
      const xCSS = e.clientX - rect.left;

      if (isDraggingMarkerRef.current) {
        const { width, secPerPx, visibleStart } = getTimelineMetrics();
        let x = xCSS - markerGrabDxRef.current;
        const EDGE = 18,
          DAMP = 0.03;
        if (x < EDGE) {
          setUiThrottled({
            panOffsetSec:
              (uiRef.current?.panOffsetSec ?? 0) - (EDGE - x) * DAMP * secPerPx,
          });
          x = EDGE;
        } else if (x > width - EDGE) {
          setUiThrottled({
            panOffsetSec:
              (uiRef.current?.panOffsetSec ?? 0) +
              (x - (width - EDGE)) * DAMP * secPerPx,
          });
          x = width - EDGE;
        }
        let t = visibleStart.clone().add(x * secPerPx, "seconds");
        t = clampToWindow(t);
        const times = getTimes();
        if (times?.interval) t = snapToInterval(t);
        gotoThrottled(t.format("HH:mm:ss"));
        triggerChange();
        invalidate();
        e.preventDefault();
        return;
      }

      if (!isPanningRef.current) return;
      const times = getTimes()!;
      const start = moment(times.start, "HH:mm:ss").subtract(
        times.buffer,
        "seconds",
      );
      const end = moment(times.end, "HH:mm:ss").add(times.buffer, "seconds");
      const totalSec = end.diff(start, "seconds");
      const width = (cnvTimesRef.current?.width ?? 1) / DPR;
      const zoom = clamp(uiRef.current?.zoom ?? 1, ZOOM_MIN, ZOOM_MAX);
      const secPerPx = totalSec / width / zoom;
      const dx = e.clientX - panStartRef.current.x;
      setUiThrottled({
        panOffsetSec: panStartRef.current.offsetSec - dx * secPerPx,
      });
      triggerChange();
      invalidate();
      e.preventDefault();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      getTimelineMetrics,
      setUiThrottled,
      gotoThrottled,
      triggerChange,
      invalidate,
    ],
  );

  const handlePointerUpTimes = useCallback((e: PointerEvent) => {
    if (isDraggingMarkerRef.current) {
      isDraggingMarkerRef.current = false;
      markerGrabDxRef.current = 0;
      try {
        cnvTimesRef.current?.releasePointerCapture(
          dragMarkerPointerIdRef.current!,
        );
      } catch {
        /* ignored */
      }
      dragMarkerPointerIdRef.current = null;
      return;
    }
    if (isPanningRef.current) {
      isPanningRef.current = false;
      try {
        cnvTimesRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignored */
      }
    }
  }, []);

  const handleMouseMoveTimes = useCallback(
    (e: MouseEvent) => {
      const g = getMarkerGeometry();
      const overCap =
        e.offsetX >= g.rectX &&
        e.offsetX <= g.rectX + g.rectWidth &&
        e.offsetY >= g.rectY &&
        e.offsetY <= g.rectY + g.rectHeight;
      const overTimeLabels =
        e.offsetY < (cnvTimesRef.current?.height ?? 0) / 2 / DPR;
      if (cnvTimesRef.current)
        cnvTimesRef.current.style.cursor = overCap
          ? "ew-resize"
          : overTimeLabels
            ? "grab"
            : "default";
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [getMarkerGeometry],
  );

  const handleMouseScrollTimes = useCallback(
    (e: WheelEvent) => {
      if (!getTimes() || e.deltaY === 0) return;
      const zoomOld = clamp(uiRef.current?.zoom ?? 1, ZOOM_MIN, ZOOM_MAX);
      let zoomNew = zoomOld * (e.deltaY > 0 ? 0.95 : 1.05);
      zoomNew = clamp(zoomNew, ZOOM_MIN, ZOOM_MAX, zoomNew);
      if (zoomNew === zoomOld) return;
      const { visibleStart, secPerPx, width } = getTimelineMetrics();
      const rect = cnvTimesRef.current?.getBoundingClientRect();
      if (!rect) return;
      const xCSS = e.clientX - rect.left;
      const timeAtCursor = visibleStart.clone().add(xCSS * secPerPx, "seconds");
      const times = getTimes()!;
      const bs = moment(times.start, "HH:mm:ss").subtract(
        times.buffer,
        "seconds",
      );
      const newSecPerPx = (secPerPx * zoomOld) / zoomNew;
      const newVisibleStart = timeAtCursor
        .clone()
        .subtract(xCSS * newSecPerPx, "seconds");
      const clamped = clampVisibleStart(newVisibleStart, newSecPerPx, width);
      const newPanOffsetSec = clamped.diff(bs, "seconds");
      setUiThrottled({ zoom: zoomNew, panOffsetSec: newPanOffsetSec });
      triggerChange();
      invalidate();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [getTimelineMetrics, setUiThrottled, triggerChange, invalidate],
  );

  const handleMouseMoveMain = useCallback(
    (e: MouseEvent) => {
      if (!getTimes()) return;
      const { offsetX: ox, offsetY: oy } = e;
      const lw = sizesRef.current.timeline.labels.width;
      const th = trackHeightRef.current;

      pointOverRef.current = { x: ox, y: oy };

      const sel = getSelection();
      const selectedTrack = getDisplayedTracks().find(
        (t: TLTrack) => t.id === (sel.trackId ?? null),
      );
      if (selectedTrack) {
        const { sessionBounds } = getSessionMetrics(selectedTrack);
        sessionOverRef.current = sessionBounds.find((b) => b.over) ?? null;
      } else {
        sessionOverRef.current = null;
      }

      const intents = intentsRef.current;
      intents["timeline.labels.resize"] = ox > lw - 4 && ox < lw;
      intents["timeline.labels.over"] =
        !intents["timeline.labels.resize"] && ox < lw;

      const overTrackIndex = intents["timeline.labels.over"]
        ? Math.floor((oy - th) / th)
        : -1;
      const tracks = getDisplayedTracks();
      intents["timeline.labels.over"] = tracks[overTrackIndex] != null;

      if (rootRef.current) {
        rootRef.current.style.cursor = intents["timeline.labels.resize"]
          ? "ew-resize"
          : intents["timeline.labels.over"]
            ? "pointer"
            : "default";
      }
      invalidate();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [getSessionMetrics, invalidate],
  );

  const handlePointerDownMain = useCallback(
    (e: PointerEvent) => {
      if (!getTimes()) return;
      const lw = sizesRef.current.timeline.labels.width;
      const overGutter = e.offsetX > lw - 4 && e.offsetX < lw;

      if (overGutter) {
        isResizingRef.current = true;
        resizePointerIdRef.current = e.pointerId;
        cnvMainRef.current?.setPointerCapture(e.pointerId);
        boundRef.current = rootRef.current?.getBoundingClientRect() ?? null;
        e.preventDefault();
        return;
      }

      if (e.offsetX > lw) {
        const sel = getSelection();
        const selectedTrack = getDisplayedTracks().find(
          (t: TLTrack) => t.id === sel.trackId,
        );
        if (selectedTrack) {
          const found = findSelectedRange(selectedTrack);
          if (found) {
            const { bound } = found;
            const hr = 4;
            const xLeft = bound.x + hr + 2,
              xRight = bound.x + bound.width - hr - 2;
            const yMid = bound.y + bound.height / 2;
            const onLeft = isOnHandle(e.offsetX, e.offsetY, xLeft, yMid, 7);
            const onRight = isOnHandle(e.offsetX, e.offsetY, xRight, yMid, 7);
            if (onLeft || onRight) {
              isResizingSessionRef.current = true;
              resizeSideRef.current = onLeft ? "start" : "end";
              resizeTrackIdRef.current = selectedTrack.id;
              resizeBoundRef.current = { ...bound };
              resizeStartXRef.current = e.clientX;
              cnvMainRef.current?.setPointerCapture(e.pointerId);
              resizeOrigStartRef.current = moment(bound.start, "HH:mm:ss");
              resizeOrigEndRef.current = moment(bound.end, "HH:mm:ss");
              e.preventDefault();
              return;
            }
          }
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [findSelectedRange],
  );

  const handlePointerMoveMain = useCallback(
    async (e: PointerEvent) => {
      if (!getTimes()) return;

      if (
        isResizingSessionRef.current &&
        resizeTrackIdRef.current &&
        resizeBoundRef.current
      ) {
        const rect = cnvMainRef.current?.getBoundingClientRect();
        if (!rect) return;
        const xCSS = e.clientX - rect.left;
        const { width, secPerPx } = getTimelineMetrics();
        const EDGE = 18,
          DAMP = 0.03;
        if (xCSS < EDGE)
          setUiThrottled({
            panOffsetSec:
              (uiRef.current?.panOffsetSec ?? 0) -
              (EDGE - xCSS) * DAMP * secPerPx,
          });
        else if (xCSS > width - EDGE)
          setUiThrottled({
            panOffsetSec:
              (uiRef.current?.panOffsetSec ?? 0) +
              (xCSS - (width - EDGE)) * DAMP * secPerPx,
          });

        const dx = e.clientX - resizeStartXRef.current;
        const dSec = dxToSnappedSeconds(dx);
        let newStart = resizeOrigStartRef.current!.clone();
        let newEnd = resizeOrigEndRef.current!.clone();
        if (resizeSideRef.current === "start")
          newStart = newStart.add(dSec, "seconds");
        else newEnd = newEnd.add(dSec, "seconds");

        const times = getTimes()!;
        const clampStart = moment(times.start, "HH:mm:ss");
        const clampEnd = moment(times.end, "HH:mm:ss");
        if (newStart.isBefore(clampStart)) newStart = clampStart.clone();
        if (newEnd.isAfter(clampEnd)) newEnd = clampEnd.clone();

        const minSpan = times.interval ?? 60;
        if (newEnd.diff(newStart, "seconds") < minSpan) {
          if (resizeSideRef.current === "start") {
            const candidate = newEnd.clone().subtract(minSpan, "seconds");
            newStart = candidate.isBefore(clampStart)
              ? clampStart.clone()
              : candidate;
          } else {
            const candidate = newStart.clone().add(minSpan, "seconds");
            newEnd = candidate.isAfter(clampEnd) ? clampEnd.clone() : candidate;
          }
        }

        resizeBoundRef.current.previewStart = newStart.format("HH:mm:ss");
        resizeBoundRef.current.previewEnd = newEnd.format("HH:mm:ss");
        invalidate();
        triggerChange();
        e.preventDefault();
        return;
      }

      if (!isResizingRef.current) return;
      const left =
        boundRef.current?.left ??
        cnvMainRef.current?.getBoundingClientRect().left ??
        0;
      const x = typeof e.offsetX === "number" ? e.offsetX : e.clientX - left;
      const newWidth = Math.max(80, Math.min(250, x));
      sizesRef.current.timeline.labels.width = newWidth;
      try {
        await storageRef.current?.set(
          "monitoring.timeline.labels.width",
          newWidth,
        );
        document.body.style.setProperty(
          "--timeline-labels-width",
          `${newWidth}px`,
        );
      } catch {
        /* ignored */
      }
      await invalidateCanvas();
      e.preventDefault();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      getTimelineMetrics,
      setUiThrottled,
      dxToSnappedSeconds,
      invalidate,
      triggerChange,
      invalidateCanvas,
    ],
  );

  const handlePointerUpWindow = useCallback(
    async (e: PointerEvent) => {
      if (isResizingSessionRef.current) {
        isResizingSessionRef.current = false;
        const trackId = resizeTrackIdRef.current;
        const bound = resizeBoundRef.current;
        const startNew = bound?.previewStart,
          endNew = bound?.previewEnd;
        if (trackId && bound && startNew && endNew) {
          try {
            await window.timeline.updateRange?.(trackId, {
              startOld: bound.start,
              endOld: bound.end,
              startNew,
              endNew,
            });
          } catch {
            /* ignored */
          }
        }
        resizeSideRef.current = null;
        resizeTrackIdRef.current = null;
        resizeBoundRef.current = null;
        resizeStartXRef.current = 0;
        resizeOrigStartRef.current = null;
        resizeOrigEndRef.current = null;
        try {
          cnvMainRef.current?.releasePointerCapture(e.pointerId);
        } catch {
          /* ignored */
        }
        await invalidateCanvas();
        triggerChange();
      }

      if (!isResizingRef.current) return;
      try {
        await storageRef.current?.set(
          "monitoring.timeline.labels.width",
          sizesRef.current.timeline.labels.width,
        );
      } catch {
        /* ignored */
      }
      isResizingRef.current = false;
      if (resizePointerIdRef.current != null) {
        try {
          cnvMainRef.current?.releasePointerCapture(resizePointerIdRef.current);
        } catch {
          /* ignored */
        }
        resizePointerIdRef.current = null;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [invalidateCanvas, triggerChange],
  );

  const handleClickMain = useCallback(
    (e: MouseEvent) => {
      if (!getTimes()) return;
      const so = sessionOverRef.current;
      if (so) {
        const { track, start, end } = so;
        const sessionKeys: string[] = [];
        if (start && end && start !== end)
          sessionKeys.push(`in@${start}`, `out@${end}`);
        else if (start) sessionKeys.push(`in@${start}`, `out@${start}`);
        setUiThrottled({ selection: { trackId: track.id, sessionKeys } });
        invalidate();
        triggerChange();
        return;
      }

      if (isResizingRef.current || intentsRef.current["timeline.labels.resize"])
        return;
      const lw = sizesRef.current.timeline.labels.width;
      const th = trackHeightRef.current;

      if (e.offsetX <= lw) {
        const index = Math.floor((e.offsetY - th) / th);
        const track = getDisplayedTracks()[index];
        if (!track) return;
        const wasSelected = getSelection().trackId === track.id;
        setUiThrottled({
          selection: {
            trackId: wasSelected ? null : track.id,
            sessionKeys: [],
          },
        });
        invalidate();
        triggerChange();
        return;
      }

      const trackId = getSelection().trackId;
      if (trackId != null) {
        setUiThrottled({ selection: { trackId, sessionKeys: [] } });
        triggerChange();
        invalidate();
      }
      invalidateUI();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [setUiThrottled, invalidate, triggerChange, invalidateUI],
  );

  // ── Marking system ──────────────────────────────────────────────────────────

  const startMarking = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "m" }));
  }, []);

  const stopMarking = useCallback(() => {
    if (markingRef.current)
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  }, []);

  // ── Effects ─────────────────────────────────────────────────────────────────

  // Storage init + initial snapshot
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const company = await window.timeline.company();
      const location = await window.timeline.location();
      storageRef.current = appStorage.location(company, location);
      await storageRef.current.ensure("monitoring.timeline.labels.width", 280);
      const storedW =
        parseFloat(
          String(
            await storageRef.current.get("monitoring.timeline.labels.width"),
          ),
        ) || 280;
      sizesRef.current.timeline.labels.width = storedW;
      document.body.style.setProperty(
        "--timeline-labels-width",
        `${storedW}px`,
      );

      if (rootRef.current) {
        const s = getComputedStyle(rootRef.current);
        trackHeightRef.current =
          parseInt(s.getPropertyValue("--canvas-track-height")) || 40;
      }

      const currentTime = await window.timeline.current();
      if (!cancelled) {
        setToolbar((prev) => ({ ...prev, currentTime: currentTime || "-" }));
        setUiThrottled({ category: categoryProp ?? DEFAULT_CATEGORY });
        const snap = await window.timeline.snapshot();
        await invalidateSnapshot(snap);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [categoryProp, setUiThrottled, invalidateSnapshot]);

  // IPC subscriptions
  useEffect(() => {
    const subscribers: EventSubscriber[] = [
      window.timeline.subscribe("snapshot", (s) =>
        invalidateSnapshot(s as TimelineSnapshot),
      ),
      window.timeline.subscribe("detached", (d) => {
        tornRef.current = !!(d as { torn?: boolean }).torn;
        setToolbar((p) => ({ ...p, torn: tornRef.current }));
      }),
      window.timeline.subscribe("attached", (d) => {
        tornRef.current = !!(d as { torn?: boolean }).torn;
        setToolbar((p) => ({ ...p, torn: tornRef.current }));
      }),
      window.timeline.subscribe("move", (s) => {
        invalidateSnapshot(s as TimelineSnapshot);
        rootRef.current?.dispatchEvent(
          new CustomEvent("move", { bubbles: true }),
        );
        scrollToMarkerFn();
      }),
      window.timeline.subscribe("playback", (s) =>
        invalidateSnapshot(s as TimelineSnapshot),
      ),
      window.timeline.subscribe("playback:paused", (s) => {
        invalidateSnapshot(s as TimelineSnapshot);
        uiRef.current.playback = false;
        setToolbar((p) => ({ ...p, playback: false }));
      }),
      window.timeline.subscribe("playback:ended", (s) => {
        invalidateSnapshot(s as TimelineSnapshot);
        uiRef.current.playback = false;
        setToolbar((p) => ({ ...p, playback: false }));
      }),
    ];
    return () => subscribers.forEach((s) => s.unsubscribe());
  }, [invalidateSnapshot, scrollToMarkerFn]);

  // Canvas event listeners (cnvMain + cnvTimes)
  useEffect(() => {
    const c1 = cnvMainRef.current,
      c2 = cnvTimesRef.current;
    if (!c1 || !c2) return;

    c1.addEventListener("mousemove", handleMouseMoveMain as EventListener);
    c1.addEventListener("mouseleave", () => invalidate());
    c1.addEventListener("pointerdown", handlePointerDownMain as EventListener);
    c1.addEventListener("click", handleClickMain as EventListener);

    c2.addEventListener("pointerdown", handlePointerDownTimes as EventListener);
    c2.addEventListener("mousemove", handleMouseMoveTimes as EventListener);
    c2.addEventListener("wheel", handleMouseScrollTimes as EventListener);

    window.addEventListener(
      "pointermove",
      handlePointerMoveMain as unknown as EventListener,
    );
    window.addEventListener(
      "pointerup",
      handlePointerUpWindow as unknown as EventListener,
    );
    window.addEventListener(
      "pointercancel",
      handlePointerUpWindow as unknown as EventListener,
    );
    window.addEventListener(
      "pointermove",
      handlePointerMoveTimes as unknown as EventListener,
    );
    window.addEventListener(
      "pointerup",
      handlePointerUpTimes as unknown as EventListener,
    );
    window.addEventListener(
      "pointercancel",
      handlePointerUpTimes as unknown as EventListener,
    );
    window.addEventListener("resize", () => invalidateCanvas());

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMqChange = () => invalidate();
    mq.addEventListener?.("change", onMqChange);

    return () => {
      c1.removeEventListener("mousemove", handleMouseMoveMain as EventListener);
      c1.removeEventListener(
        "pointerdown",
        handlePointerDownMain as EventListener,
      );
      c1.removeEventListener("click", handleClickMain as EventListener);
      c2.removeEventListener(
        "pointerdown",
        handlePointerDownTimes as EventListener,
      );
      c2.removeEventListener(
        "mousemove",
        handleMouseMoveTimes as EventListener,
      );
      c2.removeEventListener("wheel", handleMouseScrollTimes as EventListener);
      window.removeEventListener(
        "pointermove",
        handlePointerMoveMain as unknown as EventListener,
      );
      window.removeEventListener(
        "pointerup",
        handlePointerUpWindow as unknown as EventListener,
      );
      window.removeEventListener(
        "pointercancel",
        handlePointerUpWindow as unknown as EventListener,
      );
      window.removeEventListener(
        "pointermove",
        handlePointerMoveTimes as unknown as EventListener,
      );
      window.removeEventListener(
        "pointerup",
        handlePointerUpTimes as unknown as EventListener,
      );
      window.removeEventListener(
        "pointercancel",
        handlePointerUpTimes as unknown as EventListener,
      );
      mq.removeEventListener?.("change", onMqChange);
    };
  }, [
    handleMouseMoveMain,
    handlePointerDownMain,
    handleClickMain,
    handlePointerDownTimes,
    handleMouseMoveTimes,
    handleMouseScrollTimes,
    handlePointerMoveMain,
    handlePointerUpWindow,
    handlePointerMoveTimes,
    handlePointerUpTimes,
    invalidate,
    invalidateCanvas,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      ctrlPressedRef.current = e.ctrlKey || e.metaKey;
      if (e.key === "ArrowLeft") {
        moveBackward();
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        moveForward();
        e.preventDefault();
      } else if (e.key === "Home") {
        moveToFirst();
        e.preventDefault();
      } else if (e.key === "End") {
        moveToLast();
        e.preventDefault();
      } else if (e.key === "+") {
        addTrack();
        e.preventDefault();
      } else if (e.key === "i") {
        addSession("in");
        e.preventDefault();
      } else if (e.key === "o") {
        addSession("out");
        e.preventDefault();
      } else if (e.key === "Delete") {
        const sel = getSelection();
        const trackSel = sel.trackId != null;
        const track = trackSel
          ? getDisplayedTracks().find((t: TLTrack) => t.id === sel.trackId)
          : null;
        const sessionSel = track ? !!findSelectedRange(track) : false;
        if (trackSel && !sessionSel) removeTrack();
        else if (sessionSel) deleteSession();
      } else if (e.key === "Escape" && markingRef.current) {
        markingRef.current = false;
        markingInfoRef.current = null;
        invalidate();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    moveBackward,
    moveForward,
    moveToFirst,
    moveToLast,
    addTrack,
    addSession,
    removeTrack,
    deleteSession,
    findSelectedRange,
    invalidate,
  ]);

  // Marking hotkey (m/M key)
  useEffect(() => {
    if (markingReadyRef.current) return;
    markingReadyRef.current = true;

    const canMarkNow = () => {
      if (tornRef.current) return false;
      if (!getTimes()) return false;
      if (getSelection().trackId == null) return false;
      const imgs = Array.from(
        document.querySelectorAll<HTMLImageElement>(
          '.cameras .camera[data-loaded="true"] img',
        ),
      );
      return imgs.length > 0;
    };

    const getLoadedCameraImages = () =>
      Array.from(
        document.querySelectorAll<HTMLImageElement>(
          '.cameras .camera[data-loaded="true"] img',
        ),
      );

    const getFillMode = () =>
      (
        document.querySelector<HTMLElement>(".cameras")?.dataset?.fill ??
        "cover"
      ).toLowerCase();

    const getImageDrawBox = (img: HTMLImageElement) => {
      const r = img.getBoundingClientRect();
      const boxW = r.width,
        boxH = r.height;
      const nW = img.naturalWidth || 0,
        nH = img.naturalHeight || 0;
      const mode = getFillMode();
      if (!nW || !nH || mode === "stretch")
        return { offX: 0, offY: 0, drawW: boxW, drawH: boxH, boxW, boxH };
      const imgAR = nW / nH,
        boxAR = boxW / boxH;
      let drawW: number, drawH: number, offX: number, offY: number;
      if (mode === "contain") {
        if (imgAR > boxAR) {
          drawW = boxW;
          drawH = boxW / imgAR;
          offX = 0;
          offY = (boxH - drawH) / 2;
        } else {
          drawH = boxH;
          drawW = boxH * imgAR;
          offY = 0;
          offX = (boxW - drawW) / 2;
        }
      } else {
        if (imgAR > boxAR) {
          drawH = boxH;
          drawW = boxH * imgAR;
          offY = 0;
          offX = (boxW - drawW) / 2;
        } else {
          drawW = boxW;
          drawH = boxW / imgAR;
          offX = 0;
          offY = (boxH - drawH) / 2;
        }
      }
      return { offX, offY, drawW, drawH, boxW, boxH };
    };

    const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

    const armMarkingOnce = () => {
      if (markingRef.current) return;
      markingRef.current = true;
      const images = getLoadedCameraImages();

      const onMouseDown = (downEvent: PointerEvent) => {
        const img = downEvent.currentTarget as HTMLImageElement;
        const camera = img.closest(".camera") as HTMLElement | null;
        if (!camera) return;
        img.setPointerCapture?.(downEvent.pointerId);
        downEvent.preventDefault();
        const trackId = getSelection().trackId;
        if (trackId == null) return;
        const timestamp = getTimes()?.current;
        if (!timestamp) return;
        const cameraId = camera.dataset?.id ?? "";
        markingRef.current = true;
        markingInfoRef.current = { trackId, timestamp, cameraId };
        invalidate();

        const mode = getFillMode();
        const imgRect = img.getBoundingClientRect();
        const localX = downEvent.clientX - imgRect.left;
        const localY = downEvent.clientY - imgRect.top;
        const box = getImageDrawBox(img);
        let startNormX = clamp01((localX - box.offX) / box.drawW);
        let startNormY = clamp01((localY - box.offY) / box.drawH);
        let endNormX = startNormX;
        let endNormY = startNormY;

        const onMouseMove = (moveEvent: PointerEvent) => {
          const mlX = moveEvent.clientX - imgRect.left;
          const mlY = moveEvent.clientY - imgRect.top;
          endNormX = clamp01((mlX - box.offX) / box.drawW);
          endNormY = clamp01((mlY - box.offY) / box.drawH);
        };

        const onMouseUp = async () => {
          img.removeEventListener("pointermove", onMouseMove as EventListener);
          img.removeEventListener("pointerup", onMouseUp);
          img.removeEventListener("pointercancel", onMouseUp);
          try {
            img.releasePointerCapture?.(downEvent.pointerId);
          } catch {
            /* ignored */
          }
          const cx = (startNormX + endNormX) / 2;
          const cy = (startNormY + endNormY) / 2;
          const rx = Math.abs(endNormX - startNormX) / 2 || 0.05;
          const ry = Math.abs(endNormY - startNormY) / 2 || 0.05;
          if (trackId == null || !timestamp) return;
          const ts = toSec(timestamp);
          const marker: AddMarkerPayload = {
            timestamp,
            ts,
            cameraId,
            cx,
            cy,
            rx,
            ry,
          };
          try {
            await window.timeline.addMarker(trackId, marker);
          } catch {
            /* ignored */
          }
          markingRef.current = false;
          markingInfoRef.current = null;
          invalidate();
        };

        img.addEventListener("pointermove", onMouseMove as EventListener);
        img.addEventListener("pointerup", onMouseUp);
        img.addEventListener("pointercancel", onMouseUp);
      };

      for (const img of images) {
        img.addEventListener("pointerdown", onMouseDown as EventListener);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      if (e.key !== "m" && e.key !== "M") return;
      if (!canMarkNow()) {
        rootRef.current?.dispatchEvent(
          new CustomEvent("timeline:hint", {
            detail: "Select a track and ensure cameras are loaded to mark.",
            bubbles: true,
          }),
        );
        return;
      }
      armMarkingOnce();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidate]);

  // ResizeObserver
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => invalidateCanvas());
    observer.observe(el);
    return () => observer.disconnect();
  }, [invalidateCanvas]);

  // ── JSX ─────────────────────────────────────────────────────────────────────

  const {
    torn,
    playback,
    currentTime,
    trackSelected,
    cutAvailable,
    patchAvailable,
    hasNoTracks,
  } = toolbar;

  return (
    <Root
      ref={rootRef}
      data-torn={torn ? "true" : "false"}
      data-detached={detached ? "true" : "false"}
    >
      <UiControls className="ui-controls">
        {/* Left: session actions */}
        <div className="timeline-actions">
          <button
            aria-label="Add In"
            disabled={!trackSelected}
            onClick={() => addSession("in")}
          >
            <span className="icon icon-track-in" />
          </button>
          <button
            aria-label="Add Out"
            disabled={!trackSelected}
            onClick={() => addSession("out")}
          >
            <span className="icon icon-track-out" />
          </button>
          <button aria-label="Cut" disabled={!cutAvailable} onClick={cut}>
            <span className="icon icon-track-cut" />
          </button>
          <button aria-label="Patch" disabled={!patchAvailable} onClick={patch}>
            <span className="icon icon-track-patch" />
          </button>
          <button
            aria-label="Mark Person"
            disabled={!trackSelected}
            onClick={startMarking}
          >
            <span className="icon icon-mark-person" />
          </button>
          <button
            aria-label="Unmark Person"
            disabled={!trackSelected}
            onClick={unmarkAtCurrent}
          >
            <span className="icon icon-unmark-person" />
          </button>
          <button
            aria-label="Delete Session"
            disabled={!trackSelected}
            onClick={deleteSession}
          >
            <span className="icon icon-session-delete" />
          </button>
        </div>

        {/* Center: playback controls */}
        <div className="timeline-controls">
          <button aria-label="Move to First" onClick={moveToFirst}>
            <span className="icon icon-first" />
          </button>
          <button aria-label="Move Back" onClick={moveBackward}>
            <span className="icon icon-back" />
          </button>
          <TimeDisplay>
            <span className="time-text">{currentTime}</span>
            <button
              aria-label={playback ? "Pause" : "Play"}
              onClick={togglePlay}
            >
              <span
                className={`icon ${playback ? "icon-pause" : "icon-play"}`}
              />
            </button>
          </TimeDisplay>
          <button aria-label="Move Next" onClick={moveForward}>
            <span className="icon icon-next" />
          </button>
          <button aria-label="Move to Last" onClick={moveToLast}>
            <span className="icon icon-last" />
          </button>
        </div>

        {/* Right: track management */}
        <div className="timeline-actions">
          <button aria-label="Add Track" onClick={addTrack}>
            <span className="icon icon-track-add" />
          </button>
          <button aria-label="Mode" className="btn-mode">
            <span className="icon icon-mode" />
          </button>
          <button aria-label="Tear out" className="btn-tear" onClick={tear}>
            <span className="icon icon-tear" />
          </button>
        </div>
      </UiControls>

      <UiWrapper className="ui-wrapper">
        <CanvasTimes ref={cnvTimesRef} id="cnvTimes" />
        <CanvasMainWrapper
          ref={canvasWrapperRef}
          className="canvas-wrapper--main"
        >
          <CanvasMain ref={cnvMainRef} id="cnvMain" />
          <EmptyPlaceholder $visible={hasNoTracks}>
            Press the "+" button to add a new track.
          </EmptyPlaceholder>
        </CanvasMainWrapper>
        <CanvasMarker ref={cnvMarkerRef} id="cnvMarker" />
      </UiWrapper>
    </Root>
  );
}

MonitoringTimeline.displayName = "MonitoringTimeline";

export default MonitoringTimeline;
