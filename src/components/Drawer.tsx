import { Drawer as DrawerMUI } from "@mui/material";
import { Box } from "@mui/system";
import Title from "./Title";
import { Colors } from "../theme";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  header?: ReactNode;
  width?: number | string;
}

const Drawer = ({ open, onClose, children, title, header, width = 661 }: Props) => {
  return (
    <DrawerMUI
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width,
            bgcolor: Colors.white,
            padding: "16px",
            borderTopLeftRadius: "16px",
            borderBottomLeftRadius: "16px",
            height: "calc(100% - 32px)",
          },
        },
      }}
    >
      <Box>
        <Box
          position={"absolute"}
          top={20}
          right={20}
          onClick={onClose}
          sx={{ cursor: "pointer" }}
        >
          <img src="./assets/x-close.svg" alt="" />
        </Box>
        {header ?? (title && <Title margin={false} marginBottom="0" title={title} />)}
      </Box>
      <Box height={"100%"}>{children}</Box>
    </DrawerMUI>
  );
};

export default Drawer;
