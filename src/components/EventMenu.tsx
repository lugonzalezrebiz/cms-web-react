import { Divider, Typography } from "@mui/material";
import { Colors, Fonts } from "../theme";
import { Fragment, useState } from "react";
import { Box } from "@mui/system";
import PopoverMenu from "./PopoverMenu";

export interface CameraContextMenuItem {
  id: number;
  name: string;
  label: string;
  icon?: string;
  shortcut?: string;
  dividerAfter?: boolean;
  onClick: (cameraIndex: number) => void;
}

const EventMenu = ({
  contextMenuTitle,
  iconMenu,
  contextMenuItems = [],
}: {
  contextMenuTitle?: string;
  iconMenu?: string;
  contextMenuItems?: CameraContextMenuItem[];
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (contextMenuItems.length === 0) return null;

  return (
    <>
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          px: "10px",
          py: "5px",
          bgcolor: Colors.white,
          border: `1px solid ${Colors.silverGrey}`,
          borderRadius: "8px",
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          "&:hover": { bgcolor: Colors.lightGray },
        }}
      >
        {iconMenu && <img src={iconMenu} alt="" style={{ display: "block" }} />}
        {contextMenuTitle && (
          <Typography
            sx={{
              fontFamily: Fonts.main,
              fontSize: 13,
              fontWeight: 500,
              color: Colors.lightBlack,
              lineHeight: 1,
            }}
          >
            {contextMenuTitle}
          </Typography>
        )}
      </Box>

      <PopoverMenu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        setAnchorEl={() => setAnchorEl(null)}
        maxWidth="170px"
      >
        {contextMenuTitle && (
          <Box
            sx={{
              pb: "12px",
              mb: "12px",
              borderBottom: `1px solid ${Colors.silverGrey}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pr: "28px",
            }}
          >
            <Typography
              sx={{
                fontFamily: Fonts.main,
                fontWeight: 700,
                fontSize: 16,
                color: Colors.lightBlack,
              }}
            >
              {contextMenuTitle}
            </Typography>
          </Box>
        )}

        <Typography
          sx={{
            fontFamily: Fonts.main,
            fontSize: 11,
            color: Colors.dimGray,
            mb: "10px",
          }}
        >
          Drag an item onto a camera
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {contextMenuItems.map((item) => (
            <Fragment key={item.id}>
              <Box
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("eventMenuItemId", String(item.id));
                  e.dataTransfer.effectAllowed = "copy";
                  setAnchorEl(null);
                }}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  px: "10px",
                  py: "6px",
                  bgcolor: Colors.main,
                  color: Colors.white,
                  borderRadius: "6px",
                  cursor: "grab",
                  userSelect: "none",
                  fontSize: 12,
                  fontFamily: Fonts.main,
                  fontWeight: 500,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  "&:active": { cursor: "grabbing", opacity: 0.85 },
                }}
              >
                {item.icon && (
                  <Box
                    sx={{ display: "flex", alignItems: "center", fontSize: 14 }}
                  >
                    <img src={item.icon} alt="" />
                  </Box>
                )}
                {item.label}
                {item.shortcut && (
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: Fonts.main,
                      fontSize: 10,
                      opacity: 0.75,
                      ml: "2px",
                    }}
                  >
                    {item.shortcut}
                  </Typography>
                )}
              </Box>
              {item.dividerAfter && (
                <Divider
                  sx={{
                    width: "100%",
                    borderColor: Colors.paleSlateBlue,
                    my: 0.5,
                  }}
                />
              )}
            </Fragment>
          ))}
        </Box>
      </PopoverMenu>
    </>
  );
};

export default EventMenu;
