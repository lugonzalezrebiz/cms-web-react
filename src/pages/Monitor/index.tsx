import { Box } from "@mui/system";
import { useState, useMemo } from "react";
import useAssignments from "../../hooks/useAssignments";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";
import { useExpandedCamera } from "../../hooks/useExpandedCamera";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import useTrackers from "../../hooks/useTrackers";
import { useCameraEventPoints } from "../../components/timeline/hooks/useCameraEventPoints";
import { useDashboardParams } from "./hooks/useDashboardParams";
import { useMarkerState } from "./hooks/useMarkerState";
import { useSessionDate } from "../../components/timeline/hooks/useSessionDate";
import {
  timeStringToSec,
  hasReviewedTwin,
} from "../../components/timeline/utils";
import { useSaveMonitoring } from "../../components/timeline/hooks/useSaveMonitoring";
import { useTimelineMarker } from "../../components/timeline/hooks/useTimelineMarker";
import { useTimelinePopout } from "./hooks/useTimelinePopout";
import { useDeleteEventPoint } from "./hooks/useDeleteEventPoint";
import { useReviewedEventPoints } from "./hooks/useReviewedEventPoints";
import { useActiveCameras } from "./hooks/useActiveCameras";
import { useGuardedActivityHandlers } from "./hooks/useGuardedActivityHandlers";
import { useCameraContextMenus } from "./hooks/useCameraContextMenus";
import { useComplianceMarkerTargets } from "./hooks/useComplianceMarkerTargets";
import { useExpandedCameraTags } from "./hooks/useExpandedCameraTags";
import {
  useRegisterMonitorActions,
  useTimelineTab,
} from "../../contexts/useMonitorContext";
import { useEventPointsBroadcast } from "./hooks/useEventPointsBroadcast";
import { ExpandedCameraDialog } from "./components/ExpandedCameraDialog";
import { useTrackerGroupResolution } from "./hooks/useTrackerGroupResolution";
import { useFilteredEventPoints } from "./hooks/useFilteredEventPoints";
import { useFilteredMenuItems } from "./hooks/useFilteredMenuItems";
import NoReviewGuard from "../../components/NoReviewGuard";
import EmployeePunchDialog from "../../components/timeline/EmployeePunchDialog";
import CustomerPunchDialog from "../../components/timeline/CustomerPunchDialog";
import CustomerReEnterDialog from "../../components/timeline/CustomerReEnterDialog";
import useNavigateWithQuery from "../../hooks/useNavigate";
import { useEmployeePunchFlow } from "./hooks/useEmployeePunchFlow";
import { useCustomerPunchFlow } from "./hooks/useCustomerPunchFlow";
import type { TimelineTabProps } from "./constants";
import type { NavTab } from "../../components/timeline/types";
import { isPunchesNavTab } from "../../components/timeline/constants";

const EMPTY_MENU_ITEMS: ReturnType<typeof useFilteredMenuItems> = [];
// Compliance violations adds nothing on top of the default TimeLine props.
const NO_TAB_TIMELINE_PROPS: TimelineTabProps = {};
const NO_DISABLED_TABS: NavTab[] = [];
// Customer punches needs employees to attend customers.
const CUSTOMERS_TAB_DISABLED: NavTab[] = ["customers"];

const Monitor = () => {
  const { company, location, date, monitoringID } = useDashboardParams();

  const { assignments } = useAssignments({
    companyID: company,
    locationID: location,
  });
  const currentAssignment = assignments.find(
    (a) => a.monitoringID === monitoringID,
  );
  const timeStart = currentAssignment?.open ?? null;
  const timeEnd = currentAssignment?.close ?? null;

  const trackerResolution = useTrackerGroupResolution();
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

  const { trackers, isLoading: isTrackersLoading } = useTrackers();
  const [openMenuCamera, setOpenMenuCamera] = useState<number | null>(null);
  // "employees" shows every camera and switches the timeline to per-camera bars;
  // "customers" shows every camera and lists the punched-in employees (read-only);
  // "employeesCustomers" shows every camera with Back Room and Unattended;
  // "compliances" keeps the tracker-filtered activity view.
  // Lives in the monitor context so the header can show this tab's shortcuts.
  const { activeTab, setActiveTab } = useTimelineTab();
  const isEmployeesTab = activeTab === "employees";
  const isCustomersTab = activeTab === "customers";
  const isEmployeesCustomersTab = activeTab === "employeesCustomers";
  const isPunchesTab = isPunchesNavTab(activeTab);
  const navigate = useNavigateWithQuery();

  const { expandedCamera, handleExpandCamera } = useExpandedCamera();

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
    ? "no-trackers"
    : hasNoGroupsConfigured
      ? "no-groups"
      : hasNoEventsLoaded
        ? "no-events"
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

  const { cameraGroupKey, isCameraReloading, sortedCameras } =
    useActiveCameras({
      activeTab,
      isPunchesTab,
      trackerResolution,
      monitoringCameras,
      filteredEventPoints,
      markerSec,
      expandedCamera,
      handleExpandCamera,
    });

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

  const { handleActivitySelectGuarded, handleActivityRejectGuarded } =
    useGuardedActivityHandlers({
      allEventPoints,
      markerSec,
      handleActivitySelect,
      handleActivityReject,
      handleAcceptEventPoint,
      handleMarkAiIncorrect,
    });

  const { cameraMenuItems, expandedCameraMenuItems } = useCameraContextMenus({
    company,
    location,
    openMenuCamera,
    expandedCamera,
    sortedCameras,
    handleActivitySelect: handleActivitySelectGuarded,
    handleActivityReject: handleActivityRejectGuarded,
    trackers,
    trackerResolution,
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

  const { timestamp, setTimestamp } = useMarkerState();

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

  const { markerTimeSec, handleMarkerChange, showFinalizeButton } =
    useTimelineMarker({
      snapshot,
      onTimeChange: setTimestamp,
      onMarkerChange: handleCameraMarkerChange,
    });

  // Employee punches and Customer punches: rows, session bars, dialogs and
  // the TimeLine props each tab adds on top of Compliance violations'.
  const punchMarkerSec = markerTimeSec ?? timelineStartSec;
  const employeeFlow = useEmployeePunchFlow({ markerSec: punchMarkerSec });
  const customerFlow = useCustomerPunchFlow({
    markerSec: punchMarkerSec,
    employeeTracks: employeeFlow.tracks,
    employeeOpenSessions: employeeFlow.openSessions,
    employeeClosedSessions: employeeFlow.closedSessions,
    employeeRows: employeeFlow.employeeRows,
  });

  // Employee punches remembers where its marker was when leaving the tab;
  // Customer punches always starts from the beginning of the timeline.
  const [prevTimelineTab, setPrevTimelineTab] = useState(activeTab);
  const [employeeMarkerSec, setEmployeeMarkerSec] = useState<
    number | undefined
  >(undefined);
  if (prevTimelineTab !== activeTab) {
    if (prevTimelineTab === "employees" && markerTimeSec !== null)
      setEmployeeMarkerSec(markerTimeSec);
    setPrevTimelineTab(activeTab);
  }
  const punchesTargetSec = isEmployeesTab
    ? (employeeMarkerSec ?? timelineStartSec)
    : timelineStartSec;

  const { timelinePopped, handlePopOut, restoreMarkerSec } = useTimelinePopout(
    handleMarkerChange,
    markerTimeSec,
    cameraGroup,
    trackerOption ?? "",
    customTrackerIDs,
    activeTab,
    setActiveTab,
  );

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

  useRegisterMonitorActions(
    handleDone,
    showFinalizeButton,
    isDoneLoading,
    unreviewedTrackerIds,
    aiTrackerIds,
  );

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
  // Mirrors TimeLine.tsx's own hasMultipleRows (selectableRows.length >= 2) — filteredMenuItems
  // is the same source useActivityRows builds its selectableRows from, one-to-one.
  const hasMultipleRows = filteredMenuItems.length >= 2;

  // Employee/Customer punches override the Compliance violations defaults
  // below with their own rows, bars, shortcuts and undo history.
  const tabTimelineProps = isEmployeesTab
    ? employeeFlow.timelineProps
    : isCustomersTab
      ? customerFlow.timelineProps
      : isEmployeesCustomersTab
        ? customerFlow.employeesCustomersTimelineProps
        : NO_TAB_TIMELINE_PROPS;

  // No employees in Employee punches yet → nobody can attend customers.
  const disabledTabs =
    employeeFlow.tracks.length === 0 ? CUSTOMERS_TAB_DISABLED : NO_DISABLED_TABS;

  const timelineProps = useMemo(
    () => ({
      snapshot,
      cameraEventPoints: filteredEventPoints,
      onMarkerChange: handleMarkerChange,
      markerTimeSec,
      // Punches tabs start from the beginning of the timeline; only Compliance
      // violations jumps to its first event point.
      targetMarkerSec:
        restoreMarkerSec ??
        (isPunchesTab
          ? punchesTargetSec
          : isTrackerTab
            ? trackerTargetSec
            : cameraGroupTargetSec),
      // Re-applies the target on every tab switch, even when two tabs target
      // the same second (e.g. both at the timeline start).
      targetMarkerKey: activeTab,
      onUpdateEventPoint: handleUpdateEventPoint,
      onPopOut: handlePopOut,
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
      onTabChange: setActiveTab,
      disabledTabs,
      menuItems: filteredMenuItems,
      rangeSessions,
      expandedIcon: !expandedCamera,
      rowsLoadState: isReviewDataLoading || isPendingCameraGroupSwitch,
      loadState:
        isMonitoringLoading ||
        isTrackersLoading ||
        isTrackerGroupingsLoading ||
        isPendingCameraGroupSwitch,
      pendingReviewWallSec,
      ...tabTimelineProps,
    }),
    [
      snapshot,
      filteredEventPoints,
      handleMarkerChange,
      markerTimeSec,
      restoreMarkerSec,
      trackerTargetSec,
      cameraGroupTargetSec,
      punchesTargetSec,
      isTrackerTab,
      isPunchesTab,
      handleUpdateEventPoint,
      handlePopOut,
      handleUndo,
      handleRedo,
      canUndo,
      canRedo,
      handleDeleteEventPoint,
      handleAcceptEventPoint,
      handleRejectEventPoint,
      handleMarkAiIncorrect,
      handleConvertEventPoint,
      activeTab,
      setActiveTab,
      filteredMenuItems,
      rangeSessions,
      expandedCamera,
      isTrackersLoading,
      isTrackerGroupingsLoading,
      isPendingCameraGroupSwitch,
      isMonitoringLoading,
      isReviewDataLoading,
      pendingReviewWallSec,
      tabTimelineProps,
      disabledTabs,
    ],
  );

  const expandedCameraTags = useExpandedCameraTags({
    filteredEventPoints,
    expandedCamera,
    sortedCameras,
    markerSec,
    hasMultipleRows,
  });

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
        mt={"10px"}
        mb={timelinePopped ? "10px" : "0"}
        sx={{ flex: 9, minHeight: 0, height: 0 }}
      >
        <CameraLayout
          key={cameraGroupKey}
          count={sortedCameras.length}
          maxHeight="100%"
          contextMenuItems={cameraMenuItems}
          onMenuOpen={setOpenMenuCamera}
          cameraEventPoints={filteredEventPoints}
          markerSec={markerSec}
          onRemoveEventPoint={handleDeleteEventPoint}
          onRejectEventPoint={handleRejectEventPoint}
          cameras={sortedCameras}
          company={company}
          location={location}
          date={date}
          timestamp={timestamp}
          expandedCamera={expandedCamera}
          onExpandCamera={handleExpandCamera}
          loadState={isMonitoringLoading || isCameraReloading}
          hasMultipleRows={hasMultipleRows}
        />
      </Box>

      {!timelinePopped && (
        <Box
          sx={{
            flex: 3,
            minHeight: 0,
            zIndex: expandedCamera !== null ? 2000 : 1000,
          }}
        >
          <TimeLine {...timelineProps} />
        </Box>
      )}
      <ExpandedCameraDialog
        open={expandedCamera !== null}
        onClose={() =>
          expandedCamera !== null && handleExpandCamera(expandedCamera)
        }
        cameraIndex={expandedCamera ?? 0}
        expandCamera={handleExpandCamera}
        tags={expandedCameraTags}
        contextMenuItems={expandedCameraMenuItems}
        cameraId={sortedCameras[expandedCamera ?? 0]?.id}
        cameraName={sortedCameras[expandedCamera ?? 0]?.name}
        company={company}
        location={location}
        date={date}
        timestamp={timestamp}
        onRemoveTag={handleDeleteEventPoint}
        onRejectTag={handleRejectEventPoint}
        customHeight={timelinePopped ? "91%" : "70%"}
      />
      <EmployeePunchDialog {...employeeFlow.dialogProps} />
      <CustomerPunchDialog {...customerFlow.punchDialogProps} />
      <CustomerReEnterDialog {...customerFlow.reEnterDialogProps} />
      <NoReviewGuard reason={noReviewReason} onGoBack={() => navigate(-1)} />
    </Box>
  );
};

export default Monitor;
