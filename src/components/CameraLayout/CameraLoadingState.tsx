import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import { Colors, Fonts } from "../../theme";
import Spinner from "../Spinner";

const CameraLoadingState = ({ maxHeight }: { maxHeight: number | string }) => (
  <Box
    sx={{
      width: "calc(100% - 20px)",
      height: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
      mx: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: Colors.black,
      borderRadius: 1,
      flexDirection: "column",
      gap: 1,
      mb: "10px",
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

export default CameraLoadingState;
