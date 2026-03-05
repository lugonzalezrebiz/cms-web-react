import { Box } from "@mui/system";
import { Colors } from "../theme";
import { useMemo } from "react";
import type { NavTab, TimelineBodyProps, FlatRow } from "./timeline/types";
import { TUNNEL_CAMERAS, MOCK_SNAPSHOT } from "./timeline/constants";
import { useTimelineKeyboard } from "./timeline/hooks/useTimelineKeyboard";
import { useTimelineBodyState } from "./timeline/hooks/useTimelineBodyState";
import { TimelineRowList } from "./timeline/TimelineRowList";
import { TimelineTimeRuler } from "./timeline/TimelineTimeRuler";
import { TimelineGridRows } from "./timeline/TimelineGridRows";
import { TimelineMarker } from "./timeline/TimelineMarker";

const toSeconds = (time: string) => {
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

const TimelineBody = ({
  snapshot,
  activeTab,
  selectedTab,
  cameraActivities,
}: TimelineBodyProps) => {
  const isTunnel = selectedTab === "2";

  const data = snapshot || MOCK_SNAPSHOT;
  const timelineStartSec = toSeconds(data.timeline.times.start);
  const timelineEndSec = toSeconds(data.timeline.times.end);

  const filteredTracks =
    snapshot?.timeline.tracks.filter((t) => t.category === activeTab) ||
    MOCK_SNAPSHOT.timeline.tracks.filter((t) => t.category === activeTab);

  const flatRows = useMemo((): FlatRow[] => {
    if (!isTunnel) {
      return filteredTracks.map((t, i) => ({
        id: t.id,
        name: t.name,
        kind: "camera" as const,
        cameraNumber: i + 1,
        sessions: t.sessions,
      }));
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
  }, [isTunnel, filteredTracks, cameraActivities]);

  const selectableRows = useMemo(
    () => (isTunnel ? flatRows.filter((r) => r.kind === "activity") : flatRows),
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
  });

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        borderTop: `1px solid ${Colors.lightGrayishBlue}`,
        overflow: "hidden",
      }}
    >
      <TimelineRowList
        flatRows={flatRows}
        selectedTracks={state.selectedTracks}
        activeSessionStarts={state.activeSessionStarts}
        isTunnel={isTunnel}
        headerLabel={headerLabel}
        listBodyRef={state.listBodyRef}
        rowsScrollRef={state.rowsScrollRef}
        setSelectedTracks={state.setSelectedTracks}
        setActiveSessionStarts={state.setActiveSessionStarts}
        setCompletedSessions={state.setCompletedSessions}
        markerSec={state.markerSec}
        timelineStartSec={timelineStartSec}
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
          hourStep={state.hourStep}
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
          hourStep={state.hourStep}
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
        />

        <TimelineMarker
          isCurrentVisible={state.isCurrentVisible}
          currentLeft={state.currentLeft}
          selectedTracks={state.selectedTracks}
          showPunchOut={state.showPunchOut}
        />
      </Box>
    </Box>
  );
};

export default TimelineBody;
