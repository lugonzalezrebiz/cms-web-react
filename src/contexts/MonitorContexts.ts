import { createContext } from "react";

export interface MonitorState {
  handleDone: () => void;
  showFinalizeButton: boolean;
}

export const MonitorStateContext = createContext<MonitorState>({
  handleDone: () => {},
  showFinalizeButton: false,
});

export const MonitorSetterContext = createContext<(s: MonitorState) => void>(() => {});

export const CameraGroupContext = createContext<{
  cameraGroup: string;
  setCameraGroup: (v: string) => void;
  trackerOption: string;
  setTrackerOption: (v: string) => void;
  customTrackerIDs: number[];
  setCustomTrackerIDs: (ids: number[]) => void;
}>({
  cameraGroup: "0",
  setCameraGroup: () => {},
  trackerOption: "",
  setTrackerOption: () => {},
  customTrackerIDs: [],
  setCustomTrackerIDs: () => {},
});
