import { useEffect, useRef } from "react";

export const useAutoSaveOnUnmount = (handleDone: () => void) => {
  const handleDoneRef = useRef(handleDone);
  useEffect(() => { handleDoneRef.current = handleDone; }, [handleDone]);

  useEffect(() => {
    let active = false;
    const id = setTimeout(() => { active = true; }, 0);
    return () => {
      clearTimeout(id);
      if (active) handleDoneRef.current();
    };
  }, []);
};
