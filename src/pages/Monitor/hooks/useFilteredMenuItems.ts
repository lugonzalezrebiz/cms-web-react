import { useMemo } from "react";

interface Tracker {
  id: number;
  name: string;
  mode: "POINT" | "RANGE";
}

interface TrackerGrouping {
  id: number;
  name: string;
  cameras: { id: number; name: string }[];
}

export interface MenuItem {
  id: number;
  name: string;
  label: string;
  onClick: (index: number) => void;
}

interface Params {
  trackers: Tracker[];
  trackerGroupings: TrackerGrouping[];
  handleActivitySelect: (index: number, name: string, mode: "POINT" | "RANGE") => void;
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

const noop = (_i: number) => {};

export function useFilteredMenuItems({
  trackers,
  trackerGroupings,
  handleActivitySelect,
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
}: Params): MenuItem[] {
  const menuItems = useMemo<MenuItem[]>(
    () =>
      trackers.map((t) => ({
        id: t.id,
        name: t.name,
        label: t.name,
        onClick: (index: number) => handleActivitySelect(index, t.name, t.mode),
      })),
    [trackers, handleActivitySelect],
  );

  return useMemo(() => {
    if (isJoinCameraTracker) {
      const groupingTracker = trackerGroupings.find((t) => t.id === cameraGroupNum);
      if (groupingTracker) {
        const prefix = buildPrefix(groupingTracker.name);
        return groupingTracker.cameras.map((cam) => ({
          id: cam.id * 10000 + groupingTracker.id,
          name: `${prefix}(${cam.name})`,
          label: `${prefix}(${cam.name})`,
          onClick: noop,
        }));
      }
    }

    if (isJoinCameraSpecific) {
      const trackerID = cameraToJoinTrackerMap.get(cameraSpecificId) ?? 0;
      const groupingTracker = trackerGroupings.find((t) => t.id === trackerID);
      if (groupingTracker) {
        const prefix = buildPrefix(groupingTracker.name);
        const camName =
          groupingTracker.cameras.find((c) => c.id === cameraSpecificId)?.name ?? String(cameraSpecificId);
        return [
          {
            id: cameraSpecificId * 10000 + trackerID,
            name: `${prefix}(${camName})`,
            label: `${prefix}(${camName})`,
            onClick: noop,
          },
        ];
      }
    }

    if (singleTrackerID && isDirectTracker) return menuItems.filter((item) => item.id === singleTrackerID);

    if (isCustomMode && customTrackerIDs.length > 0) {
      const rows: MenuItem[] = [];
      const addedIds = new Set<number>();
      for (const id of customTrackerIDs) {
        if (id.startsWith("cam_")) {
          const camId = Number(id.slice(4));
          const trackerId = cameraToJoinTrackerMap.get(camId);
          const tracker = trackerGroupings.find((t) => t.id === trackerId);
          if (!tracker) continue;
          const prefix = buildPrefix(tracker.name);
          const camName = tracker.cameras.find((c) => c.id === camId)?.name ?? String(camId);
          const rowId = camId * 10000 + tracker.id;
          if (!addedIds.has(rowId)) {
            addedIds.add(rowId);
            rows.push({ id: rowId, name: `${prefix}(${camName})`, label: `${prefix}(${camName})`, onClick: noop });
          }
        } else {
          const tracker = trackerGroupings.find((t) => t.id === Number(id));
          if (!tracker) continue;
          if (joinCameraTrackerMap.has(tracker.id)) {
            const prefix = buildPrefix(tracker.name);
            for (const cam of tracker.cameras) {
              const rowId = cam.id * 10000 + tracker.id;
              if (!addedIds.has(rowId)) {
                addedIds.add(rowId);
                rows.push({
                  id: rowId,
                  name: `${prefix}(${cam.name})`,
                  label: `${prefix}(${cam.name})`,
                  onClick: noop,
                });
              }
            }
          } else {
            const menuItem = menuItems.find((item) => item.id === Number(id));
            if (menuItem && !addedIds.has(menuItem.id)) {
              addedIds.add(menuItem.id);
              rows.push(menuItem);
            }
          }
        }
      }
      return rows;
    }

    if (isTrackerTab && trackerOption) return menuItems.filter((item) => item.id === Number(trackerOption));

    return menuItems;
  }, [
    menuItems,
    trackerGroupings,
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
