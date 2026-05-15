import { useMemo } from "react";
import { useTrackersByCamera } from "../../../hooks/useTrackersByCamera";
import type { CameraContextMenuItem } from "../../../types";

export const useCameraMenuItems = (
  company: number,
  location: number,
  openMenuCamera: number | null,
  handleActivitySelect: (cameraIndex: number, activityLabel: string, mode: "POINT" | "RANGE") => void,
): CameraContextMenuItem[] => {
  const fetchedTrackers = useTrackersByCamera(
    company,
    location,
    (openMenuCamera ?? 0) + 1,
    openMenuCamera !== null,
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
