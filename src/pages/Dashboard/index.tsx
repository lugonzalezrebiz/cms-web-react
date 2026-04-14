import { Box } from "@mui/system";
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
import MediaCarousel from "../../components/MediaCarousel";
import { useMenuItems } from "./hooks/useMenuItems";
import { useSalesTransactions } from "./hooks/useSalesTransactions";
import { useDashboardParams } from "./hooks/useDashboardParams";
import { usePosData } from "./hooks/usePosData";
import { useMarkerState } from "./hooks/useMarkerState";

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

  const { company, location, date } = useDashboardParams();

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

  const { transactions } = useSalesTransactions();

  const { posSnapshot, posEventPoints } = usePosData(transactions, snapshot);

  const { timestamp, setTimestamp, posMarkerSec, setPosMarkerSec, activeMarkerSec } =
    useMarkerState(selectedTab, markerSec);

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
          markerSec={activeMarkerSec}
        />
      </Box>

      {/* Camera grid */}
      <Box sx={{ flex: 6, minHeight: 0, height: 0 }}>
        {selectedTab === "2" ? (
          <MediaCarousel
            company={company}
            location={location}
            transactions={transactions}
            onSlideChange={setPosMarkerSec}
            onDropMenuItem={(itemId, cameraId, timeSec) => {
              const item = allMenuItems.find((m) => m.id === itemId);
              if (!item) return;
              handleMarkerChange(timeSec);
              handleActivitySelect(cameraId - 1, item.label);
            }}
          />
        ) : (
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
        )}
      </Box>

      {/* Timeline panel */}
      <Box sx={{ flex: 4, minHeight: 0 }}>
        <TimeLine
          selectedTab={selectedTab}
          trackers={trackers}
          snapshot={snapshot}
          posSnapshot={posSnapshot}
          posEventPoints={posEventPoints}
          cameraActivities={cameraActivities}
          cameraEventPoints={allEventPoints}
          onMarkerChange={handleMarkerChange}
          targetMarkerSec={selectedTab === "2" && posMarkerSec !== null ? posMarkerSec : undefined}
          drawerOpen={drawerOpen}
          onTimeChange={setTimestamp}
          onUpdateEventPoint={handleUpdateEventPoint}
        />
      </Box>
    </Box>
  );
};

export default Dashboard;
