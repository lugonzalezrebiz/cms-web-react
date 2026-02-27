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
        // bgcolor: Colors.ghostoffWhite,
        // padding: {
        //   xs: "0 1em 1em 1em",
        //   sm: "0 1em 1em 1em",
        //   lg: "0 1em 1em 1em",
        //   xl: "0 1em 1em 1em",
        // },
      }}
    >
      {children}
    </Box>
  );
};

export default Content;
