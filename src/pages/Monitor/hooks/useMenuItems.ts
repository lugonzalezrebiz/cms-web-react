import { useState, useMemo } from "react";
import type { CameraContextMenuItem } from "../../../components/EventMenu";
import type { CameraEventPoint } from "../../../components/timeline/types";

const TAG_TOLERANCE_SEC = 300;

export const useMenuItems = (
  trackers: { id: number; name: string }[],
  handleActivitySelect: (cameraIndex: number, activityLabel: string) => void,
  allEventPoints: CameraEventPoint[],
  activeMarkerSec: number,
) => {
  const [extraMenuItems, setExtraMenuItems] = useState<CameraContextMenuItem[]>([]);

  const handleAddMenuItem = (label: string) => {
    setExtraMenuItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: label,
        label,
        onClick: (index) => handleActivitySelect(index, label),
      },
    ]);
  };

  const cameraMenuItems: CameraContextMenuItem[] = trackers.map((t) => ({
    id: t.id,
    name: t.name,
    label: t.name,
    onClick: (index) => handleActivitySelect(index, t.name),
  }));

  const allMenuItems = [...cameraMenuItems, ...extraMenuItems];

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of allMenuItems) {
      counts[item.label] = new Set(
        allEventPoints
          .filter(
            (ep) =>
              ep.label === item.label &&
              Math.abs(activeMarkerSec - ep.timeSec) <= TAG_TOLERANCE_SEC,
          )
          .map((ep) => ep.cameraId),
      ).size;
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMenuItems.length, allEventPoints, activeMarkerSec]);

  return { allMenuItems, handleAddMenuItem, itemCounts };
};
