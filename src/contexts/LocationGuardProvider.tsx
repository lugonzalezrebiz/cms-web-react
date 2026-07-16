import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LocationGuardContext } from "./LocationGuardContextDef";
import LocationGuard from "../components/LocationGuard";
import useAuth from "../hooks/useAuth";
import { STRICT_GEOLOCATION } from "../config";

const CHECK_INTERVAL_MS = 5000;
const GEOLOCATION_TIMEOUT_MS = 5000;

// Resolves to null (rather than rejecting) on denial, timeout, or an environment
// without geolocation support, so callers can decide how to react.
function getGeolocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => resolve(null),
      { timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 0 },
    );
  });
}

export function LocationGuardProvider({ children }: { children: ReactNode }) {
  const { authenticated, logout } = useAuth();
  const [blocked, setBlocked] = useState(false);
  // Only the not-authenticated (pre-login) dialog can be dismissed without
  // consequence; it stays hidden until the next explicit checkNow() call
  // (i.e. the next login attempt) even if the background poll keeps finding
  // the permission missing.
  const [dismissed, setDismissed] = useState(false);
  const [opening, setOpening] = useState(false);

  const checkNow = useCallback(async () => {
    const location = await getGeolocation();
    if (STRICT_GEOLOCATION) {
      setDismissed(false);
      setBlocked(!location);
    }
    return location;
  }, []);

  useEffect(() => {
    if (!STRICT_GEOLOCATION) return;

    let cancelled = false;
    const poll = async () => {
      const location = await getGeolocation();
      if (cancelled) return;
      setBlocked(!location);
    };

    poll();
    const interval = setInterval(poll, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleOpenSettings = async () => {
    if (!window.api?.openLocationSettings) return;
    setOpening(true);
    try {
      await window.api.openLocationSettings();
    } finally {
      setOpening(false);
    }
  };

  const handleRetry = () => {
    checkNow();
  };

  const handleCancel = () => {
    if (authenticated) {
      logout();
      return;
    }
    setDismissed(true);
  };

  const open = STRICT_GEOLOCATION && blocked && !dismissed;

  return (
    <LocationGuardContext.Provider value={{ checkNow }}>
      {children}
      <LocationGuard
        open={open}
        authenticated={authenticated}
        opening={opening}
        onOpenSettings={handleOpenSettings}
        onRetry={handleRetry}
        onCancel={handleCancel}
      />
    </LocationGuardContext.Provider>
  );
}

export default LocationGuardProvider;
