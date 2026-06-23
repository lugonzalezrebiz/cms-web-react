import { useMemo } from "react";
import useTrackerGrouping from "../../../hooks/useTrackerGrouping";
import { useCameraGroup } from "../../../contexts/useMonitorContext";

const PAY_STATION_ID = 8;

export function useTrackerGroupResolution() {
  const { cameraGroup, trackerOption, customTrackerIDs } = useCameraGroup();
  const { trackers: trackerGroupings } = useTrackerGrouping();

  const isTrackerTab = cameraGroup === "tracker";
  const isCustomMode = cameraGroup === "__custom__";
  const isCameraGroup = cameraGroup.startsWith("cam_");
  const cameraSpecificId = isCameraGroup ? Number(cameraGroup.slice(4)) : NaN;
  const cameraGroupNum = isCameraGroup ? NaN : Number(cameraGroup);

  const joinCameraTrackerMap = useMemo(() => {
    const map = new Map<number, { id: number; name: string }[]>();
    for (const t of trackerGroupings)
      if (t.joinCamera && t.cameras.length > 0 && t.id === PAY_STATION_ID)
        map.set(t.id, t.cameras);
    return map;
  }, [trackerGroupings]);

  const cameraToJoinTrackerMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const [trackerId, cameras] of joinCameraTrackerMap)
      for (const cam of cameras)
        map.set(cam.id, trackerId);
    return map;
  }, [joinCameraTrackerMap]);

  const isJoinCameraTracker =
    !isNaN(cameraGroupNum) && joinCameraTrackerMap.has(cameraGroupNum);
  const isJoinCameraSpecific =
    isCameraGroup &&
    !isNaN(cameraSpecificId) &&
    cameraToJoinTrackerMap.has(cameraSpecificId);
  const isDirectTracker =
    !isCameraGroup &&
    cameraGroup !== "" &&
    cameraGroup !== "0" &&
    !isNaN(cameraGroupNum) &&
    !isJoinCameraTracker;

  const singleTrackerID = isDirectTracker
    ? cameraGroupNum
    : isJoinCameraSpecific
      ? (cameraToJoinTrackerMap.get(cameraSpecificId) ?? 0)
      : isJoinCameraTracker
        ? cameraGroupNum
        : isTrackerTab && trackerOption
          ? Number(trackerOption)
          : 0;

  return {
    cameraGroup,
    trackerOption,
    customTrackerIDs,
    trackerGroupings,
    isTrackerTab,
    isCustomMode,
    isCameraGroup,
    cameraSpecificId,
    cameraGroupNum,
    joinCameraTrackerMap,
    cameraToJoinTrackerMap,
    isJoinCameraTracker,
    isJoinCameraSpecific,
    isDirectTracker,
    singleTrackerID,
  };
}
