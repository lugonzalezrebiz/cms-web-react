export type Camera = { id: number; name: string };

export interface CameraContextMenuItem {
  id: number;
  name: string;
  label: string;
  icon?: string;
  shortcut?: string;
  dividerAfter?: boolean;
  reviewed?: boolean;
  onClick: (cameraIndex: number) => void;
}
