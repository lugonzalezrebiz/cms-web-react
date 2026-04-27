import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useTimelinePopout(
  onMarkerChange: (sec: number) => void,
) {
  const [searchParams] = useSearchParams();
  const [timelinePopped, setTimelinePopped] = useState(false);
  const popoutRef = useRef<Window | null>(null);
  const onMarkerChangeRef = useRef(onMarkerChange);
  useEffect(() => {
    onMarkerChangeRef.current = onMarkerChange;
  });

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

  useEffect(() => {
    if (!timelinePopped) return;
    const channel = new BroadcastChannel("timeline-sync");
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "marker") {
        onMarkerChangeRef.current(e.data.sec as number);
      }
    };
    channel.addEventListener("message", handler);
    return () => channel.close();
  }, [timelinePopped]);

  return { timelinePopped, handlePopOut };
}
