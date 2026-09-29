import { useMemo } from "react";
import type { CameraEventPoint } from "../../../components/timeline/types";
import {
  getEventPointColors,
  isOverlapsBlue,
} from "../../../components/timeline/utils";

interface Params {
  filteredEventPoints: CameraEventPoint[];
  expandedCamera: number | null;
  sortedCameras: { id: number }[];
  markerSec: number;
  hasMultipleRows: boolean;
}

// Tags shown on the expanded camera: one per label for the points under the
// marker, reviewed ones first, colored like their timeline diamonds.
export const useExpandedCameraTags = ({
  filteredEventPoints,
  expandedCamera,
  sortedCameras,
  markerSec,
  hasMultipleRows,
}: Params) =>
  useMemo(() => {
    if (expandedCamera === null) return [];
    const activePoints = filteredEventPoints.filter(
      (ep) =>
        ep.cameraId === sortedCameras[expandedCamera]?.id &&
        markerSec >= ep.startSec &&
        markerSec <= ep.endSec,
    );

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
          filteredEventPoints.filter(
            (other) =>
              other.cameraId === ep.cameraId && other.label === ep.label,
          ),
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
  }, [
    filteredEventPoints,
    expandedCamera,
    sortedCameras,
    markerSec,
    hasMultipleRows,
  ]);
