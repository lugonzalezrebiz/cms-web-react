import { useMemo, useState } from "react";
import type { TimelineSnapshot, CameraEventPoint } from "../types";
import { MOCK_SNAPSHOT } from "../constants";
import { useGet } from "../../../hooks/useApi";

interface ApiTracker {
  id: number;
  name: string;
  mode: "POINT" | "RANGE";
}

interface ApiCamera {
  id: number;
  name: string;
  group: { id: number; name: string };
}

interface PointEntry {
  type: "POINT";
  timestamp: string;
  zoneId: number | null;
  reviewed: boolean;
  value: boolean;
}

interface RangeEntry {
  type: "RANGE";
  start: string;
  end: string;
  zoneId: number | null;
  reviewed: boolean;
}

type EventEntry = PointEntry | RangeEntry;

interface ApiEvent {
  trackerId: number;
  cameraId: number;
  entries: EventEntry[];
}

interface MonitoringResponse {
  success: boolean;
  monitoring: {
    id: string;
    trackers: ApiTracker[];
    cameras: ApiCamera[];
    events: ApiEvent[];
  };
}

function toSec(datetime: string): number {
  const time = datetime.split(" ")[1] ?? "00:00:00";
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + (s ?? 0);
}

type RangeSessions = Record<number, { type: "in" | "out"; timestamp: string }[]>;

function toTimeStr(datetime: string): string {
  return datetime.split(" ")[1] ?? "00:00:00";
}

function buildEventPoints(events: ApiEvent[]): CameraEventPoint[] {
  const points: CameraEventPoint[] = [];
  for (const event of events) {
    const label = `Item ${event.trackerId}`;
    for (const entry of event.entries) {
      if (entry.type === "POINT") {
        const timeSec = toSec(entry.timestamp);
        points.push({
          id: points.length,
          cameraId: event.cameraId,
          timeSec,
          startSec: Math.max(0, timeSec - 120),
          endSec: timeSec + 120,
          label,
        });
      }
    }
  }
  return points;
}

function buildRangeSessions(events: ApiEvent[]): RangeSessions {
  const sessions: RangeSessions = {};
  for (const event of events) {
    for (const entry of event.entries) {
      if (entry.type === "RANGE") {
        if (!sessions[event.trackerId]) sessions[event.trackerId] = [];
        sessions[event.trackerId].push({ type: "in", timestamp: toTimeStr(entry.start) });
        sessions[event.trackerId].push({ type: "out", timestamp: toTimeStr(entry.end) });
      }
    }
  }
  return sessions;
}

export function useMonitoring(_trackers: { id: number; name: string }[], monitoringID: string): {
  snapshot: TimelineSnapshot;
  eventPoints: CameraEventPoint[];
  rangeSessions: RangeSessions;
  loading: boolean;
  error: string | null;
} {
  const [baseSnapshot] = useState<TimelineSnapshot>(MOCK_SNAPSHOT);

  const { data, isPending: loading, error: queryError } = useGet<MonitoringResponse>(
    `monitoring/${monitoringID}/load2`,
  );

  const monitoring = data?.success ? data.monitoring : null;
  const error = queryError ? queryError.message : null;

  const snapshot = useMemo<TimelineSnapshot>(() => {
    if (!monitoring) return baseSnapshot;
    return {
      ...baseSnapshot,
      timeline: {
        ...baseSnapshot.timeline,
        tracks: monitoring.cameras.map((cam) => ({
          id: cam.id,
          name: cam.name,
          category: "activities" as const,
          sessions: [],
        })),
      },
    };
  }, [monitoring, baseSnapshot]);

  const eventPoints = useMemo(
    () => buildEventPoints(monitoring?.events ?? []),
    [monitoring],
  );

  const rangeSessions = useMemo(() => {
    const sessions = buildRangeSessions(monitoring?.events ?? []);
    // TODO: remove mock
    sessions[1] = [
      { type: "in", timestamp: "08:00:10" },
      { type: "out", timestamp: "23:00:00" },
    ];
    return sessions;
  }, [monitoring]);

  return { snapshot, eventPoints, rangeSessions, loading, error };
}
