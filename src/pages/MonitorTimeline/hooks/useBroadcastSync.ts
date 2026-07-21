import { useEffect, useRef, useState } from "react";

export const useBroadcastSync = (
  markerTimeSec: number | null,
  onMarkerChange: (sec: number) => void,
) => {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastReceivedSecRef = useRef<number | null>(null);
  const onMarkerChangeRef = useRef(onMarkerChange);
  useEffect(() => { onMarkerChangeRef.current = onMarkerChange; }, [onMarkerChange]);

  const [cameraGroup, setCameraGroup] = useState("0");
  const [trackerOption, setTrackerOption] = useState("");
  const [customTrackerIDs, setCustomTrackerIDs] = useState<string[]>([]);

  useEffect(() => {
    lastReceivedSecRef.current = null;
    const channel = new BroadcastChannel("timeline-sync");
    channelRef.current = channel;
    channel.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "marker" && e.data?.source === "monitor") {
        lastReceivedSecRef.current = e.data.sec as number;
        onMarkerChangeRef.current(e.data.sec as number);
      }
      if (e.data?.type === "filter") {
        setCameraGroup(e.data.cameraGroup as string);
        setTrackerOption(e.data.trackerOption as string);
        if (Array.isArray(e.data.customTrackerIDs)) {
          setCustomTrackerIDs(e.data.customTrackerIDs as string[]);
        }
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
    if (lastReceivedSecRef.current === markerTimeSec) return;
    channelRef.current.postMessage({ type: "marker", sec: markerTimeSec, source: "popout" });
  }, [markerTimeSec]);

  return { cameraGroup, trackerOption, customTrackerIDs };
};
