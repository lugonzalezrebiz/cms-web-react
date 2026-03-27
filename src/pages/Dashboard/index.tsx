import { Box } from "@mui/system";
import { useRef, useState } from "react";
import type { CameraContextMenuItem } from "../../components/EventMenu";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";
import { ToggleButtonTitles } from "../../sections/Header";

const Dashboard = ({ selectedTab, drawerOpen }: { selectedTab: string; drawerOpen?: boolean }) => {
  const cameraCount =
    ToggleButtonTitles.find((t) => t.value === selectedTab)?.cameraCount ?? 4;

  const activityCounterRef = useRef(0);
  const [cameraActivities, setCameraActivities] = useState<
    { id: number; cameraIndex: number; activityLabel: string }[]
  >([]);
  const handleActivitySelect = (
    cameraIndex: number,
    activityLabel: string,
  ): void => {
    setCameraActivities((prev) => {
      const alreadyExists = prev.some(
        (a) =>
          a.cameraIndex === cameraIndex && a.activityLabel === activityLabel,
      );
      if (alreadyExists) return prev;
      const newId = activityCounterRef.current++;
      return [...prev, { id: newId, cameraIndex, activityLabel }];
    });
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        gap: 1,
      }}
    >
      {/* Camera grid */}
      <Box sx={{ flex: 6, minHeight: 0, height: 0 }}>
        <CameraLayout
          count={cameraCount}
          media="/assets/camera/Cam thumbnail.svg"
          maxHeight="100%"
          cameraItemList={() => alert("Camera list clicked")}
          contextMenuTitle="Comp. Violations"
          contextMenuItems={selectedTab === "2" ? cameraMenuItems : []}
          iconMenu="/assets/plus.svg"
        />
      </Box>

      {/* Timeline panel */}
      <Box sx={{ flex: 4, minHeight: 0 }}>
        <TimeLine
          selectedTab={selectedTab}
          cameraActivities={cameraActivities}
          drawerOpen={drawerOpen}
        />
      </Box>
    </Box>
  );
};

export default Dashboard;
