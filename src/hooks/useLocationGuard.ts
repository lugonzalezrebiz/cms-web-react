import { useContext } from "react";
import type { LocationGuardContextType } from "../contexts/LocationGuardContextDef";
import { LocationGuardContext } from "../contexts/LocationGuardContextDef";

const useLocationGuard = (): LocationGuardContextType => {
  const context = useContext(LocationGuardContext);
  if (!context) {
    throw new Error("useLocationGuard must be used within LocationGuardProvider");
  }
  return context;
};

export default useLocationGuard;
