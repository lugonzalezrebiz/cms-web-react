import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import { Colors, Fonts } from "../theme";
import Tooltip from "./Tooltip";
import { useCameraFrame } from "../hooks/useCameraFrame";
import type { CameraEventPoint } from "./timeline/types";
import CameraOverlayMenu, {
  type CameraContextMenuItem,
} from "./CameraOverlayMenu";
import { usePopover } from "../hooks/usePopover";

export const TAG_TOLERANCE_SEC = 300;

interface CameraItemProps {
  index: number;
  media: string;
  expandCamera: (index: number) => void;
  isExpanded?: boolean;
  tags: CameraContextMenuItem[];
  contextMenuItems: CameraContextMenuItem[];
  onRemoveTag: (tagId: number) => void;
  cameraLabel?: boolean;
  // Real image props — when provided, loads from DVR via dvr:// protocol
  cameraId?: number;
  cameraName?: string;
  company?: number;
  location?: number;
  date?: string;
  timestamp?: string;
}

export const CameraItem = ({
  index,
  media,
  expandCamera,
  isExpanded = false,
  tags,
  contextMenuItems,
  cameraId,
  cameraName,
  company,
  location,
  date,
  timestamp,
  onRemoveTag,
  cameraLabel = true,
}: CameraItemProps) => {
  const { open: showMenu, handleOpen, handleClose: closeMenu } = usePopover();

  const useRealImages =
    cameraId !== undefined &&
    company !== undefined &&
    location !== undefined &&
    date !== undefined &&
    timestamp !== undefined;

  const liveSrc = useCameraFrame(
    useRealImages
      ? {
          company: company!,
          location: location!,
          date: date!,
          camera: cameraId!,
          timestamp: timestamp!,
        }
      : { company: 0, location: 0, date: "", camera: 0, timestamp: "" },
  );

  const imageSrc = useRealImages ? liveSrc : media;

  return (
    <Box
      onContextMenu={(e) => {
        e.preventDefault();
        handleOpen(e);
      }}
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        bgcolor: Colors.blushWhite,
        overflow: "hidden",
        borderRadius: 1,
      }}
    >
      <img
        src={imageSrc || media}
        alt={cameraName ?? `Camera ${index + 1}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          opacity: useRealImages && !liveSrc ? 0.15 : 1,
        }}
      />

      {/* Top-left: camera label */}
      {cameraLabel && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            height: "22px",
            display: "flex",
            alignItems: "center",
            borderRadius: "4px",
            bgcolor: Colors.semiTransparentBlackTwo,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              padding: "2px 0px 2px 4px",
              color: Colors.white,
              borderRadius: 0.5,
              fontSize: 12,
              mr: "9px",
              fontFamily: Fonts.main,
              lineHeight: 1.5,
            }}
          >
            Camera {index + 1}
          </Typography>
          <img
            style={{ padding: "0 4px 0 0", cursor: "pointer" }}
            src="../assets/chevron-down.svg"
            onClick={handleOpen}
            alt="Show camera options"
          />
        </Box>
      )}

      {/* Bottom-left: tags (max 2 visible, +N overflow) */}
      {tags.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 10,
            left: 8,
            display: "flex",
            gap: "4px",
            alignItems: "center",
            maxWidth: "calc(100% - 48px)",
            zIndex: 1,
          }}
        >
          {tags.slice(0, 2).map((tag) => (
            <Box
              key={tag.id}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                bgcolor: Colors.main,
                color: Colors.white,
                pl: "6px",
                pr: "4px",
                py: "2px",
                borderRadius: "4px",
                fontSize: 10,
                fontFamily: Fonts.main,
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                maxWidth: "100px",
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "60px",
                }}
              >
                {tag.name}
              </span>
              <Box
                component="span"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTag(tag.id);
                }}
                sx={{
                  cursor: "pointer",
                  lineHeight: 1,
                  opacity: 0.8,
                  fontSize: 10,
                  "&:hover": { opacity: 1 },
                }}
              >
                ✕
              </Box>
            </Box>
          ))}
          {tags.length > 2 && (
            <Tooltip
              detail={tags
                .slice(2)
                .map((t) => t.name)
                .join(", \n")}
              position="top"
              withoutIcon
              dark
            >
              <Box
                sx={{
                  bgcolor: Colors.semiTransparentBlackTwo,
                  color: Colors.white,
                  px: "6px",
                  py: "2px",
                  borderRadius: "4px",
                  fontSize: 10,
                  fontFamily: Fonts.main,
                  lineHeight: 1.4,
                  whiteSpace: "nowrap",
                  cursor: "default",
                }}
              >
                +{tags.length - 2}
              </Box>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Bottom-right: expand button */}
      <Box sx={{ position: "absolute", bottom: 10, right: 13, zIndex: 1 }}>
        <img
          style={{ cursor: "pointer" }}
          src={!isExpanded ? "../assets/expand-03.svg" : " "}
          alt={!isExpanded ? "Expand camera" : ""}
          onClick={() => expandCamera(index)}
        />
      </Box>

      <CameraOverlayMenu
        open={showMenu}
        onClose={closeMenu}
        items={contextMenuItems}
        cameraIndex={index}
        title="Select a Compliance Violations"
      />
    </Box>
  );
};

export type CameraInfo = { id: number; name: string };

interface CameraLayoutProps {
  count: number;
  media: string;
  maxHeight?: number | string;
  contextMenuItems?: CameraContextMenuItem[];
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
}

const getRowDistribution = (count: number): number[] => {
  if (count === 0) return [];

  if (count % 5 === 0) {
    const rows: number[] = [];
    let remaining = count;
    while (remaining > 0) {
      rows.push(5);
      remaining -= 5;
    }
    return rows;
  }

  const n = Math.min(count, 16);
  const numRows = n <= 2 ? 1 : n <= 8 ? 2 : n <= 12 ? 3 : 4;
  const rows: number[] = [];
  let remaining = n;
  for (let i = 0; i < numRows; i++) {
    const rowCount = Math.ceil(remaining / (numRows - i));
    rows.push(rowCount);
    remaining -= rowCount;
  }
  return rows;
};

const GAP = 8;

interface SharedCameraItemProps {
  media: string;
  expandCamera: (index: number) => void;
  onRemoveTag: (tagId: number) => void;
  getTagsForCamera: (index: number) => CameraContextMenuItem[];
  contextMenuItems: CameraContextMenuItem[];
  cameras?: CameraInfo[];
  company?: number;
  location?: number;
  date?: string;
  timestamp?: string;
}

const CameraCell = ({
  camIndex,
  maxCols,
  media,
  expandCamera,
  onRemoveTag,
  getTagsForCamera,
  contextMenuItems,
  cameras,
  company,
  location,
  date,
  timestamp,
}: SharedCameraItemProps & { camIndex: number; maxCols: number }) => {
  return (
    <Box
      sx={{
        flex: "0 0 auto",
        width: `calc(${100 / maxCols}% - ${(GAP * (maxCols - 1)) / maxCols}px)`,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <CameraItem
        index={camIndex}
        media={media}
        expandCamera={expandCamera}
        tags={getTagsForCamera(camIndex)}
        contextMenuItems={contextMenuItems}
        onRemoveTag={onRemoveTag}
        cameraId={cameras?.[camIndex]?.id}
        cameraName={cameras?.[camIndex]?.name}
        company={company}
        location={location}
        date={date}
        timestamp={timestamp}
      />
    </Box>
  );
};

const CameraRow = ({
  startIdx,
  rowCount,
  maxCols,
  ...shared
}: SharedCameraItemProps & {
  startIdx: number;
  rowCount: number;
  maxCols: number;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: `${GAP}px`,
        justifyContent: "center",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: rowCount }, (_, colIndex) => (
        <CameraCell
          key={colIndex}
          camIndex={startIdx + colIndex}
          maxCols={maxCols}
          {...shared}
        />
      ))}
    </Box>
  );
};

const CameraLayout = ({
  count,
  media,
  maxHeight = 350,
  contextMenuItems = [],
  cameras,
  company,
  location,
  date,
  timestamp,
  cameraEventPoints = [],
  markerSec = 0,
  onRemoveEventPoint,
  onExpandCamera: handleExpandCamera,
}: CameraLayoutProps) => {
  const safeCount = count % 5 === 0 ? count : Math.min(count, 16);
  if (safeCount === 0) return null;

  const totalHeight =
    typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;

  const getTagsForCamera = (cameraIndex: number): CameraContextMenuItem[] =>
    cameraEventPoints
      .filter(
        (ep) =>
          ep.cameraId === 1 + cameraIndex &&
          Math.abs(markerSec - ep.timeSec) <= TAG_TOLERANCE_SEC,
      )
      .map((ep) => ({
        id: ep.id,
        name: ep.label,
        label: ep.label,
        onClick: () => {},
      }));

  const sharedProps: SharedCameraItemProps = {
    media,
    expandCamera: handleExpandCamera,
    onRemoveTag: (tagId) => onRemoveEventPoint?.(tagId),
    getTagsForCamera,
    contextMenuItems,
    cameras,
    company,
    location,
    date,
    timestamp,
  };

  const rowDistribution = getRowDistribution(safeCount);
  const numRows = rowDistribution.length;
  const maxCols = rowDistribution[0];
  const rowStarts = rowDistribution.map((_, i) =>
    rowDistribution.slice(0, i).reduce((sum, n) => sum + n, 0),
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))`,
        gap: `${GAP}px`,
        width: "97%",
        height: totalHeight,
        overflow: "hidden",
        m: "auto",
      }}
    >
      {rowDistribution.map((rowCount, rowIndex) => (
        <CameraRow
          key={rowIndex}
          startIdx={rowStarts[rowIndex]}
          rowCount={rowCount}
          maxCols={maxCols}
          {...sharedProps}
        />
      ))}
    </Box>
  );
};

export default CameraLayout;
