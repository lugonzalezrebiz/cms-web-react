import { useMemo } from "react";
import { useTrackersByCamera } from "../../../hooks/useTrackersByCamera";
import type { CameraContextMenuItem } from "../../../components/CameraOverlayMenu";

export const useCameraMenuItems = (
  company: number,
  location: number,
  cameraId: number | null,
  handleActivitySelect: (cameraId: number, activityLabel: string, mode: "POINT" | "RANGE") => void,
): CameraContextMenuItem[] => {
  const fetchedTrackers = useTrackersByCamera(
    company,
    location,
    cameraId ?? 0,
    cameraId !== null,
  );

  return useMemo<CameraContextMenuItem[]>(
    () =>
      fetchedTrackers.map((t) => ({
        id: t.id,
        name: t.name,
        label: t.name,
        onClick: (idx: number) => handleActivitySelect(idx, t.name, t.mode),
      })),
    [fetchedTrackers, handleActivitySelect],
  );
};
