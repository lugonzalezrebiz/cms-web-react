import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Box } from "@mui/system";
import TimeLine from "../../components/TimeLine";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import { useCameraEventPoints } from "../../components/timeline/hooks/useCameraEventPoints";
import { useTimelineMarker } from "../../components/timeline/hooks/useTimelineMarker";
import { useSessionDate } from "../../components/timeline/hooks/useSessionDate";
import { useSaveMonitoring } from "../../components/timeline/hooks/useSaveMonitoring";
import useTrackers from "../../hooks/useTrackers";
import { useMenuItems } from "../Monitor/hooks/useMenuItems";

const MonitorTimeline = () => {
  const [searchParams] = useSearchParams();
  const monitoringID = searchParams.get("monitoringID") ?? "";
  const { trackers } = useTrackers();
  const { snapshot, eventPoints: preloadedEventPoints, rangeSessions } = useMonitoring(trackers, monitoringID);

  const {
    cameraEventPoints,
    handleMarkerChange: handleCameraMarkerChange,
    handleUpdateEventPoint,
    handleActivitySelect,
    handleRemoveEventPoint,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  } = useCameraEventPoints(monitoringID);

  const allEventPoints = [...cameraEventPoints, ...preloadedEventPoints];

  const { markerTimeSec, handleMarkerChange } = useTimelineMarker({
    snapshot,
    onMarkerChange: handleCameraMarkerChange,
  });

  const { allMenuItems } = useMenuItems(trackers, handleActivitySelect);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const suppressBroadcastRef = useRef(false);
  const handleMarkerChangeRef = useRef(handleMarkerChange);
  useEffect(() => { handleMarkerChangeRef.current = handleMarkerChange; }, [handleMarkerChange]);

  useEffect(() => {
    const channel = new BroadcastChannel("timeline-sync");
    channelRef.current = channel;
    channel.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "marker" && e.data?.source === "monitor") {
        suppressBroadcastRef.current = true;
        handleMarkerChangeRef.current(e.data.sec as number);
      }
    });
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (markerTimeSec === null || !channelRef.current) return;
    if (suppressBroadcastRef.current) {
      suppressBroadcastRef.current = false;
      return;
    }
    channelRef.current.postMessage({ type: "marker", sec: markerTimeSec, source: "popout" });
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
        onRemoveEventPoint={handleRemoveEventPoint}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        headerLabel="Activities"
        viewMode="activity"
        menuItems={allMenuItems}
        rangeSessions={rangeSessions}
      />
    </Box>
  );
};

export default MonitorTimeline;
