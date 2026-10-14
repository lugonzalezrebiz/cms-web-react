import { Box } from "@mui/system";
import { useState } from "react";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";
import { useExpandedCamera } from "../../hooks/useExpandedCamera";
import { useDashboardParams } from "./hooks/useDashboardParams";
import { useMarkerState } from "./hooks/useMarkerState";
import { useTimelinePopout } from "./hooks/useTimelinePopout";
import { useActiveCameras } from "./hooks/useActiveCameras";
import { useGuardedActivityHandlers } from "./hooks/useGuardedActivityHandlers";
import { useCameraContextMenus } from "./hooks/useCameraContextMenus";
import { useExpandedCameraTags } from "./hooks/useExpandedCameraTags";
import {
  useRegisterMonitorActions,
  useTimelineTab,
} from "../../contexts/useMonitorContext";
import { ExpandedCameraDialog } from "./components/ExpandedCameraDialog";
import { PunchDialogs } from "./components/PunchDialogs";
import { useTrackerGroupResolution } from "./hooks/useTrackerGroupResolution";
import { useMonitorTimeline } from "./hooks/useMonitorTimeline";
import NoReviewGuard from "../../components/NoReviewGuard";
import useNavigateWithQuery from "../../hooks/useNavigate";
import { isPunchesNavTab } from "../../components/timeline/constants";

const Monitor = () => {
  const { company, location, date, monitoringID } = useDashboardParams();

  const trackerResolution = useTrackerGroupResolution();
  const { cameraGroup, trackerOption, customTrackerIDs } = trackerResolution;

  const [openMenuCamera, setOpenMenuCamera] = useState<number | null>(null);
  // "employeesCustomers" shows every camera and lists Back Room, Unattended
  // and the punched-in employees with their customers;
  // "compliances" keeps the tracker-filtered activity view.
  // Lives in the monitor context so the header can show this tab's shortcuts.
  const { activeTab, setActiveTab } = useTimelineTab();
  const isPunchesTab = isPunchesNavTab(activeTab);
  const navigate = useNavigateWithQuery();

  const { expandedCamera, handleExpandCamera } = useExpandedCamera();
  const { timestamp, setTimestamp } = useMarkerState();

  // The timeline's data, review state, filtering, marker, Employees &
  // Customers flows and saving — shared with the popout timeline.
  const {
    timelineProps,
    tabTargetSec,
    punchDialogProps,
    noReviewReason,
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
  } = useMonitorTimeline({
    monitoringID,
    company,
    location,
    trackerResolution,
    activeTab,
    onTabChange: setActiveTab,
    onTimeChange: setTimestamp,
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

  const { timelinePopped, handlePopOut, restoreMarkerSec } = useTimelinePopout(
    handleMarkerChange,
    markerTimeSec,
    cameraGroup,
    trackerOption ?? "",
    customTrackerIDs,
    activeTab,
    setActiveTab,
  );

  useRegisterMonitorActions(
    handleDone,
    showFinalizeButton,
    isDoneLoading,
    unreviewedTrackerIds,
    aiTrackerIds,
  );

  // Mirrors TimeLine.tsx's own hasMultipleRows (selectableRows.length >= 2) — filteredMenuItems
  // is the same source useActivityRows builds its selectableRows from, one-to-one.
  const hasMultipleRows = filteredMenuItems.length >= 2;

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
          <TimeLine
            // Back from the popout, the marker stays where it was left there.
            targetMarkerSec={restoreMarkerSec ?? tabTargetSec}
            onPopOut={handlePopOut}
            expandedIcon={!expandedCamera}
            {...timelineProps}
          />
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
      <PunchDialogs {...punchDialogProps} />
      <NoReviewGuard reason={noReviewReason} onGoBack={() => navigate(-1)} />
    </Box>
  );
};

export default Monitor;
