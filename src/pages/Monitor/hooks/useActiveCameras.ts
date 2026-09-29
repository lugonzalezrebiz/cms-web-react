import { useEffect, useMemo, useRef, useState } from "react";
import { TAG_TOLERANCE_SEC } from "../../../components/CameraLayout";
import type {
  CameraEventPoint,
  NavTab,
} from "../../../components/timeline/types";
import type { useTrackerGroupResolution } from "./useTrackerGroupResolution";

interface Params {
  activeTab: NavTab;
  isPunchesTab: boolean;
  trackerResolution: ReturnType<typeof useTrackerGroupResolution>;
  monitoringCameras: { id: number; name: string }[];
  filteredEventPoints: CameraEventPoint[];
  markerSec: number;
  expandedCamera: number | null;
  handleExpandCamera: (index: number) => void;
}

// Cameras shown in the grid: every camera on the punches tabs; on Compliance
// violations, the ones with a filtered event point near the marker. Also
// flags a short reload when the camera group changes and closes the expanded
// camera once it drops out of the filtered set.
export const useActiveCameras = ({
  activeTab,
  isPunchesTab,
  trackerResolution,
  monitoringCameras,
  filteredEventPoints,
  markerSec,
  expandedCamera,
  handleExpandCamera,
}: Params) => {
  const {
    cameraGroup,
    trackerOption,
    isTrackerTab,
    isCustomMode,
    cameraGroupNum,
    joinCameraTrackerMap,
    isJoinCameraTracker,
    isJoinCameraSpecific,
    isDirectTracker,
  } = trackerResolution;

  const cameraGroupKey = `${activeTab}-${cameraGroup}-${trackerOption ?? ""}`;
  const [prevCameraGroupKey, setPrevCameraGroupKey] = useState(cameraGroupKey);
  const [isCameraReloading, setIsCameraReloading] = useState(false);

  if (prevCameraGroupKey !== cameraGroupKey) {
    setPrevCameraGroupKey(cameraGroupKey);
    setIsCameraReloading(true);
  }

  const activeCameras = useMemo(() => {
    if (isPunchesTab) return monitoringCameras;
    const candidateCameras = isJoinCameraTracker
      ? (() => {
          const cameraIds = new Set(
            (joinCameraTrackerMap.get(cameraGroupNum) ?? []).map((c) => c.id),
          );
          return monitoringCameras.filter((cam) => cameraIds.has(cam.id));
        })()
      : monitoringCameras;

    return candidateCameras.filter((camera) =>
      filteredEventPoints.some((ep) => {
        if (ep.cameraId !== camera.id) return false;
        const hasRange = ep.endSec > ep.startSec;
        if (hasRange)
          return markerSec >= ep.timeSec - 60 && markerSec <= ep.endSec + 60;
        return Math.abs(markerSec - ep.timeSec) <= TAG_TOLERANCE_SEC;
      }),
    );
  }, [
    isPunchesTab,
    isJoinCameraTracker,
    joinCameraTrackerMap,
    cameraGroupNum,
    monitoringCameras,
    filteredEventPoints,
    markerSec,
  ]);

  const sortedCameras = useMemo(
    () => [...activeCameras].sort((a, b) => a.id - b.id),
    [activeCameras],
  );

  useEffect(() => {
    if (!isCameraReloading) return;
    const t = setTimeout(() => setIsCameraReloading(false), 400);
    return () => clearTimeout(t);
  }, [isCameraReloading]);

  const expandedCameraIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (expandedCamera === null) {
      expandedCameraIdRef.current = null;
    } else {
      const id = sortedCameras[expandedCamera]?.id;
      if (id !== undefined) expandedCameraIdRef.current = id;
    }
  }, [expandedCamera, sortedCameras]);

  useEffect(() => {
    const isFiltered =
      isDirectTracker ||
      isJoinCameraTracker ||
      isJoinCameraSpecific ||
      isCustomMode ||
      (isTrackerTab && !!trackerOption);
    if (!isFiltered || expandedCamera === null) return;
    const id = expandedCameraIdRef.current;
    if (id !== null && !activeCameras.some((c) => c.id === id)) {
      handleExpandCamera(expandedCamera);
    }
  }, [
    activeCameras,
    isDirectTracker,
    isJoinCameraTracker,
    isJoinCameraSpecific,
    isCustomMode,
    isTrackerTab,
    trackerOption,
    expandedCamera,
    handleExpandCamera,
  ]);

  return { cameraGroupKey, isCameraReloading, sortedCameras };
};
