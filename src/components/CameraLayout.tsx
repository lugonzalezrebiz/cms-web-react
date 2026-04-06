import { useState, useEffect } from "react";
import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import { Colors, Fonts } from "../theme";
import { type CameraContextMenuItem } from "./EventMenu";
import Tooltip from "./Tooltip";

interface CameraItemProps {
  index: number;
  media: string;
  cameraItemList: () => void;
  expandCamera: (index: number) => void;
  isExpanded?: boolean;
  tags: CameraContextMenuItem[];
  onDrop: (itemId: string) => void;
}

function CameraItem({
  index,
  media,
  cameraItemList,
  expandCamera,
  isExpanded = false,
  tags,
  onDrop,
}: CameraItemProps) {
  const [isDragOver, setIsDragOver] = useState(false);

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
        src={media}
        alt={`Camera ${index + 1}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
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
                bgcolor: Colors.main,
                color: Colors.white,
                px: "6px",
                py: "2px",
                borderRadius: "4px",
                fontSize: 10,
                fontFamily: Fonts.main,
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                maxWidth: "80px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {tag.name}
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

interface CameraLayoutProps {
  count: number;
  media: string;
  cameraItemList: () => void;
  maxHeight?: number | string;
  contextMenuItems?: CameraContextMenuItem[];
}

function getRowDistribution(count: number): number[] {
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
}

const GAP = 8;

const CameraLayout = ({
  count,
  media,
  maxHeight = 350,
  cameraItemList,
  contextMenuItems = [],
}: CameraLayoutProps) => {
  const [expandedCamera, setExpandedCamera] = useState<number | null>(null);
  const [cameraTags, setCameraTags] = useState<
    Record<number, CameraContextMenuItem[]>
  >({});

  useEffect(() => {
    if (expandedCamera === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedCamera(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedCamera]);

  const safeCount = Math.min(count, 16);
  if (safeCount === 0) return null;

  const totalHeight =
    typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;

  const handleExpandCamera = (index: number) => {
    setExpandedCamera((prev) => (prev === index ? null : index));
  };

  const handleDrop = (cameraIndex: number, itemId: string) => {
    const item = contextMenuItems.find((i) => i.id === itemId);
    if (!item) return;
    item.onClick(cameraIndex);
    setCameraTags((prev) => {
      const existing = prev[cameraIndex] ?? [];
      if (existing.some((t) => t.id === itemId)) return prev;
      return { ...prev, [cameraIndex]: [...existing, item] };
    });
  };

  if (expandedCamera !== null) {
    return (
      <Box
        sx={{
          width: "97%",
          height: totalHeight,
          overflow: "hidden",
          m: "auto",
        }}
      >
        <CameraItem
          index={expandedCamera}
          media={media}
          cameraItemList={cameraItemList}
          expandCamera={handleExpandCamera}
          isExpanded
          tags={cameraTags[expandedCamera] ?? []}
          onDrop={(itemId) => handleDrop(expandedCamera, itemId)}
        />
      </Box>
    );
  }

  const rowDistribution = getRowDistribution(safeCount);
  const numRows = rowDistribution.length;
  const maxCols = rowDistribution[0];

  let idx = 0;

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
      {rowDistribution.map((rowCount, rowIndex) => {
        const startIdx = idx;
        idx += rowCount;

        return (
          <Box
            key={rowIndex}
            sx={{
              display: "flex",
              gap: `${GAP}px`,
              justifyContent: "center",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {Array.from({ length: rowCount }, (_, colIndex) => {
              const camIndex = startIdx + colIndex;
              return (
                <Box
                  key={colIndex}
                  sx={{
                    flex: "0 0 auto",
                    width: `calc(${100 / maxCols}% - ${
                      (GAP * (maxCols - 1)) / maxCols
                    }px)`,
                    minHeight: 0,
                    overflow: "hidden",
                  }}
                >
                  <CameraItem
                    index={camIndex}
                    media={media}
                    cameraItemList={cameraItemList}
                    expandCamera={handleExpandCamera}
                    tags={cameraTags[camIndex] ?? []}
                    onDrop={(itemId) => handleDrop(camIndex, itemId)}
                  />
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
};

export default CameraLayout;
