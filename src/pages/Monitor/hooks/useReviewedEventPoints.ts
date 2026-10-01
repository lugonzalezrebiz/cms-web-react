import { useMemo } from "react";
import type { CameraEventPoint } from "../../../components/timeline/types";
import { hasReviewedTwin } from "../../../components/timeline/utils";
import type { useTrackerGroupResolution } from "./useTrackerGroupResolution";

type TrackerGrouping = ReturnType<
  typeof useTrackerGroupResolution
>["trackerGroupings"][number];

interface Params {
  cameraEventPoints: CameraEventPoint[];
  preloadedEventPoints: CameraEventPoint[];
  rejectedEventIds: Set<number>;
  acceptedEventIds: Set<number>;
  aiIncorrectEventIds: Set<number>;
  trackerGroupings: TrackerGrouping[];
}

// Local + preloaded event points with this session's review decisions applied,
// and which trackers still have / ever had AI events.
export const useReviewedEventPoints = ({
  cameraEventPoints,
  preloadedEventPoints,
  rejectedEventIds,
  acceptedEventIds,
  aiIncorrectEventIds,
  trackerGroupings,
}: Params) => {
  const allEventPoints = useMemo(
    () =>
      [...cameraEventPoints, ...preloadedEventPoints].map((ep) => {
        if (rejectedEventIds.has(ep.id))
          return {
            ...ep,
            rejected: true,
            reviewed: true,
            reviewDisagree: true,
            touchedThisSession: true,
          };
        if (acceptedEventIds.has(ep.id)) {
          // Accepting a POINT diamond always confirms value=true (a violation happened);
          // if the AI's own original value said otherwise, that's a reviewer disagreement.
          if (ep.mode === "POINT") {
            return {
              ...ep,
              accepted: true,
              reviewed: true,
              value: true,
              reviewDisagree: ep.value !== true,
              touchedThisSession: true,
            };
          }
          return {
            ...ep,
            accepted: true,
            reviewed: true,
            touchedThisSession: true,
          };
        }
        if (aiIncorrectEventIds.has(ep.id)) {
          if (ep.mode === "POINT") {
            return {
              ...ep,
              accepted: true,
              reviewed: true,
              value: false,
              reviewDisagree: ep.value !== false,
              touchedThisSession: true,
            };
          }
          return {
            ...ep,
            accepted: true,
            reviewed: true,
            touchedThisSession: true,
          };
        }
        return ep;
      }),
    [
      cameraEventPoints,
      preloadedEventPoints,
      acceptedEventIds,
      rejectedEventIds,
      aiIncorrectEventIds,
    ],
  );

  const unreviewedTrackerIds = useMemo(() => {
    const ids = new Set<number>();
    for (const t of trackerGroupings) {
      const cameraIds =
        t.joinCamera && t.cameras.length > 0
          ? new Set(t.cameras.map((c) => c.id))
          : null;
      const hasUnreviewed = allEventPoints.some(
        (ep) =>
          !ep.reviewed &&
          !ep.rejected &&
          ep.label === t.name &&
          (!cameraIds || cameraIds.has(ep.cameraId)) &&
          !hasReviewedTwin(ep, allEventPoints),
      );
      if (hasUnreviewed) ids.add(t.id);
    }
    return ids;
  }, [trackerGroupings, allEventPoints]);

  // Trackers that have AI-detected events at all (reviewed or not). Backed
  // directly by preloadedEventPoints from the server, so — unlike a locally
  // accumulated set — it survives a reload: the tracker's toggle keeps
  // showing even after everything gets reviewed/rejected, while the AI icon
  // (driven by the live unreviewedTrackerIds) disappears once nothing is
  // pending.
  const aiTrackerIds = useMemo(() => {
    const ids = new Set<number>();
    for (const t of trackerGroupings) {
      const cameraIds =
        t.joinCamera && t.cameras.length > 0
          ? new Set(t.cameras.map((c) => c.id))
          : null;
      const hasAnyEvent = allEventPoints.some(
        (ep) =>
          ep.label === t.name && (!cameraIds || cameraIds.has(ep.cameraId)),
      );
      if (hasAnyEvent) ids.add(t.id);
    }
    return ids;
  }, [trackerGroupings, allEventPoints]);

  return { allEventPoints, unreviewedTrackerIds, aiTrackerIds };
};
