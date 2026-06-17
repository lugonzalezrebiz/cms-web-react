import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export const useTimelinePopout =(
  onMarkerChange: (sec: number) => void,
  markerTimeSec: number | null,
  cameraGroup: string = "",
) =>{
  const [searchParams] = useSearchParams();
  const [timelinePopped, setTimelinePopped] = useState(false);
  const [restoreMarkerSec, setRestoreMarkerSec] = useState<number | undefined>(undefined);
  const popoutRef = useRef<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onMarkerChangeRef = useRef(onMarkerChange);
  const markerTimeSecRef = useRef(markerTimeSec);
  const suppressSendRef = useRef(false);

  useEffect(() => { onMarkerChangeRef.current = onMarkerChange; });
  useEffect(() => { markerTimeSecRef.current = markerTimeSec; }, [markerTimeSec]);

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

  const handlePopOut = useCallback(() => {
    if (popoutRef.current && !popoutRef.current.closed) {
      popoutRef.current.focus();
      return;
    }
    const params = new URLSearchParams(searchParams);
    if (cameraGroup) params.set("cameraGroup", cameraGroup);
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
