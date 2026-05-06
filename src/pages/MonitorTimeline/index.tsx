import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Box } from "@mui/system";
import TimeLine from "../../components/TimeLine";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import { useCameraEventPoints } from "../../components/timeline/hooks/useCameraEventPoints";
import { useTimelineMarker } from "../../components/timeline/hooks/useTimelineMarker";
import { useSessionDate } from "../../components/timeline/hooks/useSessionDate";
import { useSaveMonitoring } from "../../components/timeline/hooks/useSaveMonitoring";
import { useTrackers } from "../Monitor/hooks/useTrackers";
import { useMenuItems } from "../Monitor/hooks/useMenuItems";

const MonitorTimeline = () => {
  const [searchParams] = useSearchParams();
  const monitoringID = searchParams.get("monitoringID") ?? "";
  const trackers = useTrackers(monitoringID);
  const { snapshot, eventPoints: preloadedEventPoints, rangeSessions } = useMonitoring(trackers, monitoringID);

  const {
    cameraEventPoints,
    handleMarkerChange: handleCameraMarkerChange,
    handleUpdateEventPoint,
    handleActivitySelect,
  } = useCameraEventPoints();

  const allEventPoints = [...cameraEventPoints, ...preloadedEventPoints];

  const { markerTimeSec, handleMarkerChange } = useTimelineMarker({
    snapshot,
    onMarkerChange: handleCameraMarkerChange,
  });

  const { allMenuItems } = useMenuItems(trackers, handleActivitySelect);

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
  useSaveMonitoring({
    trackers,
    eventPoints: cameraEventPoints,
    sessionDate,
    monitoringID,
  });

  return (
    <Box sx={{ height: "100vh", overflow: "hidden" }}>
      <TimeLine
        snapshot={snapshot}
        cameraEventPoints={allEventPoints}
        onMarkerChange={handleMarkerChange}
        markerTimeSec={markerTimeSec}
        onUpdateEventPoint={handleUpdateEventPoint}
        headerLabel="Activities"
        viewMode="activity"
        menuItems={allMenuItems}
        rangeSessions={rangeSessions}
      />
    </Box>
  );
};

export default MonitorTimeline;
