import { CustomScrollbarY } from "../CustomScrollbar";
import { CameraRow } from "./CameraRow";
import { GAP, type SharedCameraItemProps } from "./types";

export interface CameraScrollableGridProps {
  totalHeight: string;
  rowHeight: string;
  rowDistribution: number[];
  rowStarts: number[];
  maxCols: number;
  totalCameras: number;
  sharedProps: SharedCameraItemProps;
}

const CameraScrollableGrid = ({
  totalHeight,
  rowHeight,
  rowDistribution,
  rowStarts,
  maxCols,
  totalCameras,
  sharedProps,
}: CameraScrollableGridProps) => (
  <CustomScrollbarY
    height={totalHeight}
    sx={{ width: "100%", m: "auto" }}
    thumbLength={15}
    contentSx={{ display: "flex", flexDirection: "column", gap: `${GAP}px`, pl: "10px" }}
    top={-10}
  >
    {rowDistribution.map((rowCount, rowIndex) => (
      <CameraRow
        key={rowIndex}
        startIdx={rowStarts[rowIndex]}
        rowCount={rowCount}
        maxCols={maxCols}
        rowHeight={rowHeight}
        totalCameras={totalCameras}
        {...sharedProps}
      />
    ))}
  </CustomScrollbarY>
);

export default CameraScrollableGrid;
