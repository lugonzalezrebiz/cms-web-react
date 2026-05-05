import { Box } from "@mui/system";
import { useState, useMemo } from "react";
import { useTrackersByCamera } from "../../hooks/useTrackersByCamera";
import type { CameraContextMenuItem } from "../../components/CameraOverlayMenu";
import TimeLine from "../../components/TimeLine";
import CameraLayout, { TAG_TOLERANCE_SEC } from "../../components/CameraLayout";
import { useExpandedCamera } from "../../hooks/useExpandedCamera";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import { useCameras } from "./hooks/useCameras";
import { useTrackerCameras } from "./hooks/useTrackerCameras";
import { useCameraEventPoints } from "../../components/timeline/hooks/useCameraEventPoints";
import { useMenuItems } from "./hooks/useMenuItems";
import { useSalesTransactions } from "./hooks/useSalesTransactions";
import { useDashboardParams } from "./hooks/useDashboardParams";
import { useMarkerState } from "./hooks/useMarkerState";
import { usePosCarousel } from "./hooks/usePosCarousel";
import { useSessionDate } from "../../components/timeline/hooks/useSessionDate";
import { useSaveMonitoring } from "../../components/timeline/hooks/useSaveMonitoring";
import { useTimelineMarker } from "../../components/timeline/hooks/useTimelineMarker";
import { useTimelinePopout } from "./hooks/useTimelinePopout";
import {
  useRegisterMonitorActions,
  useCameraGroup,
} from "../../contexts/MonitorContext";
import { ExpandedCameraDialog } from "./components/ExpandedCameraDialog";
import { PosCarouselSection } from "./components/PosCarouselSection";

const Monitor = () => {
  const { company, location, date } = useDashboardParams();

  const { cameraGroup, trackerOption } = useCameraGroup();
  const allCameras = useCameras(company, location, date);
  const trackerCameras = useTrackerCameras(trackerOption);
  const cameras = cameraGroup === "7" && trackerOption ? trackerCameras : allCameras;
  const trackers = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
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
  } = useCameraEventPoints();

  const fetchedTrackers = useTrackersByCamera(
    company, location,
    (openMenuCamera ?? 0) + 1,
    openMenuCamera !== null,
  );
  const cameraMenuItems = useMemo<CameraContextMenuItem[]>(() => [
    ...fetchedTrackers.map((t) => ({
      id: t.id,
      name: t.name,
      label: t.name,
      onClick: (idx: number) => handleActivitySelect(idx, t.name),
    })),
    { id: -1, name: "Event", label: "Event", onClick: (idx: number) => handleActivitySelect(idx, "Event") },
  ], [fetchedTrackers, handleActivitySelect]);

  const { snapshot, eventPoints: preloadedEventPoints, rangeSessions } =
    useMonitoring(trackers);
  const allEventPoints = [...cameraEventPoints, ...preloadedEventPoints];

  const { transactions, loading: transactionsLoading } = useSalesTransactions();

  const { timestamp, setTimestamp, posMarkerSec, setPosMarkerSec } =
    useMarkerState(cameraGroup, markerSec);

  const { allMenuItems } = useMenuItems(trackers, handleActivitySelect);

  const {
    current,
    goTo,
    prev,
    next,
    currentCameraId,
    currentTimeSec,
    attended,
    toggleAttended,
    handleDone: handlePosDone,
  } = usePosCarousel(transactions, setPosMarkerSec);

  const { markerTimeSec, handleMarkerChange, showFinalizeButton } =
    useTimelineMarker({
      snapshot,
      onTimeChange: setTimestamp,
      onMarkerChange: handleCameraMarkerChange,
    });

  const { timelinePopped, handlePopOut } =
    useTimelinePopout(handleMarkerChange);

  const sessionDate = useSessionDate();
  const { handleDone } = useSaveMonitoring({
    trackers,
    eventPoints: cameraEventPoints,
    sessionDate,
  });

  useRegisterMonitorActions(handleDone, showFinalizeButton);

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
    menuItems: Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      label: `Item ${i + 1}`,
      onClick: (index: number) => handleActivitySelect(index, `Item ${i + 1}`),
    })),
    rangeSessions,
  } as const;

  const expandedCameraTags =
    expandedCamera !== null
      ? allEventPoints
          .filter(
            (ep) =>
              ep.cameraId === 1 + expandedCamera &&
              Math.abs(markerSec - ep.timeSec) <= TAG_TOLERANCE_SEC,
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
        {cameraGroup === "2" ? (
          <PosCarouselSection
            company={company}
            location={location}
            transactions={transactions}
            loading={transactionsLoading}
            current={current}
            prev={prev}
            next={next}
            goTo={goTo}
            currentTimeSec={currentTimeSec}
            currentCameraId={currentCameraId}
            allMenuItems={allMenuItems}
            onMarkerChange={handleMarkerChange}
            onActivitySelect={handleActivitySelect}
            attended={attended}
            onToggleAttended={toggleAttended}
            onDone={handlePosDone}
          />
        ) : (
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
        )}
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
