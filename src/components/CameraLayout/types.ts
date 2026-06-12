import type { CameraContextMenuItem } from "./CameraOverlayMenu";
import type { CameraInfo } from "../../hooks/useExitingCameras";
import type { CameraEventPoint } from "../timeline/types";

export const GAP = 8;
export const TRANSITION_MS = 200;

export interface SharedCameraItemProps {
  expandCamera: (index: number) => void;
  onRemoveTag: (tagId: number) => void;
  getTagsForCamera: (index: number) => CameraContextMenuItem[];
  contextMenuItems: CameraContextMenuItem[];
  onMenuOpen?: (index: number) => void;
  cameras?: CameraInfo[];
  company?: number;
  location?: number;
  date?: string;
  timestamp?: string;
  openMenuIndex: number | null;
  onCloseMenu: () => void;
  exitingIds: ReadonlySet<number>;
  skipAnimation?: boolean;
}

export interface CameraLayoutProps {
  count: number;
  maxHeight?: number | string;
  contextMenuItems?: CameraContextMenuItem[];
  onMenuOpen?: (index: number) => void;
  cameras?: CameraInfo[];
  company?: number;
  location?: number;
  date?: string;
  timestamp?: string;
  cameraEventPoints?: CameraEventPoint[];
  markerSec?: number;
  onRemoveEventPoint?: (id: number) => void;
  expandedCamera: number | null;
  onExpandCamera: (index: number) => void;
  loadState?: boolean;
}

export const getRowDistribution = (count: number): number[] => {
  if (count === 0) return [];

  const effective = count > 1 && count % 2 !== 0 ? count + 1 : count;

  if (effective <= 12) {
    const numRows = effective <= 2 ? 1 : effective <= 8 ? 2 : 3;
    const rows: number[] = [];
    let remaining = effective;
    for (let i = 0; i < numRows; i++) {
      const rowCount = Math.ceil(remaining / (numRows - i));
      rows.push(rowCount);
      remaining -= rowCount;
    }
    return rows;
  }

  if (count > 16 && count % 5 === 0) {
    const rows: number[] = [];
    let remaining = count;
    while (remaining > 0) {
      rows.push(Math.min(remaining, 5));
      remaining -= 5;
    }
    return rows;
  }

  const rows: number[] = [];
  let remaining = effective;
  while (remaining > 0) {
    rows.push(Math.min(remaining, 4));
    remaining -= 4;
  }
  return rows;
};
