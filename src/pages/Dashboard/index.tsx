import { Box } from "@mui/system";
import { useState } from "react";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import type { CameraContextMenuItem } from "../../components/EventMenu";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";

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

const Dashboard = () => {
  const [cameraCount] = useState(16);

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
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <CameraLayout
            count={cameraCount}
            media="/assets/camera/Cam thumbnail.svg"
            maxHeight={"300px"}
            contextMenuTitle="Comp. Violations"
            contextMenuItems={cameraMenuItems}
            iconMenu="/assets/plus.svg"
          />
        </Box>
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
