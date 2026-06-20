import { Box } from "@mui/system";
import { GAP, type SharedCameraItemProps } from "./types";
import { CameraRow } from "./CameraRow";
import { CameraItem } from "./CameraItem";

export interface CameraStaticGridProps {
  totalHeight: string;
  numRows: number;
  count: number;
  rowDistribution: number[];
  rowStarts: number[];
  maxCols: number;
  sharedProps: SharedCameraItemProps;
  exitingIds: ReadonlySet<number>;
  skipAnimation: boolean;
}

const CameraStaticGrid = ({
  totalHeight,
  numRows,
  count,
  rowDistribution,
  rowStarts,
  maxCols,
  sharedProps,
  exitingIds,
  skipAnimation,
}: CameraStaticGridProps) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateRows:
        count === 0 ? "1fr" : `repeat(${numRows}, minmax(0, 1fr))`,
      gap: `${GAP}px`,
      height: totalHeight,
      overflow: "hidden",
      p: "0px 10px 10px 10px",
    }}
  >
    {count === 0 && (exitingIds.size === 0 || skipAnimation) ? (
      <CameraItem
        index={0}
        expandCamera={() => {}}
        tags={[]}
        contextMenuItems={[]}
        onRemoveTag={() => {}}
        cameraLabel={false}
        disableOverlay
        empty
        skipAnimation={skipAnimation}
      />
    ) : (
      rowDistribution.map((rowCount, rowIndex) => (
        <CameraRow
          key={rowIndex}
          startIdx={rowStarts[rowIndex]}
          rowCount={rowCount}
          maxCols={maxCols}
          totalCameras={count}
          {...sharedProps}
        />
      ))
    )}
  </Box>
);

export default CameraStaticGrid;
