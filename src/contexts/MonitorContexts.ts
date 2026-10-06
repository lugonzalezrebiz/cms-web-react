import { createContext } from "react";
import type { NavTab } from "../components/timeline/types";

export interface MonitorState {
  handleDone: () => void;
  showFinalizeButton: boolean;
  isDoneLoading: boolean;
  unreviewedTrackerIds: Set<number>;
  aiTrackerIds: Set<number>;
}

export const MonitorStateContext = createContext<MonitorState>({
  handleDone: () => {},
  showFinalizeButton: false,
  isDoneLoading: false,
  unreviewedTrackerIds: new Set(),
  aiTrackerIds: new Set(),
});

export const MonitorSetterContext = createContext<(s: MonitorState) => void>(() => {});

// Which timeline tab is showing (Employee/Customer punches, Compliance
// violations), shared so the header can show that tab's shortcuts.
export const TimelineTabContext = createContext<{
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}>({
  activeTab: "compliances",
  setActiveTab: () => {},
});

export const CameraGroupContext = createContext<{
  cameraGroup: string;
  setCameraGroup: (v: string) => void;
  trackerOption: string;
  setTrackerOption: (v: string) => void;
  customTrackerIDs: string[];
  setCustomTrackerIDs: (ids: string[]) => void;
}>({
  cameraGroup: "0",
  setCameraGroup: () => {},
  trackerOption: "",
  setTrackerOption: () => {},
  customTrackerIDs: [],
  setCustomTrackerIDs: () => {},
});
