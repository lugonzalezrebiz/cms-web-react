import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import VideocamOffOutlinedIcon from "@mui/icons-material/VideocamOffOutlined";
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
  onMenuOpen?: (index: number) => void;
  onRemoveTag: (tagId: number) => void;
  cameraLabel?: boolean;
  disableOverlay?: boolean;
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
  onMenuOpen,
  disableOverlay = false,
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

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    handleOpen(e);
    onMenuOpen?.(index);
  };

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
      onClick={(e) => {
        if (!disableOverlay) handleMenuOpen(e);
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
            Camera {cameraId ?? index + 1}
          </Typography>
          <img
            style={{ padding: "0 4px 0 0", cursor: "pointer" }}
            src="../assets/chevron-down.svg"
            onClick={() => {}}
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
                bgcolor: tag.reviewed === false ? Colors.blue : Colors.main,
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
              {tag.reviewed !== false && (
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
              )}
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
          onClick={(e) => { e.stopPropagation(); expandCamera(index); }}
        />
      </Box>

      {!disableOverlay && (
        <CameraOverlayMenu
          open={showMenu}
          onClose={closeMenu}
          items={contextMenuItems}
          cameraIndex={index}
          title="Select a Compliance Violations"
        />
      )}
    </Box>
  );
};

export type CameraInfo = { id: number; name: string };

interface CameraLayoutProps {
  count: number;
  media: string;
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
}

const getRowDistribution = (count: number): number[] => {
  if (count === 0) return [];

  if (count <= 12) {
    const numRows = count <= 2 ? 1 : count <= 8 ? 2 : 3;
    const rows: number[] = [];
    let remaining = count;
    for (let i = 0; i < numRows; i++) {
      const rowCount = Math.ceil(remaining / (numRows - i));
      rows.push(rowCount);
      remaining -= rowCount;
    }
    return rows;
  }

  // >12: fixed 4 columns, scroll handles overflow
  const rows: number[] = [];
  let remaining = count;
  while (remaining > 0) {
    const n = Math.min(remaining, 4);
    rows.push(n);
    remaining -= n;
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
  onMenuOpen?: (index: number) => void;
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
  onMenuOpen,
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
        height: "100%",
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
        onMenuOpen={onMenuOpen}
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
  rowHeight,
  ...shared
}: SharedCameraItemProps & {
  startIdx: number;
  rowCount: number;
  maxCols: number;
  rowHeight?: string;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: `${GAP}px`,
        justifyContent: "center",
        minHeight: 0,
        overflow: "hidden",
        ...(rowHeight !== undefined && {
          height: rowHeight,
          flexShrink: 0,
        }),
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
}: CameraLayoutProps) => {
  if (count === 0) {
    return (
      <Box
        sx={{
          width: "97%",
          height: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
          m: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: Colors.blushWhite,
          borderRadius: 1,
          flexDirection: "column",
          gap: 1,
        }}
      >
        <VideocamOffOutlinedIcon
          sx={{ fontSize: 40, color: Colors.dimGray, opacity: 0.4 }}
        />
        <Typography
          sx={{
            color: Colors.dimGray,
            fontFamily: Fonts.main,
            fontSize: 14,
            opacity: 0.6,
          }}
        >
          No cameras available
        </Typography>
      </Box>
    );
  }

  const scrollable = count > 12;
  const totalHeight =
    typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;
  // Each row fills exactly 1/3 of the container (same size as the 12-camera grid rows).
  // Using calc(100%) so the 3 visible rows + 2 gaps fill the container perfectly,
  // and row 4+ start beyond the fold and are revealed by scroll.
  const rowHeight = scrollable ? `calc((100% - ${GAP * 2}px) / 3)` : undefined;

  const sortedCameras = cameras
    ? [...cameras].sort((a, b) => a.id - b.id)
    : undefined;

  const getTagsForCamera = (cameraIndex: number): CameraContextMenuItem[] => {
    const seen = new Set<string>();
    return cameraEventPoints
      .filter(
        (ep) =>
          ep.cameraId ===
            (sortedCameras?.[cameraIndex]?.id ?? cameraIndex + 1) &&
          markerSec >= ep.startSec &&
          markerSec <= ep.endSec,
      )
      .sort((a, b) => (a.reviewed === false ? 1 : 0) - (b.reviewed === false ? 1 : 0))
      .filter((ep) => {
        if (seen.has(ep.label)) return false;
        seen.add(ep.label);
        return true;
      })
      .map((ep) => ({
        id: ep.id,
        name: ep.label,
        label: ep.label,
        reviewed: ep.reviewed,
        onClick: () => {},
      }));
  };

  const sharedProps: SharedCameraItemProps = {
    media,
    expandCamera: handleExpandCamera,
    onRemoveTag: (tagId) => onRemoveEventPoint?.(tagId),
    getTagsForCamera,
    contextMenuItems,
    onMenuOpen,
    cameras: sortedCameras,
    company,
    location,
    date,
    timestamp,
  };

  const rowDistribution = getRowDistribution(count);
  const numRows = rowDistribution.length;
  const maxCols = Math.max(...rowDistribution);
  const rowStarts = rowDistribution.map((_, i) =>
    rowDistribution.slice(0, i).reduce((sum, n) => sum + n, 0),
  );

  if (scrollable) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: `${GAP}px`,
          width: "97%",
          height: totalHeight,
          overflowY: "auto",
          m: "auto",
        }}
      >
        {rowDistribution.map((rowCount, rowIndex) => (
          <CameraRow
            key={rowIndex}
            startIdx={rowStarts[rowIndex]}
            rowCount={rowCount}
            maxCols={maxCols}
            rowHeight={rowHeight}
            {...sharedProps}
          />
        ))}
      </Box>
    );
  }

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
