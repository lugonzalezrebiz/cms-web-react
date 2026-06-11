import { useState, useEffect, useRef, useMemo } from "react";
import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import VideocamOffOutlinedIcon from "@mui/icons-material/VideocamOffOutlined";
import { Colors, Fonts } from "../theme";
import Tooltip from "./Tooltip";
import Spinner from "./Spinner";
import { useCameraFrame } from "../hooks/useCameraFrame";
import type { CameraEventPoint } from "./timeline/types";
import CameraOverlayMenu, {
  type CameraContextMenuItem,
} from "./CameraOverlayMenu";
import { usePopover } from "../hooks/usePopover";
import { CustomScrollbarY } from "./CustomScrollbar";

export const TAG_TOLERANCE_SEC = 60;
const TRANSITION_MS = 200;

interface CameraItemProps {
  index: number;
  expandCamera: (index: number) => void;
  isExpanded?: boolean;
  tags: CameraContextMenuItem[];
  contextMenuItems: CameraContextMenuItem[];
  onMenuOpen?: (index: number) => void;
  onRemoveTag: (tagId: number) => void;
  cameraLabel?: boolean;
  disableOverlay?: boolean;
  controlledOpen?: boolean;
  onControlledClose?: () => void;
  // Real image props — when provided, loads from DVR via dvr:// protocol
  cameraId?: number;
  cameraName?: string;
  company?: number;
  location?: number;
  date?: string;
  timestamp?: string;
  isExiting?: boolean;
}

export const CameraItem = ({
  index,
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
  controlledOpen,
  onControlledClose,
  isExiting = false,
}: CameraItemProps) => {
  const {
    open: localShowMenu,
    handleOpen,
    handleClose: localCloseMenu,
  } = usePopover();

  const isControlled = controlledOpen !== undefined;
  const showMenu = isControlled ? controlledOpen! : localShowMenu;
  const closeMenu = isControlled
    ? (onControlledClose ?? (() => {}))
    : localCloseMenu;

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    if (!isControlled) handleOpen(e);
    onMenuOpen?.(index);
  };

  const [imgError, setImgError] = useState(false);
  const [prevImageSrc, setPrevImageSrc] = useState<string | undefined>(
    undefined,
  );

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

  const imageSrc = liveSrc;

  if (imageSrc !== prevImageSrc) {
    setPrevImageSrc(imageSrc);
    setImgError(false);
  }

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
        opacity: isExiting ? 0 : 1,
        transition: `opacity ${TRANSITION_MS}ms ease-in-out`,
        "@keyframes cameraFadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
        animation: isExiting
          ? "none"
          : `cameraFadeIn ${TRANSITION_MS}ms ease-in-out`,
        pointerEvents: isExiting ? "none" : undefined,
      }}
    >
      <img
        src={imageSrc || undefined}
        //alt={cameraName ?? `Camera ${index + 1}`}
        onError={() => setImgError(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          opacity: 1,
        }}
      />

      {(imgError || !imageSrc) && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: Colors.blushWhite,
            gap: 1,
          }}
        >
          <VideocamOffOutlinedIcon
            sx={{ fontSize: 36, color: Colors.dimGray, opacity: 0.4 }}
          />
          <Typography
            sx={{
              color: Colors.dimGray,
              fontFamily: Fonts.main,
              fontSize: 13,
              opacity: 0.6,
            }}
          >
            No cameras available
          </Typography>
        </Box>
      )}

      {/* Top-left: camera label */}
      {cameraLabel && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            display: "flex",
            alignItems: "center",
            borderRadius: "4px",
            bgcolor: Colors.semiTransparentBlackTwo,
            flexDirection: "column",
            width: "90px",
          }}
        >
          {[`Camera ${cameraId ?? index + 1}`, cameraName].map((label) => (
            <Typography
              key={label}
              variant="caption"
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.title = el.scrollWidth > el.clientWidth ? (label ?? "") : "";
              }}
              sx={{
                padding: "0px 0px 0px 4px",
                color: Colors.white,
                borderRadius: 0.5,
                fontSize: 12,
                fontFamily: Fonts.main,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "90%",
              }}
            >
              {label}
            </Typography>
          ))}
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
      <Box
        sx={{
          position: "absolute",
          bottom: 10,
          right: 13,
          zIndex: 1,
          bgcolor: Colors.semiTransparentBlackTwo,
          borderRadius: "4px",
          p: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          style={{ cursor: "pointer" }}
          src={!isExpanded ? "./assets/expand-03.svg" : " "}
          alt={!isExpanded ? "Expand camera" : ""}
          onClick={(e) => {
            e.stopPropagation();
            expandCamera(index);
          }}
        />
      </Box>

      {!disableOverlay && (
        <CameraOverlayMenu
          open={showMenu}
          onClose={closeMenu}
          items={contextMenuItems}
          cameraId={cameraId ?? 0}
          title="Select a Compliance Violations"
        />
      )}
    </Box>
  );
};

export type CameraInfo = { id: number; name: string };

interface CameraLayoutProps {
  count: number;
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
  loadState?: boolean;
}

const getRowDistribution = (count: number): number[] => {
  if (count === 0) return [];

  // Odd counts > 1 pad to the next even number — the last slot renders empty
  const effective = count > 1 && count % 2 !== 0 ? count + 1 : count;

  if (effective <= 12) {
    const numRows = effective <= 2 ? 1 : effective <= 8 ? 2 : 3;
    const rows: number[] = [];
    let remaining = effective;
    for (let i = 0; i < numRows; i++) {
      const rowCount = Math.ceil(remaining / (numRows - i));
      rows.push(rowCount);
      remaining -= rowCount;
    }
    return rows;
  }

  // multiples of 5 greater than 16: rows of 5
  if (count > 16 && count % 5 === 0) {
    const rows: number[] = [];
    let remaining = count;
    while (remaining > 0) {
      rows.push(Math.min(remaining, 5));
      remaining -= 5;
    }
    return rows;
  }

  // >12: fixed 4 columns, scroll handles overflow
  const rows: number[] = [];
  let remaining = effective;
  while (remaining > 0) {
    const n = Math.min(remaining, 4);
    rows.push(n);
    remaining -= n;
  }
  return rows;
};

const GAP = 8;

interface SharedCameraItemProps {
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
  openMenuIndex: number | null;
  onCloseMenu: () => void;
  exitingIds: ReadonlySet<number>;
}

const CameraCell = ({
  camIndex,
  maxCols,
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
  openMenuIndex,
  onCloseMenu,
  exitingIds,
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
      }}
    >
      <CameraItem
        index={camIndex}
        expandCamera={expandCamera}
        tags={getTagsForCamera(camIndex)}
        contextMenuItems={contextMenuItems}
        onMenuOpen={onMenuOpen}
        onRemoveTag={onRemoveTag}
        cameraId={cameraId}
        cameraName={cameras?.[camIndex]?.name}
        company={company}
        location={location}
        date={date}
        timestamp={timestamp}
        controlledOpen={openMenuIndex === camIndex}
        onControlledClose={onCloseMenu}
        isExiting={isExiting}
      />
    </Box>
  );
};

const CameraRow = ({
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
      {Array.from({ length: rowCount }, (_, colIndex) => {
        const camIndex = startIdx + colIndex;
        if (totalCameras !== undefined && camIndex >= totalCameras) {
          return (
            <Box
              key={`empty-${colIndex}`}
              sx={{
                flex: "0 0 auto",
                width: `calc(${100 / maxCols}% - ${(GAP * (maxCols - 1)) / maxCols}px)`,
                height: "100%",
              }}
            />
          );
        }
        return (
          <CameraCell
            key={shared.cameras?.[startIdx + colIndex]?.id ?? colIndex}
            camIndex={camIndex}
            maxCols={maxCols}
            {...shared}
          />
        );
      })}
    </Box>
  );
};

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

  // sortedCameras is always the current prop — new cameras appear immediately
  const sortedCameras = useMemo(
    () => [...(cameras ?? [])].sort((a, b) => a.id - b.id),
    [cameras],
  );

  // Only cameras being removed (for fade-out)
  const [exitingCameras, setExitingCameras] = useState<CameraInfo[]>([]);
  const prevCamerasRef = useRef<CameraInfo[]>([]);

  // String key — stable when IDs are the same even if the array reference changes
  const cameraIdsKey = sortedCameras.map((c) => c.id).join(",");

  useEffect(() => {
    const incoming = [...(cameras ?? [])].sort((a, b) => a.id - b.id);
    const incomingIds = new Set(incoming.map((c) => c.id));
    const leaving = prevCamerasRef.current.filter(
      (c) => !incomingIds.has(c.id),
    );
    prevCamerasRef.current = incoming;

    if (leaving.length === 0) {
      const t = setTimeout(() => setExitingCameras([]), 0);
      return () => clearTimeout(t);
    }

    const tStart = setTimeout(() => setExitingCameras(leaving), 0);
    const tEnd = setTimeout(() => setExitingCameras([]), TRANSITION_MS + 50);

    return () => {
      clearTimeout(tStart);
      clearTimeout(tEnd);
    };
  }, [cameraIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge current cameras with any that are fading out
  const renderedCameras = useMemo(() => {
    const incomingIds = new Set(sortedCameras.map((c) => c.id));
    const exitingOnly = exitingCameras.filter((c) => !incomingIds.has(c.id));
    return [...sortedCameras, ...exitingOnly].sort((a, b) => a.id - b.id);
  }, [sortedCameras, exitingCameras]);

  const exitingIds = useMemo(
    () => new Set(exitingCameras.map((c) => c.id)),
    [exitingCameras],
  );

  if (loadState) {
    return (
      <Box
        sx={{
          width: "100%",
          height: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
          m: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: Colors.blushWhite,
          borderRadius: 1,
          flexDirection: "column",
          gap: 1,
          p: "0 10px",
        }}
      >
        <Spinner />
        <Typography
          sx={{
            color: Colors.dimGray,
            fontFamily: Fonts.main,
            fontSize: 14,
            opacity: 0.6,
            mt: "20px",
          }}
        >
          Loading cameras...
        </Typography>
      </Box>
    );
  }

  if (count === 0 && exitingIds.size === 0) {
    return (
      <Box
        sx={{
          width: "100%",
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

  const scrollable = renderedCameras.length > 16;
  const totalHeight =
    typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;
  const rowHeight = scrollable ? `calc((100% - ${GAP * 2}px) / 3)` : undefined;

  const getTagsForCamera = (cameraIndex: number): CameraContextMenuItem[] => {
    const seen = new Set<string>();
    return cameraEventPoints
      .filter((ep) => {
        if (ep.cameraId !== renderedCameras[cameraIndex]?.id) return false;
        const hasRange = ep.endSec > ep.startSec;
        if (hasRange)
          return (
            markerSec >= ep.timeSec - TAG_TOLERANCE_SEC &&
            markerSec <= ep.endSec + TAG_TOLERANCE_SEC
          );
        return Math.abs(markerSec - ep.timeSec) <= TAG_TOLERANCE_SEC;
      })
      .sort(
        (a, b) =>
          (a.reviewed === false ? 1 : 0) - (b.reviewed === false ? 1 : 0),
      )
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
  };

  const rowDistribution = getRowDistribution(renderedCameras.length);
  const numRows = rowDistribution.length;
  const maxCols = Math.max(...rowDistribution);
  const rowStarts = rowDistribution.map((_, i) =>
    rowDistribution.slice(0, i).reduce((sum, n) => sum + n, 0),
  );

  if (scrollable) {
    return (
      <CustomScrollbarY
        height={totalHeight}
        sx={{ width: "100%", m: "auto" }}
        thumbLength={15}
        contentSx={{
          display: "flex",
          flexDirection: "column",
          gap: `${GAP}px`,
          pl: "10px",
        }}
        top={-10}
      >
        {rowDistribution.map((rowCount, rowIndex) => (
          <CameraRow
            key={rowIndex}
            startIdx={rowStarts[rowIndex]}
            rowCount={rowCount}
            maxCols={maxCols}
            rowHeight={rowHeight}
            totalCameras={renderedCameras.length}
            {...sharedProps}
          />
        ))}
      </CustomScrollbarY>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))`,
        gap: `${GAP}px`,
        //width: "100%",
        height: totalHeight,
        overflow: "hidden",
        p: "0px 10px 10px 10px",
      }}
    >
      {rowDistribution.map((rowCount, rowIndex) => (
        <CameraRow
          key={rowIndex}
          startIdx={rowStarts[rowIndex]}
          rowCount={rowCount}
          maxCols={maxCols}
          totalCameras={count}
          {...sharedProps}
        />
      ))}
    </Box>
  );
};

export default CameraLayout;
