import type { NavTab, TimelineSnapshot } from "./types";

export const NAV_TABS: { id: NavTab; label: string; iconClass: string }[] = [
  { id: "employees", label: "Employee punches", iconClass: "users-03" },
  { id: "compliances", label: "Compliance violations", iconClass: "shield-tick" },
  { id: "activities", label: "Activities", iconClass: "placeholder" },
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
  { id: 101, name: "Camera 1", category: "activities", sessions: [] },
  { id: 102, name: "Camera 2", category: "activities", sessions: [] },
  { id: 103, name: "Camera 3", category: "activities", sessions: [] },
  { id: 104, name: "Camera 4", category: "activities", sessions: [] },
  { id: 105, name: "Camera 5", category: "activities", sessions: [] },
  { id: 106, name: "Camera 6", category: "activities", sessions: [] },
];

export const MOCK_SNAPSHOT: TimelineSnapshot = {
  timeline: {
    times: {
      start: "09:00:00",
      end: "19:00:00",
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
      {
        id: 3,
        name: "Speed violation",
        category: "compliances" as NavTab,
        sessions: [
          { type: "in" as const, timestamp: "10:15:00" },
          { type: "out" as const, timestamp: "10:20:00" },
        ],
      },
      {
        id: 4,
        name: "Loading bay",
        category: "activities" as NavTab,
        sessions: [
          { type: "in" as const, timestamp: "11:00:00" },
          { type: "out" as const, timestamp: "14:30:00" },
        ],
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
