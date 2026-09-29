import { useMemo } from "react";
import { useCameraMenuItems } from "./useCameraMenuItems";
import type { useTrackerGroupResolution } from "./useTrackerGroupResolution";

type ActivityHandler = Parameters<typeof useCameraMenuItems>[3];

interface Params {
  company: number;
  location: number;
  /** Grid index of the camera whose overlay menu is open. */
  openMenuCamera: number | null;
  expandedCamera: number | null;
  sortedCameras: { id: number }[];
  handleActivitySelect: ActivityHandler;
  handleActivityReject: ActivityHandler;
  trackers: Parameters<typeof useCameraMenuItems>[5];
  trackerResolution: ReturnType<typeof useTrackerGroupResolution>;
}

// Context-menu activities for the grid camera whose menu is open and for the
// expanded camera, narrowed to the trackers of the current camera group.
export const useCameraContextMenus = ({
  company,
  location,
  openMenuCamera,
  expandedCamera,
  sortedCameras,
  handleActivitySelect,
  handleActivityReject,
  trackers,
  trackerResolution,
}: Params) => {
  const {
    trackerOption,
    customTrackerIDs,
    isTrackerTab,
    isCustomMode,
    cameraToJoinTrackerMap,
    isJoinCameraTracker,
    isJoinCameraSpecific,
    isDirectTracker,
    singleTrackerID,
  } = trackerResolution;

  const allCameraMenuItems = useCameraMenuItems(
    company,
    location,
    openMenuCamera !== null
      ? (sortedCameras[openMenuCamera]?.id ?? null)
      : null,
    handleActivitySelect,
    handleActivityReject,
    trackers,
  );
  const allExpandedCameraMenuItems = useCameraMenuItems(
    company,
    location,
    expandedCamera !== null
      ? (sortedCameras[expandedCamera]?.id ?? null)
      : null,
    handleActivitySelect,
    handleActivityReject,
    trackers,
  );

  const trackerMenuFilter = useMemo(
    () => (items: typeof allCameraMenuItems) => {
      if (
        singleTrackerID &&
        (isDirectTracker || isJoinCameraTracker || isJoinCameraSpecific)
      )
        return items.filter(
          (item) => (item.trackerId ?? item.id) === singleTrackerID,
        );
      if (isCustomMode && customTrackerIDs.length > 0) {
        const trackerIds = new Set<number>();
        for (const id of customTrackerIDs) {
          if (id.startsWith("cam_")) {
            const tid = cameraToJoinTrackerMap.get(Number(id.slice(4)));
            if (tid) trackerIds.add(tid);
          } else {
            trackerIds.add(Number(id));
          }
        }
        return items.filter((item) =>
          trackerIds.has(item.trackerId ?? item.id),
        );
      }
      if (isTrackerTab && trackerOption)
        return items.filter(
          (item) => (item.trackerId ?? item.id) === Number(trackerOption),
        );
      return items;
    },
    [
      isDirectTracker,
      isJoinCameraTracker,
      isJoinCameraSpecific,
      singleTrackerID,
      isCustomMode,
      customTrackerIDs,
      cameraToJoinTrackerMap,
      isTrackerTab,
      trackerOption,
    ],
  );

  const cameraMenuItems = useMemo(
    () => trackerMenuFilter(allCameraMenuItems),
    [trackerMenuFilter, allCameraMenuItems],
  );
  const expandedCameraMenuItems = useMemo(
    () => trackerMenuFilter(allExpandedCameraMenuItems),
    [trackerMenuFilter, allExpandedCameraMenuItems],
  );

  return { cameraMenuItems, expandedCameraMenuItems };
};
