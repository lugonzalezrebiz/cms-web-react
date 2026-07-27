import { createContext } from "react";

export interface MonitorState {
  handleDone: () => void;
  showFinalizeButton: boolean;
  isDoneLoading: boolean;
  unreviewedTrackerIds: Set<number>;
}

export const MonitorStateContext = createContext<MonitorState>({
  handleDone: () => {},
  showFinalizeButton: false,
  isDoneLoading: false,
  unreviewedTrackerIds: new Set(),
});

export const MonitorSetterContext = createContext<(s: MonitorState) => void>(() => {});

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
