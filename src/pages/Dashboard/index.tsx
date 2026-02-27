import { IconButton, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useState } from "react";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import type { CameraContextMenuItem } from "../../components/EventMenu";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";

// ─── Camera context menu ───────────────────────────────────────────────────────

const cameraMenuItems: CameraContextMenuItem[] = [
  {
    label: "option 1",
    icon: <FullscreenIcon fontSize="small" />,
    shortcut: "F",
    onClick: (index) => alert(`Fullscreen camera ${index + 1}`),
    dividerAfter: true,
  },
  {
    label: "option 2",
    onClick: (index) => alert(`Download camera ${index + 1}`),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [cameraCount, setCameraCount] = useState(3);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: 1,
        }}
      >
        {/* Counter control */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1,
            py: 0.5,
            bgcolor: "rgba(0,0,0,0.06)",
            borderRadius: 1,
            width: "fit-content",
          }}
        >
          <IconButton
            size="small"
            onClick={() => setCameraCount((n) => Math.max(1, n - 1))}
            disabled={cameraCount <= 1}
          >
            −
          </IconButton>
          <Typography
            variant="body2"
            sx={{ minWidth: 80, textAlign: "center" }}
          >
            {cameraCount} camera{cameraCount !== 1 ? "s" : ""}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setCameraCount((n) => Math.min(16, n + 1))}
            disabled={cameraCount >= 16}
          >
            +
          </IconButton>
        </Box>

        {/* Camera grid */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <CameraLayout
            count={cameraCount}
            media="/assets/camera/Cam thumbnail.svg"
            maxHeight={"300px"}
            cameraItemList={() => alert("Camera list clicked")}
            expandCamera={() => alert("Expand camera clicked")}
            contextMenuTitle="Comp. Violations"
            contextMenuItems={cameraMenuItems}
            iconMenu="/assets/plus.svg"
          />
        </Box>

        {/* Timeline panel */}
        <Box
          sx={{
            height: "200px",
            flexShrink: 0,
          }}
        >
          <TimeLine />
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;
