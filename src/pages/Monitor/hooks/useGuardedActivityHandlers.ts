import { useCallback } from "react";
import { TAG_TOLERANCE_SEC } from "../../../components/CameraLayout";
import type { CameraEventPoint } from "../../../components/timeline/types";

type ActivityHandler = (
  cameraId: number,
  activityLabel: string,
  mode?: "POINT" | "RANGE",
) => void;

interface Params {
  allEventPoints: CameraEventPoint[];
  markerSec: number;
  handleActivitySelect: ActivityHandler;
  handleActivityReject: ActivityHandler;
  handleAcceptEventPoint: (id: number) => void;
  handleMarkAiIncorrect: (id: number) => void;
}

// Camera-menu actions for Compliance violations: skip exact duplicates, and
// resolve a pending (AI) diamond near the marker instead of adding a new point.
export const useGuardedActivityHandlers = ({
  allEventPoints,
  markerSec,
  handleActivitySelect,
  handleActivityReject,
  handleAcceptEventPoint,
  handleMarkAiIncorrect,
}: Params) => {
  const handleActivitySelectGuarded = useCallback(
    (
      cameraId: number,
      activityLabel: string,
      mode: "POINT" | "RANGE" = "POINT",
    ) => {
      const hasDuplicate = allEventPoints.some(
        (ep) =>
          ep.cameraId === cameraId &&
          ep.label === activityLabel &&
          ep.timeSec === markerSec &&
          ep.reviewed,
      );
      if (hasDuplicate) return;

      // A pending (unreviewed) diamond near the marker for this camera/label
      // is what the tap is resolving — accept it instead of creating a new,
      // separately-reviewed point.
      const pending = allEventPoints.find(
        (ep) =>
          ep.cameraId === cameraId &&
          ep.label === activityLabel &&
          ep.reviewed === false &&
          !ep.rejected &&
          Math.abs(ep.timeSec - markerSec) <= TAG_TOLERANCE_SEC,
      );
      if (pending) {
        handleAcceptEventPoint(pending.id);
        return;
      }

      handleActivitySelect(cameraId, activityLabel, mode);
    },
    [allEventPoints, handleActivitySelect, handleAcceptEventPoint, markerSec],
  );

  const handleActivityRejectGuarded = useCallback(
    (
      cameraId: number,
      activityLabel: string,
      mode: "POINT" | "RANGE" = "POINT",
    ) => {
      const hasDuplicate = allEventPoints.some(
        (ep) =>
          ep.cameraId === cameraId &&
          ep.label === activityLabel &&
          ep.timeSec === markerSec &&
          ep.reviewed,
      );
      if (hasDuplicate) return;

      const pending = allEventPoints.find(
        (ep) =>
          ep.cameraId === cameraId &&
          ep.label === activityLabel &&
          ep.reviewed === false &&
          !ep.rejected &&
          Math.abs(ep.timeSec - markerSec) <= TAG_TOLERANCE_SEC,
      );
      if (pending) {
        handleMarkAiIncorrect(pending.id);
        return;
      }

      handleActivityReject(cameraId, activityLabel, mode);
    },
    [allEventPoints, handleActivityReject, handleMarkAiIncorrect, markerSec],
  );

  return { handleActivitySelectGuarded, handleActivityRejectGuarded };
};
