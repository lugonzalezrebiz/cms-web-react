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
  rejected?: boolean;
  accepted?: boolean;
};

export type ResizingState = { id: number; side: "left" | "right" } | null;
export type SetResizing = React.Dispatch<React.SetStateAction<ResizingState>>;

// The clip playback is scoped to when a diamond is selected: start/end bound the review
// window, center is where the marker snaps back to once playback finishes.
export type PlayWindow = { start: number; end: number; center: number };

export type EventPointUpdate = Partial<Pick<CameraEventPoint, "timeSec" | "startSec" | "endSec">>;

export interface TimelineBodyProps {
  snapshot?: TimelineSnapshot;
  posSnapshot?: TimelineSnapshot;
  posEventPoints?: CameraEventPoint[];
  activeTab: NavTab;
  selectedTab?: string;
  cameraActivities?: {
    id: number;
    cameraId: number;
    activityLabel: string;
  }[];
  cameraEventPoints?: CameraEventPoint[];
  onMarkerChange?: (sec: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onUpdateEventPoint?: (id: number, update: Partial<Pick<CameraEventPoint, "startSec" | "endSec">>) => void;
}
