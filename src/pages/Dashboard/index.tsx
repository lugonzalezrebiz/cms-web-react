import { useMemo } from "react";
import { Box } from "@mui/system";
import EventMenu from "../../components/EventMenu";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";
import { ToggleButtonTitles } from "../../sections/Header";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import { IconButton } from "@mui/material";
import { Check } from "@mui/icons-material";
import { Colors } from "../../theme";
import { useCameras } from "./hooks/useCameras";
import { useTrackers } from "./hooks/useTrackers";
import { useCameraEventPoints } from "../../components/timeline/hooks/useCameraEventPoints";
import MediaCarousel from "../../components/MediaCarousel";
import { useMenuItems } from "./hooks/useMenuItems";
import { useSalesTransactions } from "./hooks/useSalesTransactions";
import { useDashboardParams } from "./hooks/useDashboardParams";
import { usePosData } from "./hooks/usePosData";
import { useMarkerState } from "./hooks/useMarkerState";
import { usePosAttendance } from "./hooks/usePosAttendance";
import Button from "../../components/Button";
import { StyledToggleButton, StyledToggleGroup } from "./styled";

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

  const allEventPoints = useMemo(
    () => [...cameraEventPoints, ...preloadedEventPoints],
    [cameraEventPoints, preloadedEventPoints],
  );

  const { transactions, loading: transactionsLoading } = useSalesTransactions();

  const { posSnapshot, posEventPoints } = usePosData(transactions, snapshot);

  const {
    timestamp,
    setTimestamp,
    posMarkerSec,
    setPosMarkerSec,
    activeMarkerSec,
  } = useMarkerState(selectedTab, markerSec);

  const { attended, setCurrentTx, toggleAttended, toMarkerSec, handleDone } =
    usePosAttendance();

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
            loading={transactionsLoading}
            onSlideChange={(tx) => {
              setPosMarkerSec(toMarkerSec(tx));
              setCurrentTx(tx);
            }}
            onDropMenuItem={(itemId, tx) => {
              const item = allMenuItems.find((m) => m.id === itemId);
              if (!item) return;
              handleMarkerChange(toMarkerSec(tx));
              handleActivitySelect(tx.terminal.id - 1, item.label);
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

      {/* Attendance buttons — POS tab only */}
      {selectedTab === "2" && (
        <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", px: 2 }}>
          <Button
            selected={attended === "attended"}
            onClick={() => toggleAttended("attended")}
            disableRipple={false}
          >
            Attended
          </Button>
          <Button
            selected={attended === "unattended"}
            onClick={() => toggleAttended("unattended")}
            disableRipple={false}
          >
            Unattended
          </Button>
          {attended !== null && (
            <Box bgcolor={Colors.vividOrange} borderRadius="6px">
              <IconButton onClick={handleDone} size="small">
                <Check fontSize="small" sx={{ color: Colors.white }} />
              </IconButton>
            </Box>
          )}
        </Box>
      )}

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
          targetMarkerSec={
            selectedTab === "2" && posMarkerSec !== null
              ? posMarkerSec
              : undefined
          }
          drawerOpen={drawerOpen}
          onTimeChange={setTimestamp}
          onUpdateEventPoint={handleUpdateEventPoint}
        />
      </Box>
    </Box>
  );
};

export default Dashboard;
