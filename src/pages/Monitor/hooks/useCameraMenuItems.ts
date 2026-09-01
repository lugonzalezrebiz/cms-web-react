import { useMemo } from "react";
import { useTrackersByCamera } from "../../../hooks/useTrackersByCamera";
import type { CameraContextMenuItem } from "../../../components/CameraLayout/CameraOverlayMenu";

export const useCameraMenuItems = (
  company: number,
  location: number,
  cameraId: number | null,
  handleActivitySelect: (cameraId: number, activityLabel: string, mode: "POINT" | "RANGE") => void,
  handleActivityReject: (cameraId: number, activityLabel: string, mode: "POINT" | "RANGE") => void,
  allTrackers: { id: number; values: string[] }[],
): CameraContextMenuItem[] => {
  const fetchedTrackers = useTrackersByCamera(
    company,
    location,
    cameraId ?? 0,
    cameraId !== null,
  );

  return useMemo<CameraContextMenuItem[]>(() => {
    const valuesById = new Map(allTrackers.map((t) => [t.id, t.values]));
    const items: CameraContextMenuItem[] = [];
    for (const t of fetchedTrackers) {
      const values = valuesById.get(t.id);
      if (t.mode === "POINT" && values?.length === 2) {
        items.push({
          id: t.id * 10 + 1,
          trackerId: t.id,
          name: values[0],
          label: t.name,
          onClick: (idx: number) => handleActivitySelect(idx, t.name, t.mode),
        });
        items.push({
          id: t.id * 10 + 2,
          trackerId: t.id,
          name: values[1],
          label: t.name,
          onClick: (idx: number) => handleActivityReject(idx, t.name, t.mode),
        });
      } else {
        items.push({
          id: t.id,
          trackerId: t.id,
          name: t.name,
          label: t.name,
          onClick: (idx: number) => handleActivitySelect(idx, t.name, t.mode),
        });
      }
    }
    return items;
  }, [fetchedTrackers, allTrackers, handleActivitySelect, handleActivityReject]);
};
