import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { NavTab } from "../../../components/timeline/types";
import type { TimelineSelection } from "../../../components/TimeLine";

// How many received marker seconds are remembered to avoid echoing them.
const RECENT_RECEIVED_SECS = 30;

export const useTimelinePopout =(
  onMarkerChange: (sec: number) => void,
  markerTimeSec: number | null,
  cameraGroup: string,
  trackerOption: string,
  customTrackerIDs: string[] = [],
  activeTab: NavTab = "compliances",
  onTabChange?: (tab: NavTab) => void,
) =>{
  const [searchParams] = useSearchParams();
  const [timelinePopped, setTimelinePopped] = useState(false);
  const [restoreMarkerSec, setRestoreMarkerSec] = useState<number | undefined>(undefined);
  const [restoreSelection, setRestoreSelection] = useState<
    (TimelineSelection & { key: number }) | undefined
  >(undefined);
  const popoutRef = useRef<Window | null>(null);

  // Clear restoreMarkerSec when the filter changes so toggle auto-pan works after popout closes
  const [prevFilter, setPrevFilter] = useState({ cameraGroup, trackerOption });
  if (
    prevFilter.cameraGroup !== cameraGroup ||
    prevFilter.trackerOption !== trackerOption
  ) {
    setPrevFilter({ cameraGroup, trackerOption });
    if (restoreMarkerSec !== undefined) setRestoreMarkerSec(undefined);
  }
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onMarkerChangeRef = useRef(onMarkerChange);
  const markerTimeSecRef = useRef(markerTimeSec);
  // Recent seconds received from the other window: never echoed back, even
  // when several arrive before this window re-renders (e.g. while dragging
  // the marker or holding an arrow), which would make the marker jump back.
  const receivedSecsRef = useRef<number[]>([]);
  const cameraGroupRef = useRef(cameraGroup);
  const trackerOptionRef = useRef(trackerOption);
  const customTrackerIDsRef = useRef(customTrackerIDs);
  const activeTabRef = useRef(activeTab);
  const onTabChangeRef = useRef(onTabChange);
  // The latest selection, from this window's timeline or the popout's: sent to
  // the popout when it opens, restored here when it closes.
  const latestSelectionRef = useRef<TimelineSelection | null>(null);
  const handleSelectionChange = useCallback((selection: TimelineSelection) => {
    latestSelectionRef.current = selection;
  }, []);

  useEffect(() => { onMarkerChangeRef.current = onMarkerChange; });
  useEffect(() => { markerTimeSecRef.current = markerTimeSec; }, [markerTimeSec]);
  useEffect(() => { cameraGroupRef.current = cameraGroup; }, [cameraGroup]);
  useEffect(() => { trackerOptionRef.current = trackerOption; }, [trackerOption]);
  useEffect(() => { customTrackerIDsRef.current = customTrackerIDs; }, [customTrackerIDs]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { onTabChangeRef.current = onTabChange; });

  useEffect(() => {
    if (!timelinePopped) return;
    receivedSecsRef.current = [];
    const channel = new BroadcastChannel("timeline-sync");
    channelRef.current = channel;

    channel.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "marker" && e.data?.source === "popout") {
        receivedSecsRef.current = [
          ...receivedSecsRef.current.slice(-(RECENT_RECEIVED_SECS - 1)),
          e.data.sec as number,
        ];
        onMarkerChangeRef.current(e.data.sec as number);
      }
      if (e.data?.type === "selection" && e.data?.source === "popout") {
        latestSelectionRef.current = e.data.selection as TimelineSelection;
      }
      if (e.data?.type === "navTab" && e.data?.source === "popout") {
        onTabChangeRef.current?.(e.data.tab as NavTab);
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
        channel.postMessage({ type: "navTab", tab: activeTabRef.current, source: "monitor" });
      }
    });

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [timelinePopped]);

  useEffect(() => {
    if (!timelinePopped || markerTimeSec === null) return;
    if (receivedSecsRef.current.includes(markerTimeSec)) return;
    channelRef.current?.postMessage({ type: "marker", sec: markerTimeSec, source: "monitor" });
  }, [markerTimeSec, timelinePopped]);

  useEffect(() => {
    if (!timelinePopped) return;
    channelRef.current?.postMessage({ type: "filter", cameraGroup, trackerOption, customTrackerIDs });
  }, [cameraGroup, trackerOption, customTrackerIDs, timelinePopped]);

  useEffect(() => {
    if (!timelinePopped) return;
    channelRef.current?.postMessage({ type: "navTab", tab: activeTab, source: "monitor" });
  }, [activeTab, timelinePopped]);

  const handlePopOut = useCallback(() => {
    if (popoutRef.current && !popoutRef.current.closed) {
      popoutRef.current.focus();
      return;
    }
    const params = new URLSearchParams(searchParams);
    if (cameraGroup) params.set("cameraGroup", cameraGroup);
    // The popout starts on this tab, so a selection in it isn't lost to a
    // tab switch once the tab arrives.
    params.set("tab", activeTabRef.current);
    // And with this window's selection, to take on as soon as its rows load.
    if (latestSelectionRef.current) {
      params.set("selection", JSON.stringify(latestSelectionRef.current));
    }
    const currentSec = markerTimeSecRef.current;
    if (currentSec !== null) params.set("markerSec", String(Math.round(currentSec)));
    const route = `/monitor/timeline?${params.toString()}`;
    const url =
      window.location.protocol === "file:"
        ? `${window.location.href.split("#")[0]}#${route}`
        : route;
      
    // Tall enough for the punch dialogs (e.g. the add-employee one) to fit.
    const win = window.open(
      url,
      "timeline-popout",
      "width=1400,height=700,resizable=yes",
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
        // And the selection where the popout left it.
        if (latestSelectionRef.current) {
          setRestoreSelection({ ...latestSelectionRef.current, key: Date.now() });
        }
        setTimelinePopped(false);
        popoutRef.current = null;
      }
    }, 500);
  }, [searchParams, cameraGroup]);

  return {
    timelinePopped,
    handlePopOut,
    restoreMarkerSec,
    restoreSelection,
    handleSelectionChange,
  };
}
