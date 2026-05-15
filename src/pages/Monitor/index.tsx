import { Box } from "@mui/system";
import { useState, useMemo } from "react";
import useAssignments from "../../hooks/useAssignments";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";
import { useExpandedCamera } from "../../hooks/useExpandedCamera";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import { useTrackerCameras } from "./hooks/useTrackerCameras";
import useTrackers from "../../hooks/useTrackers";
import { useCameraEventPoints } from "../../components/timeline/hooks/useCameraEventPoints";
// import { useSalesTransactions } from "./hooks/useSalesTransactions";
import { useDashboardParams } from "./hooks/useDashboardParams";
import { useMarkerState } from "./hooks/useMarkerState";
// import { usePosCarousel } from "./hooks/usePosCarousel";
import { useSessionDate } from "../../components/timeline/hooks/useSessionDate";
import { useSaveMonitoring } from "../../components/timeline/hooks/useSaveMonitoring";
import { useTimelineMarker } from "../../components/timeline/hooks/useTimelineMarker";
import { useTimelinePopout } from "./hooks/useTimelinePopout";
import { useDeleteEventPoint } from "./hooks/useDeleteEventPoint";
import { useCameraMenuItems } from "./hooks/useCameraMenuItems";
import {
  useRegisterMonitorActions,
  useCameraGroup,
} from "../../contexts/useMonitorContext";
import { ExpandedCameraDialog } from "./components/ExpandedCameraDialog";

const Monitor = () => {
  const { company, location, date, monitoringID } = useDashboardParams();

  const { assignments } = useAssignments(company, location);
  const currentAssignment = assignments.find(
    (a) => a.monitoringID === monitoringID,
  );
  const timeStart = currentAssignment?.open ?? null;
  const timeEnd = currentAssignment?.close ?? null;

  const { cameraGroup, trackerOption } = useCameraGroup();
  const isTrackerTab = cameraGroup === "tracker";
  const groupID =
    cameraGroup !== "0" && !isTrackerTab ? Number(cameraGroup) : 0;
  const trackerID = isTrackerTab && trackerOption ? Number(trackerOption) : 0;
  const cameras = useTrackerCameras(groupID, trackerID);
  const sortedCameras = useMemo(
    () => [...cameras].sort((a, b) => a.id - b.id),
    [cameras],
  );
  const { trackers } = useTrackers();
  const [openMenuCamera, setOpenMenuCamera] = useState<number | null>(null);

  const { expandedCamera, handleExpandCamera } = useExpandedCamera();

  const {
    cameraEventPoints,
    markerSec,
    handleRemoveEventPoint,
    handleRegisterPreloadedDelete,
    handleActivitySelect,
    handleMarkerChange: handleCameraMarkerChange,
    handleUpdateEventPoint,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    cleanUp
  } = useCameraEventPoints(monitoringID);

  const cameraMenuItems = useCameraMenuItems(company, location, openMenuCamera, handleActivitySelect);
  const expandedCameraMenuItems = useCameraMenuItems(company, location, expandedCamera, handleActivitySelect);

  const {
    snapshot,
    eventPoints: preloadedEventPoints,
    rangeSessions,
  } = useMonitoring(trackers, monitoringID, timeStart, timeEnd);
  const allEventPoints = useMemo(
    () => [...cameraEventPoints, ...preloadedEventPoints],
    [cameraEventPoints, preloadedEventPoints],
  );

  const { handleDeleteEventPoint } = useDeleteEventPoint(
    monitoringID,
    allEventPoints,
    handleRemoveEventPoint,
    handleRegisterPreloadedDelete,
  );

  // const { transactions } = useSalesTransactions(monitoringID);

  const { timestamp, setTimestamp, posMarkerSec } = useMarkerState(
    cameraGroup,
    markerSec,
  );

  // const { current, goTo, prev, next, currentCameraId, currentTimeSec, attended, toggleAttended, handleDone: handlePosDone } = usePosCarousel(transactions, setPosMarkerSec);

  const { markerTimeSec, handleMarkerChange, showFinalizeButton } =
    useTimelineMarker({
      snapshot,
      onTimeChange: setTimestamp,
      onMarkerChange: handleCameraMarkerChange,
    });

  const { timelinePopped, handlePopOut } = useTimelinePopout(
    handleMarkerChange,
    markerTimeSec,
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

  const menuItems = useMemo(
    () =>
      trackers.map((t) => ({
        id: t.id,
        name: t.name,
        label: t.name,
        onClick: (index: number) => handleActivitySelect(index, t.name, t.mode),
      })),
    [trackers, handleActivitySelect],
  );

  const timelineProps = useMemo(
    () => ({
      snapshot,
      cameraEventPoints: allEventPoints,
      onMarkerChange: handleMarkerChange,
      markerTimeSec,
      targetMarkerSec:
        cameraGroup === "2" && posMarkerSec !== null ? posMarkerSec : undefined,
      onUpdateEventPoint: handleUpdateEventPoint,
      onPopOut: handlePopOut,
      headerLabel: "Compliance Violations" as const,
      onUndo: handleUndo,
      onRedo: handleRedo,
      canUndo,
      canRedo,
      onRemoveEventPoint: handleDeleteEventPoint,
      viewMode: "activity" as const,
      menuItems,
      rangeSessions,
    }),
    [
      snapshot,
      allEventPoints,
      handleMarkerChange,
      markerTimeSec,
      cameraGroup,
      posMarkerSec,
      handleUpdateEventPoint,
      handlePopOut,
      handleUndo,
      handleRedo,
      canUndo,
      canRedo,
      handleDeleteEventPoint,
      menuItems,
      rangeSessions,
    ],
  );

  const expandedCameraTags = useMemo(() => {
    if (expandedCamera === null) return [];
    const seen = new Set<string>();
    return allEventPoints
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
        onClick: () => {},
      }));
  }, [allEventPoints, expandedCamera, sortedCameras, markerSec]);

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
      <Box sx={{ flex: 7, minHeight: 0, height: 0 }}>
        <CameraLayout
          count={cameras.length}
          media="/assets/camera/Cam thumbnail.svg"
          maxHeight="100%"
          contextMenuItems={cameraMenuItems}
          onMenuOpen={setOpenMenuCamera}
          cameraEventPoints={allEventPoints}
          markerSec={markerSec}
          onRemoveEventPoint={handleDeleteEventPoint}
          cameras={cameras}
          company={company}
          location={location}
          date={date}
          timestamp={timestamp}
          expandedCamera={expandedCamera}
          onExpandCamera={handleExpandCamera}
        />
      </Box>
      {/* && !expandedCamera */}

      {!timelinePopped && expandedCamera === null && (
        <Box sx={{ flex: 3, minHeight: 0 }}>
          <TimeLine {...timelineProps} />
        </Box>
      )}

      {expandedCamera !== null && !timelinePopped && (
        <Box sx={{ flex: 3, minHeight: 0, zIndex: 2000 }}>
          <TimeLine {...timelineProps} />
        </Box>
      )}

      <ExpandedCameraDialog
        open={expandedCamera !== null}
        onClose={() =>
          expandedCamera !== null && handleExpandCamera(expandedCamera)
        }
        cameraIndex={expandedCamera ?? 0}
        media="/assets/camera/Cam thumbnail.svg"
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
