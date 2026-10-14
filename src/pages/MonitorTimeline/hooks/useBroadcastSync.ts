import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { NavTab } from "../../../components/timeline/types";
import type { TimelineSelection } from "../../../components/TimeLine";

// How many received marker seconds are remembered to avoid echoing them.
const RECENT_RECEIVED_SECS = 30;

export const useBroadcastSync = (onMarkerChange: (sec: number) => void) => {
  const channelRef = useRef<BroadcastChannel | null>(null);
  // Recent seconds received from the other window: never echoed back, even
  // when several arrive before this window re-renders (e.g. while dragging
  // the marker or holding an arrow), which would make the marker jump back.
  const receivedSecsRef = useRef<number[]>([]);
  const onMarkerChangeRef = useRef(onMarkerChange);
  useEffect(() => { onMarkerChangeRef.current = onMarkerChange; }, [onMarkerChange]);

  // Start from the main window's camera group and tab (in the URL), so their
  // first sync isn't taken for a change — which would drop the marker it sent
  // and, on a tab switch, the selection.
  const [searchParams] = useSearchParams();
  const [cameraGroup, setCameraGroup] = useState(
    () => searchParams.get("cameraGroup") ?? "0",
  );
  const [trackerOption, setTrackerOption] = useState("");
  const [customTrackerIDs, setCustomTrackerIDs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>(
    () => (searchParams.get("tab") as NavTab | null) ?? "compliances",
  );
  // The main window's selection (in the URL), to take on when the popout
  // opens.
  const [restoreSelection] = useState<
    (TimelineSelection & { key: number }) | undefined
  >(() => {
    const param = searchParams.get("selection");
    if (!param) return undefined;
    try {
      return { ...(JSON.parse(param) as TimelineSelection), key: 0 };
    } catch {
      return undefined;
    }
  });

  useEffect(() => {
    receivedSecsRef.current = [];
    const channel = new BroadcastChannel("timeline-sync");
    channelRef.current = channel;
    channel.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "marker" && e.data?.source === "monitor") {
        receivedSecsRef.current = [
          ...receivedSecsRef.current.slice(-(RECENT_RECEIVED_SECS - 1)),
          e.data.sec as number,
        ];
        onMarkerChangeRef.current(e.data.sec as number);
      }
      if (e.data?.type === "filter") {
        setCameraGroup(e.data.cameraGroup as string);
        setTrackerOption(e.data.trackerOption as string);
        if (Array.isArray(e.data.customTrackerIDs)) {
          setCustomTrackerIDs(e.data.customTrackerIDs as string[]);
        }
      }
      if (e.data?.type === "navTab" && e.data?.source === "monitor") {
        setActiveTab(e.data.tab as NavTab);
      }
    });
    channel.postMessage({ type: "request-sync" });
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  // Sends this window's marker to the main one (not a second just received
  // from it). A function rather than an argument: the marker comes from data
  // that needs this hook's camera group first.
  const publishMarker = useCallback((sec: number | null) => {
    if (sec === null || !channelRef.current) return;
    if (receivedSecsRef.current.includes(sec)) return;
    channelRef.current.postMessage({ type: "marker", sec, source: "popout" });
  }, []);

  // Sends this window's selection to the main one, which restores it when the
  // popout closes.
  const publishSelection = useCallback((selection: TimelineSelection) => {
    channelRef.current?.postMessage({
      type: "selection",
      selection,
      source: "popout",
    });
  }, []);

  const changeTab = useCallback((tab: NavTab) => {
    setActiveTab(tab);
    channelRef.current?.postMessage({ type: "navTab", tab, source: "popout" });
  }, []);

  return {
    cameraGroup,
    trackerOption,
    customTrackerIDs,
    activeTab,
    changeTab,
    publishMarker,
    restoreSelection,
    publishSelection,
  };
};
