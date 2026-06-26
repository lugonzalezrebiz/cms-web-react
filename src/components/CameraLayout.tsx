import { useState } from "react";
import { useExitingCameras } from "../hooks/useExitingCameras";
import { useTagsForCamera } from "../hooks/useTagsForCamera";
import CameraLoadingState from "./CameraLayout/CameraLoadingState";
import CameraScrollableGrid from "./CameraLayout/CameraScrollableGrid";
import CameraStaticGrid from "./CameraLayout/CameraStaticGrid";
import {
  GAP,
  TRANSITION_MS,
  getRowDistribution,
  type CameraLayoutProps,
  type SharedCameraItemProps,
} from "./CameraLayout/types";

export type { CameraInfo } from "../hooks/useExitingCameras";
export { TAG_TOLERANCE_SEC } from "../hooks/useTagsForCamera";
export { CameraItem } from "./CameraLayout/CameraItem";
export type { CameraContextMenuItem } from "./CameraLayout/CameraOverlayMenu";

const CameraLayout = ({
  count,
  maxHeight = 350,
  contextMenuItems = [],
  onMenuOpen,
  cameras,
  company,
  location,
  date,
  timestamp,
  cameraEventPoints = [],
  markerSec = 0,
  onRemoveEventPoint,
  onExpandCamera: handleExpandCamera,
  loadState = false,
}: CameraLayoutProps) => {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  const { renderedCameras, exitingIds, skipAnimation } = useExitingCameras(
    loadState ? undefined : cameras,
    count,
    TRANSITION_MS,
  );
  const getTagsForCamera = useTagsForCamera(
    cameraEventPoints,
    markerSec,
    renderedCameras,
  );

  const scrollable = renderedCameras.length > 16;
  const totalHeight =
    typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;
  const rowHeight = scrollable ? `calc((100% - ${GAP * 2}px) / 3)` : undefined;

  const sharedProps: SharedCameraItemProps = {
    expandCamera: handleExpandCamera,
    onRemoveTag: (tagId) => onRemoveEventPoint?.(tagId),
    getTagsForCamera,
    contextMenuItems,
    onMenuOpen: (index) => {
      setOpenMenuIndex(index);
      onMenuOpen?.(index);
    },
    cameras: renderedCameras,
    company,
    location,
    date,
    timestamp,
    openMenuIndex,
    onCloseMenu: () => setOpenMenuIndex(null),
    exitingIds,
    skipAnimation,
  };

  const rowDistribution = getRowDistribution(renderedCameras.length);
  const numRows = rowDistribution.length;
  const maxCols = Math.max(...rowDistribution);
  const rowStarts = rowDistribution.map((_, i) =>
    rowDistribution.slice(0, i).reduce((sum, n) => sum + n, 0),
  );

  return loadState ? (
    <CameraLoadingState maxHeight={maxHeight} />
  ) : scrollable ? (
    <CameraScrollableGrid
      totalHeight={totalHeight}
      rowHeight={rowHeight!}
      rowDistribution={rowDistribution}
      rowStarts={rowStarts}
      maxCols={maxCols}
      totalCameras={renderedCameras.length}
      sharedProps={sharedProps}
    />
  ) : (
    <CameraStaticGrid
      totalHeight={totalHeight}
      numRows={numRows}
      count={count}
      rowDistribution={rowDistribution}
      rowStarts={rowStarts}
      maxCols={maxCols}
      sharedProps={sharedProps}
      exitingIds={exitingIds}
      skipAnimation={skipAnimation}
    />
  );
};

export default CameraLayout;
