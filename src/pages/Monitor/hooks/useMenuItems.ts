import type { CameraContextMenuItem } from "../../../components/CameraOverlayMenu";

export const useMenuItems = (
  trackers: { id: number; name: string }[],
  handleActivitySelect: (cameraIndex: number, activityLabel: string) => void,
) => {
  const allMenuItems: CameraContextMenuItem[] = trackers.map((t) => ({
    id: t.id,
    name: t.name,
    label: t.name,
    onClick: (index) => handleActivitySelect(index, t.name),
  }));

  return { allMenuItems };
};
