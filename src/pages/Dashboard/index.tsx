import { Box } from "@mui/system";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import EventMenu from "../../components/EventMenu";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";
import { ToggleButtonTitles } from "../../sections/Header";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../theme";
import { useCameras } from "./hooks/useCameras";
import { useTrackers } from "./hooks/useTrackers";
import { useCameraEventPoints } from "../../components/timeline/hooks/useCameraEventPoints";
import { useMenuItems } from "./hooks/useMenuItems";

const StyledToggleButton = styled(ToggleButton)({
  color: Colors.mediumGray,
  flex: 1,
  fontFamily: Fonts.main,
  textTransform: "none",
  fontWeight: "normal",
  backgroundColor: Colors.lightGray,
  border: "none",
  margin: 0,
  fontSize: "14px",
  borderRadius: 35,
  whiteSpace: "nowrap",
  "&.Mui-selected": {
    color: Colors.lightBlack,
    backgroundColor: Colors.white,
    //fontWeight: "bold",
  },
  "&.Mui-selected:hover": {
    backgroundColor: Colors.white,
  },
  "&:not(.Mui-selected)": {
    backgroundColor: Colors.lightGray,
  },
});

const StyledToggleGroup = styled(ToggleButtonGroup)({
  padding: 4,
  backgroundColor: Colors.lightGray,
  borderRadius: 30,
  height: "32px",
  width: "100%",
  boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.07)",
  "& .MuiToggleButtonGroup-lastButton": {
    margin: 0,
  },
  "& .MuiToggleButtonGroup-firstButton": {
    margin: 1,
  },
  "& .MuiToggleButtonGroup-grouped": {
    borderRadius: 35,
  },
});

const Dashboard = ({
  selectedTab,
  drawerOpen,
  onTabChange,
}: {
  selectedTab: string;
  drawerOpen?: boolean;
  onTabChange: (value: string) => void;
}) => {
  const cameraCount =
    ToggleButtonTitles.find((t) => t.value === selectedTab)?.cameraCount ?? 4;

  // ── URL params (?company=1&location=2&date=20240101) ──────────────────────
  const [searchParams] = useSearchParams();
  const company = Number(searchParams.get("company") ?? 0);
  const location = Number(searchParams.get("location") ?? 0);
  const date = searchParams.get("date") ?? ""; // YYYYMMDD

  const cameras = useCameras(company, location, date);
  const trackers = useTrackers();

  const {
    cameraActivities,
    cameraEventPoints,
    markerSec,
    handleRemoveEventPoint,
    handleActivitySelect,
    handleMarkerChange,
    handleUpdateEventPoint,
  } = useCameraEventPoints();

  const { allMenuItems, handleAddMenuItem } = useMenuItems(
    trackers,
    handleActivitySelect,
  );

  const { snapshot, eventPoints: preloadedEventPoints } =
    useMonitoring(trackers);

  const allEventPoints = [...cameraEventPoints, ...preloadedEventPoints];

  const [timestamp, setTimestamp] = useState("");

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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          m: "10px 16px 0 16px",
        }}
      >
        <Box>
          <StyledToggleGroup
            value={selectedTab}
            exclusive
            onChange={(_event, newValue) => {
              if (newValue !== null) onTabChange(newValue);
            }}
            aria-label="Time range"
          >
            {ToggleButtonTitles.map(({ value, title }) => (
              <StyledToggleButton key={value} value={value}>
                {title}
              </StyledToggleButton>
            ))}
          </StyledToggleGroup>
        </Box>

        <EventMenu
          contextMenuTitle="Comp. Violations"
          contextMenuItems={allMenuItems}
          iconMenu="/assets/plus-1.svg"
          onAddItem={handleAddMenuItem}
          cameraEventPoints={allEventPoints}
          markerSec={markerSec}
        />
      </Box>

      {/* Camera grid */}
      <Box sx={{ flex: 6, minHeight: 0, height: 0 }}>
        <CameraLayout
          count={cameras.length || cameraCount}
          media="/assets/camera/Cam thumbnail.svg"
          maxHeight="100%"
          cameraItemList={() => alert("Camera list clicked")}
          contextMenuItems={allMenuItems}
          cameraEventPoints={allEventPoints}
          markerSec={markerSec}
          onRemoveEventPoint={handleRemoveEventPoint}
          cameras={cameras}
          company={company}
          location={location}
          date={date}
          timestamp={timestamp}
        />
      </Box>

      {/* Timeline panel */}
      <Box sx={{ flex: 4, minHeight: 0 }}>
        <TimeLine
          selectedTab={selectedTab}
          trackers={trackers}
          snapshot={snapshot}
          cameraActivities={cameraActivities}
          cameraEventPoints={allEventPoints}
          onMarkerChange={handleMarkerChange}
          drawerOpen={drawerOpen}
          onTimeChange={setTimestamp}
          onUpdateEventPoint={handleUpdateEventPoint}
        />
      </Box>
    </Box>
  );
};

export default Dashboard;
