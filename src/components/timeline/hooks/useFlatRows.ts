import { useMemo } from "react";
import type { CameraEventPoint, FlatRow, TimelineSnapshot } from "../types";

function toSeconds(time: string): number {
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

interface UseFlatRowsParams {
  isTunnel: boolean;
  data: TimelineSnapshot;
  cameraActivities?: { id: number; cameraIndex: number; activityLabel: string }[];
  cameraEventPoints?: CameraEventPoint[];
}

export const useFlatRows = ({
  isTunnel,
  data,
  cameraActivities,
  cameraEventPoints,
}: UseFlatRowsParams) => {
  const timelineStartSec = toSeconds(data.timeline.times.start);
  const timelineEndSec = toSeconds(data.timeline.times.end);

  const flatRows = useMemo((): FlatRow[] => {
    const tracks = data.timeline.tracks;
    if (!isTunnel) {
      const rows: FlatRow[] = [];
      for (let i = 0; i < tracks.length; i++) {
        const cam = tracks[i];
        rows.push({
          id: cam.id,
          name: cam.name,
          kind: "camera" as const,
          cameraNumber: i + 1,
          sessions: cam.sessions,
        });
        const labels = [
          ...new Set(
            (cameraEventPoints ?? [])
              .filter((ep) => ep.cameraId === cam.id)
              .map((ep) => ep.label),
          ),
        ].sort();
        labels.forEach((label, idx) => {
          rows.push({
            id: cam.id * 1000 + idx,
            name: label,
            kind: "event" as const,
            parentCameraId: cam.id,
            cameraNumber: 0,
            sessions: [],
          });
        });
      }
      return rows;
    }
    const rows: FlatRow[] = [];
    let camNum = 0;
    for (const cam of tracks) {
      camNum++;
      rows.push({
        id: cam.id,
        name: cam.name,
        kind: "camera",
        cameraNumber: camNum,
        sessions: cam.sessions,
      });
      const acts = (cameraActivities ?? []).filter(
        (a) => a.cameraIndex === cam.id - 1,
      );
      for (const act of acts) {
        rows.push({
          id: 10000 + act.id,
          name: act.activityLabel,
          kind: "activity",
          parentCameraId: cam.id,
          cameraNumber: 0,
          sessions: [],
        });
      }
    }
    return rows;
  }, [isTunnel, cameraActivities, cameraEventPoints, data]);

  const selectableRows = useMemo(
    () =>
      isTunnel
        ? flatRows.filter((r) => r.kind === "activity")
        : flatRows.filter((r) => r.kind !== "event"),
    [isTunnel, flatRows],
  );

  const allTimestamps = flatRows.flatMap((row) =>
    row.sessions.map((s) => toSeconds(s.timestamp)),
  );
  const firstActivitySec =
    allTimestamps.length > 0 ? Math.min(...allTimestamps) : 0;

  return { flatRows, selectableRows, timelineStartSec, timelineEndSec, firstActivitySec };
};
