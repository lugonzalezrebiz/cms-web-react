import { useEffect, useMemo, useRef, useState } from "react";
import type { CameraEventPoint } from "../../../components/timeline/types";

interface Params {
  cameraGroup: string;
  trackerOption: string;
  isTrackerTab: boolean;
  filteredEventPoints: CameraEventPoint[];
  timelineStartSec: number;
}

// Prefer the first still-pending (AI) point — that's what the reviewer actually
// needs to land on — falling back to the first point overall once nothing is
// pending anymore.
const pickFirstTarget = (points: CameraEventPoint[]) =>
  [...points]
    .filter((ep) => !ep.reviewed)
    .sort((a, b) => a.timeSec - b.timeSec)[0] ??
  [...points].sort((a, b) => a.timeSec - b.timeSec)[0];

// Where Compliance violations moves the marker: the first unreviewed point of
// the selected tracker (tracker tab), or the first point of the camera group
// once per group switch.
export const useComplianceMarkerTargets = ({
  cameraGroup,
  trackerOption,
  isTrackerTab,
  filteredEventPoints,
  timelineStartSec,
}: Params) => {
  const trackerTargetSec = useMemo(() => {
    if (!isTrackerTab || !trackerOption) return timelineStartSec;
    return filteredEventPoints
      .filter((ep) => !ep.reviewed)
      .sort((a, b) => a.timeSec - b.timeSec)[0]?.timeSec;
  }, [isTrackerTab, trackerOption, filteredEventPoints, timelineStartSec]);

  const [cameraGroupTargetSec, setCameraGroupTargetSec] = useState<
    number | undefined
  >(undefined);
  const cameraGroupInitializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isTrackerTab) return;
    cameraGroupInitializedRef.current = null;
    const first = pickFirstTarget(filteredEventPoints);
    if (first !== undefined) {
      setCameraGroupTargetSec(first.timeSec);
      cameraGroupInitializedRef.current = cameraGroup;
    } else {
      setCameraGroupTargetSec(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraGroup]);

  useEffect(() => {
    if (isTrackerTab || cameraGroupInitializedRef.current !== null) return;
    if (filteredEventPoints.length === 0) return;
    const first = pickFirstTarget(filteredEventPoints);
    if (first !== undefined) {
      setCameraGroupTargetSec(first.timeSec);
      cameraGroupInitializedRef.current = cameraGroup;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredEventPoints]);

  return { trackerTargetSec, cameraGroupTargetSec };
};
