import { Box } from "@mui/system";
import { useRef, useState } from "react";
import type { CameraContextMenuItem } from "../../components/EventMenu";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";
import { ToggleButtonTitles } from "../../sections/Header";

// ─── Component ────────────────────────────────────────────────────────────────

const Dashboard = ({ selectedTab }: { selectedTab: string }) => {
  const cameraCount =
    ToggleButtonTitles.find((t) => t.value === selectedTab)?.cameraCount ?? 4;

  const activityCounterRef = useRef(0);
  const [cameraActivities, setCameraActivities] = useState<
    { id: number; cameraIndex: number; activityLabel: string }[]
  >([]);

  const handleActivitySelect = (cameraIndex: number, activityLabel: string) => {
    const newId = activityCounterRef.current++;
    setCameraActivities((prev) => [
      ...prev,
      { id: newId, cameraIndex, activityLabel },
    ]);
  };

  const cameraMenuItems: CameraContextMenuItem[] = [
    {
      label: "Collision",
      onClick: (index) => handleActivitySelect(index, "Collision"),
    },
    {
      label: "Car door open",
      onClick: (index) => handleActivitySelect(index, "Car door open"),
    },
    {
      label: "Violent behaviour",
      onClick: (index) => handleActivitySelect(index, "Violent behaviour"),
    },
    {
      label: "Human in tunnel",
      onClick: (index) => handleActivitySelect(index, "Human in tunnel"),
    },
    {
      label: "Slip & Fall",
      onClick: (index) => handleActivitySelect(index, "Slip & Fall"),
    },
  ];

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
            maxHeight={"500px"}
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
          <TimeLine
            selectedTab={selectedTab}
            cameraActivities={cameraActivities}
          />
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;
