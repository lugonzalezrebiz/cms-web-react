import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Typography,
} from "@mui/material";
import { Colors, Fonts } from "../theme";
import { Fragment, type ReactNode } from "react";
import { Box } from "@mui/system";

export interface CameraContextMenuItem {
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  dividerAfter?: boolean;
  onClick: (cameraIndex: number) => void;
}

const EventMenu = ({
  index,
  contextMenuTitle,
  iconMenu,
  contextMenuItems = [],
  anchorPosition,
  onClose,
}: {
  index: number;
  contextMenuTitle?: string;
  iconMenu?: string;
  contextMenuItems?: CameraContextMenuItem[];
  anchorPosition: { mouseX: number; mouseY: number } | null;
  onClose: () => void;
}) => {
  return (
    <Menu
      open={anchorPosition !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        anchorPosition !== null
          ? { top: anchorPosition.mouseY, left: anchorPosition.mouseX }
          : undefined
      }
      PaperProps={{
        sx: {
          bgcolor: Colors.paleSteal,
          backdropFilter: "blur(8px)",
          color: Colors.lightBlack,
          minWidth: 163,
          borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "none",
        },
      }}
    >
      {contextMenuTitle && (
        <Box
          sx={{
            px: "8px",
            py: "8px",
            borderBottom: `1px solid ${Colors.silverGrey}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontFamily: Fonts.main,
              fontWeight: 700,
              fontSize: 16,
              color: Colors.lightBlack,
              letterSpacing: 0.3,
            }}
          >
            {contextMenuTitle}
          </Typography>
          <img
            style={{ marginLeft: "8px" }}
            src={iconMenu || "../assets/plus.svg"}
            alt=""
          />
        </Box>
      )}
      <MenuList dense disablePadding sx={{ py: "8px" }}>
        {contextMenuItems.map((item, i) => (
          <Fragment key={i}>
            <MenuItem
              onClick={() => {
                item.onClick(index);
                onClose();
              }}
              sx={{
                px: 2,
                py: 0.75,
                color: Colors.lightBlack,
                "&:hover": {
                  bgcolor: Colors.transparentWhite,
                },
              }}
            >
              {item.icon && (
                <ListItemIcon
                  sx={{ color: Colors.softSteelBlue, minWidth: 32 }}
                >
                  {item.icon}
                </ListItemIcon>
              )}
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontFamily: Fonts.main,
                  fontSize: 14,
                  color: Colors.lightBlack,
                }}
              />
              {item.shortcut && (
                <Typography
                  variant="body2"
                  sx={{
                    color: Colors.blueGray,
                    ml: 2,
                    fontFamily: Fonts.main,
                    fontSize: 12,
                  }}
                >
                  {item.shortcut}
                </Typography>
              )}
            </MenuItem>
            {item.dividerAfter && (
              <Divider sx={{ borderColor: Colors.paleSlateBlue, my: 0.5 }} />
            )}
          </Fragment>
        ))}
      </MenuList>
    </Menu>
  );
};

export default EventMenu;
