export type NavTab = "employees" | "compliances" | "activities";

export interface TimelineBodyHandle {
  stepMarker: (deltaSec: number) => void;
  setMarker: (sec: number) => void;
  togglePlay: () => void;
}

export interface TimelineSnapshot {
  timeline: {
    times: {
      start: string;
      end: string;
      current: string;
      buffer: number;
      interval: number;
      businessStart: string;
      businessEnd: string;
      actualStart: string;
      actualEnd: string;
    };
    tracks: {
      id: number;
      name: string;
      category: NavTab;
      sessions: {
        type: "in" | "out";
        timestamp: string;
      }[];
    }[];
  };
  ui: {
    panOffsetSec: number;
    zoom: number;
    category: NavTab;
    playback: boolean;
  };
}

export type FlatRow = {
  id: number;
  name: string;
  kind: "camera" | "activity" | "event";
  parentCameraId?: number;
  cameraNumber: number;
  sessions: { type: "in" | "out"; timestamp: string }[];
};

export type CameraEventPoint = {
  id: number;
  cameraId: number;
  timeSec: number;
  startSec: number;
  endSec: number;
  label: string;
  reviewed: boolean;
  value: boolean;
  mode: "POINT" | "RANGE";
  entryIds?: number[];
};

export type ResizingState = { id: number; side: "left" | "right" } | null;
export type SetResizing = React.Dispatch<React.SetStateAction<ResizingState>>;

export type RangeSessions = Record<number, { type: "in" | "out"; timestamp: string }[]>;

export type DragConfig = { target: "start" | "end"; minSec: number; maxSec: number };
