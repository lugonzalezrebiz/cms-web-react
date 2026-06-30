import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Box } from "@mui/system";
import TimeLine from "../../components/TimeLine";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import { useCameraEventPoints } from "../../components/timeline/hooks/useCameraEventPoints";
import { useTimelineMarker } from "../../components/timeline/hooks/useTimelineMarker";
import { useSessionDate } from "../../components/timeline/hooks/useSessionDate";
import { useSaveMonitoring } from "../../components/timeline/hooks/useSaveMonitoring";
import useTrackers from "../../hooks/useTrackers";
import useTrackerGrouping from "../../hooks/useTrackerGrouping";
import { useFilteredEventPoints } from "../Monitor/hooks/useFilteredEventPoints";
import { useFilteredMenuItems } from "../Monitor/hooks/useFilteredMenuItems";
import { useDeleteEventPoint } from "../Monitor/hooks/useDeleteEventPoint";
import { useEventPointsBroadcast } from "../Monitor/hooks/useEventPointsBroadcast";
import { useBroadcastSync } from "./hooks/useBroadcastSync";

const MonitorTimeline = () => {
  const [searchParams] = useSearchParams();
  const monitoringID = searchParams.get("monitoringID") ?? "";
  const { trackers, isLoading: isTrackersLoading } = useTrackers();
  const { trackers: trackerGroupings } = useTrackerGrouping();
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

  const markerSecParam = searchParams.get("markerSec");
  const initialMarkerSec = markerSecParam !== null ? Number(markerSecParam) : undefined;
  const [targetSec, setTargetSec] = useState<number | undefined>(initialMarkerSec);
  const { cameraGroup, trackerOption, customTrackerIDs } = useBroadcastSync(
    markerTimeSec,
    setTargetSec,
  );

  // Reset broadcast target when filter changes so auto-pan fires immediately
  const prevCameraGroupRef = useRef(cameraGroup);
  if (prevCameraGroupRef.current !== cameraGroup) {
    prevCameraGroupRef.current = cameraGroup;
    if (targetSec !== undefined) setTargetSec(undefined);
  }

  // Tracker resolution (mirrors useTrackerGroupResolution but using broadcast state)
  const isTrackerTab = cameraGroup === "tracker";
  const isCustomMode = cameraGroup === "__custom__";
  const isCameraGroup = cameraGroup.startsWith("cam_");
  const cameraSpecificId = isCameraGroup ? Number(cameraGroup.slice(4)) : NaN;
  const cameraGroupNum = isCameraGroup ? NaN : Number(cameraGroup);

  const joinCameraTrackerMap = useMemo(() => {
    const map = new Map<number, { id: number; name: string }[]>();
    for (const t of trackerGroupings)
      if (t.joinCamera && t.cameras.length > 0) map.set(t.id, t.cameras);
    return map;
  }, [trackerGroupings]);

  const cameraToJoinTrackerMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const [trackerId, cameras] of joinCameraTrackerMap)
      for (const cam of cameras) map.set(cam.id, trackerId);
    return map;
  }, [joinCameraTrackerMap]);

  const isJoinCameraTracker =
    !isNaN(cameraGroupNum) && joinCameraTrackerMap.has(cameraGroupNum);
  const isJoinCameraSpecific =
    isCameraGroup &&
    !isNaN(cameraSpecificId) &&
    cameraToJoinTrackerMap.has(cameraSpecificId);
  const isDirectTracker =
    !isCameraGroup &&
    cameraGroup !== "" &&
    cameraGroup !== "0" &&
    !isNaN(cameraGroupNum) &&
    !isJoinCameraTracker;

  const singleTrackerID = isDirectTracker
    ? cameraGroupNum
    : isJoinCameraSpecific
      ? (cameraToJoinTrackerMap.get(cameraSpecificId) ?? 0)
      : isJoinCameraTracker
        ? cameraGroupNum
        : isTrackerTab && trackerOption
          ? Number(trackerOption)
          : 0;

  const filteredEventPoints = useFilteredEventPoints({
    allEventPoints,
    trackerGroupings,
    trackers,
    isJoinCameraTracker,
    isJoinCameraSpecific,
    isDirectTracker,
    isCustomMode,
    isTrackerTab,
    cameraGroupNum,
    cameraSpecificId,
    singleTrackerID,
    customTrackerIDs,
    trackerOption,
    joinCameraTrackerMap,
    cameraToJoinTrackerMap,
  });

  const filteredMenuItems = useFilteredMenuItems({
    trackers,
    trackerGroupings,
    handleActivitySelect,
    isJoinCameraTracker,
    isJoinCameraSpecific,
    isDirectTracker,
    isCustomMode,
    isTrackerTab,
    cameraGroupNum,
    cameraSpecificId,
    singleTrackerID,
    customTrackerIDs,
    trackerOption,
    joinCameraTrackerMap,
    cameraToJoinTrackerMap,
  });

  // Auto-pan targets — same logic as Monitor/index.tsx
  const trackerTargetSec = useMemo(() => {
    if (!isTrackerTab || !trackerOption) return undefined;
    return filteredEventPoints
      .filter((ep) => !ep.reviewed)
      .sort((a, b) => a.timeSec - b.timeSec)[0]?.timeSec;
  }, [isTrackerTab, trackerOption, filteredEventPoints]);

  const [cameraGroupTargetSec, setCameraGroupTargetSec] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    if (isTrackerTab) return;
    const first = [...filteredEventPoints].sort(
      (a, b) => a.timeSec - b.timeSec,
    )[0];
    setCameraGroupTargetSec(first?.timeSec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraGroup]);

  const autoTargetSec = isTrackerTab ? trackerTargetSec : cameraGroupTargetSec;

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
        targetMarkerSec={targetSec ?? autoTargetSec}
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
