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

export const TABS_DIALOG = [
  { key: "all", label: "All", icon: "../assets/users-03.svg" },
  { key: "sales", label: "Sales", icon: "../assets/tag-01.svg" },
  { key: "nonsales", label: "Non.Sales", icon: "../assets/user-02.svg" },
  { key: "unknown", label: "Unknow", icon: "../assets/help-circle.svg" },
];

export const PEOPLE = [
  {
    name: "Name Last Name",
    lastSeen: "Last seen 1 Day ago",
    role: "Sales representative",
  },
  {
    name: "Name Last Name",
    lastSeen: "Last seen 1 Day ago",
    role: "Sales representative",
  },
  {
    name: "Name Last Name",
    lastSeen: "Last seen 1 Day ago",
    role: "Sales representative",
  },
  {
    name: "Name Last Name",
    lastSeen: "Last seen 1 Day ago",
    role: "Sales representative",
  },
  {
    name: "Name Last Name",
    lastSeen: "Last seen 1 Day ago",
    role: "Sales representative",
  },
];