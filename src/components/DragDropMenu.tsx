import { Divider, IconButton, InputBase, Typography } from "@mui/material";
import { Colors, Fonts } from "../theme";
import { Fragment } from "react";
import { Box } from "@mui/system";
import PopoverMenu from "./PopoverMenu";
export interface CameraContextMenuItem {
  id: number;
  name: string;
  label: string;
  icon?: string;
  shortcut?: string;
  dividerAfter?: boolean;
  onClick: (cameraId: number) => void;
}

const EventMenu = ({
  contextMenuTitle,
  iconMenu,
  contextMenuItems = [],
  itemCounts = {},
  subtitle,
  object,
  anchorEl,
  onOpenMenu,
  onCloseMenu,
  input,
  onInputChange,
  onAdd,
}: {
  contextMenuTitle?: string;
  iconMenu?: string;
  contextMenuItems?: CameraContextMenuItem[];
  itemCounts?: Record<string, number>;
  subtitle?: string;
  object?: string;
  anchorEl: HTMLElement | null;
  onOpenMenu: (el: HTMLElement) => void;
  onCloseMenu: () => void;
  input: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
}) => {
  return (
    <Box>
      <Box
        onClick={(e) => onOpenMenu(e.currentTarget)}
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
        setAnchorEl={onCloseMenu}
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
          {subtitle || "Drag an drop"}
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", mb: "12px" }}>
          {contextMenuItems.map((item) => (
            <Fragment key={item.id}>
              <Box
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("eventMenuItemId", String(item.id));
                  e.dataTransfer.setData("eventmenuid", String(item.id));
                  e.dataTransfer.effectAllowed = "copy";
                  onCloseMenu();
                }}
                sx={{
                  width: "100%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "6px",
                  px: "10px",
                  py: "6px",
                  bgcolor: Colors.white,
                  color: Colors.lightBlack,
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

                <Box sx={{ color: Colors.vividOrange }}>
                  {(itemCounts[item.label] ?? 0) > 0 && (
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "16px",
                        height: "16px",
                        px: "4px",
                        bgcolor: Colors.transparentVividOrange,
                        color: Colors.vividOrange,
                        borderRadius: "8px",
                        fontSize: 10,
                        fontFamily: Fonts.main,
                        lineHeight: 1,
                        fontWeight: 600,
                      }}
                    >
                      <span>
                        {itemCounts[item.label]} {object}
                      </span>
                    </Box>
                  )}
                </Box>
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

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            border: `1px solid ${Colors.paleGray}`,
            borderRadius: "12px",
            px: "12px",
            py: "6px",
            backgroundColor: Colors.ghostWhite,
          }}
        >
          <InputBase
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
            placeholder="Add option..."
            fullWidth
            sx={{
              fontFamily: Fonts.main,
              fontSize: "13px",
              color: Colors.lightBlack,
              "& input::placeholder": { color: Colors.paleSilver },
            }}
          />
          <IconButton
            size="small"
            onClick={onAdd}
            disabled={!input.trim()}
            sx={{ p: "4px", opacity: input.trim() ? 1 : 0.3 }}
          >
            <img
              src="./assets/arrow-narrow-right.svg"
              alt="add"
              style={{ height: "18px" }}
            />
          </IconButton>
        </Box>
      </PopoverMenu>
    </Box>
  );
};

export default EventMenu;
