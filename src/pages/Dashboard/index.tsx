import { Box } from "@mui/system";
import { useRef, useState } from "react";
import type { CameraContextMenuItem } from "../../components/EventMenu";
import EventMenu from "../../components/EventMenu";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";
import { ToggleButtonTitles } from "../../sections/Header";

const Dashboard = ({
  selectedTab,
  drawerOpen,
}: {
  selectedTab: string;
  drawerOpen?: boolean;
}) => {
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
      id: 1,
      name: "Collision",
      label: "Collision",
      onClick: (index) => handleActivitySelect(index, "Collision"),
    },
    {
      id: 2,
      name: "Car door open",
      label: "Car door open",
      onClick: (index) => handleActivitySelect(index, "Car door open"),
    },
    {
      id: 3,
      name: "Violent behaviour",
      label: "Violent behaviour",
      onClick: (index) => handleActivitySelect(index, "Violent behaviour"),
    },
    {
      id: 4,
      name: "Human in tunnel",
      label: "Human in tunnel",
      onClick: (index) => handleActivitySelect(index, "Human in tunnel"),
    },
    {
      id: 5,
      name: "Slip & Fall",
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
          contextMenuItems={selectedTab === "2" ? cameraMenuItems : []}
        />
      </Box>

      {selectedTab === "2" && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", px: "1.5%" }}>
          <EventMenu
            contextMenuTitle="Comp. Violations"
            contextMenuItems={cameraMenuItems}
            iconMenu="/assets/plus-1.svg"
          />
        </Box>
      )}

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
