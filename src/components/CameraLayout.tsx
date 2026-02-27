import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import { Colors, Fonts } from "../theme";

function CameraItem({
  index,
  media,
  cameraItemList,
  expandCamera,
}: {
  index: number;
  media: string;
  cameraItemList?: () => void;
  expandCamera?: () => void;
  contextMenuTitle?: string;
  iconMenu?: string;
}) {
  return (
    <Box
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
    </Box>
  );
}

interface CameraLayoutProps {
  count: number;
  media: string;
  cameraItemList?: () => void;
  expandCamera?: () => void;
  maxHeight?: number | string;
  contextMenuTitle?: string;
  iconMenu?: string;
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
  expandCamera,
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
