import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LocationGuardContext } from "./LocationGuardContextDef";
import LocationGuard from "../components/LocationGuard";
import useAuth from "../hooks/useAuth";
import { STRICT_GEOLOCATION } from "../config";

const CHECK_INTERVAL_MS = 5000;
const GEOLOCATION_TIMEOUT_MS = 5000;
const TICK_MS = 250;

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
  const [checking, setChecking] = useState(false);
  // Timestamp the next background check is due; drives both the poll loop
  // below and the countdown shown in the dialog.
  const [nextCheckAt, setNextCheckAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const checkNow = useCallback(async () => {
    setChecking(true);
    const location = await getGeolocation();
    setChecking(false);
    if (STRICT_GEOLOCATION) {
      setDismissed(false);
      setBlocked(!location);
    }
    // Re-arm the background loop from this point so it doesn't immediately
    // re-check again right after a manual/explicit check.
    setNextCheckAt(Date.now() + CHECK_INTERVAL_MS);
    return location;
  }, []);

  useEffect(() => {
    if (!STRICT_GEOLOCATION) return;

    let cancelled = false;
    const delay = Math.max(0, nextCheckAt - Date.now());
    const timeout = setTimeout(async () => {
      setChecking(true);
      const location = await getGeolocation();
      if (cancelled) return;
      setChecking(false);
      setBlocked(!location);
      setNextCheckAt(Date.now() + CHECK_INTERVAL_MS);
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [nextCheckAt]);

  // Ticks `now` forward so the dialog's countdown stays in sync with nextCheckAt.
  useEffect(() => {
    if (!STRICT_GEOLOCATION) return;
    const interval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const secondsUntilCheck = Math.max(0, Math.ceil((nextCheckAt - now) / 1000));

  const handleOpenSettings = async () => {
    if (!window.api?.openLocationSettings) return;
    setOpening(true);
    try {
      await window.api.openLocationSettings();
    } finally {
      setOpening(false);
    }
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
        checking={checking}
        secondsUntilCheck={secondsUntilCheck}
        onOpenSettings={handleOpenSettings}
        onCancel={handleCancel}
      />
    </LocationGuardContext.Provider>
  );
}

export default LocationGuardProvider;
