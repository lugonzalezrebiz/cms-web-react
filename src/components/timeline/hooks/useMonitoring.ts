import { useMemo, useState } from "react";
import type { TimelineSnapshot, CameraEventPoint, RangeSessions } from "../types";
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
  id: string;
  timestamp: string;
  zoneId: number | null;
  reviewed: boolean;
  value: boolean;
}

interface RangeEntry {
  type: "RANGE";
  startId: string;
  endId: string;
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

export interface MonitoringResponse {
  success: boolean;
  monitoring: {
    id: string;
    trackers: ApiTracker[];
    cameras: ApiCamera[];
    events: ApiEvent[];
  };
}

const toSec=(datetime: string): number =>{
  const time = datetime.split(" ")[1] ?? "00:00:00";
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + (s ?? 0);
}


const toTimeStr=(datetime: string): string =>{
  return datetime.split(" ")[1] ?? "00:00:00";
}

const buildEventPoints=(events: ApiEvent[], trackerMap: Map<number, string>, modeMap: Map<number, "POINT" | "RANGE">): CameraEventPoint[]=> {
  const points: CameraEventPoint[] = [];
  for (const event of events) {
    const label = trackerMap.get(event.trackerId) ?? "";
    const mode = modeMap.get(event.trackerId) ?? "POINT";
    for (const entry of event.entries) {
      if (entry.type === "POINT") {
        const timeSec = toSec(entry.timestamp);
        points.push({
          id: Number(entry.id),
          cameraId: event.cameraId,
          timeSec,
          startSec: Math.max(0, timeSec - 120),
          endSec: timeSec,
          label,
          reviewed: entry.reviewed,
          value: entry.value,
          mode,
          entryIds: [Number(entry.id)],
        });
      } else if (entry.type === "RANGE") {
        const timeSec = toSec(entry.start);
        const endSec = toSec(entry.end);
        points.push({
          id: Number(entry.startId),
          cameraId: event.cameraId,
          timeSec,
          startSec: timeSec,
          endSec,
          label,
          reviewed: entry.reviewed,
          value: true,
          mode: "RANGE",
          entryIds: [Number(entry.startId), Number(entry.endId)],
        });
      }
    }
  }
  return points;
}

const buildRangeSessions=(events: ApiEvent[]): RangeSessions=> {
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

export const useMonitoring=(
  _trackers: { id: number; name: string }[],
  monitoringID: string,
  timeStart?: string | null,
  timeEnd?: string | null,
): {
  snapshot: TimelineSnapshot;
  eventPoints: CameraEventPoint[];
  rangeSessions: RangeSessions;
  loading: boolean;
  error: string | null;
} =>{
  const [baseSnapshot] = useState<TimelineSnapshot>(MOCK_SNAPSHOT);

  const { data, isPending: loading, error: queryError } = useGet<MonitoringResponse>(
    `monitoring/${monitoringID}/load2`,
    undefined,
    { refetchOnWindowFocus: false },
  );

  const monitoring = data?.success ? data.monitoring : null;
  const error = queryError ? queryError.message : null;

  const snapshot = useMemo<TimelineSnapshot>(() => {
    const times = {
      ...baseSnapshot.timeline.times,
      start: timeStart ?? baseSnapshot.timeline.times.start,
      end: timeEnd ?? baseSnapshot.timeline.times.end,
    };
    if (!monitoring) return { ...baseSnapshot, timeline: { ...baseSnapshot.timeline, times } };
    return {
      ...baseSnapshot,
      timeline: {
        ...baseSnapshot.timeline,
        times,
        tracks: monitoring.cameras.map((cam) => ({
          id: cam.id,
          name: cam.name,
          category: "activities" as const,
          sessions: [],
        })),
      },
    };
  }, [monitoring, baseSnapshot, timeStart, timeEnd]);

  const eventPoints = useMemo(() => {
    const trackerMap = new Map((monitoring?.trackers ?? []).map((t) => [t.id, t.name]));
    const modeMap = new Map((monitoring?.trackers ?? []).map((t) => [t.id, t.mode]));
    return buildEventPoints(monitoring?.events ?? [], trackerMap, modeMap);
  }, [monitoring]);

  const rangeSessions = useMemo(() => {
    const sessions = buildRangeSessions(monitoring?.events ?? []);
    // TODO: remove mock
    sessions[10] = [
      { type: "in", timestamp: "08:00:10" },
      { type: "out", timestamp: "23:00:00" },
    ];
    return sessions;
  }, [monitoring]);

  return { snapshot, eventPoints, rangeSessions, loading, error };
}
