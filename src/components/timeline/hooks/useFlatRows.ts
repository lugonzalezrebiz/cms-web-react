import { useMemo } from "react";
import type { CameraEventPoint, FlatRow, TimelineSnapshot } from "../types";
import { timeStringToSec } from "../utils";

interface UseFlatRowsParams {
  data: TimelineSnapshot;
  cameraEventPoints?: CameraEventPoint[];
}

export const useFlatRows = ({
  data,
  cameraEventPoints,
}: UseFlatRowsParams) => {
  const timelineStartSec = timeStringToSec(data.timeline.times.start);
  const timelineEndSec = timeStringToSec(data.timeline.times.end);

  const flatRows = useMemo((): FlatRow[] => {
    const tracks = data.timeline.tracks;
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
  }, [cameraEventPoints, data]);

  const selectableRows = useMemo(
    () => flatRows.filter((r) => r.kind !== "event"),
    [flatRows],
  );

  const allTimestamps = flatRows.flatMap((row) =>
    row.sessions.map((s) => timeStringToSec(s.timestamp)),
  );
  const firstActivitySec =
    allTimestamps.length > 0 ? Math.min(...allTimestamps) : 0;

  return { flatRows, selectableRows, timelineStartSec, timelineEndSec, firstActivitySec };
};
