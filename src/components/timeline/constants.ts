import type { NavTab, TimelineSnapshot } from "./types";

export const NAV_TABS: { id: NavTab; label: string; iconClass: string }[] = [
  //{ id: "employees", label: "Employee punches", iconClass: "users-03" },
  { id: "compliances", label: "Compliance violations", iconClass: "shield-tick" },
 // { id: "activities", label: "Activities", iconClass: "placeholder" },
];

export const CAMERA_OPTIONS = [
  "Off",
  "Collision",
  "Car door open",
  "Violent behaviours",
  "Human in tunnel",
  "Slip & Fall",
];

export const TUNNEL_CAMERAS: TimelineSnapshot["timeline"]["tracks"] = [
  { id: 1, name: "Camera 1", category: "activities", sessions: [] },
  { id: 2, name: "Camera 2", category: "activities", sessions: [] },
  { id: 3, name: "Camera 3", category: "activities", sessions: [] },
  { id: 4, name: "Camera 4", category: "activities", sessions: [] },
  { id: 5, name: "Camera 5", category: "activities", sessions: [] },
  { id: 6, name: "Camera 6", category: "activities", sessions: [] },
];

export const TIMELINE_TOTAL_SEC = 24 * 3600;
export const MIN_PIXELS_PER_TICK = 60;
const DEFAULT_MAX_ZOOM = 72;
export const DEFAULT_ZOOM_TICK_STEP_SEC = 600;

export const getZoomForTickStep = (gridWidthPx: number, stepSec: number): number =>
  Math.ceil((MIN_PIXELS_PER_TICK * TIMELINE_TOTAL_SEC) / (stepSec * gridWidthPx));

export const getMaxZoom = (gridWidthPx: number, imagesIntervalSec: number): number => {
  if (!gridWidthPx || !imagesIntervalSec) return DEFAULT_MAX_ZOOM;
  return Math.max(DEFAULT_MAX_ZOOM, getZoomForTickStep(gridWidthPx, imagesIntervalSec));
};

export const MOCK_SNAPSHOT: TimelineSnapshot = {
  timeline: {
    times: {
      start: "08:00:00",
      end: "23:00:00",
      current: "12:30:00",
      buffer: 0,
      interval: 3600,
      businessStart: "09:00:00",
      businessEnd: "19:00:00",
      actualStart: "08:55:00",
      actualEnd: "18:05:00",
    },
    tracks: [
      {
        id: 1,
        name: "John Smith",
        category: "employees" as NavTab,
        sessions: [],
      },
      {
        id: 2,
        name: "Maria Garcia",
        category: "employees" as NavTab,
        sessions: [],
      },
    ],
  },
  ui: {
    panOffsetSec: 0,
    zoom: 1,
    category: "employees" as NavTab,
    playback: false,
  },
};
