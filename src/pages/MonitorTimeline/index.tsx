import { useEffect, useRef } from "react";
import { Box } from "@mui/system";
import TimeLine from "../../components/TimeLine";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import { useCameraEventPoints } from "../../components/timeline/hooks/useCameraEventPoints";
import { useTimelineMarker } from "../../components/timeline/hooks/useTimelineMarker";
import { useSessionDate } from "../../components/timeline/hooks/useSessionDate";
import { useSaveMonitoring } from "../../components/timeline/hooks/useSaveMonitoring";
import { useTrackers } from "../Monitor/hooks/useTrackers";

const MonitorTimeline = () => {
  const trackers = useTrackers();
  const { snapshot, eventPoints: preloadedEventPoints } = useMonitoring(trackers);

  const {
    cameraEventPoints,
    handleMarkerChange: handleCameraMarkerChange,
    handleUpdateEventPoint,
  } = useCameraEventPoints();

  const allEventPoints = [...cameraEventPoints, ...preloadedEventPoints];

  const { markerTimeSec, handleMarkerChange, showFinalizeButton } =
    useTimelineMarker({
      snapshot,
      onMarkerChange: handleCameraMarkerChange,
    });

  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel("timeline-sync");
    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (markerTimeSec === null || !channelRef.current) return;
    channelRef.current.postMessage({ type: "marker", sec: markerTimeSec });
  }, [markerTimeSec]);

  const sessionDate = useSessionDate();
  const { handleDone } = useSaveMonitoring({
    trackers,
    eventPoints: cameraEventPoints,
    sessionDate,
  });

  return (
    <Box sx={{ height: "100vh", overflow: "hidden" }}>
      <TimeLine
        snapshot={snapshot}
        cameraEventPoints={allEventPoints}
        onMarkerChange={handleMarkerChange}
        markerTimeSec={markerTimeSec}
        showFinalizeButton={showFinalizeButton}
        onUpdateEventPoint={handleUpdateEventPoint}
        onDone={handleDone}
        headerLabel="Cameras"
      />
    </Box>
  );
};

export default MonitorTimeline;
