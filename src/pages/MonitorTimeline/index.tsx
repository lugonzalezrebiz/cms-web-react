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
import useAssignments from "../../hooks/useAssignments";
import { useFilteredEventPoints } from "../Monitor/hooks/useFilteredEventPoints";
import { useFilteredMenuItems } from "../Monitor/hooks/useFilteredMenuItems";
import { useDeleteEventPoint } from "../Monitor/hooks/useDeleteEventPoint";
import { useEventPointsBroadcast } from "../Monitor/hooks/useEventPointsBroadcast";
import { useBroadcastSync } from "./hooks/useBroadcastSync";
import { timeStringToSec, hasReviewedTwin } from "../../components/timeline/utils";
import NoReviewGuard from "../../components/NoReviewGuard";

const EMPTY_MENU_ITEMS: ReturnType<typeof useFilteredMenuItems> = [];

const MonitorTimeline = () => {
  const [searchParams] = useSearchParams();
  const monitoringID = searchParams.get("monitoringID") ?? "";
  const company = Number(searchParams.get("company") ?? 0);
  const location = Number(searchParams.get("location") ?? 0);

  const { assignments } = useAssignments({
    companyID: company,
    locationID: location,
  });
  const currentAssignment = assignments.find(
    (a) => a.monitoringID === monitoringID,
  );
  const timeStart = currentAssignment?.open ?? null;
  const timeEnd = currentAssignment?.close ?? null;

  const { trackers, isLoading: isTrackersLoading } = useTrackers();
  const { trackers: trackerGroupings, isLoading: isTrackerGroupingsLoading } =
    useTrackerGrouping();
  const {
    snapshot,
    eventPoints: preloadedEventPoints,
    rangeSessions,
    loading: isMonitoringLoading,
  } = useMonitoring(trackers, monitoringID, timeStart, timeEnd);

  const {
    cameraEventPoints,
    rejectedEventIds,
    handleRejectEventPoint,
    acceptedEventIds,
    handleAcceptEventPoint,
    aiIncorrectEventIds,
    handleMarkAiIncorrect,
    handleMarkerChange: handleCameraMarkerChange,
    handleUpdateEventPoint,
    handleActivitySelect,
    handleActivityReject,
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
    () =>
      [...cameraEventPoints, ...preloadedEventPoints].map((ep) => {
        if (rejectedEventIds.has(ep.id))
          return { ...ep, rejected: true, reviewed: true, reviewDisagree: true };
        if (acceptedEventIds.has(ep.id)) {
          // Accepting a POINT diamond always confirms value=true (a violation happened);
          // if the AI's own original value said otherwise, that's a reviewer disagreement.
          if (ep.mode === "POINT") {
            return {
              ...ep,
              accepted: true,
              reviewed: true,
              value: true,
              reviewDisagree: ep.value !== true,
            };
          }
          return { ...ep, accepted: true, reviewed: true };
        }
        if (aiIncorrectEventIds.has(ep.id)) {
          if (ep.mode === "POINT") {
            return {
              ...ep,
              accepted: true,
              reviewed: true,
              value: false,
              reviewDisagree: ep.value !== false,
            };
          }
          return { ...ep, accepted: true, reviewed: true };
        }
        return ep;
      }),
    [
      cameraEventPoints,
      preloadedEventPoints,
      acceptedEventIds,
      rejectedEventIds,
      aiIncorrectEventIds,
    ],
  );

  const unreviewedTrackerIds = useMemo(() => {
    const ids = new Set<number>();
    for (const t of trackerGroupings) {
      const cameraIds =
        t.joinCamera && t.cameras.length > 0
          ? new Set(t.cameras.map((c) => c.id))
          : null;
      const hasUnreviewed = allEventPoints.some(
        (ep) =>
          !ep.reviewed &&
          ep.label === t.name &&
          (!cameraIds || cameraIds.has(ep.cameraId)) &&
          !hasReviewedTwin(ep, allEventPoints),
      );
      if (hasUnreviewed) ids.add(t.id);
    }
    return ids;
  }, [trackerGroupings, allEventPoints]);

  const isReviewDataLoading =
    isMonitoringLoading || isTrackersLoading || isTrackerGroupingsLoading;
  const hasNoTrackersConfigured = !isReviewDataLoading && trackers.length === 0;
  const hasNoGroupsConfigured =
    !isReviewDataLoading && trackerGroupings.length === 0;
  const hasNoEventsLoaded =
    !isReviewDataLoading && preloadedEventPoints.length === 0;

  const noReviewReason = hasNoTrackersConfigured
    ? "no-trackers"
    : hasNoGroupsConfigured
      ? "no-groups"
      : hasNoEventsLoaded
        ? "no-events"
        : undefined;

  const visibleEventPoints = useMemo(
    () => allEventPoints.filter((ep) => !ep.rejected),
    [allEventPoints],
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

  const isPendingCameraGroupSwitch =
    isTrackerTab && !trackerOption && unreviewedTrackerIds.size > 0;

  const filteredEventPoints = useFilteredEventPoints({
    allEventPoints: visibleEventPoints,
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

  const rawFilteredMenuItems = useFilteredMenuItems({
    trackers,
    trackerGroupings,
    handleActivitySelect,
    handleActivityReject,
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
  const filteredMenuItems =
    isReviewDataLoading || isPendingCameraGroupSwitch
      ? EMPTY_MENU_ITEMS
      : rawFilteredMenuItems;

  // Auto-pan targets — same logic as Monitor/index.tsx
  const timelineStartSec = timeStringToSec(
    snapshot?.timeline?.times?.start ?? "00:00:00",
  );

  const trackerTargetSec = useMemo(() => {
    if (!isTrackerTab || !trackerOption) return timelineStartSec;
    return filteredEventPoints
      .filter((ep) => !ep.reviewed)
      .sort((a, b) => a.timeSec - b.timeSec)[0]?.timeSec;
  }, [isTrackerTab, trackerOption, filteredEventPoints, timelineStartSec]);

  const [cameraGroupTargetSec, setCameraGroupTargetSec] = useState<
    number | undefined
  >(undefined);
  const cameraGroupInitializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isTrackerTab) return;
    cameraGroupInitializedRef.current = null;
    const first = [...filteredEventPoints].sort(
      (a, b) => a.timeSec - b.timeSec,
    )[0];
    if (first !== undefined) {
      setCameraGroupTargetSec(first.timeSec);
      cameraGroupInitializedRef.current = cameraGroup;
    } else {
      setCameraGroupTargetSec(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraGroup]);

  useEffect(() => {
    if (isTrackerTab || cameraGroupInitializedRef.current !== null) return;
    if (filteredEventPoints.length === 0) return;
    const first = [...filteredEventPoints].sort(
      (a, b) => a.timeSec - b.timeSec,
    )[0];
    if (first !== undefined) {
      setCameraGroupTargetSec(first.timeSec);
      cameraGroupInitializedRef.current = cameraGroup;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredEventPoints]);

  const autoTargetSec = isTrackerTab ? trackerTargetSec : cameraGroupTargetSec;

  const pendingReviewWallSec = useMemo(() => {
    let earliest: (typeof filteredEventPoints)[number] | undefined;
    for (const ep of filteredEventPoints) {
      if (ep.reviewed !== false || ep.rejected) continue;
      if (hasReviewedTwin(ep, filteredEventPoints)) continue;
      if (earliest === undefined || ep.timeSec < earliest.timeSec) earliest = ep;
    }
    if (!earliest) return undefined;
    return earliest.mode === "RANGE" && earliest.endSec > earliest.timeSec
      ? earliest.endSec
      : earliest.timeSec;
  }, [filteredEventPoints]);

  const eventPointsToSave = useMemo(
    () => allEventPoints.filter((ep) => !ep.entryIds || ep.accepted || ep.rejected),
    [allEventPoints],
  );

  const sessionDate = useSessionDate();
  useSaveMonitoring({
    trackers,
    eventPoints: eventPointsToSave,
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
        onAcceptEventPoint={handleAcceptEventPoint}
        onMarkAiIncorrect={handleMarkAiIncorrect}
        onRejectEventPoint={handleRejectEventPoint}
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
        loadState={
          isMonitoringLoading ||
          isTrackersLoading ||
          isTrackerGroupingsLoading ||
          isPendingCameraGroupSwitch
        }
        rowsLoadState={
          isTrackersLoading || isTrackerGroupingsLoading || isPendingCameraGroupSwitch
        }
        pendingReviewWallSec={pendingReviewWallSec}
      />
      <NoReviewGuard reason={noReviewReason} onGoBack={() => window.close()} />
    </Box>
  );
};

export default MonitorTimeline;
