import { Box } from "@mui/system";
import { Colors } from "../theme";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { TimelineBodyProps } from "./timeline/types";

export interface TimelineBodyHandle {
  stepMarker: (deltaSec: number) => void;
  togglePlay: () => void;
}
import { MOCK_SNAPSHOT } from "./timeline/constants";
import { useTimelineKeyboard } from "./timeline/hooks/useTimelineKeyboard";
import { useTimelineBodyState } from "./timeline/hooks/useTimelineBodyState";
import { useFlatRows } from "./timeline/hooks/useFlatRows";
import { TimelineRowList } from "./timeline/TimelineRowList";
import { TimelineTimeRuler } from "./timeline/TimelineTimeRuler";
import { TimelineGridRows } from "./timeline/TimelineGridRows";
import { TimelineMarker } from "./timeline/TimelineMarker";
import { GoToTimeDialog } from "./timeline/GoToTimeDialog";

const TimelineBody = forwardRef<TimelineBodyHandle, TimelineBodyProps>(
  (
    {
      snapshot,
      activeTab,
      selectedTab,
      cameraActivities,
      cameraEventPoints,
      onMarkerChange,
      onPlayingChange,
      onUpdateEventPoint,
    },
    ref,
  ) => {
    const [goToTimeOpen, setGoToTimeOpen] = useState(false);
    const isTunnel = selectedTab === "2";

    const data = snapshot || MOCK_SNAPSHOT;
    const {
      flatRows,
      selectableRows,
      timelineStartSec,
      timelineEndSec,
      firstActivitySec,
    } = useFlatRows({ isTunnel, data, cameraActivities, cameraEventPoints });

    const headerLabel = "Cameras";

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

    useEffect(() => {
      onPlayingChange?.(state.isPlaying);
    }, [state.isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps
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
      isPlaying: state.isPlaying,
      setIsPlaying: state.setIsPlaying,
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
      togglePlay: () => {
        state.setIsPlaying((prev) => !prev);
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
            overflow: "hidden",
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
            onUpdateEventPoint={onUpdateEventPoint}
          />

          <TimelineMarker
            isCurrentVisible={state.isCurrentVisible}
            currentLeft={state.currentLeft}
            selectedTracks={state.selectedTracks}
            showPunchOut={state.showPunchOut}
            iTrackId={state.iTrackId}
            flatRows={flatRows}
            listBodyRef={state.listBodyRef}
            setMarkerSec={state.setMarkerSec}
            visibleStart={state.visibleStart}
            visibleDuration={state.visibleDuration}
            timelineStartSec={timelineStartSec}
            timelineEndSec={timelineEndSec}
            gridRef={state.gridRef}
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
  },
);

export default TimelineBody;
