import { Popover } from "@mui/material";
import { Colors } from "../theme";
import { Box } from "@mui/system";
import type { ReactNode } from "react";

interface PopoverMenuProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  setAnchorEl: () => void;
  children: ReactNode;
  height?: string;
}

const PopoverMenu = ({
  open,
  anchorEl,
  setAnchorEl,
  children,
  height,
}: PopoverMenuProps) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={() => setAnchorEl()}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: {
            background: Colors.white,
            width: "100%",
            maxWidth: "332px",
            height: "100%",
            maxHeight: height ? height : "380px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "8px",
            padding: "24px",
            boxShadow: " 0 2px 10px 0 rgba(0, 0, 0, 0.16)",
            borderRadius: "16px",
          },
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
        }}
      >
        <Box
          onClick={() => setAnchorEl()}
          sx={{
            position: "absolute",
            right: 24,
            top: 24,
            cursor: "pointer",
          }}
        >
          <img src="../assets/x-close.svg" alt="" />
        </Box>
        <Box>{children}</Box>
      </Box>
    </Popover>
  );
};

export default PopoverMenu;
