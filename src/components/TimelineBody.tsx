import { Box } from "@mui/system";
import { Colors } from "../theme";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { NavTab, TimelineBodyProps, FlatRow, CameraEventPoint } from "./timeline/types";

export interface TimelineBodyHandle {
  stepMarker: (deltaSec: number) => void;
}
import { TUNNEL_CAMERAS, MOCK_SNAPSHOT } from "./timeline/constants";
import { useTimelineKeyboard } from "./timeline/hooks/useTimelineKeyboard";
import { useTimelineBodyState } from "./timeline/hooks/useTimelineBodyState";
import { TimelineRowList } from "./timeline/TimelineRowList";
import { TimelineTimeRuler } from "./timeline/TimelineTimeRuler";
import { TimelineGridRows } from "./timeline/TimelineGridRows";
import { TimelineMarker } from "./timeline/TimelineMarker";
import { GoToTimeDialog } from "./timeline/GoToTimeDialog";

const toSeconds = (time: string) => {
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

const TimelineBody = forwardRef<TimelineBodyHandle, TimelineBodyProps>(({
  snapshot,
  activeTab,
  selectedTab,
  cameraActivities,
  cameraEventPoints,
  onMarkerChange,
}, ref) => {
  const [goToTimeOpen, setGoToTimeOpen] = useState(false);
  const isTunnel = selectedTab === "2";

  const data = snapshot || MOCK_SNAPSHOT;
  const timelineStartSec = toSeconds(data.timeline.times.start);
  const timelineEndSec = toSeconds(data.timeline.times.end);

  const filteredTracks =
    snapshot?.timeline.tracks.filter((t) => t.category === activeTab) ||
    MOCK_SNAPSHOT.timeline.tracks.filter((t) => t.category === activeTab);

  const flatRows = useMemo((): FlatRow[] => {
    if (!isTunnel) {
      const rows: FlatRow[] = [];
      for (let i = 0; i < TUNNEL_CAMERAS.length; i++) {
        const cam = TUNNEL_CAMERAS[i];
        rows.push({
          id: cam.id,
          name: cam.name,
          kind: "camera" as const,
          cameraNumber: i + 1,
          sessions: cam.sessions,
        });
        const labels = [
          ...new Set(
            (cameraEventPoints ?? [])
              .filter((ep) => ep.cameraId === cam.id)
              .map((ep) => ep.label),
          ),
        ].sort();
        labels.forEach((label, idx) => {
          rows.push({
            id: cam.id * 1000 + idx,
            name: label,
            kind: "event" as const,
            parentCameraId: cam.id,
            cameraNumber: 0,
            sessions: [],
          });
        });
      }
      return rows;
    }
    const rows: FlatRow[] = [];
    let camNum = 0;
    for (const cam of TUNNEL_CAMERAS) {
      camNum++;
      rows.push({
        id: cam.id,
        name: cam.name,
        kind: "camera",
        cameraNumber: camNum,
        sessions: cam.sessions,
      });
      const acts = (cameraActivities ?? []).filter(
        (a) => a.cameraIndex === cam.id - 101,
      );
      for (const act of acts) {
        rows.push({
          id: 10000 + act.id,
          name: act.activityLabel,
          kind: "activity",
          parentCameraId: cam.id,
          cameraNumber: 0,
          sessions: [],
        });
      }
    }
    return rows;
  }, [isTunnel, filteredTracks, cameraActivities, cameraEventPoints]);

  const selectableRows = useMemo(
    () =>
      isTunnel
        ? flatRows.filter((r) => r.kind === "activity")
        : flatRows.filter((r) => r.kind !== "event"),
    [isTunnel, flatRows],
  );

  const allTimestamps = flatRows.flatMap((row) =>
    row.sessions.map((s) => toSeconds(s.timestamp)),
  );
  const firstActivitySec =
    allTimestamps.length > 0 ? Math.min(...allTimestamps) : 0;

  const headerLabel = isTunnel ? "Tunnel Activities" : (activeTab as NavTab);

  const state = useTimelineBodyState({
    snapshot,
    activeTab,
    selectedTab,
    cameraActivities,
    isTunnel,
    flatRows,
    selectableRows,
    timelineStartSec,
    timelineEndSec,
    firstActivitySec,
  });

  useEffect(() => {
    onMarkerChange?.(state.resolvedMarkerSec);
  }, [state.resolvedMarkerSec]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select the camera row when a new event point is dropped onto it
  const prevEventCountRef = useRef(cameraEventPoints?.length ?? 0);
  useEffect(() => {
    const count = cameraEventPoints?.length ?? 0;
    if (count > prevEventCountRef.current && cameraEventPoints?.length) {
      const last = cameraEventPoints[cameraEventPoints.length - 1];
      state.setITrackId(last.cameraId);
      state.setSelectedTracks(new Set());
    }
    prevEventCountRef.current = count;
  }, [cameraEventPoints]); // eslint-disable-line react-hooks/exhaustive-deps

  useTimelineKeyboard({
    isTunnel,
    selectableRows,
    iTrackId: state.iTrackId,
    setITrackId: state.setITrackId,
    activeSessionStarts: state.activeSessionStarts,
    setActiveSessionStarts: state.setActiveSessionStarts,
    markerSec: state.markerSec,
    timelineStartSec,
    timelineEndSec,
    selectedTracks: state.selectedTracks,
    setSelectedTracks: state.setSelectedTracks,
    setCompletedSessions: state.setCompletedSessions,
    setMarkerSec: state.setMarkerSec,
    setShowPunchOut: state.setShowPunchOut,
    punchOutTimerRef: state.punchOutTimerRef,
    zoom: state.zoom,
    setZoom: state.setZoom,
    panOffsetSec: state.panOffsetSec,
    setPanOffsetSec: state.setPanOffsetSec,
    totalSec: state.totalSec,
    gridRef: state.gridRef,
    setGoToTimeOpen,
  });

  useImperativeHandle(ref, () => ({
    stepMarker: (deltaSec: number) => {
      const next = Math.max(
        timelineStartSec,
        Math.min(timelineEndSec, state.resolvedMarkerSec + deltaSec),
      );
      state.setMarkerSec(next);
    },
  }));

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        borderTop: `1px solid ${Colors.lightGrayishBlue}`,
        overflow: "hidden",
      }}
    >
      <TimelineRowList
        dialogOnClose={state.handleOnCloseDialog}
        onOpenDialog={state.handleOnOpenDialog}
        openDialog={state.openDialog}
        flatRows={flatRows}
        selectedTracks={state.selectedTracks}
        activeSessionStarts={state.activeSessionStarts}
        isTunnel={isTunnel}
        headerLabel={headerLabel}
        listBodyRef={state.listBodyRef}
        rowsScrollRef={state.rowsScrollRef}
        iTrackId={state.iTrackId}
        setITrackId={state.setITrackId}
        setSelectedTracks={state.setSelectedTracks}
      />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: Colors.white,
          position: "relative",
        }}
      >
        <TimelineTimeRuler
          zoom={state.zoom}
          isDragging={state.isDragging}
          panOffsetSec={state.panOffsetSec}
          setIsDragging={state.setIsDragging}
          setDragStartX={state.setDragStartX}
          setDragStartOffset={state.setDragStartOffset}
          handleMouseMove={state.handleMouseMove}
          timelineStartSec={timelineStartSec}
          timelineEndSec={timelineEndSec}
          visibleStart={state.visibleStart}
          visibleDuration={state.visibleDuration}
          startSec={state.startSec}
          tickStepSec={state.tickStepSec}
          isInActivityRange={state.isInActivityRange}
        />

        <TimelineGridRows
          flatRows={flatRows}
          gridRef={state.gridRef}
          rowsScrollRef={state.rowsScrollRef}
          listBodyRef={state.listBodyRef}
          zoom={state.zoom}
          panOffsetSec={state.panOffsetSec}
          totalSec={state.totalSec}
          startSec={state.startSec}
          tickStepSec={state.tickStepSec}
          selectedTracks={state.selectedTracks}
          completedSessions={state.completedSessions}
          activeSessionStarts={state.activeSessionStarts}
          resolvedMarkerSec={state.resolvedMarkerSec}
          isTunnel={isTunnel}
          visibleStart={state.visibleStart}
          visibleDuration={state.visibleDuration}
          hasAnyBars={state.hasAnyBars}
          setZoom={state.setZoom}
          setPanOffsetSec={state.setPanOffsetSec}
          cameraEventPoints={cameraEventPoints}
        />

        <TimelineMarker
          isCurrentVisible={state.isCurrentVisible}
          currentLeft={state.currentLeft}
          selectedTracks={state.selectedTracks}
          showPunchOut={state.showPunchOut}
          iTrackId={state.iTrackId}
          flatRows={flatRows}
          listBodyRef={state.listBodyRef}
        />
      </Box>

      <GoToTimeDialog
        open={goToTimeOpen}
        onClose={() => setGoToTimeOpen(false)}
        onConfirm={(sec) => state.setMarkerSec(sec)}
        timelineStartSec={timelineStartSec}
        timelineEndSec={timelineEndSec}
      />
    </Box>
  );
});

export default TimelineBody;
