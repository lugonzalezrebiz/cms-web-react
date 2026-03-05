export type NavTab = "employees" | "compliances" | "activities";

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
  kind: "camera" | "activity";
  parentCameraId?: number;
  cameraNumber: number;
  sessions: { type: "in" | "out"; timestamp: string }[];
};

export interface TimelineBodyProps {
  snapshot?: TimelineSnapshot;
  activeTab: NavTab;
  selectedTab?: string;
  cameraActivities?: {
    id: number;
    cameraIndex: number;
    activityLabel: string;
  }[];
}
