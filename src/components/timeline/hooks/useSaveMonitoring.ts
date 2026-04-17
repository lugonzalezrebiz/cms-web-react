import { useCallback } from "react";
import { usePost } from "../../../hooks/useApi";
import useAuth from "../../../hooks/useAuth";
import { MONITORING_ID, REVIEWER_ROLE } from "../../../config";
import { secToTimeString } from "./useTimelineMarker";
import type { CameraEventPoint } from "../types";

interface SaveTransaction {
  sales_timestamp: string;
  attended: boolean;
  reviewed?: boolean;
  review_date?: string;
}

interface SaveEntry {
  tracker_id: number;
  monitoring_id: string;
  camera_id: number;
  zone_id: null;
  transactions: SaveTransaction[];
}

interface SaveResponse {
  success: boolean;
}

export const useSaveMonitoring = ({
  trackers,
  eventPoints,
  sessionDate,
}: {
  trackers: { id: number; name: string; attended?: boolean }[];
  eventPoints: CameraEventPoint[];
  sessionDate: string;
}) => {
  const { user } = useAuth();
  const { mutate } = usePost<SaveResponse, SaveEntry[]>(
    `monitoring/${MONITORING_ID}/save`,
    {
      onSuccess: (data) => {
        if (data.success) alert("Monitoring saved successfully.");
      },
    },
  );

  const handleDone = useCallback(() => {
    const labelToTrackerId: Record<string, number> = Object.fromEntries(
      trackers.map((t) => [t.name, t.id]),
    );
    const trackerAttended: Record<number, boolean> = Object.fromEntries(
      trackers.map((t) => [t.id, t.attended ?? false]),
    );

    const grouped = new Map<
      string,
      { trackerId: number; cameraId: number; timestamps: string[]; attended: boolean }
    >();

    for (const ep of eventPoints) {
      const trackerId = labelToTrackerId[ep.label] ?? Math.floor(ep.id / 10000);
      const key = `${trackerId}-${ep.cameraId}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          trackerId,
          cameraId: ep.cameraId,
          timestamps: [],
          attended: trackerAttended[trackerId] ?? false,
        });
      }
      grouped.get(key)!.timestamps.push(secToTimeString(ep.timeSec));
    }

    const reviewerPayload = {
      reviewed: true,
      review_date: new Date().toISOString(),
    };

    const payload: SaveEntry[] = Array.from(grouped.values()).map(
      ({ trackerId, cameraId, timestamps, attended }) => ({
        tracker_id: trackerId,
        monitoring_id: MONITORING_ID,
        camera_id: cameraId,
        zone_id: null,
        transactions: timestamps.map((t) => ({
          sales_timestamp: `${sessionDate} ${t}`,
          attended,
          ...(user?.roleID === REVIEWER_ROLE ? reviewerPayload : {}),
        })),
      }),
    );

    mutate(payload);
  }, [trackers, eventPoints, sessionDate, user, mutate]);

  return { handleDone };
};
