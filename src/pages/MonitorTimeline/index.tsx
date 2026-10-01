import { useState, useMemo, useRef } from "react";
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
import { useReviewedEventPoints } from "../Monitor/hooks/useReviewedEventPoints";
import { useTrackerGroupResolutionFor } from "../Monitor/hooks/useTrackerGroupResolution";
import { useComplianceMarkerTargets } from "../Monitor/hooks/useComplianceMarkerTargets";
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

  // Same review state as the main window (Monitor/index.tsx).
  const { allEventPoints, unreviewedTrackerIds } = useReviewedEventPoints({
    cameraEventPoints,
    preloadedEventPoints,
    rejectedEventIds,
    acceptedEventIds,
    aiIncorrectEventIds,
    trackerGroupings,
  });

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
      handleRejectEventPoint,
      broadcastMutation,
    );

  const markerSecParam = searchParams.get("markerSec");
  const initialMarkerSec = markerSecParam !== null ? Number(markerSecParam) : undefined;
  const [targetSec, setTargetSec] = useState<number | undefined>(initialMarkerSec);
  const { cameraGroup, trackerOption, customTrackerIDs, activeTab, changeTab } = useBroadcastSync(
    markerTimeSec,
    setTargetSec,
  );
  const isPunchesTab = activeTab === "employees" || activeTab === "customers";

  // Reset broadcast target when filter changes so auto-pan fires immediately
  const prevCameraGroupRef = useRef(cameraGroup);
  if (prevCameraGroupRef.current !== cameraGroup) {
    prevCameraGroupRef.current = cameraGroup;
    if (targetSec !== undefined) setTargetSec(undefined);
  }

  // Same tracker resolution as the main window, fed by the broadcast state.
  const {
    isTrackerTab,
    isCustomMode,
    cameraSpecificId,
    cameraGroupNum,
    joinCameraTrackerMap,
    cameraToJoinTrackerMap,
    isJoinCameraTracker,
    isJoinCameraSpecific,
    isDirectTracker,
    singleTrackerID,
  } = useTrackerGroupResolutionFor({
    cameraGroup,
    trackerOption,
    customTrackerIDs,
    trackerGroupings,
    isTrackerGroupingsLoading,
  });

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

  const { trackerTargetSec, cameraGroupTargetSec } = useComplianceMarkerTargets(
    {
      cameraGroup,
      trackerOption,
      isTrackerTab,
      filteredEventPoints,
      timelineStartSec,
    },
  );

  // Punches tabs start from the beginning of the timeline; only Compliance
  // violations jumps to its first event point.
  const autoTargetSec = isPunchesTab
    ? timelineStartSec
    : isTrackerTab
      ? trackerTargetSec
      : cameraGroupTargetSec;

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
    () => allEventPoints.filter((ep) => !ep.entryIds || ep.touchedThisSession),
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
        headerLabel={
          activeTab === "employees"
            ? "Employee Punches"
            : activeTab === "customers"
              ? "Customer Punches"
              : "Activities"
        }
        viewMode={isPunchesTab ? "camera" : "activity"}
        activeTab={activeTab}
        onTabChange={changeTab}
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
        // The punches lists don't depend on review data, so no loader there.
        rowsLoadState={
          !isPunchesTab && (isReviewDataLoading || isPendingCameraGroupSwitch)
        }
        pendingReviewWallSec={pendingReviewWallSec}
      />
      <NoReviewGuard reason={noReviewReason} onGoBack={() => window.close()} />
    </Box>
  );
};

export default MonitorTimeline;
