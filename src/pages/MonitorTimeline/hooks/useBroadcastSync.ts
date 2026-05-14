import { useEffect, useRef, useState } from "react";

export const useBroadcastSync = (markerTimeSec: number | null) => {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const suppressBroadcastRef = useRef(false);
  const [targetSec, setTargetSec] = useState<number | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel("timeline-sync");
    channelRef.current = channel;

    channel.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "marker" && e.data?.source === "monitor") {
        suppressBroadcastRef.current = true;
        setTargetSec(e.data.sec as number);
      }
    });

    channel.postMessage({ type: "request-sync" });

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (markerTimeSec === null || !channelRef.current) return;
    if (suppressBroadcastRef.current) {
      suppressBroadcastRef.current = false;
      return;
    }
    channelRef.current.postMessage({ type: "marker", sec: markerTimeSec, source: "popout" });
  }, [markerTimeSec]);

  return { targetSec };
};
