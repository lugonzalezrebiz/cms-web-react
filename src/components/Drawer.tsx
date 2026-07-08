import { Divider, Drawer as DrawerMUI } from "@mui/material";
import { Box } from "@mui/system";
import Title from "./Title";
import { Colors } from "../theme";
import { assetUrl } from "../utils";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  header?: ReactNode;
  width?: number | string;
}

const Drawer = ({
  open,
  onClose,
  children,
  title,
  header,
  width = 520,
}: Props) => {
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
            padding: "16px 24px",
            borderTopLeftRadius: "16px",
            borderBottomLeftRadius: "16px",
            height: "calc(100% - 32px)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <Box
          position={"absolute"}
          top={20}
          right={20}
          onClick={onClose}
          sx={{ cursor: "pointer", visibility: "hidden" }}
        >
          <img src={assetUrl("x-close.svg")} alt="" />
        </Box>
        {header ??
          (title && (
            <Box>
              <Box p={"8px 0 10px 0"}>
                <Title
                  showDivider={false}
                  margin={false}
                  marginBottom="0"
                  title={title}
                />
              </Box>
              <Divider />
            </Box>
          ))}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {children}
      </Box>
    </DrawerMUI>
  );
};

export default Drawer;
