import { createContext } from "react";

export interface LocationGuardContextType {
  // Runs an immediate geolocation check, arms the guard dialog if it fails
  // (and STRICT_GEOLOCATION is on), and resolves with the coordinates so
  // callers (e.g. login) can attach them to a request.
  checkNow: () => Promise<{ lat: number; lon: number } | null>;
}

export const LocationGuardContext = createContext<LocationGuardContextType | null>(null);
