import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface MonitorState {
  handleDone: () => void;
  showFinalizeButton: boolean;
}

const MonitorStateContext = createContext<MonitorState>({
  handleDone: () => {},
  showFinalizeButton: false,
});

const MonitorSetterContext = createContext<(s: MonitorState) => void>(() => {});

const CameraGroupContext = createContext<{
  cameraGroup: string;
  setCameraGroup: (v: string) => void;
}>({ cameraGroup: "1", setCameraGroup: () => {} });

export function MonitorProvider({ children }: { children: ReactNode }) {
  const [state, setStateInternal] = useState<MonitorState>({
    handleDone: () => {},
    showFinalizeButton: false,
  });

  const setState = useCallback((s: MonitorState) => setStateInternal(s), []);
  const [cameraGroup, setCameraGroup] = useState("1");

  return (
    <MonitorSetterContext.Provider value={setState}>
      <MonitorStateContext.Provider value={state}>
        <CameraGroupContext.Provider value={{ cameraGroup, setCameraGroup }}>
          {children}
        </CameraGroupContext.Provider>
      </MonitorStateContext.Provider>
    </MonitorSetterContext.Provider>
  );
}

export const useMonitorState = () => useContext(MonitorStateContext);
export const useMonitorSetter = () => useContext(MonitorSetterContext);
export const useCameraGroup = () => useContext(CameraGroupContext);

export function useRegisterMonitorActions(
  handleDone: () => void,
  showFinalizeButton: boolean,
) {
  const set = useMonitorSetter();
  useEffect(() => {
    set({ handleDone, showFinalizeButton });
  }, [handleDone, showFinalizeButton, set]);
}
