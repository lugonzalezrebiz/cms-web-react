import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box } from "@mui/system";
import TimeLine from "../../components/TimeLine";
import useTrackerGrouping from "../../hooks/useTrackerGrouping";
import { useTrackerGroupResolutionFor } from "../Monitor/hooks/useTrackerGroupResolution";
import { useMonitorTimeline } from "../Monitor/hooks/useMonitorTimeline";
import { PunchDialogs } from "../Monitor/components/PunchDialogs";
import { useBroadcastSync } from "./hooks/useBroadcastSync";
import NoReviewGuard from "../../components/NoReviewGuard";

// The timeline popped out of the main Monitor window: the same timeline
// (useMonitorTimeline), kept in sync with the main window over
// BroadcastChannel — the marker and tab both ways, the camera group from it.
const MonitorTimeline = () => {
  const [searchParams] = useSearchParams();
  const monitoringID = searchParams.get("monitoringID") ?? "";
  const company = Number(searchParams.get("company") ?? 0);
  const location = Number(searchParams.get("location") ?? 0);

  // Where the main window's marker is (from the URL, then from its messages).
  const markerSecParam = searchParams.get("markerSec");
  const initialMarkerSec =
    markerSecParam !== null ? Number(markerSecParam) : undefined;
  const [targetSec, setTargetSec] = useState<number | undefined>(
    initialMarkerSec,
  );
  const {
    cameraGroup,
    trackerOption,
    customTrackerIDs,
    activeTab,
    changeTab,
    publishMarker,
    restoreSelection,
    publishSelection,
  } = useBroadcastSync(setTargetSec);

  // Reset broadcast target when filter changes so auto-pan fires immediately
  const [prevCameraGroup, setPrevCameraGroup] = useState(cameraGroup);
  if (prevCameraGroup !== cameraGroup) {
    setPrevCameraGroup(cameraGroup);
    if (targetSec !== undefined) setTargetSec(undefined);
  }

  // Same tracker resolution as the main window, fed by the broadcast state.
  const { trackers: trackerGroupings, isLoading: isTrackerGroupingsLoading } =
    useTrackerGrouping();
  const trackerResolution = useTrackerGroupResolutionFor({
    cameraGroup,
    trackerOption,
    customTrackerIDs,
    trackerGroupings,
    isTrackerGroupingsLoading,
  });

  const {
    timelineProps,
    tabTargetSec,
    punchDialogProps,
    noReviewReason,
    markerTimeSec,
  } = useMonitorTimeline({
    monitoringID,
    company,
    location,
    trackerResolution,
    activeTab,
    onTabChange: changeTab,
  });

  // This window's marker goes to the main one.
  useEffect(() => {
    publishMarker(markerTimeSec);
  }, [markerTimeSec, publishMarker]);

  return (
    <Box sx={{ height: "100vh", overflow: "hidden" }}>
      <TimeLine
        targetMarkerSec={targetSec ?? tabTargetSec}
        onPopOut={() => window.close()}
        expandedIcon={false}
        // The main window's selection when it popped out; this window's goes
        // back to it, for when the popout closes.
        restoreSelection={restoreSelection}
        onSelectionChange={publishSelection}
        {...timelineProps}
      />
      <PunchDialogs {...punchDialogProps} />
      <NoReviewGuard reason={noReviewReason} onGoBack={() => window.close()} />
    </Box>
  );
};

export default MonitorTimeline;
