import { useState, useCallback, useMemo, type ReactNode } from "react";
import {
  MonitorStateContext,
  MonitorSetterContext,
  CameraGroupContext,
  TimelineTabContext,
} from "./MonitorContexts";
import type { NavTab } from "../components/timeline/types";

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
  const [activeTab, setActiveTab] = useState<NavTab>("compliances");
  const timelineTab = useMemo(
    () => ({ activeTab, setActiveTab }),
    [activeTab],
  );

  return (
    <MonitorSetterContext.Provider value={setState}>
      <MonitorStateContext.Provider value={state}>
        <CameraGroupContext.Provider
          value={{ cameraGroup, setCameraGroup, trackerOption, setTrackerOption, customTrackerIDs, setCustomTrackerIDs }}
        >
          <TimelineTabContext.Provider value={timelineTab}>
            {children}
          </TimelineTabContext.Provider>
        </CameraGroupContext.Provider>
      </MonitorStateContext.Provider>
    </MonitorSetterContext.Provider>
  );
};
