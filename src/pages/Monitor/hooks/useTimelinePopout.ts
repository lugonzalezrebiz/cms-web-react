import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export const useTimelinePopout =(
  onMarkerChange: (sec: number) => void,
  markerTimeSec: number | null,
  cameraGroup: string,
  trackerOption: string,
  customTrackerIDs: string[] = [],
) =>{
  const [searchParams] = useSearchParams();
  const [timelinePopped, setTimelinePopped] = useState(false);
  const [restoreMarkerSec, setRestoreMarkerSec] = useState<number | undefined>(undefined);
  const popoutRef = useRef<Window | null>(null);

  // Clear restoreMarkerSec when the filter changes so toggle auto-pan works after popout closes
  const prevCameraGroupRef2 = useRef(cameraGroup);
  const prevTrackerOptionRef = useRef(trackerOption);
  if (
    prevCameraGroupRef2.current !== cameraGroup ||
    prevTrackerOptionRef.current !== trackerOption
  ) {
    prevCameraGroupRef2.current = cameraGroup;
    prevTrackerOptionRef.current = trackerOption;
    if (restoreMarkerSec !== undefined) setRestoreMarkerSec(undefined);
  }
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onMarkerChangeRef = useRef(onMarkerChange);
  const markerTimeSecRef = useRef(markerTimeSec);
  const suppressSendRef = useRef(false);
  const cameraGroupRef = useRef(cameraGroup);
  const trackerOptionRef = useRef(trackerOption);
  const customTrackerIDsRef = useRef(customTrackerIDs);

  useEffect(() => { onMarkerChangeRef.current = onMarkerChange; });
  useEffect(() => { markerTimeSecRef.current = markerTimeSec; }, [markerTimeSec]);
  useEffect(() => { cameraGroupRef.current = cameraGroup; }, [cameraGroup]);
  useEffect(() => { trackerOptionRef.current = trackerOption; }, [trackerOption]);
  useEffect(() => { customTrackerIDsRef.current = customTrackerIDs; }, [customTrackerIDs]);

  useEffect(() => {
    if (!timelinePopped) return;
    const channel = new BroadcastChannel("timeline-sync");
    channelRef.current = channel;

    channel.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "marker" && e.data?.source === "popout") {
        suppressSendRef.current = true;
        onMarkerChangeRef.current(e.data.sec as number);
      }
      if (e.data?.type === "request-sync") {
        const sec = markerTimeSecRef.current;
        if (sec !== null) {
          channel.postMessage({ type: "marker", sec, source: "monitor" });
        }
        channel.postMessage({
          type: "filter",
          cameraGroup: cameraGroupRef.current,
          trackerOption: trackerOptionRef.current,
          customTrackerIDs: customTrackerIDsRef.current,
        });
      }
    });

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [timelinePopped]);

  useEffect(() => {
    if (!timelinePopped || markerTimeSec === null) return;
    if (suppressSendRef.current) {
      suppressSendRef.current = false;
      return;
    }
    channelRef.current?.postMessage({ type: "marker", sec: markerTimeSec, source: "monitor" });
  }, [markerTimeSec, timelinePopped]);

  useEffect(() => {
    if (!timelinePopped) return;
    channelRef.current?.postMessage({ type: "filter", cameraGroup, trackerOption, customTrackerIDs });
  }, [cameraGroup, trackerOption, customTrackerIDs, timelinePopped]);

  const handlePopOut = useCallback(() => {
    if (popoutRef.current && !popoutRef.current.closed) {
      popoutRef.current.focus();
      return;
    }
    const params = new URLSearchParams(searchParams);
    if (cameraGroup) params.set("cameraGroup", cameraGroup);
    const currentSec = markerTimeSecRef.current;
    if (currentSec !== null) params.set("markerSec", String(Math.round(currentSec)));
    const route = `/monitor/timeline?${params.toString()}`;
    const url =
      window.location.protocol === "file:"
        ? `${window.location.href.split("#")[0]}#${route}`
        : route;
      
    const win = window.open(
      url,
      "timeline-popout",
      "width=1400,height=500,resizable=yes",
    );
    if (!win) return;
    popoutRef.current = win;
    setTimelinePopped(true);
    const interval = setInterval(() => {
      if (win.closed) {
        clearInterval(interval);
        if (markerTimeSecRef.current !== null) {
          setRestoreMarkerSec(markerTimeSecRef.current);
        }
        setTimelinePopped(false);
        popoutRef.current = null;
      }
    }, 500);
  }, [searchParams, cameraGroup]);

  return { timelinePopped, handlePopOut, restoreMarkerSec };
}
