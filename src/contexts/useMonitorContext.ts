import { useContext, useEffect } from "react";
import {
  MonitorStateContext,
  MonitorSetterContext,
  CameraGroupContext,
  type MonitorState,
} from "./MonitorContexts";

export const useMonitorState = () => useContext(MonitorStateContext);
export const useMonitorSetter = () => useContext(MonitorSetterContext);
export const useCameraGroup = () => useContext(CameraGroupContext);

export const useRegisterMonitorActions = (
  handleDone: () => void,
  showFinalizeButton: boolean,
  isDoneLoading: boolean,
  unreviewedTrackerIds: Set<number> = new Set(),
  aiTrackerIds: Set<number> = new Set(),
) => {
  const set = useMonitorSetter();
  useEffect(() => {
    set({
      handleDone,
      showFinalizeButton,
      isDoneLoading,
      unreviewedTrackerIds,
      aiTrackerIds,
    } satisfies MonitorState);
  }, [handleDone, showFinalizeButton, isDoneLoading, unreviewedTrackerIds, aiTrackerIds, set]);
};
