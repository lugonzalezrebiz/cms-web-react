import { Box } from "@mui/material";
import { useRef, useState, useEffect } from "react";
import TimelineBody, { type TimelineBodyHandle } from "./timeline/TimelineBody";
import type {
  NavTab,
  CameraEventPoint,
  TimelineSnapshot,
} from "./timeline/types";
import { usePopover } from "./timeline/hooks/usePopover";
import { useSessionDate } from "./timeline/hooks/useSessionDate";
import { useTimelineMarker } from "./timeline/hooks/useTimelineMarker";
import { useSaveMonitoring } from "./timeline/hooks/useSaveMonitoring";
import TimelineNavPopover from "./timeline/TimelineNavPopover";
import TimelineCameraPopover from "./timeline/TimelineCameraPopover";
import TimelineToolbar from "./timeline/TimelineToolbar";

const TimeLine = ({
  selectedTab,
  cameraActivities,
  cameraEventPoints,
  drawerOpen,
  onTimeChange,
  onMarkerChange,
  trackers = [],
  snapshot,
  posSnapshot,
  posEventPoints,
  targetMarkerSec,
  onUpdateEventPoint,
}: {
  selectedTab?: string;
  cameraActivities?: {
    id: number;
    cameraIndex: number;
    activityLabel: string;
  }[];
  cameraEventPoints?: CameraEventPoint[];
  drawerOpen?: boolean;
  onTimeChange?: (timestamp: string) => void;
  onMarkerChange?: (sec: number) => void;
  trackers?: { id: number; name: string }[];
  snapshot: TimelineSnapshot;
  posSnapshot?: TimelineSnapshot;
  posEventPoints?: CameraEventPoint[];
  targetMarkerSec?: number;
  onUpdateEventPoint?: (
    id: number,
    update: Partial<Pick<CameraEventPoint, "startSec" | "endSec">>,
  ) => void;
}) => {
  const mergedEventPoints = cameraEventPoints ?? [];
  const [activeTab, setActiveTab] = useState<NavTab>("employees");
  const [selectedCameraOption, setSelectedCameraOption] = useState("Off");
  const [isPlaying, setIsPlaying] = useState(false);
  const timelineBodyRef = useRef<TimelineBodyHandle>(null);

  useEffect(() => {
    if (targetMarkerSec !== undefined) {
      timelineBodyRef.current?.setMarker(targetMarkerSec);
    }
  }, [targetMarkerSec]);

  const sessionDate = useSessionDate();
  const { markerTimeSec, handleMarkerChange, isMarkerAtEnd } =
    useTimelineMarker({
      snapshot,
      onTimeChange,
      onMarkerChange,
    });
  const { handleDone } = useSaveMonitoring({
    trackers,
    eventPoints: mergedEventPoints,
    sessionDate,
  });

  const nav = usePopover();
  const cameraMenu = usePopover();

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TimelineToolbar
        selectedTab={selectedTab}
        drawerOpen={drawerOpen}
        selectedCameraOption={selectedCameraOption}
        markerTimeSec={markerTimeSec}
        snapshotStartTime={snapshot.timeline.times.start}
        isPlaying={isPlaying}
        isMarkerAtEnd={isMarkerAtEnd}
        onDone={handleDone}
        onStepMarker={(sec) => timelineBodyRef.current?.stepMarker(sec)}
        onTogglePlay={() => timelineBodyRef.current?.togglePlay()}
      />

      <TimelineNavPopover
        open={nav.open}
        anchorEl={nav.anchorEl}
        onClose={nav.handleClose}
        drawerOpen={drawerOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <TimelineCameraPopover
        open={cameraMenu.open}
        anchorEl={cameraMenu.anchorEl}
        onClose={cameraMenu.handleClose}
        drawerOpen={drawerOpen}
        selectedOption={selectedCameraOption}
        onOptionChange={setSelectedCameraOption}
      />

      <TimelineBody
        ref={timelineBodyRef}
        snapshot={snapshot}
        posSnapshot={posSnapshot}
        posEventPoints={posEventPoints}
        activeTab={activeTab}
        selectedTab={selectedTab}
        cameraActivities={cameraActivities}
        cameraEventPoints={mergedEventPoints}
        onMarkerChange={handleMarkerChange}
        onPlayingChange={setIsPlaying}
        onUpdateEventPoint={onUpdateEventPoint}
      />
    </Box>
  );
};

export default TimeLine;
