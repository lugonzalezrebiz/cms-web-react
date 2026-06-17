import { useState, useMemo, useEffect } from "react";
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
import { useBroadcastSync } from "./hooks/useBroadcastSync";

const MonitorTimeline = () => {
  const [searchParams] = useSearchParams();
  const monitoringID = searchParams.get("monitoringID") ?? "";
  const cameraGroup = searchParams.get("cameraGroup") ?? "";
  const { trackers } = useTrackers();
  const {
    snapshot,
    eventPoints: preloadedEventPoints,
    rangeSessions,
  } = useMonitoring(trackers, monitoringID);

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
    cleanUp,
  } = useCameraEventPoints(monitoringID);

  const allEventPoints = [...cameraEventPoints, ...preloadedEventPoints];

  const isDirectTracker =
    cameraGroup !== "" && cameraGroup !== "0" && !isNaN(Number(cameraGroup));
  const isCustomMode = cameraGroup === "__custom__";

  const [customTrackerIDs, setCustomTrackerIDs] = useState<number[]>(() => {
    if (!isCustomMode) return [];
    try {
      const saved = sessionStorage.getItem(`custom_tracker_group_${monitoringID}`);
      return saved ? (JSON.parse(saved) as string[]).map(Number) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!isCustomMode) return;
    const channel = new BroadcastChannel("timeline-sync");
    channel.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "custom-group") {
        setCustomTrackerIDs(e.data.ids as number[]);
      }
    });
    return () => channel.close();
  }, [isCustomMode]);

  const filteredEventPoints = useMemo(() => {
    if (isDirectTracker) {
      const tracker = trackers.find((t) => t.id === Number(cameraGroup));
      if (!tracker) return allEventPoints;
      return allEventPoints.filter((ep) => ep.label === tracker.name);
    }
    if (isCustomMode && customTrackerIDs.length > 0) {
      const names = new Set(
        trackers
          .filter((t) => customTrackerIDs.includes(t.id))
          .map((t) => t.name),
      );
      return allEventPoints.filter((ep) => names.has(ep.label));
    }
    return allEventPoints;
  }, [allEventPoints, isDirectTracker, isCustomMode, cameraGroup, customTrackerIDs, trackers]);

  const { markerTimeSec, handleMarkerChange } = useTimelineMarker({
    snapshot,
    onMarkerChange: handleCameraMarkerChange,
  });

  const { allMenuItems } = useMenuItems(trackers, handleActivitySelect);

  const filteredMenuItems = useMemo(() => {
    if (isDirectTracker)
      return allMenuItems.filter((item) => item.id === Number(cameraGroup));
    if (isCustomMode && customTrackerIDs.length > 0)
      return allMenuItems.filter((item) => customTrackerIDs.includes(item.id));
    return allMenuItems;
  }, [allMenuItems, isDirectTracker, isCustomMode, cameraGroup, customTrackerIDs]);

  const [targetSec, setTargetSec] = useState<number | undefined>(undefined);
  useBroadcastSync(markerTimeSec, setTargetSec);

  const sessionDate = useSessionDate();
  useSaveMonitoring({
    trackers,
    eventPoints: cameraEventPoints,
    sessionDate,
    monitoringID,
    onSuccess: cleanUp,
  });

  return (
    <Box sx={{ height: "100vh", overflow: "hidden" }}>
      <TimeLine
        snapshot={snapshot}
        cameraEventPoints={filteredEventPoints}
        onMarkerChange={handleMarkerChange}
        markerTimeSec={markerTimeSec}
        targetMarkerSec={targetSec}
        onUpdateEventPoint={handleUpdateEventPoint}
        onRemoveEventPoint={handleRemoveEventPoint}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        headerLabel="Activities"
        viewMode="activity"
        menuItems={filteredMenuItems}
        rangeSessions={rangeSessions}
        onPopOut={() => window.close()}
        expandedIcon={false}
      />
    </Box>
  );
};

export default MonitorTimeline;
