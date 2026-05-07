import { Box } from "@mui/system";
import { useState, useMemo, useEffect, useRef } from "react";
import { useTrackersByCamera } from "../../hooks/useTrackersByCamera";
import type { CameraContextMenuItem } from "../../components/CameraOverlayMenu";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";
import { useExpandedCamera } from "../../hooks/useExpandedCamera";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import { useTrackerCameras } from "./hooks/useTrackerCameras";
import useTrackers from "../../hooks/useTrackers";
import { useCameraEventPoints } from "../../components/timeline/hooks/useCameraEventPoints";
import { useMenuItems } from "./hooks/useMenuItems";
// import { useSalesTransactions } from "./hooks/useSalesTransactions";
import { useDashboardParams } from "./hooks/useDashboardParams";
import { useMarkerState } from "./hooks/useMarkerState";
// import { usePosCarousel } from "./hooks/usePosCarousel";
import { useSessionDate } from "../../components/timeline/hooks/useSessionDate";
import { useSaveMonitoring } from "../../components/timeline/hooks/useSaveMonitoring";
import { useTimelineMarker } from "../../components/timeline/hooks/useTimelineMarker";
import { useTimelinePopout } from "./hooks/useTimelinePopout";
import {
  useRegisterMonitorActions,
  useCameraGroup,
} from "../../contexts/MonitorContext";
import { ExpandedCameraDialog } from "./components/ExpandedCameraDialog";

const Monitor = () => {
  const { company, location, date, monitoringID } = useDashboardParams();

  const { cameraGroup, trackerOption } = useCameraGroup();
  const isTrackerTab = cameraGroup === "tracker";
  const groupID =
    cameraGroup !== "0" && !isTrackerTab ? Number(cameraGroup) : 0;
  const trackerID = isTrackerTab && trackerOption ? Number(trackerOption) : 0;
  const cameras = useTrackerCameras(groupID, trackerID);
  const { trackers } = useTrackers();
  const [openMenuCamera, setOpenMenuCamera] = useState<number | null>(null);

  const { expandedCamera, handleExpandCamera } = useExpandedCamera();

  const {
    cameraEventPoints,
    markerSec,
    handleRemoveEventPoint,
    handleActivitySelect,
    handleMarkerChange: handleCameraMarkerChange,
    handleUpdateEventPoint,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  } = useCameraEventPoints(monitoringID);

  const fetchedTrackers = useTrackersByCamera(
    company,
    location,
    (openMenuCamera ?? 0) + 1,
    openMenuCamera !== null,
  );
  const cameraMenuItems = useMemo<CameraContextMenuItem[]>(
    () => [
      ...fetchedTrackers.map((t) => ({
        id: t.id,
        name: t.name,
        label: t.name,
        onClick: (idx: number) => handleActivitySelect(idx, t.name),
      })),
    ],
    [fetchedTrackers, handleActivitySelect],
  );

  const {
    snapshot,
    eventPoints: preloadedEventPoints,
    rangeSessions,
  } = useMonitoring(trackers, monitoringID);
  const allEventPoints = [...cameraEventPoints, ...preloadedEventPoints];

  // const { transactions } = useSalesTransactions(monitoringID);

  const { timestamp, setTimestamp, posMarkerSec } = useMarkerState(
    cameraGroup,
    markerSec,
  );

  const { allMenuItems } = useMenuItems(trackers, handleActivitySelect);

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
  });

  useRegisterMonitorActions(handleDone, showFinalizeButton);

  const handleDoneRef = useRef(handleDone);
  useEffect(() => {
    handleDoneRef.current = handleDone;
  }, [handleDone]);
  useEffect(() => {
    let active = false;
    const id = setTimeout(() => {
      active = true;
    }, 0);
    return () => {
      clearTimeout(id);
      if (active) handleDoneRef.current();
    };
  }, []);

  const timelineProps = {
    snapshot,
    cameraEventPoints: allEventPoints,
    onMarkerChange: handleMarkerChange,
    markerTimeSec,
    targetMarkerSec:
      cameraGroup === "2" && posMarkerSec !== null ? posMarkerSec : undefined,
    onUpdateEventPoint: handleUpdateEventPoint,
    onPopOut: handlePopOut,
    headerLabel: "Compliance Violations",
    onUndo: handleUndo,
    onRedo: handleRedo,
    canUndo,
    canRedo,
    onRemoveEventPoint: handleRemoveEventPoint,
    viewMode: "activity" as const,
    menuItems: trackers.map((t) => ({
      id: t.id,
      name: t.name,
      label: t.name,
      onClick: (index: number) => handleActivitySelect(index, t.name),
    })),
    rangeSessions,
  } as const;

  const expandedCameraTags =
    expandedCamera !== null
      ? allEventPoints
          .filter(
            (ep) =>
              ep.cameraId === 1 + expandedCamera &&
              markerSec >= ep.startSec &&
              markerSec <= ep.endSec,
          )
          .map((ep) => ({
            id: ep.id,
            name: ep.label,
            label: ep.label,
            onClick: () => {},
          }))
      : [];

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
      <Box sx={{ flex: 6, minHeight: 0, height: 0 }}>
        <CameraLayout
          count={cameras.length}
          media="/assets/camera/Cam thumbnail.svg"
          maxHeight="100%"
          contextMenuItems={cameraMenuItems}
          onMenuOpen={setOpenMenuCamera}
          cameraEventPoints={allEventPoints}
          markerSec={markerSec}
          onRemoveEventPoint={handleRemoveEventPoint}
          cameras={cameras}
          company={company}
          location={location}
          date={date}
          timestamp={timestamp}
          expandedCamera={expandedCamera}
          onExpandCamera={handleExpandCamera}
        />
      </Box>

      {!timelinePopped && (
        <Box sx={{ flex: 4, minHeight: 0 }}>
          <TimeLine {...timelineProps} />
        </Box>
      )}

      {expandedCamera !== null && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "34vh",
            zIndex: 2000,
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
        media="/assets/camera/Cam thumbnail.svg"
        expandCamera={handleExpandCamera}
        tags={expandedCameraTags}
        contextMenuItems={allMenuItems}
        cameraId={cameras[expandedCamera ?? 0]?.id}
        cameraName={cameras[expandedCamera ?? 0]?.name}
        company={company}
        location={location}
        date={date}
        timestamp={timestamp}
        onRemoveTag={handleRemoveEventPoint}
      />
    </Box>
  );
};

export default Monitor;
