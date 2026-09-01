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
  onReject: (index: number) => void;
}

interface Params {
  trackers: Tracker[];
  trackerGroupings: TrackerGrouping[];
  handleActivitySelect: (index: number, name: string, mode: "POINT" | "RANGE") => void;
  handleActivityReject: (index: number, name: string, mode: "POINT" | "RANGE") => void;
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

export function useFilteredMenuItems({
  trackers,
  trackerGroupings,
  handleActivitySelect,
  handleActivityReject,
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
  const getMode = (trackerId: number): "POINT" | "RANGE" =>
    trackers.find((t) => t.id === trackerId)?.mode ?? "POINT";

  const menuItems = useMemo<MenuItem[]>(
    () =>
      trackers.map((t) => ({
        id: t.id,
        name: t.name,
        label: t.name,
        onClick: (index: number) => handleActivitySelect(index, t.name, t.mode),
        onReject: (index: number) => handleActivityReject(index, t.name, t.mode),
      })),
    [trackers, handleActivitySelect, handleActivityReject],
  );

  return useMemo(() => {
    if (isJoinCameraTracker) {
      const groupingTracker = trackerGroupings.find((t) => t.id === cameraGroupNum);
      if (groupingTracker) {
        const mode = getMode(groupingTracker.id);
        const sortedCameras = [...groupingTracker.cameras].sort((a, b) => a.id - b.id);
        return sortedCameras.map((cam) => ({
          id: cam.id * 10000 + groupingTracker.id,
          name: `${groupingTracker.name} (${cam.name})`,
          label: `${groupingTracker.name} (${cam.name})`,
          onClick: () => handleActivitySelect(cam.id, groupingTracker.name, mode),
          onReject: () => handleActivityReject(cam.id, groupingTracker.name, mode),
        }));
      }
    }

    if (isJoinCameraSpecific) {
      const trackerID = cameraToJoinTrackerMap.get(cameraSpecificId) ?? 0;
      const groupingTracker = trackerGroupings.find((t) => t.id === trackerID);
      if (groupingTracker) {
        const camName =
          groupingTracker.cameras.find((c) => c.id === cameraSpecificId)?.name ?? String(cameraSpecificId);
        return [
          {
            id: cameraSpecificId * 10000 + trackerID,
            name: `${groupingTracker.name} (${camName})`,
            label: `${groupingTracker.name} (${camName})`,
            onClick: () =>
              handleActivitySelect(
                cameraSpecificId,
                groupingTracker.name,
                getMode(trackerID),
              ),
            onReject: () =>
              handleActivityReject(
                cameraSpecificId,
                groupingTracker.name,
                getMode(trackerID),
              ),
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
          const camName = tracker.cameras.find((c) => c.id === camId)?.name ?? String(camId);
          const rowId = camId * 10000 + tracker.id;
          if (!addedIds.has(rowId)) {
            addedIds.add(rowId);
            const mode = getMode(tracker.id);
            rows.push({
              id: rowId,
              name: `${tracker.name} (${camName})`,
              label: `${tracker.name} (${camName})`,
              onClick: () => handleActivitySelect(camId, tracker.name, mode),
              onReject: () => handleActivityReject(camId, tracker.name, mode),
            });
          }
        } else {
          const tracker = trackerGroupings.find((t) => t.id === Number(id));
          if (!tracker) continue;
          if (joinCameraTrackerMap.has(tracker.id)) {
            const mode = getMode(tracker.id);
            const sortedCameras = [...tracker.cameras].sort((a, b) => a.id - b.id);
            for (const cam of sortedCameras) {
              const rowId = cam.id * 10000 + tracker.id;
              if (!addedIds.has(rowId)) {
                addedIds.add(rowId);
                rows.push({
                  id: rowId,
                  name: `${tracker.name} (${cam.name})`,
                  label: `${tracker.name} (${cam.name})`,
                  onClick: () => handleActivitySelect(cam.id, tracker.name, mode),
                  onReject: () => handleActivityReject(cam.id, tracker.name, mode),
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
