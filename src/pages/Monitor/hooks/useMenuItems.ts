import type { CameraContextMenuItem } from "../../../components/CameraOverlayMenu";

const STATIC_ITEMS = [
  "Event",
  "E-Stop Activation",
  "Unattended Pay Station",
  "Collision In Tunnel",
  "Human in Tunnel",
  "Slip & Fall"
];

export const useMenuItems = (
  trackers: { id: number; name: string }[],
  handleActivitySelect: (cameraIndex: number, activityLabel: string) => void,
) => {
  const cameraMenuItems: CameraContextMenuItem[] = trackers.map((t) => ({
    id: t.id,
    name: t.name,
    label: t.name,
    onClick: (index) => handleActivitySelect(index, t.name),
  }));

  const staticMenuItems: CameraContextMenuItem[] = STATIC_ITEMS.map(
    (label, i) => ({
      id: -(i + 1),
      name: label,
      label,
      onClick: (index) => handleActivitySelect(index, label),
    }),
  );

  return { allMenuItems: [...cameraMenuItems, ...staticMenuItems] };
};
