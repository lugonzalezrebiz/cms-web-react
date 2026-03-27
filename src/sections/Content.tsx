import { Box } from "@mui/material";
import type { ReactNode } from "react";

const Content = ({
  children,
  marginLeft,
}: {
  children: ReactNode;
  marginLeft?: string; //@deprecated
}) => {
  return (
    <Box
      sx={{
        marginLeft: marginLeft, //@deprecated
        transition: "margin-left 0.4s ease",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </Box>
  );
};

export default Content;
