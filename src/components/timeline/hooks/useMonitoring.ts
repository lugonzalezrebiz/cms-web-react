import { useMemo, useState } from "react";
import type { TimelineSnapshot, CameraEventPoint } from "../types";
import { MOCK_SNAPSHOT, TUNNEL_CAMERAS } from "../constants";
import { useGet } from "../../../hooks/useApi";
import { MONITORING_ID } from "../../../config";


interface MonitoringTransaction {
  sales_timestamp: string;
  attended: boolean;
}

interface MonitoringEntry {
  tracker_id: number;
  monitoring_id: string;
  camera_id: number;
  zone_id: number | null;
  transactions: MonitoringTransaction[];
}

interface MonitoringResponse {
  success: boolean;
  monitoring: MonitoringEntry[];
}

function toSec(datetime: string): number {
  const time = datetime.split(" ")[1] ?? "00:00:00";
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + (s ?? 0);
}

function buildEventPoints(monitoring: MonitoringEntry[], trackerLabels: Record<number, string>): CameraEventPoint[] {
  const points: CameraEventPoint[] = [];
  for (const entry of monitoring) {
    for (const t of entry.transactions) {
      const timeSec = toSec(t.sales_timestamp);
      const startSec = Math.max(0, timeSec - 120);
      points.push({
        id: entry.tracker_id * 10000 + points.length,
        cameraId: entry.camera_id,
        timeSec,
        startSec,
        endSec: timeSec + 120,
        label: trackerLabels[entry.tracker_id] ?? "Event",
      });
    }
  }
  return points;
}


export function useMonitoring(trackers: { id: number; name: string }[]): {
  snapshot: TimelineSnapshot;
  eventPoints: CameraEventPoint[];
  loading: boolean;
  error: string | null;
} {
  const [snapshot] = useState<TimelineSnapshot>({
    ...MOCK_SNAPSHOT,
    timeline: {
      ...MOCK_SNAPSHOT.timeline,
      tracks: TUNNEL_CAMERAS.map((cam) => ({ ...cam, sessions: [] })),
    },
  });

  const { data, isPending: loading, error: queryError } = useGet<MonitoringResponse>(
    `monitoring/${MONITORING_ID}/load`,
  );

  const monitoringEntries = data?.success ? data.monitoring : [];
  const error = queryError ? queryError.message : null;

  const trackerLabels = useMemo(
    () => Object.fromEntries(trackers.map((t) => [t.id, t.name])),
    [trackers],
  );

  const eventPoints = useMemo(
    () => buildEventPoints(monitoringEntries, trackerLabels),
    [monitoringEntries, trackerLabels],
  );

  return { snapshot, eventPoints, loading, error };
}
