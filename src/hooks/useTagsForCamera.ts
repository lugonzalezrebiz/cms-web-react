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

      // Only one chip per label, ever — reviewed (green/orange) wins over unreviewed
      // (blue) when both exist for the same label, so sort reviewed first and keep
      // just the first occurrence per label.
      const seen = new Set<string>();
      return activePoints
        .sort(
          (a, b) =>
            (a.reviewed === false ? 1 : 0) - (b.reviewed === false ? 1 : 0),
        )
        .filter((ep) => {
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
            ep.accepted === true ||
            (!!ep.meta && ep.reviewed) ||
            (ep.reviewed &&
              cameraEventPoints.some(
                (other) =>
                  other.id !== ep.id &&
                  other.label === ep.label &&
                  !other.reviewed &&
                  other.timeSec === ep.timeSec,
              )),
          onClick: () => {},
        }));
    },
    [cameraEventPoints, markerSec, cameras],
  );
