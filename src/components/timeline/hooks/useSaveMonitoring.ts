import { useCallback, useEffect, useRef } from "react";
import { usePost } from "../../../hooks/useApi";
import useAuth from "../../../hooks/useAuth";
import { REVIEWER_ROLE, URL_API } from "../../../config";
import { secToTimeString } from "./useTimelineMarker";
import type { CameraEventPoint } from "../types";

interface PointEntry {
  type: "POINT";
  timestamp: string;
  value: boolean;
  zoneId: number | null;
  reviewed: boolean;
  reviewDate: string | null;
  review_disagree: boolean;
  processed: boolean;
  processDate: string | null;
}

interface RangeEntry {
  type: "RANGE";
  start: string;
  end: string;
  zoneId: number | null;
  reviewed: boolean;
  review_disagree: boolean;
  processed: boolean;
  processDate: string | null;
}

interface SaveEventGroup {
  trackerId: number;
  cameraId: number;
  entries: (PointEntry | RangeEntry)[];
}

interface SavePayload {
  events: SaveEventGroup[];
}

interface SaveResponse {
  success: boolean;
}

export interface RangeEvent {
  trackerId: number;
  cameraId: number;
  startSec: number;
  endSec: number;
}

export const useSaveMonitoring = ({
  trackers,
  eventPoints,
  rangeEvents = [],
  sessionDate,
  monitoringID,
}: {
  trackers: { id: number; name: string; attended?: boolean }[];
  eventPoints: CameraEventPoint[];
  rangeEvents?: RangeEvent[];
  sessionDate: string;
  monitoringID: string;
}) => {
  const { user, token } = useAuth();
  const { mutateAsync: mutateSave } = usePost<SaveResponse, SavePayload>(
    `monitoring/${monitoringID}/save2`
  );
  const { mutateAsync: mutateFinish } = usePost<unknown, void>(
    `monitoring/${monitoringID}/review/finish`
  );

  const buildPayload = useCallback((): SavePayload => {
    const labelToTrackerId: Record<string, number> = Object.fromEntries(
      trackers.map((t) => [t.name, t.id]),
    );
    const isReviewer = user?.roleID === REVIEWER_ROLE;
    const now = new Date().toISOString();
    const grouped = new Map<string, SaveEventGroup>();

    const getGroup = (trackerId: number, cameraId: number): SaveEventGroup => {
      const key = `${trackerId}-${cameraId}`;
      if (!grouped.has(key)) grouped.set(key, { trackerId, cameraId, entries: [] });
      return grouped.get(key)!;
    };

    for (const ep of eventPoints) {
      const trackerId = labelToTrackerId[ep.label] ?? 0;
      const group = getGroup(trackerId, ep.cameraId);
      const reviewed = isReviewer ? true : ep.reviewed;
      const reviewDate = isReviewer ? now : null;

      if (ep.mode === "RANGE") {
        const endSec = ep.endSec > ep.timeSec ? ep.endSec : ep.timeSec;
        group.entries.push({
          type: "RANGE",
          start: `${sessionDate} ${secToTimeString(ep.timeSec)}`,
          end: `${sessionDate} ${secToTimeString(endSec)}`,
          zoneId: null,
          reviewed,
          review_disagree: false,
          processed: false,
          processDate: null,
        });
      } else {
        group.entries.push({
          type: "POINT",
          timestamp: `${sessionDate} ${secToTimeString(ep.timeSec)}`,
          value: ep.value,
          zoneId: null,
          reviewed,
          reviewDate,
          review_disagree: false,
          processed: false,
          processDate: null,
        });
      }
    }

    for (const re of rangeEvents) {
      const group = getGroup(re.trackerId, re.cameraId);
      group.entries.push({
        type: "RANGE",
        start: `${sessionDate} ${secToTimeString(re.startSec)}`,
        end: `${sessionDate} ${secToTimeString(re.endSec)}`,
        zoneId: null,
        reviewed: isReviewer,
        review_disagree: false,
        processed: false,
        processDate: null,
      });
    }

    return { events: Array.from(grouped.values()) };
  }, [trackers, eventPoints, rangeEvents, sessionDate, user]);

  const buildPayloadRef = useRef(buildPayload);
  useEffect(() => { buildPayloadRef.current = buildPayload; }, [buildPayload]);

  useEffect(() => {
    const onBeforeUnload = () => {
      const payload = buildPayloadRef.current();
      fetch(`${URL_API}monitoring/${monitoringID}/save2`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      sessionStorage.setItem("monitoringSavedOnReload", monitoringID);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [monitoringID, token]);

  useEffect(() => {
    const savedID = sessionStorage.getItem("monitoringSavedOnReload");
    if (savedID === monitoringID) {
      sessionStorage.removeItem("monitoringSavedOnReload");
    }
  }, [monitoringID]);

  const handleSave = useCallback(() => {
    mutateSave(buildPayloadRef.current());
  }, [mutateSave]);

  const handleDone = useCallback(async () => {
    await mutateSave(buildPayloadRef.current());
    await mutateFinish();
  }, [mutateSave, mutateFinish]);

  return { handleSave, handleDone };
};
