import { useMemo, useState } from "react";
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
import { useDeleteEventPoint } from "../Monitor/hooks/useDeleteEventPoint";
import { useEventPointsBroadcast } from "../Monitor/hooks/useEventPointsBroadcast";
import { useBroadcastSync } from "./hooks/useBroadcastSync";

const MonitorTimeline = () => {
  const [searchParams] = useSearchParams();
  const monitoringID = searchParams.get("monitoringID") ?? "";
  const { trackers, isLoading: isTrackersLoading } = useTrackers();
  const {
    snapshot,
    eventPoints: preloadedEventPoints,
    rangeSessions,
    loading: isMonitoringLoading,
  } = useMonitoring(trackers, monitoringID);

  const {
    cameraEventPoints,
    handleMarkerChange: handleCameraMarkerChange,
    handleUpdateEventPoint,
    handleActivitySelect,
    handleRemoveEventPoint,
    handleRegisterPreloadedDelete,
    handleConvertToEditableLocal,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    cleanUp,
  } = useCameraEventPoints(monitoringID);

  const allEventPoints = useMemo(
    () => [...cameraEventPoints, ...preloadedEventPoints],
    [cameraEventPoints, preloadedEventPoints],
  );

  const { markerTimeSec, handleMarkerChange } = useTimelineMarker({
    snapshot,
    onMarkerChange: handleCameraMarkerChange,
  });

  const { broadcastMutation } = useEventPointsBroadcast(monitoringID);

  const { handleDeleteEventPoint, handleConvertEventPoint } =
    useDeleteEventPoint(
      monitoringID,
      allEventPoints,
      handleRemoveEventPoint,
      handleRegisterPreloadedDelete,
      handleConvertToEditableLocal,
      broadcastMutation,
    );

  const { allMenuItems } = useMenuItems(trackers, handleActivitySelect);

  const [targetSec, setTargetSec] = useState<number | undefined>(undefined);
  const { cameraGroup, trackerOption } = useBroadcastSync(
    markerTimeSec,
    setTargetSec,
  );

  const isTrackerTab = cameraGroup === "tracker";

  const filteredEventPoints = useMemo(() => {
    if (!isTrackerTab || !trackerOption) return allEventPoints;
    const tracker = trackers.find((t) => t.id === Number(trackerOption));
    if (!tracker) return allEventPoints;
    return allEventPoints.filter((ep) => ep.label === tracker.name);
  }, [allEventPoints, isTrackerTab, trackerOption, trackers]);

  const filteredMenuItems = useMemo(() => {
    if (!isTrackerTab || !trackerOption) return allMenuItems;
    return allMenuItems.filter((item) => item.id === Number(trackerOption));
  }, [allMenuItems, isTrackerTab, trackerOption]);

  const sessionDate = useSessionDate();
  useSaveMonitoring({
    trackers,
    eventPoints: cameraEventPoints,
    sessionDate,
    monitoringID,
    onSuccess: cleanUp,
  });

  return (
    <Box sx={{ height: "100vh", overflow: "hidden" }}>
      <TimeLine
        snapshot={snapshot}
        cameraEventPoints={filteredEventPoints}
        onMarkerChange={handleMarkerChange}
        markerTimeSec={markerTimeSec}
        targetMarkerSec={targetSec}
        onUpdateEventPoint={handleUpdateEventPoint}
        onRemoveEventPoint={handleDeleteEventPoint}
        onConvertEventPointToLocal={handleConvertEventPoint}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        headerLabel="Activities"
        viewMode="activity"
        menuItems={filteredMenuItems}
        rangeSessions={rangeSessions}
        onPopOut={() => window.close()}
        expandedIcon={false}
        loadState={isMonitoringLoading || isTrackersLoading}
        rowsLoadState={isTrackersLoading}
      />
    </Box>
  );
};

export default MonitorTimeline;
