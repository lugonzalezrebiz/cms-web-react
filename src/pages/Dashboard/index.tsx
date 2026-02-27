import { Box } from "@mui/system";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import type { CameraContextMenuItem } from "../../components/EventMenu";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";
import { ToggleButtonTitles } from "../../sections/Header";

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

const Dashboard = ({ selectedTab }: { selectedTab: string }) => {
  const cameraCount =
    ToggleButtonTitles.find((t) => t.value === selectedTab)?.cameraCount ?? 4;

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
