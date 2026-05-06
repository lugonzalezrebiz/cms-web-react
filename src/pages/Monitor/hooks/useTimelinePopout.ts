import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useTimelinePopout(
  onMarkerChange: (sec: number) => void,
  markerTimeSec: number | null,
) {
  const [searchParams] = useSearchParams();
  const [timelinePopped, setTimelinePopped] = useState(false);
  const popoutRef = useRef<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onMarkerChangeRef = useRef(onMarkerChange);
  const suppressSendRef = useRef(false);

  useEffect(() => { onMarkerChangeRef.current = onMarkerChange; });

  useEffect(() => {
    if (!timelinePopped) return;
    const channel = new BroadcastChannel("timeline-sync");
    channelRef.current = channel;

    channel.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "marker" && e.data?.source === "popout") {
        suppressSendRef.current = true;
        onMarkerChangeRef.current(e.data.sec as number);
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

  return { timelinePopped, handlePopOut };
}
