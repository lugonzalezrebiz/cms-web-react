import { useMemo } from "react";
import type { CameraEventPoint } from "../../../components/timeline/types";

interface Tracker {
  id: number;
  name: string;
}

interface TrackerGrouping {
  id: number;
  name: string;
  cameras: { id: number; name: string }[];
}

interface Params {
  allEventPoints: CameraEventPoint[];
  trackerGroupings: TrackerGrouping[];
  trackers: Tracker[];
  isJoinCameraTracker: boolean;
  isJoinCameraSpecific: boolean;
  isDirectTracker: boolean;
  isCustomMode: boolean;
  isTrackerTab: boolean;
  cameraGroupNum: number;
  cameraSpecificId: number;
  singleTrackerID: number;
  customTrackerIDs: string[];
  trackerOption: string;
  joinCameraTrackerMap: Map<number, { id: number; name: string }[]>;
  cameraToJoinTrackerMap: Map<number, number>;
}

function buildPrefix(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function useFilteredEventPoints({
  allEventPoints,
  trackerGroupings,
  trackers,
  isJoinCameraTracker,
  isJoinCameraSpecific,
  isDirectTracker,
  isCustomMode,
  isTrackerTab,
  cameraGroupNum,
  cameraSpecificId,
  singleTrackerID,
  customTrackerIDs,
  trackerOption,
  joinCameraTrackerMap,
  cameraToJoinTrackerMap,
}: Params): CameraEventPoint[] {
  return useMemo(() => {
    if (isJoinCameraTracker) {
      const groupingTracker = trackerGroupings.find((t) => t.id === cameraGroupNum);
      if (!groupingTracker) return [];
      const cameraIds = new Set(groupingTracker.cameras.map((c) => c.id));
      const prefix = buildPrefix(groupingTracker.name);
      const camNameById = new Map(groupingTracker.cameras.map((c) => [c.id, c.name]));
      return allEventPoints
        .filter((ep) => ep.label === groupingTracker.name && cameraIds.has(ep.cameraId))
        .map((ep) => ({ ...ep, label: `${prefix}(${camNameById.get(ep.cameraId) ?? ep.cameraId})` }));
    }

    if (isJoinCameraSpecific) {
      const trackerID = cameraToJoinTrackerMap.get(cameraSpecificId) ?? 0;
      const groupingTracker = trackerGroupings.find((t) => t.id === trackerID);
      if (!groupingTracker) return [];
      const prefix = buildPrefix(groupingTracker.name);
      const camName =
        groupingTracker.cameras.find((c) => c.id === cameraSpecificId)?.name ?? String(cameraSpecificId);
      return allEventPoints
        .filter((ep) => ep.label === groupingTracker.name && ep.cameraId === cameraSpecificId)
        .map((ep) => ({ ...ep, label: `${prefix}(${camName})` }));
    }

    if (isDirectTracker && singleTrackerID) {
      if (!trackerGroupings.length) return [];
      const groupingTracker = trackerGroupings.find((t) => t.id === singleTrackerID);
      if (!groupingTracker) return allEventPoints;
      return allEventPoints.filter((ep) => ep.label === groupingTracker.name);
    }

    if (isCustomMode && customTrackerIDs.length > 0) {
      const result: CameraEventPoint[] = [];
      for (const id of customTrackerIDs) {
        if (id.startsWith("cam_")) {
          const camId = Number(id.slice(4));
          const trackerId = cameraToJoinTrackerMap.get(camId);
          const tracker = trackerGroupings.find((t) => t.id === trackerId);
          if (!tracker) continue;
          const prefix = buildPrefix(tracker.name);
          const camName = tracker.cameras.find((c) => c.id === camId)?.name ?? String(camId);
          const label = `${prefix}(${camName})`;
          for (const ep of allEventPoints)
            if (ep.label === tracker.name && ep.cameraId === camId) result.push({ ...ep, label });
        } else {
          const tracker = trackerGroupings.find((t) => t.id === Number(id));
          if (!tracker) continue;
          if (joinCameraTrackerMap.has(tracker.id)) {
            const prefix = buildPrefix(tracker.name);
            const cameraIds = new Set(tracker.cameras.map((c) => c.id));
            const camNameById = new Map(tracker.cameras.map((c) => [c.id, c.name]));
            for (const ep of allEventPoints)
              if (ep.label === tracker.name && cameraIds.has(ep.cameraId))
                result.push({ ...ep, label: `${prefix}(${camNameById.get(ep.cameraId) ?? ep.cameraId})` });
          } else {
            for (const ep of allEventPoints)
              if (ep.label === tracker.name) result.push(ep);
          }
        }
      }
      return result;
    }

    if (isTrackerTab && trackerOption) {
      const tracker = trackers.find((t) => t.id === Number(trackerOption));
      if (!tracker) return allEventPoints;
      return allEventPoints.filter((ep) => ep.label === tracker.name);
    }

    return allEventPoints;
  }, [
    allEventPoints,
    trackerGroupings,
    trackers,
    isJoinCameraTracker,
    isJoinCameraSpecific,
    isDirectTracker,
    isCustomMode,
    isTrackerTab,
    cameraGroupNum,
    cameraSpecificId,
    singleTrackerID,
    customTrackerIDs,
    trackerOption,
    joinCameraTrackerMap,
    cameraToJoinTrackerMap,
  ]);
}
