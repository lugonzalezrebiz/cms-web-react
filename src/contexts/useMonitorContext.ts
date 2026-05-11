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
) => {
  const set = useMonitorSetter();
  useEffect(() => {
    set({ handleDone, showFinalizeButton } satisfies MonitorState);
  }, [handleDone, showFinalizeButton, set]);
};
