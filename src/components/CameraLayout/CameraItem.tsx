import { useState } from "react";
import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import VideocamOffOutlinedIcon from "@mui/icons-material/VideocamOffOutlined";
import { Colors, Fonts } from "../../theme";
import Tooltip from "../Tooltip";
import { useCameraFrame } from "../../hooks/useCameraFrame";
import CameraOverlayMenu, {
  type CameraContextMenuItem,
} from "./CameraOverlayMenu";
import { usePopover } from "../../hooks/usePopover";
import { TRANSITION_MS, EXIT_TRANSITION_MS } from "./types";

interface CameraItemProps {
  index: number;
  expandCamera: (index: number) => void;
  isExpanded?: boolean;
  empty?: boolean;
  tags: CameraContextMenuItem[];
  contextMenuItems: CameraContextMenuItem[];
  onMenuOpen?: (index: number) => void;
  onRemoveTag: (tagId: number) => void;
  onRejectTag?: (tagId: number) => void;
  cameraLabel?: boolean;
  disableOverlay?: boolean;
  skipAnimation?: boolean;
  controlledOpen?: boolean;
  onControlledClose?: () => void;
  cameraId?: number;
  cameraName?: string;
  company?: number;
  location?: number;
  date?: string;
  timestamp?: string;
  isExiting?: boolean;
  totalCameras?: number;
}

export const CameraItem = ({
  index,
  expandCamera,
  isExpanded = false,
  empty = false,
  tags,
  contextMenuItems,
  onMenuOpen,
  disableOverlay = false,
  skipAnimation = false,
  cameraId,
  cameraName,
  company,
  location,
  date,
  timestamp,
  onRemoveTag,
  onRejectTag,
  cameraLabel = true,
  controlledOpen,
  onControlledClose,
  isExiting = false,
  totalCameras = 1,
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

  const imageSrc = useCameraFrame(
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
        bgcolor: Colors.black,
        overflow: "hidden",
        borderRadius: 1,
        pointerEvents: isExiting ? "none" : undefined,
        "@keyframes cameraFadeIn": {
          from: { opacity: 0, transform: "scale(0.96)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
        "@keyframes cameraFadeOut": {
          from: { opacity: 1, transform: "scale(1)" },
          to: { opacity: 0, transform: "scale(1.04)" },
        },
        animation:
          empty || skipAnimation
            ? "none"
            : isExiting
              ? `cameraFadeOut ${EXIT_TRANSITION_MS}ms ease-in-out ${Math.min((totalCameras - 1 - index) * 40, 240)}ms forwards`
              : `cameraFadeIn ${TRANSITION_MS}ms ease-out ${Math.min(index * 40, 240)}ms both`,
      }}
    >
      <img
        src={imageSrc || undefined}
        onError={() => setImgError(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          opacity: 1,
        }}
      />

      {(imgError || !imageSrc || empty) && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: Colors.black,
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
                bgcolor: tag.overlapsUnreviewed
                  ? tag.mode === "POINT" && tag.value === false
                    ? Colors.blushRed
                    : Colors.leafGreen
                  : tag.reviewed === false
                    ? Colors.blue
                    : Colors.main,
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
              {tag.reviewed === false && !tag.rejected ? (
                <Box
                  component="span"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRejectTag?.(tag.id);
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
              ) : (
                tag.reviewed !== false &&
                !tag.rejected && (
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
                )
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

      {!empty && !isExpanded && (
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
            src="./assets/expand-03.svg"
            alt="Expand camera"
            onClick={(e) => {
              e.stopPropagation();
              expandCamera(index);
            }}
          />
        </Box>
      )}

      {!disableOverlay && (
        <CameraOverlayMenu
          open={showMenu}
          onClose={closeMenu}
          items={contextMenuItems}
          cameraId={cameraId ?? 0}
          title="Select a Compliance Violation"
        />
      )}
    </Box>
  );
};
