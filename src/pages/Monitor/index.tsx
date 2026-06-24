import { Box } from "@mui/system";
import { useState, useMemo, useEffect, useRef } from "react";
import useAssignments from "../../hooks/useAssignments";
import TimeLine from "../../components/TimeLine";
import CameraLayout, { TAG_TOLERANCE_SEC } from "../../components/CameraLayout";
import { useExpandedCamera } from "../../hooks/useExpandedCamera";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import useTrackers from "../../hooks/useTrackers";
import { useCameraEventPoints } from "../../components/timeline/hooks/useCameraEventPoints";
// import { useSalesTransactions } from "./hooks/useSalesTransactions";
import { useDashboardParams } from "./hooks/useDashboardParams";
import { useMarkerState } from "./hooks/useMarkerState";
// import { usePosCarousel } from "./hooks/usePosCarousel";
import { useSessionDate } from "../../components/timeline/hooks/useSessionDate";
import { timeStringToSec } from "../../components/timeline/utils";
import { useSaveMonitoring } from "../../components/timeline/hooks/useSaveMonitoring";
import { useTimelineMarker } from "../../components/timeline/hooks/useTimelineMarker";
import { useTimelinePopout } from "./hooks/useTimelinePopout";
import { useDeleteEventPoint } from "./hooks/useDeleteEventPoint";
import { useCameraMenuItems } from "./hooks/useCameraMenuItems";
import { useRegisterMonitorActions } from "../../contexts/useMonitorContext";
import { ExpandedCameraDialog } from "./components/ExpandedCameraDialog";
import { useTrackerGroupResolution } from "./hooks/useTrackerGroupResolution";
import { useFilteredEventPoints } from "./hooks/useFilteredEventPoints";
import { useFilteredMenuItems } from "./hooks/useFilteredMenuItems";

const Monitor = () => {
  const { company, location, date, monitoringID } = useDashboardParams();

  const { assignments } = useAssignments({ companyID: company, locationID: location });
  const currentAssignment = assignments.find(
    (a) => a.monitoringID === monitoringID,
  );
  const timeStart = currentAssignment?.open ?? null;
  const timeEnd = currentAssignment?.close ?? null;

  const {
    cameraGroup,
    trackerOption,
    customTrackerIDs,
    trackerGroupings,
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
  } = useTrackerGroupResolution();

  const { trackers, isLoading: isTrackersLoading } = useTrackers();
  const [openMenuCamera, setOpenMenuCamera] = useState<number | null>(null);

  const { expandedCamera, handleExpandCamera } = useExpandedCamera();

  const {
    cameraEventPoints,
    markerSec,
    handleRemoveEventPoint,
    handleRegisterPreloadedDelete,
    handleConvertToEditableLocal,
    handleActivitySelect,
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
  const allEventPoints = useMemo(
    () => [...cameraEventPoints, ...preloadedEventPoints],
    [cameraEventPoints, preloadedEventPoints],
  );

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

  const activeCameras = useMemo(() => {
    if (isJoinCameraTracker) {
      const cameraIds = new Set((joinCameraTrackerMap.get(cameraGroupNum) ?? []).map((c) => c.id));
      return monitoringCameras.filter((cam) => cameraIds.has(cam.id));
    }
    if (isJoinCameraSpecific) {
      return monitoringCameras.filter((cam) => cam.id === cameraSpecificId);
    }
    return monitoringCameras.filter((camera) =>
      filteredEventPoints.some((ep) => {
        if (ep.cameraId !== camera.id) return false;
        const hasRange = ep.endSec > ep.startSec;
        if (hasRange)
          return markerSec >= ep.timeSec - 60 && markerSec <= ep.endSec + 60;
        return Math.abs(markerSec - ep.timeSec) <= TAG_TOLERANCE_SEC;
      }),
    );
  }, [
    isJoinCameraTracker,
    isJoinCameraSpecific,
    joinCameraTrackerMap,
    cameraGroupNum,
    cameraSpecificId,
    monitoringCameras,
    filteredEventPoints,
    markerSec,
  ]);

  const sortedCameras = useMemo(
    () => [...activeCameras].sort((a, b) => a.id - b.id),
    [activeCameras],
  );

  const expandedCameraIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (expandedCamera === null) {
      expandedCameraIdRef.current = null;
    } else {
      const id = sortedCameras[expandedCamera]?.id;
      if (id !== undefined) expandedCameraIdRef.current = id;
    }
  }, [expandedCamera, sortedCameras]);

  useEffect(() => {
    const isFiltered =
      isDirectTracker || isJoinCameraTracker || isJoinCameraSpecific || isCustomMode || (isTrackerTab && !!trackerOption);
    if (!isFiltered || expandedCamera === null) return;
    const id = expandedCameraIdRef.current;
    if (id !== null && !activeCameras.some((c) => c.id === id)) {
      handleExpandCamera(expandedCamera);
    }
  }, [
    activeCameras,
    isDirectTracker,
    isJoinCameraTracker,
    isJoinCameraSpecific,
    isCustomMode,
    isTrackerTab,
    trackerOption,
    expandedCamera,
    handleExpandCamera,
  ]);

  const allCameraMenuItems = useCameraMenuItems(
    company,
    location,
    openMenuCamera !== null
      ? (sortedCameras[openMenuCamera]?.id ?? null)
      : null,
    handleActivitySelect,
  );
  const allExpandedCameraMenuItems = useCameraMenuItems(
    company,
    location,
    expandedCamera !== null
      ? (sortedCameras[expandedCamera]?.id ?? null)
      : null,
    handleActivitySelect,
  );

  const trackerMenuFilter = useMemo(
    () => (items: typeof allCameraMenuItems) => {
      if (singleTrackerID && (isDirectTracker || isJoinCameraTracker || isJoinCameraSpecific))
        return items.filter((item) => item.id === singleTrackerID);
      if (isCustomMode && customTrackerIDs.length > 0) {
        const trackerIds = new Set<number>();
        for (const id of customTrackerIDs) {
          if (id.startsWith("cam_")) {
            const tid = cameraToJoinTrackerMap.get(Number(id.slice(4)));
            if (tid) trackerIds.add(tid);
          } else {
            trackerIds.add(Number(id));
          }
        }
        return items.filter((item) => trackerIds.has(item.id));
      }
      if (isTrackerTab && trackerOption)
        return items.filter((item) => item.id === Number(trackerOption));
      return items;
    },
    [isDirectTracker, isJoinCameraTracker, isJoinCameraSpecific, singleTrackerID, isCustomMode, customTrackerIDs, cameraToJoinTrackerMap, isTrackerTab, trackerOption],
  );

  const cameraMenuItems = useMemo(
    () => trackerMenuFilter(allCameraMenuItems),
    [trackerMenuFilter, allCameraMenuItems],
  );
  const expandedCameraMenuItems = useMemo(
    () => trackerMenuFilter(allExpandedCameraMenuItems),
    [trackerMenuFilter, allExpandedCameraMenuItems],
  );

  const { handleDeleteEventPoint, handleConvertEventPoint } =
    useDeleteEventPoint(
      monitoringID,
      allEventPoints,
      handleRemoveEventPoint,
      handleRegisterPreloadedDelete,
      handleConvertToEditableLocal,
    );

  // const { transactions } = useSalesTransactions(monitoringID);

  const { timestamp, setTimestamp } = useMarkerState();

  const timelineStartSec = timeStringToSec(snapshot?.timeline?.times?.start ?? "00:00:00");

  const trackerTargetSec = useMemo(() => {
    if (!isTrackerTab || !trackerOption) return timelineStartSec;
    return filteredEventPoints
      .filter((ep) => !ep.reviewed)
      .sort((a, b) => a.timeSec - b.timeSec)[0]?.timeSec;
  }, [isTrackerTab, trackerOption, filteredEventPoints, timelineStartSec]);

  // const { current, goTo, prev, next, currentCameraId, currentTimeSec, attended, toggleAttended, handleDone: handlePosDone } = usePosCarousel(transactions, setPosMarkerSec);

  const { markerTimeSec, handleMarkerChange, showFinalizeButton } =
    useTimelineMarker({
      snapshot,
      onTimeChange: setTimestamp,
      onMarkerChange: handleCameraMarkerChange,
    });

  const { timelinePopped, handlePopOut, restoreMarkerSec } = useTimelinePopout(
    handleMarkerChange,
    markerTimeSec,
    cameraGroup,
  );

  const sessionDate = useSessionDate();
  const { handleDone } = useSaveMonitoring({
    trackers,
    eventPoints: cameraEventPoints,
    sessionDate,
    monitoringID,
    onSuccess: cleanUp,
  });

  useRegisterMonitorActions(handleDone, showFinalizeButton);

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

  const timelineProps = useMemo(
    () => ({
      snapshot,
      cameraEventPoints: filteredEventPoints,
      onMarkerChange: handleMarkerChange,
      markerTimeSec,
      targetMarkerSec: restoreMarkerSec ?? trackerTargetSec,
      onUpdateEventPoint: handleUpdateEventPoint,
      onPopOut: handlePopOut,
      headerLabel: "Compliance Violations" as const,
      onUndo: handleUndo,
      onRedo: handleRedo,
      canUndo,
      canRedo,
      onRemoveEventPoint: handleDeleteEventPoint,
      onConvertEventPointToLocal: handleConvertEventPoint,
      viewMode: "activity" as const,
      menuItems: filteredMenuItems,
      rangeSessions,
      expandedIcon: !expandedCamera,
      rowsLoadState: isTrackersLoading,
      loadState: isMonitoringLoading || isTrackersLoading,
    }),
    [
      snapshot,
      filteredEventPoints,
      handleMarkerChange,
      markerTimeSec,
      restoreMarkerSec,
      trackerTargetSec,
      handleUpdateEventPoint,
      handlePopOut,
      handleUndo,
      handleRedo,
      canUndo,
      canRedo,
      handleDeleteEventPoint,
      handleConvertEventPoint,
      filteredMenuItems,
      rangeSessions,
      expandedCamera,
      isTrackersLoading,
      isMonitoringLoading,
    ],
  );

  const expandedCameraTags = useMemo(() => {
    if (expandedCamera === null) return [];
    const seen = new Set<string>();
    return filteredEventPoints
      .filter(
        (ep) =>
          ep.cameraId === sortedCameras[expandedCamera]?.id &&
          markerSec >= ep.startSec &&
          markerSec <= ep.endSec,
      )
      .filter((ep) => {
        if (seen.has(ep.label)) return false;
        seen.add(ep.label);
        return true;
      })
      .map((ep) => ({
        id: ep.id,
        name: ep.label,
        label: ep.label,
        reviewed: ep.reviewed,
        overlapsUnreviewed:
          ep.reviewed &&
          filteredEventPoints.some(
            (other) =>
              other.id !== ep.id &&
              other.cameraId === ep.cameraId &&
              !other.reviewed &&
              other.timeSec === ep.timeSec,
          ),
        onClick: () => {},
      }));
  }, [filteredEventPoints, expandedCamera, sortedCameras, markerSec]);

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
      <Box mt={"10px"} sx={{ flex: 9, minHeight: 0, height: 0 }}>
        <CameraLayout
          count={activeCameras.length}
          maxHeight="100%"
          contextMenuItems={cameraMenuItems}
          onMenuOpen={setOpenMenuCamera}
          cameraEventPoints={filteredEventPoints}
          markerSec={markerSec}
          onRemoveEventPoint={handleDeleteEventPoint}
          cameras={activeCameras}
          company={company}
          location={location}
          date={date}
          timestamp={timestamp}
          expandedCamera={expandedCamera}
          onExpandCamera={handleExpandCamera}
          loadState={isMonitoringLoading}
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
      />
    </Box>
  );
};

export default Monitor;
