import { useMemo } from "react";
import type { CameraEventPoint, FlatRow, TimelineSnapshot, RangeSessions } from "../types";
import { timeStringToSec } from "../utils";

interface UseFlatRowsParams {
  data: TimelineSnapshot;
  cameraEventPoints?: CameraEventPoint[];
  viewMode?: "camera" | "activity";
  menuItems?: { id: number; name: string }[];
  rangeSessions?: RangeSessions;
}

export const useFlatRows = ({
  data,
  cameraEventPoints,
  viewMode = "camera",
  menuItems = [],
  rangeSessions,
}: UseFlatRowsParams) => {
  const timelineStartSec = timeStringToSec(data.timeline.times.start);
  const timelineEndSec = timeStringToSec(data.timeline.times.end);

  const cameraFlatRows = useMemo((): FlatRow[] => {
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

  const activityFlatRows = useMemo(
    (): FlatRow[] =>
      menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        kind: "activity" as const,
        cameraNumber: 0,
        sessions: rangeSessions?.[item.id] ?? [],
      })),
    [menuItems, rangeSessions],
  );

  const cameraSelectableRows = useMemo(
    () => cameraFlatRows.filter((r) => r.kind !== "event"),
    [cameraFlatRows],
  );

  const isActivityMode = viewMode === "activity";
  const flatRows = isActivityMode ? activityFlatRows : cameraFlatRows;
  const selectableRows = isActivityMode ? activityFlatRows : cameraSelectableRows;

  const allTimestamps = cameraFlatRows.flatMap((row) =>
    row.sessions.map((s) => timeStringToSec(s.timestamp)),
  );
  const firstActivitySec =
    allTimestamps.length > 0 ? Math.min(...allTimestamps) : 0;

  return { flatRows, selectableRows, timelineStartSec, timelineEndSec, firstActivitySec };
};
