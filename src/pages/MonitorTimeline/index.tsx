import { useState, useMemo, useEffect } from "react";
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
  const isDirectTracker =
    !isTrackerTab &&
    cameraGroup !== "" &&
    cameraGroup !== "0" &&
    !isNaN(Number(cameraGroup));
  const isCustomMode = cameraGroup === "__custom__";

  const [customTrackerIDs, setCustomTrackerIDs] = useState<number[]>([]);

  useEffect(() => {
    if (!isCustomMode) return;
    const channel = new BroadcastChannel("timeline-sync");
    channel.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "custom-group") {
        setCustomTrackerIDs(e.data.ids as number[]);
      }
    });
    return () => channel.close();
  }, [isCustomMode]);

  const filteredEventPoints = useMemo(() => {
    if (isTrackerTab && trackerOption) {
      const tracker = trackers.find((t) => t.id === Number(trackerOption));
      if (tracker) return allEventPoints.filter((ep) => ep.label === tracker.name);
    }
    if (isDirectTracker) {
      const tracker = trackers.find((t) => t.id === Number(cameraGroup));
      if (tracker) return allEventPoints.filter((ep) => ep.label === tracker.name);
    }
    if (isCustomMode && customTrackerIDs.length > 0) {
      const names = new Set(
        trackers.filter((t) => customTrackerIDs.includes(t.id)).map((t) => t.name),
      );
      return allEventPoints.filter((ep) => names.has(ep.label));
    }
    return allEventPoints;
  }, [allEventPoints, isTrackerTab, trackerOption, isDirectTracker, isCustomMode, cameraGroup, customTrackerIDs, trackers]);

  const filteredMenuItems = useMemo(() => {
    if (isTrackerTab && trackerOption)
      return allMenuItems.filter((item) => item.id === Number(trackerOption));
    if (isDirectTracker)
      return allMenuItems.filter((item) => item.id === Number(cameraGroup));
    if (isCustomMode && customTrackerIDs.length > 0)
      return allMenuItems.filter((item) => customTrackerIDs.includes(item.id));
    return allMenuItems;
  }, [allMenuItems, isTrackerTab, trackerOption, isDirectTracker, isCustomMode, cameraGroup, customTrackerIDs]);

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
