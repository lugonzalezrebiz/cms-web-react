import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Box } from "@mui/system";
import EventMenu from "../../components/EventMenu";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";
import { useMonitoring } from "../../components/timeline/hooks/useMonitoring";
import { useCameras } from "./hooks/useCameras";
import { useTrackers } from "./hooks/useTrackers";
import { useCameraEventPoints } from "../../components/timeline/hooks/useCameraEventPoints";
import MediaCarousel from "../../components/MediaCarousel";
import { useMenuItems } from "./hooks/useMenuItems";
import { useSalesTransactions } from "./hooks/useSalesTransactions";
import { useDashboardParams } from "./hooks/useDashboardParams";
import { useMarkerState } from "./hooks/useMarkerState";
import ToggleButton from "../../components/ToggleButton";
import { useEventMenu } from "./hooks/useEventMenu";
import { usePosCarousel } from "./hooks/usePosCarousel";
import { useSessionDate } from "../../components/timeline/hooks/useSessionDate";
import { useSaveMonitoring } from "../../components/timeline/hooks/useSaveMonitoring";
import { useTimelineMarker } from "../../components/timeline/hooks/useTimelineMarker";
import { useRegisterMonitorActions } from "../../contexts/MonitorContext";
import { Check } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { Colors } from "../../theme";
import Button from "../../components/Button";

const CameraGroups = [
  { value: "1", title: "All" },
  { value: "2", title: "POS" },
];

const Monitor = () => {
  const { company, location, date } = useDashboardParams();
  const [searchParams] = useSearchParams();
  const [timelinePopped, setTimelinePopped] = useState(false);
  const popoutRef = useRef<Window | null>(null);

  const handlePopOut = useCallback(() => {
    if (popoutRef.current && !popoutRef.current.closed) {
      popoutRef.current.focus();
      return;
    }
    const win = window.open(
      `/monitor/timeline?${searchParams.toString()}`,
      "timeline-popout",
      "width=1400,height=500,resizable=yes",
    );
    if (!win) return;
    popoutRef.current = win;
    setTimelinePopped(true);
    const interval = setInterval(() => {
      if (win.closed) {
        clearInterval(interval);
        setTimelinePopped(false);
        popoutRef.current = null;
      }
    }, 500);
  }, [searchParams]);

  const cameras = useCameras(company, location, date);
  const trackers = useTrackers();
  const [cameraGroup, setCameraGroup] = useState("1");

  const {
    cameraEventPoints,
    markerSec,
    handleRemoveEventPoint,
    handleActivitySelect,
    handleMarkerChange: handleCameraMarkerChange,
    handleUpdateEventPoint,
  } = useCameraEventPoints();

  const { snapshot, eventPoints: preloadedEventPoints } =
    useMonitoring(trackers);
  const allEventPoints = [...cameraEventPoints, ...preloadedEventPoints];

  const { transactions, loading: transactionsLoading } = useSalesTransactions();

  const {
    timestamp,
    setTimestamp,
    posMarkerSec,
    setPosMarkerSec,
    activeMarkerSec,
  } = useMarkerState(cameraGroup, markerSec);

  const { allMenuItems, handleAddMenuItem, itemCounts } = useMenuItems(
    trackers,
    handleActivitySelect,
    allEventPoints,
    activeMarkerSec,
  );

  const { anchorEl, setAnchorEl, input, setInput, handleAdd } =
    useEventMenu(handleAddMenuItem);

  const {
    current,
    goTo,
    prev,
    next,
    currentCameraId,
    currentTimeSec,
    attended,
    toggleAttended,
    handleDone: handlePosDone,
  } = usePosCarousel(transactions, setPosMarkerSec);

  const { markerTimeSec, handleMarkerChange, showFinalizeButton } =
    useTimelineMarker({
      snapshot,
      onTimeChange: setTimestamp,
      onMarkerChange: handleCameraMarkerChange,
    });

  const handleMarkerChangeRef = useRef(handleMarkerChange);
  useEffect(() => {
    handleMarkerChangeRef.current = handleMarkerChange;
  });

  useEffect(() => {
    if (!timelinePopped) return;
    const channel = new BroadcastChannel("timeline-sync");
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "marker") {
        handleMarkerChangeRef.current(e.data.sec as number);
      }
    };
    channel.addEventListener("message", handler);
    return () => channel.close();
  }, [timelinePopped]);

  const sessionDate = useSessionDate();
  const { handleDone } = useSaveMonitoring({
    trackers,
    eventPoints: cameraEventPoints,
    sessionDate,
  });

  useRegisterMonitorActions(handleDone, showFinalizeButton);

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
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          m: "10px 16px 0 16px",
        }}
      >
        <ToggleButton
          value={cameraGroup}
          setValue={setCameraGroup}
          label="Camera Groups"
          groups={CameraGroups}
        />

        <EventMenu
          contextMenuTitle="Comp. Violations"
          contextMenuItems={allMenuItems}
          iconMenu="/assets/plus-1.svg"
          itemCounts={itemCounts}
          subtitle="Drag an event onto a camera to assign it"
          object="cam"
          anchorEl={anchorEl}
          onOpenMenu={setAnchorEl}
          onCloseMenu={() => setAnchorEl(null)}
          input={input}
          onInputChange={setInput}
          onAdd={handleAdd}
        />
      </Box>

      <Box sx={{ flex: 6, minHeight: 0, height: 0 }}>
        {cameraGroup === "2" ? (
          <Box
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <MediaCarousel
                company={company}
                location={location}
                transactions={transactions}
                loading={transactionsLoading}
                current={current}
                prev={prev}
                next={next}
                goTo={goTo}
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes("eventmenuid"))
                    e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const itemId = Number(
                    e.dataTransfer.getData("eventMenuItemId"),
                  );
                  if (!itemId) return;
                  const item = allMenuItems.find((m) => m.id === itemId);
                  if (!item) return;
                  handleMarkerChange(currentTimeSec);
                  handleActivitySelect(currentCameraId - 1, item.label);
                }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 0.75,
                alignItems: "center",
                justifyContent: "flex-end",
                px: 2,
                pb: 1,
                mr: "20px",
              }}
            >
              <Button
                color="secondary"
                selected={attended === "attended"}
                onClick={() => toggleAttended("attended")}
                disableRipple={false}
                sx={{ height: "32px" }}
              >
                Attended
              </Button>
              <Button
                color="secondary"
                selected={attended === "unattended"}
                onClick={() => toggleAttended("unattended")}
                disableRipple={false}
                sx={{ height: "32px" }}
              >
                Unattended
              </Button>
              {attended !== null && (
                <Box bgcolor={Colors.vividOrange} borderRadius="6px">
                  <IconButton onClick={handlePosDone} size="small">
                    <Check fontSize="small" sx={{ color: Colors.white }} />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <CameraLayout
            count={cameras.length}
            media="/assets/camera/Cam thumbnail.svg"
            maxHeight="100%"
            cameraItemList={() => alert("Camera list clicked")}
            contextMenuItems={allMenuItems}
            cameraEventPoints={allEventPoints}
            markerSec={markerSec}
            onRemoveEventPoint={handleRemoveEventPoint}
            cameras={cameras}
            company={company}
            location={location}
            date={date}
            timestamp={timestamp}
          />
        )}
      </Box>

      {!timelinePopped && (
        <Box sx={{ flex: 4, minHeight: 0 }}>
          <TimeLine
            snapshot={snapshot}
            cameraEventPoints={allEventPoints}
            onMarkerChange={handleMarkerChange}
            markerTimeSec={markerTimeSec}
            targetMarkerSec={
              cameraGroup === "2" && posMarkerSec !== null
                ? posMarkerSec
                : undefined
            }
            onUpdateEventPoint={handleUpdateEventPoint}
            onPopOut={handlePopOut}
            headerLabel="Cameras"
          />
        </Box>
      )}
    </Box>
  );
};

export default Monitor;
