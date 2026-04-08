import { useEffect, useState } from "react";
import type { TimelineSnapshot, CameraEventPoint } from "../types";
import { MOCK_SNAPSHOT, TUNNEL_CAMERAS } from "../constants";
import useAuth from "../../../hooks/useAuth";

// Maps tracker_id → label, matching cameraMenuItems IDs in Dashboard
const TRACKER_LABELS: Record<number, string> = {
  11: "Collision",
  2: "Car door open",
  3: "Violent behaviour",
  4: "Human in tunnel",
  5: "Slip & Fall",
};

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

function buildEventPoints(monitoring: MonitoringEntry[]): CameraEventPoint[] {
  const points: CameraEventPoint[] = [];
  for (const entry of monitoring) {
    for (const t of entry.transactions) {
      if (!t.attended) continue;
      const timeSec = toSec(t.sales_timestamp);
      const startSec = Math.floor(timeSec / 3600) * 3600;
      points.push({
        id: entry.tracker_id * 10000 + points.length,
        cameraId: entry.camera_id,
        timeSec,
        startSec,
        endSec: startSec + 3600,
        label: TRACKER_LABELS[entry.tracker_id] ?? "Event",
      });
    }
  }
  return points;
}

export function useMonitoring(): {
  snapshot: TimelineSnapshot;
  eventPoints: CameraEventPoint[];
  loading: boolean;
  error: string | null;
} {
  const { token } = useAuth();
  const [snapshot] = useState<TimelineSnapshot>({
    ...MOCK_SNAPSHOT,
    timeline: {
      ...MOCK_SNAPSHOT.timeline,
      tracks: TUNNEL_CAMERAS.map((cam) => ({ ...cam, sessions: [] })),
    },
  });
  const [eventPoints, setEventPoints] = useState<CameraEventPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const monitoringId = import.meta.env.VITE_MONITORING_ID;

    setLoading(true);
    setError(null);

    fetch(`${import.meta.env.VITE_URL_API}monitoring/${monitoringId}/load`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: MonitoringResponse) => {
        if (data.success) {
          setEventPoints(buildEventPoints(data.monitoring));
        } else {
          setError("Failed to load monitoring data");
        }
      })
      .catch(() => setError("Connection error"))
      .finally(() => setLoading(false));
  }, [token]);

  return { snapshot, eventPoints, loading, error };
}
