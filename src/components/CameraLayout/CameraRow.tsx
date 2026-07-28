import { Box } from "@mui/system";
import { GAP, type SharedCameraItemProps } from "./types";
import { CameraItem } from "./CameraItem";

const CameraCell = ({
  camIndex,
  maxCols,
  expandCamera,
  onRemoveTag,
  onRejectTag,
  getTagsForCamera,
  contextMenuItems,
  onMenuOpen,
  cameras,
  company,
  location,
  date,
  timestamp,
  openMenuIndex,
  onCloseMenu,
  exitingIds,
  skipAnimation,
}: SharedCameraItemProps & { camIndex: number; maxCols: number }) => {
  const cameraId = cameras?.[camIndex]?.id;
  const isExiting = cameraId !== undefined && exitingIds.has(cameraId);
  return (
    <Box
      sx={{
        flex: "0 0 auto",
        width: `calc(${100 / maxCols}% - ${(GAP * (maxCols - 1)) / maxCols}px)`,
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        transition: skipAnimation ? "none" : `width 300ms ease-in-out`,
      }}
    >
      <CameraItem
        index={camIndex}
        expandCamera={expandCamera}
        tags={getTagsForCamera(camIndex)}
        contextMenuItems={contextMenuItems}
        onMenuOpen={onMenuOpen}
        onRemoveTag={onRemoveTag}
        onRejectTag={onRejectTag}
        cameraId={cameraId}
        cameraName={cameras?.[camIndex]?.name}
        company={company}
        location={location}
        date={date}
        timestamp={timestamp}
        controlledOpen={openMenuIndex === camIndex}
        onControlledClose={onCloseMenu}
        isExiting={isExiting}
        skipAnimation={skipAnimation}
        totalCameras={cameras?.length ?? 1}
      />
    </Box>
  );
};

const EmptyCell = ({ maxCols }: { maxCols: number }) => (
  <Box
    sx={{
      flex: "0 0 auto",
      width: `calc(${100 / maxCols}% - ${(GAP * (maxCols - 1)) / maxCols}px)`,
      height: "100%",
    }}
  />
);

interface CameraRowCellProps extends SharedCameraItemProps {
  colIndex: number;
  startIdx: number;
  maxCols: number;
  totalCameras?: number;
}

const CameraRowCell = ({ colIndex, startIdx, maxCols, totalCameras, ...shared }: CameraRowCellProps) => {
  const camIndex = startIdx + colIndex;
  if (totalCameras !== undefined && camIndex >= totalCameras)
    return <EmptyCell maxCols={maxCols} />;
  return <CameraCell camIndex={camIndex} maxCols={maxCols} {...shared} />;
};

export const CameraRow = ({
  startIdx,
  rowCount,
  maxCols,
  rowHeight,
  totalCameras,
  ...shared
}: SharedCameraItemProps & {
  startIdx: number;
  rowCount: number;
  maxCols: number;
  rowHeight?: string;
  totalCameras?: number;
}) => (
  <Box
    sx={{
      display: "flex",
      gap: `${GAP}px`,
      minHeight: 0,
      overflow: "hidden",
      ...(rowHeight !== undefined && { height: rowHeight, flexShrink: 0 }),
    }}
  >
    {Array.from({ length: maxCols }, (_, colIndex) => (
      <CameraRowCell
        key={colIndex}
        colIndex={colIndex}
        startIdx={startIdx}
        maxCols={maxCols}
        totalCameras={totalCameras}
        {...shared}
      />
    ))}
  </Box>
);
