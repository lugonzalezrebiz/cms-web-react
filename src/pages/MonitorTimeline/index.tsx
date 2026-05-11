import { useSearchParams } from "react-router-dom";
import { Box } from "@mui/system";
import TimeLine from "../../components/TimeLine";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import { useCameraEventPoints } from "../../components/timeline/hooks/useCameraEventPoints";
import { useTimelineMarker } from "../../components/timeline/hooks/useTimelineMarker";
import { useSessionDate } from "../../components/timeline/hooks/useSessionDate";
import { useSaveMonitoring } from "../../components/timeline/hooks/useSaveMonitoring";
import useTrackers from "../../hooks/useTrackers";
import { useMenuItems } from "../Monitor/hooks/useMenuItems";
import { useBroadcastSync } from "./hooks/useBroadcastSync";

const MonitorTimeline = () => {
  const [searchParams] = useSearchParams();
  const monitoringID = searchParams.get("monitoringID") ?? "";
  const { trackers } = useTrackers();
  const { snapshot, eventPoints: preloadedEventPoints, rangeSessions } = useMonitoring(trackers, monitoringID);

  const {
    cameraEventPoints,
    handleMarkerChange: handleCameraMarkerChange,
    handleUpdateEventPoint,
    handleActivitySelect,
    handleRemoveEventPoint,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  } = useCameraEventPoints(monitoringID);

  const allEventPoints = [...cameraEventPoints, ...preloadedEventPoints];

  const { markerTimeSec, handleMarkerChange } = useTimelineMarker({
    snapshot,
    onMarkerChange: handleCameraMarkerChange,
  });

  const { allMenuItems } = useMenuItems(trackers, handleActivitySelect);

  useBroadcastSync(markerTimeSec, handleMarkerChange);

  const sessionDate = useSessionDate();
  useSaveMonitoring({
    trackers,
    eventPoints: cameraEventPoints,
    sessionDate,
    monitoringID,
  });

  return (
    <Box sx={{ height: "100vh", overflow: "hidden" }}>
      <TimeLine
        snapshot={snapshot}
        cameraEventPoints={allEventPoints}
        onMarkerChange={handleMarkerChange}
        markerTimeSec={markerTimeSec}
        onUpdateEventPoint={handleUpdateEventPoint}
        onRemoveEventPoint={handleRemoveEventPoint}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        headerLabel="Activities"
        viewMode="activity"
        menuItems={allMenuItems}
        rangeSessions={rangeSessions}
      />
    </Box>
  );
};

export default MonitorTimeline;
