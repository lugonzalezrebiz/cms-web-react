import type { NavTab, TimelineSnapshot } from "./types";

export const NAV_TABS: { id: NavTab; label: string; iconClass: string }[] = [
  { id: "employees", label: "Employee punches", iconClass: "users-03" },
  { id: "customers", label: "Customer punches", iconClass: "users-left" },
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

// Rows for the "Employee punches" tab — empty until the employee data is wired in.
export const EMPLOYEE_TRACKS: TimelineSnapshot["timeline"]["tracks"] = [];

export type EmployeeDialogTab = "all" | "sales" | "nonsales" | "unknown";

export type EmployeeDialogTabItem = {
  key: EmployeeDialogTab;
  label: string;
  icon: string;
};

export const EMPLOYEE_DIALOG_TABS: EmployeeDialogTabItem[] = [
  { key: "all", label: "All", icon: "users-03.svg" },
  { key: "sales", label: "Sales", icon: "tag-01.svg" },
  { key: "nonsales", label: "Non.Sales", icon: "user-02.svg" },
  { key: "unknown", label: "Unknown", icon: "help-circle.svg" },
];

export type DialogEmployee = {
  id: number;
  name: string;
  lastSeen: string;
  role: string;
  type: Exclude<EmployeeDialogTab, "all">;
};

// Placeholder list for the punch-in dialog until the employee endpoint is wired in.
export const MOCK_DIALOG_EMPLOYEES: DialogEmployee[] = [
  { id: 1, name: "Michael Johnson", lastSeen: "Last seen 1 Day ago", role: "Sales representative", type: "sales" },
  { id: 2, name: "Emily Carter", lastSeen: "Last seen 2 Days ago", role: "Sales representative", type: "sales" },
  { id: 3, name: "Jessica Thompson", lastSeen: "Last seen 3 Hours ago", role: "Sales manager", type: "sales" },
  { id: 4, name: "David Miller", lastSeen: "Last seen 1 Day ago", role: "Cashier", type: "nonsales" },
  { id: 5, name: "Ashley Robinson", lastSeen: "Last seen 5 Days ago", role: "Cashier", type: "nonsales" },
  { id: 6, name: "Christopher Davis", lastSeen: "Last seen 1 Week ago", role: "Car wash attendant", type: "nonsales" },
  { id: 7, name: "Brandon Walker", lastSeen: "Last seen 2 Days ago", role: "Maintenance technician", type: "nonsales" },
  { id: 8, name: "Samantha Harris", lastSeen: "Last seen 4 Days ago", role: "Unknown", type: "unknown" },
  { id: 9, name: "Tyler Anderson", lastSeen: "Last seen 2 Weeks ago", role: "Unknown", type: "unknown" },
];

export const EMPLOYEE_DIALOG_CAMERA_SLOTS = 4;

// Customer counts offered by the Customer Punch in dialog.
export const CUSTOMER_COUNT_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

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
