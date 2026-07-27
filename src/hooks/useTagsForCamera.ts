import { useCallback } from "react";
import type { CameraEventPoint } from "../components/timeline/types";
import type { CameraContextMenuItem } from "../components/CameraLayout/CameraOverlayMenu";
import type { CameraInfo } from "./useExitingCameras";

export const TAG_TOLERANCE_SEC = 30;

export const useTagsForCamera = (
  cameraEventPoints: CameraEventPoint[],
  markerSec: number,
  cameras: CameraInfo[],
) =>
  useCallback(
    (cameraIndex: number): CameraContextMenuItem[] => {
      const activePoints = cameraEventPoints.filter((ep) => {
        if (ep.cameraId !== cameras[cameraIndex]?.id) return false;
        return markerSec >= ep.startSec && markerSec <= ep.endSec;
      });

      const seen = new Set<string>();
      return activePoints
        .sort(
          (a, b) =>
            (a.reviewed === false ? 1 : 0) - (b.reviewed === false ? 1 : 0),
        )
        .filter((ep) => {
          // An undecided unreviewed point that overlaps a reviewed twin (the
          // green tag) must stay visible alongside it so it can be
          // accepted/rejected — otherwise it's stuck blocking the timeline
          // with no way to resolve it. Once decided, fall back to the normal
          // per-label dedupe so only the green tag remains.
          const isUndecidedUnreviewed =
            ep.reviewed === false && !ep.accepted && !ep.rejected;
          const hasReviewedTwin =
            isUndecidedUnreviewed &&
            activePoints.some(
              (other) =>
                other.id !== ep.id &&
                other.label === ep.label &&
                other.reviewed === true &&
                other.timeSec === ep.timeSec,
            );
          if (hasReviewedTwin) return true;

          if (seen.has(ep.label)) return false;
          seen.add(ep.label);
          return true;
        })
        .map((ep) => ({
          id: ep.id,
          name: ep.label,
          label: ep.label,
          reviewed: ep.reviewed,
          rejected: ep.rejected,
          accepted: ep.accepted,
          overlapsUnreviewed:
            ep.reviewed &&
            cameraEventPoints.some(
              (other) =>
                other.id !== ep.id &&
                other.label === ep.label &&
                !other.reviewed &&
                other.timeSec === ep.timeSec,
            ),
          onClick: () => {},
        }));
    },
    [cameraEventPoints, markerSec, cameras],
  );
