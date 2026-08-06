import { useCallback } from "react";
import type { CameraEventPoint } from "../components/timeline/types";
import type { CameraContextMenuItem } from "../components/CameraLayout/CameraOverlayMenu";
import type { CameraInfo } from "./useExitingCameras";
import { isOverlapsBlue, getEventPointColors } from "../components/timeline/utils";

export const TAG_TOLERANCE_SEC = 30;

export const useTagsForCamera = (
  cameraEventPoints: CameraEventPoint[],
  markerSec: number,
  cameras: CameraInfo[],
  hasMultipleRows: boolean,
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
        .map((ep) => {
          const overlapsUnreviewed = isOverlapsBlue(
            ep,
            cameraEventPoints.filter((other) => other.label === ep.label),
          );
          const { fill, border } = getEventPointColors(
            ep,
            overlapsUnreviewed,
            hasMultipleRows,
          );
          return {
            id: ep.id,
            name: ep.label,
            label: ep.label,
            reviewed: ep.reviewed,
            rejected: ep.rejected,
            accepted: ep.accepted,
            value: ep.value,
            mode: ep.mode,
            reviewDisagree: ep.reviewDisagree,
            overlapsUnreviewed,
            fillColor: fill,
            borderColor: border,
            onClick: () => {},
          };
        });
    },
    [cameraEventPoints, markerSec, cameras, hasMultipleRows],
  );
