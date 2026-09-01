import { useState, useCallback, type ReactNode } from "react";
import {
  MonitorStateContext,
  MonitorSetterContext,
  CameraGroupContext,
} from "./MonitorContexts";

export const MonitorProvider = ({ children }: { children: ReactNode }) => {
  const [state, setStateInternal] = useState({
    handleDone: () => {},
    showFinalizeButton: false,
    isDoneLoading: false,
    unreviewedTrackerIds: new Set<number>(),
    aiTrackerIds: new Set<number>(),
  });

  const setState = useCallback((s: typeof state) => setStateInternal(s), []);
  const [cameraGroup, setCameraGroup] = useState("tracker");
  const [trackerOption, setTrackerOption] = useState("");
  const [customTrackerIDs, setCustomTrackerIDs] = useState<string[]>([]);

  return (
    <MonitorSetterContext.Provider value={setState}>
      <MonitorStateContext.Provider value={state}>
        <CameraGroupContext.Provider
          value={{ cameraGroup, setCameraGroup, trackerOption, setTrackerOption, customTrackerIDs, setCustomTrackerIDs }}
        >
          {children}
        </CameraGroupContext.Provider>
      </MonitorStateContext.Provider>
    </MonitorSetterContext.Provider>
  );
};
