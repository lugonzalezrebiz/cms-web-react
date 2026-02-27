import { useState } from "react";
import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import { Colors, Fonts } from "../theme";
import EventMenu, { type CameraContextMenuItem } from "./EventMenu";

function CameraItem({
  index,
  media,
  cameraItemList,
  expandCamera,
  contextMenuItems = [],
  contextMenuTitle,
  iconMenu,
}: {
  index: number;
  media: string;
  cameraItemList: () => void;
  expandCamera: () => void;
  contextMenuItems?: CameraContextMenuItem[];
  contextMenuTitle?: string;
  iconMenu?: string;
}) {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    if (contextMenuItems.length === 0) return;
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY });
  };

  return (
    <Box
      onContextMenu={handleContextMenu}
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
        src={media}
        alt={`Camera ${index + 1}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
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
      <Box
        sx={{
          position: "absolute",
          bottom: 10,
          right: 13,
        }}
      >
        <img
          style={{ cursor: "pointer" }}
          src="../assets/expand-03.svg"
          alt=""
          onClick={expandCamera}
        />
      </Box>

      <EventMenu
        index={index}
        anchorPosition={contextMenu}
        onClose={() => setContextMenu(null)}
        contextMenuItems={contextMenuItems}
        contextMenuTitle={contextMenuTitle}
        iconMenu={iconMenu}
      />
    </Box>
  );
}

interface CameraLayoutProps {
  count: number;
  media: string;
  cameraItemList: () => void;
  expandCamera: () => void;
  maxHeight?: number | string;
  contextMenuItems?: CameraContextMenuItem[];
  contextMenuTitle?: string;
  iconMenu?: string;
}

/**
 *  1  → [1]
 *  2  → [2]
 *  3  → [2, 1]   4  → [2, 2]
 *  5  → [3, 2]   6  → [3, 3]
 *  7  → [4, 3]   8  → [4, 4]
 *  9  → [3,3,3]  10 → [4,3,3]  11 → [4,4,3]  12 → [4,4,4]
 * 13  → [4,3,3,3] ... 16 → [4,4,4,4]
 */
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
  expandCamera,
  contextMenuItems,
  contextMenuTitle,
  iconMenu,
}: CameraLayoutProps) => {
  const safeCount = Math.min(count, 16);
  if (safeCount === 0) return null;

  const rowDistribution = getRowDistribution(safeCount);
  const numRows = rowDistribution.length;
  const maxCols = rowDistribution[0];

  const totalHeight =
    typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;

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
            {Array.from({ length: rowCount }, (_, colIndex) => (
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
                  index={startIdx + colIndex}
                  media={media}
                  cameraItemList={cameraItemList}
                  expandCamera={expandCamera}
                  contextMenuItems={contextMenuItems}
                  contextMenuTitle={contextMenuTitle}
                  iconMenu={iconMenu}
                />
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
};

export default CameraLayout;
