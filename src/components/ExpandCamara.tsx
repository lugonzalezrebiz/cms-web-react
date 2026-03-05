import { Dialog, IconButton } from "@mui/material";
import { Box } from "@mui/system";
import { Colors } from "../theme";

interface Props {
  expandedCamera: number | null;
  onClose: () => void;
}

const ExpandCamara = ({ expandedCamera, onClose }: Props) => {
  return (
    <Dialog
      open={expandedCamera !== null}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: { bgcolor: Colors.blushWhite, position: "relative" },
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: "#fff",
          zIndex: 1,
        }}
      >
        <img src="../assets/x-close.svg" alt="" />
      </IconButton>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img
          src="/assets/camera/Cam thumbnail.svg"
          alt={`Camera ${expandedCamera !== null ? expandedCamera + 1 : ""}`}
          style={{
            maxWidth: "100%",
            maxHeight: "80vh",
            width: "auto",
            height: "auto",
            display: "block",
          }}
        />
      </Box>
    </Dialog>
  );
};

export default ExpandCamara;
