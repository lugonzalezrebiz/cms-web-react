import { Box } from "@mui/system";
import TimeLine from "../../components/TimeLine";
import CameraLayout, { TAG_TOLERANCE_SEC } from "../../components/CameraLayout";
import { useExpandedCamera } from "../../hooks/useExpandedCamera";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import { useCameras } from "./hooks/useCameras";
import { useTrackers } from "./hooks/useTrackers";
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

  const cameras = useCameras(company, location, date);
  const trackers = useTrackers();
  const { cameraGroup } = useCameraGroup();
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

  const { snapshot, eventPoints: preloadedEventPoints } =
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
    menuItems: allMenuItems,
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
            contextMenuItems={allMenuItems}
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
