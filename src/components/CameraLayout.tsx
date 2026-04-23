import { useExpandedCamera } from "../hooks/useExpandedCamera";
import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import { Colors, Fonts } from "../theme";
import { type CameraContextMenuItem } from "./EventMenu";
import Tooltip from "./Tooltip";
import { useCameraFrame } from "../hooks/useCameraFrame";
import type { CameraEventPoint } from "./timeline/types";
import { useState } from "react";

const TAG_TOLERANCE_SEC = 300;

interface CameraItemProps {
  index: number;
  media: string;
  cameraItemList: () => void;
  expandCamera: (index: number) => void;
  isExpanded?: boolean;
  tags: CameraContextMenuItem[];
  onDrop: (itemId: string) => void;
  // Real image props — when provided, loads from DVR via dvr:// protocol
  cameraId?: number;
  cameraName?: string;
  company?: number;
  location?: number;
  date?: string;
  timestamp?: string;
  onRemoveTag: (tagId: number) => void;
}

const CameraItem = ({
  index,
  media,
  cameraItemList,
  expandCamera,
  isExpanded = false,
  tags,
  onDrop,
  cameraId,
  cameraName,
  company,
  location,
  date,
  timestamp,
  onRemoveTag,
}: CameraItemProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

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
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const itemId = e.dataTransfer.getData("eventMenuItemId");
        if (itemId) onDrop(itemId);
      }}
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        bgcolor: Colors.blushWhite,
        overflow: "hidden",
        borderRadius: 1,
        outline: isDragOver ? `2px solid ${Colors.main}` : "none",
        transition: "outline 0.1s ease",
      }}
    >
      {/* Drag-over overlay */}
      {isDragOver && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: `${Colors.main}22`,
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      )}

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
          onClick={cameraItemList}
          alt=""
        />
      </Box>

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
          src={
            isExpanded ? "../assets/expand-06.svg" : "../assets/expand-03.svg"
          }
          alt=""
          onClick={() => expandCamera(index)}
        />
      </Box>
    </Box>
  );
}

export type CameraInfo = { id: number; name: string };

interface CameraLayoutProps {
  count: number;
  media: string;
  cameraItemList: () => void;
  maxHeight?: number | string;
  contextMenuItems?: CameraContextMenuItem[];
  // Real image props — pass these to load DVR footage via dvr:// protocol
  cameras?: CameraInfo[];
  company?: number;
  location?: number;
  date?: string;
  timestamp?: string;
  cameraEventPoints?: CameraEventPoint[];
  markerSec?: number;
  onRemoveEventPoint?: (id: number) => void;
}

const getRowDistribution = (count: number): number[] => {
  const n = Math.min(count, 16);
  if (n === 0) return [];

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
  cameraItemList: () => void;
  expandCamera: (index: number) => void;
  onRemoveTag: (tagId: number) => void;
  getTagsForCamera: (index: number) => CameraContextMenuItem[];
  onDrop: (cameraIndex: number, itemId: number) => void;
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
  cameraItemList,
  expandCamera,
  onRemoveTag,
  getTagsForCamera,
  onDrop,
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
        cameraItemList={cameraItemList}
        expandCamera={expandCamera}
        tags={getTagsForCamera(camIndex)}
        onDrop={(itemId) => onDrop(camIndex, Number(itemId))}
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
  cameraItemList,
  contextMenuItems = [],
  cameras,
  company,
  location,
  date,
  timestamp,
  cameraEventPoints = [],
  markerSec = 0,
  onRemoveEventPoint,
}: CameraLayoutProps) => {
  const { expandedCamera, handleExpandCamera } = useExpandedCamera();

  const safeCount = Math.min(count, 16);
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

  const handleDrop = (cameraIndex: number, itemId: number) => {
    const item = contextMenuItems.find((i) => i.id === itemId);
    if (!item) return;
    item.onClick(cameraIndex);
  };

  const sharedProps: SharedCameraItemProps = {
    media,
    cameraItemList,
    expandCamera: handleExpandCamera,
    onRemoveTag: (tagId) => onRemoveEventPoint?.(tagId),
    getTagsForCamera,
    onDrop: handleDrop,
    cameras,
    company,
    location,
    date,
    timestamp,
  };

  if (expandedCamera !== null) {
    return (
      <Box sx={{ width: "97%", height: totalHeight, overflow: "hidden", m: "auto" }}>
        <CameraItem
          index={expandedCamera}
          media={media}
          cameraItemList={cameraItemList}
          expandCamera={handleExpandCamera}
          isExpanded
          tags={getTagsForCamera(expandedCamera)}
          onDrop={(itemId) => handleDrop(expandedCamera, Number(itemId))}
          cameraId={cameras?.[expandedCamera]?.id}
          cameraName={cameras?.[expandedCamera]?.name}
          company={company}
          location={location}
          date={date}
          timestamp={timestamp}
          onRemoveTag={(tagId) => onRemoveEventPoint?.(tagId)}
        />
      </Box>
    );
  }

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
