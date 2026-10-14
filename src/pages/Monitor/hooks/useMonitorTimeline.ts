import { useMemo } from "react";
import useAssignments from "../../../hooks/useAssignments";
import useTrackers from "../../../hooks/useTrackers";
import { useMonitoring } from "../../../components/timeline/hooks/useMonitoring";
import { useCameraEventPoints } from "../../../components/timeline/hooks/useCameraEventPoints";
import { useTimelineMarker } from "../../../components/timeline/hooks/useTimelineMarker";
import { useSessionDate } from "../../../components/timeline/hooks/useSessionDate";
import { useSaveMonitoring } from "../../../components/timeline/hooks/useSaveMonitoring";
import {
  timeStringToSec,
  hasReviewedTwin,
} from "../../../components/timeline/utils";
import { isPunchesNavTab } from "../../../components/timeline/constants";
import type { NavTab } from "../../../components/timeline/types";
import { useReviewedEventPoints } from "./useReviewedEventPoints";
import { useFilteredEventPoints } from "./useFilteredEventPoints";
import { useFilteredMenuItems } from "./useFilteredMenuItems";
import { useDeleteEventPoint } from "./useDeleteEventPoint";
import { useEventPointsBroadcast } from "./useEventPointsBroadcast";
import { useComplianceMarkerTargets } from "./useComplianceMarkerTargets";
import { useEmployeePunchFlow } from "./useEmployeePunchFlow";
import { useCustomerPunchFlow } from "./useCustomerPunchFlow";
import type { useTrackerGroupResolutionFor } from "./useTrackerGroupResolution";
import type { TimelineTabProps } from "../constants";

const EMPTY_MENU_ITEMS: ReturnType<typeof useFilteredMenuItems> = [];
// Compliance violations adds nothing on top of the default TimeLine props.
const NO_TAB_TIMELINE_PROPS: TimelineTabProps = {};

interface Params {
  monitoringID: string;
  company: number;
  location: number;
  /** The camera group selection, resolved (from the monitor context in the
   * main window, from the broadcast in the popout). */
  trackerResolution: ReturnType<typeof useTrackerGroupResolutionFor>;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  /** Called with the marker's time of day (the main window's cameras). */
  onTimeChange?: (timestamp: string) => void;
}

// Everything the main Monitor window and the popout timeline share: the
// session's data, the review state, the tracker filtering, the marker, the
// Employees & Customers flows, saving, and the TimeLine props built from
// them. Each page adds only its own: where the marker starts
// (`tabTargetSec` unless it has its own), the popout button, and — in the
// main window — the cameras.
export const useMonitorTimeline = ({
  monitoringID,
  company,
  location,
  trackerResolution,
  activeTab,
  onTabChange,
  onTimeChange,
}: Params) => {
  const {
    cameraGroup,
    trackerOption,
    customTrackerIDs,
    trackerGroupings,
    isTrackerGroupingsLoading,
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
  } = trackerResolution;
  const isPunchesTab = isPunchesNavTab(activeTab);

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

  const {
    cameraEventPoints,
    rejectedEventIds,
    handleRejectEventPoint,
    acceptedEventIds,
    handleAcceptEventPoint,
    aiIncorrectEventIds,
    handleMarkAiIncorrect,
    markerSec,
    handleRemoveEventPoint,
    handleRegisterPreloadedDelete,
    handleConvertToEditableLocal,
    handleActivitySelect,
    handleActivityReject,
    handleMarkerChange: handleCameraMarkerChange,
    handleUpdateEventPoint,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    cleanUp,
  } = useCameraEventPoints(monitoringID);

  const {
    snapshot,
    eventPoints: preloadedEventPoints,
    rangeSessions,
    cameras: monitoringCameras,
    loading: isMonitoringLoading,
  } = useMonitoring(trackers, monitoringID, timeStart, timeEnd);

  const { allEventPoints, unreviewedTrackerIds, aiTrackerIds } =
    useReviewedEventPoints({
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
    ? ("no-trackers" as const)
    : hasNoGroupsConfigured
      ? ("no-groups" as const)
      : hasNoEventsLoaded
        ? ("no-events" as const)
        : undefined;

  const isPendingCameraGroupSwitch =
    isTrackerTab && !trackerOption && unreviewedTrackerIds.size > 0;

  const visibleEventPoints = useMemo(
    () => allEventPoints.filter((ep) => !ep.rejected),
    [allEventPoints],
  );

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

  const pendingReviewWallSec = useMemo(() => {
    let earliest: (typeof filteredEventPoints)[number] | undefined;
    for (const ep of filteredEventPoints) {
      if (ep.reviewed !== false || ep.rejected) continue;
      if (hasReviewedTwin(ep, filteredEventPoints)) continue;
      if (earliest === undefined || ep.timeSec < earliest.timeSec)
        earliest = ep;
    }
    if (!earliest) return undefined;
    return earliest.mode === "RANGE" && earliest.endSec > earliest.timeSec
      ? earliest.endSec
      : earliest.timeSec;
  }, [filteredEventPoints]);

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
  // Where the marker goes on a tab switch: Employees & Customers starts from
  // the beginning of the timeline; Compliance violations jumps to its first
  // event point.
  const tabTargetSec = isPunchesTab
    ? timelineStartSec
    : isTrackerTab
      ? trackerTargetSec
      : cameraGroupTargetSec;

  const { markerTimeSec, handleMarkerChange, showFinalizeButton } =
    useTimelineMarker({
      snapshot,
      onTimeChange,
      onMarkerChange: handleCameraMarkerChange,
    });

  // Employees & Customers: employee and customer rows, session bars, dialogs
  // and the TimeLine props the tab adds on top of Compliance violations'.
  // Their rows, bars and undo history stay the same in both windows
  // (usePunchHistorySync).
  const punchMarkerSec = markerTimeSec ?? timelineStartSec;
  const employeeFlow = useEmployeePunchFlow({ markerSec: punchMarkerSec });
  const customerFlow = useCustomerPunchFlow({
    markerSec: punchMarkerSec,
    employeeTracks: employeeFlow.tracks,
    employeeOpenSessions: employeeFlow.openSessions,
    employeeClosedSessions: employeeFlow.closedSessions,
    employeeRows: employeeFlow.employeeRows,
    // Employee and Customer adds employees with the same dialog, and acts on
    // their bars (and their undo history) through Employee punches.
    onAddEmployee: employeeFlow.openDialog,
    employeeControls: employeeFlow.controls,
  });
  const tabTimelineProps = isPunchesTab
    ? customerFlow.employeesCustomersTimelineProps
    : NO_TAB_TIMELINE_PROPS;

  // The punch-in dialogs pause the timeline while they're open.
  const isPunchDialogOpen =
    employeeFlow.dialogProps.open ||
    customerFlow.punchDialogProps.open ||
    customerFlow.reEnterDialogProps.open;

  const sessionDate = useSessionDate();
  const eventPointsToSave = useMemo(
    () => allEventPoints.filter((ep) => !ep.entryIds || ep.touchedThisSession),
    [allEventPoints],
  );
  const { handleDone, isDoneLoading } = useSaveMonitoring({
    trackers,
    eventPoints: eventPointsToSave,
    sessionDate,
    monitoringID,
    onSuccess: cleanUp,
  });

  // The TimeLine props both windows pass the same way; Employees &
  // Customers' override Compliance violations' defaults.
  const timelineProps = useMemo(
    () => ({
      snapshot,
      cameraEventPoints: filteredEventPoints,
      onMarkerChange: handleMarkerChange,
      markerTimeSec,
      // Re-applies the target on every tab switch, even when two tabs target
      // the same second (e.g. both at the timeline start).
      targetMarkerKey: activeTab,
      onUpdateEventPoint: handleUpdateEventPoint,
      headerLabel: "Compliance Violations",
      onUndo: handleUndo,
      onRedo: handleRedo,
      canUndo,
      canRedo,
      onRemoveEventPoint: handleDeleteEventPoint,
      onAcceptEventPoint: handleAcceptEventPoint,
      onRejectEventPoint: handleRejectEventPoint,
      onMarkAiIncorrect: handleMarkAiIncorrect,
      onConvertEventPointToLocal: handleConvertEventPoint,
      viewMode: "activity" as const,
      activeTab,
      onTabChange,
      menuItems: filteredMenuItems,
      rangeSessions,
      rowsLoadState: isReviewDataLoading || isPendingCameraGroupSwitch,
      loadState:
        isMonitoringLoading ||
        isTrackersLoading ||
        isTrackerGroupingsLoading ||
        isPendingCameraGroupSwitch,
      pendingReviewWallSec,
      pausePlayback: isPunchDialogOpen,
      ...tabTimelineProps,
    }),
    [
      snapshot,
      filteredEventPoints,
      handleMarkerChange,
      markerTimeSec,
      activeTab,
      handleUpdateEventPoint,
      handleUndo,
      handleRedo,
      canUndo,
      canRedo,
      handleDeleteEventPoint,
      handleAcceptEventPoint,
      handleRejectEventPoint,
      handleMarkAiIncorrect,
      handleConvertEventPoint,
      onTabChange,
      filteredMenuItems,
      rangeSessions,
      isReviewDataLoading,
      isPendingCameraGroupSwitch,
      isMonitoringLoading,
      isTrackersLoading,
      isTrackerGroupingsLoading,
      pendingReviewWallSec,
      isPunchDialogOpen,
      tabTimelineProps,
    ],
  );

  return {
    timelineProps,
    tabTargetSec,
    punchDialogProps: {
      employee: employeeFlow.dialogProps,
      customer: customerFlow.punchDialogProps,
      reEnter: customerFlow.reEnterDialogProps,
    },
    noReviewReason,
    // For the main window's cameras, header and Done button.
    trackers,
    monitoringCameras,
    isMonitoringLoading,
    allEventPoints,
    unreviewedTrackerIds,
    aiTrackerIds,
    filteredEventPoints,
    filteredMenuItems,
    markerSec,
    markerTimeSec,
    handleMarkerChange,
    showFinalizeButton,
    handleDone,
    isDoneLoading,
    handleActivitySelect,
    handleActivityReject,
    handleAcceptEventPoint,
    handleMarkAiIncorrect,
    handleRejectEventPoint,
    handleDeleteEventPoint,
  };
};
