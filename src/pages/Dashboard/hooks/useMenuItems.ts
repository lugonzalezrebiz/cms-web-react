import { useState } from "react";
import type { CameraContextMenuItem } from "../../../components/EventMenu";

export const useMenuItems = (
  trackers: { id: number; name: string }[],
  handleActivitySelect: (cameraIndex: number, activityLabel: string) => void,
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

  return {
    allMenuItems: [...cameraMenuItems, ...extraMenuItems],
    handleAddMenuItem,
  };
};
