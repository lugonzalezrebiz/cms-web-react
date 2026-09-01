import { useCallback, useEffect, useRef } from "react";
import { usePost } from "../../../hooks/useApi";
import useAuth from "../../../hooks/useAuth";
import { REVIEWER_ROLE, URL_API } from "../../../config";
import { secToTimeString } from "../utils";
import type { CameraEventPoint } from "../types";
import { useNavigatePlain } from "../../../hooks/useNavigate";

interface PointEntry {
  id?: number;
  type: "POINT";
  timestamp: string;
  value: boolean;
  zoneId: number | null;
  reviewed: boolean;
  reviewDate: string | null;
  reviewDisagree: boolean;
  status: string | null;
  processed: boolean;
  processDate: string | null;
  subject?: number | null;
  object?: number | null;
  meta?: string | null;
}

interface RangeEntry {
  startId?: number;
  endId?: number;
  type: "RANGE";
  start: string;
  end: string;
  zoneId: number | null;
  reviewed: boolean;
  reviewDisagree: boolean;
  status: string | null;
  processed: boolean;
  processDate: string | null;
  subject?: number | null;
  object?: number | null;
  meta?: string | null;
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
  onSuccess,
}: {
  trackers: { id: number; name: string; attended?: boolean }[];
  eventPoints: CameraEventPoint[];
  rangeEvents?: RangeEvent[];
  sessionDate: string;
  monitoringID: string;
  onSuccess?: () => void;
}) => {
  const navigate = useNavigatePlain();
  const { user, token } = useAuth();
  const { mutateAsync: mutateSave, isPending: isSavePending } = usePost<SaveResponse, SavePayload>(
    `monitoring/${monitoringID}/save2`, {
      onSuccess: () => {
        onSuccess?.();
      },
    },
  );
  const { mutateAsync: mutateFinish, isPending: isFinishPending } = usePost<unknown, void>(
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
      const reviewDisagree = ep.rejected === true || ep.reviewDisagree === true;
      const reviewed = isReviewer ? true : ep.reviewed || reviewDisagree;
      const reviewDate = isReviewer || reviewed ? now : null;
      // Archiving (hiding on reload) is tracked separately from reviewDisagree — the latter
      // now only drives the diamond's border color and must not also hide it.
      const status = ep.rejected === true ? "ARCHIVED" : null;

      if (ep.mode === "RANGE") {
        const endSec = ep.endSec > ep.timeSec ? ep.endSec : ep.timeSec;
        group.entries.push({
          startId: ep.entryIds?.[0],
          endId: ep.entryIds?.[1],
          type: "RANGE",
          start: `${sessionDate} ${secToTimeString(ep.timeSec)}`,
          end: `${sessionDate} ${secToTimeString(endSec)}`,
          zoneId: ep.zoneId ?? null,
          reviewed,
          reviewDisagree,
          status,
          processed: ep.processed ?? false,
          processDate: ep.processDate ?? null,
          subject: ep.subject ?? null,
          object: ep.object ?? null,
          meta: ep.meta ?? null,
        });
      } else {
        group.entries.push({
          id: ep.entryIds?.[0],
          type: "POINT",
          timestamp: `${sessionDate} ${secToTimeString(ep.timeSec)}`,
          value: ep.value,
          zoneId: ep.zoneId ?? null,
          reviewed,
          reviewDate,
          reviewDisagree,
          status,
          processed: ep.processed ?? false,
          processDate: ep.processDate ?? null,
          subject: ep.subject ?? null,
          object: ep.object ?? null,
          meta: ep.meta ?? null,
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
        reviewDisagree: false,
        status: null,
        processed: false,
        processDate: null,
      });
    }
    return { events: Array.from(grouped.values()) };
  }, [trackers, eventPoints, rangeEvents, sessionDate, user]);

  const buildPayloadRef = useRef(buildPayload);
  useEffect(() => { buildPayloadRef.current = buildPayload; }, [buildPayload]);

  const savedRef = useRef(false);

  useEffect(() => {
    savedRef.current = false;
    let active = false;
    const id = setTimeout(() => { active = true; }, 0);

    const onBeforeUnload = () => {
      savedRef.current = true;
      fetch(`${URL_API}monitoring/${monitoringID}/save2`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(buildPayloadRef.current()),
      });
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      clearTimeout(id);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (active && !savedRef.current) {
        savedRef.current = true;
        fetch(`${URL_API}monitoring/${monitoringID}/save2`, {
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(buildPayloadRef.current()),
        });
      }
    };
  }, [monitoringID, token]);

  const handleDone = useCallback(async () => {
    savedRef.current = true;
    try {
      await mutateSave(buildPayloadRef.current());
    } catch {
      // save failed — still proceed to navigate
    }
    try {
      await mutateFinish();
    } catch {
      // review/finish may return 400 — ignore and proceed
    }
    navigate("/assignments");
  }, [mutateSave, mutateFinish, navigate]);

  return { handleDone, isDoneLoading: isSavePending || isFinishPending };
};
