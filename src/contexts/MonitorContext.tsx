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

export function MonitorProvider({ children }: { children: ReactNode }) {
  const [state, setStateInternal] = useState<MonitorState>({
    handleDone: () => {},
    showFinalizeButton: false,
  });

  const setState = useCallback((s: MonitorState) => setStateInternal(s), []);

  return (
    <MonitorSetterContext.Provider value={setState}>
      <MonitorStateContext.Provider value={state}>
        {children}
      </MonitorStateContext.Provider>
    </MonitorSetterContext.Provider>
  );
}

export const useMonitorState = () => useContext(MonitorStateContext);
export const useMonitorSetter = () => useContext(MonitorSetterContext);

export function useRegisterMonitorActions(
  handleDone: () => void,
  showFinalizeButton: boolean,
) {
  const set = useMonitorSetter();
  useEffect(() => {
    set({ handleDone, showFinalizeButton });
  }, [handleDone, showFinalizeButton, set]);
}
