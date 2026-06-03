import type { CameraContextMenuItem } from "../../../components/CameraOverlayMenu";

export const useMenuItems = (
  trackers: { id: number; name: string; mode: "POINT" | "RANGE" }[],
  handleActivitySelect: (cameraId: number, activityLabel: string, mode: "POINT" | "RANGE") => void,
) => {
  const allMenuItems: CameraContextMenuItem[] = trackers.map((t) => ({
    id: t.id,
    name: t.name,
    label: t.name,
    onClick: (index) => handleActivitySelect(index, t.name, t.mode),
  }));

  return { allMenuItems };
};
