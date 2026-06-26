import { useQueryClient } from "@tanstack/react-query";
import { useDeleteCallback } from "../../../hooks/useApi";
import type { CameraEventPoint } from "../../../components/timeline/types";

interface EventEntry {
  type: "POINT" | "RANGE";
  id?: string;
  startId?: string;
  endId?: string;
  [key: string]: unknown;
}

interface MonitoringResponse {
  success: boolean;
  monitoring: {
    id: string;
    trackers: unknown[];
    cameras: unknown[];
    events: { trackerId: number; cameraId: number; entries: EventEntry[] }[];
  };
}

export const useDeleteEventPoint = (
  monitoringID: string,
  allEventPoints: CameraEventPoint[],
  handleRemoveEventPoint: (id: number) => void,
  handleRegisterPreloadedDelete: (point: CameraEventPoint) => void,
  handleConvertToLocal: (point: CameraEventPoint) => number,
  onMutated?: () => void,
) => {
  const deleteCallback = useDeleteCallback();
  const queryClient = useQueryClient();

  const removeFromCache = (entryIds: number[]) => {
    const deleted = new Set(entryIds.map(String));
    queryClient.setQueryData<MonitoringResponse>(
      [`monitoring/${monitoringID}/load2`],
      (old) => {
        if (!old?.success) return old;
        return {
          ...old,
          monitoring: {
            ...old.monitoring,
            events: old.monitoring.events.map((event) => ({
              ...event,
              entries: event.entries.filter((entry) =>
                entry.type === "POINT"
                  ? !deleted.has(entry.id ?? "")
                  : !deleted.has(entry.startId ?? "") && !deleted.has(entry.endId ?? ""),
              ),
            })),
          },
        };
      },
    );
  };

  const handleDeleteEventPoint = async (id: number) => {
    const target = allEventPoints.find((ep) => ep.id === id);
    if (target?.entryIds?.length) {
      // Register in undo history BEFORE the async DELETE so the snapshot is captured
      // with the point as a local copy. Undo restores it; handleDone re-saves it via save2.
      handleRegisterPreloadedDelete(target);
      removeFromCache(target.entryIds);
      await deleteCallback(`tracker/${monitoringID}/bulk`, { ids: target.entryIds });
      onMutated?.();
    } else {
      handleRemoveEventPoint(id);
    }
  };

  // Shadow-delete a preloaded point and immediately replace it with an editable local copy.
  // Returns the new local id synchronously; the API delete fires in the background.
  const handleConvertEventPoint = (id: number): number => {
    const target = allEventPoints.find((ep) => ep.id === id);
    if (!target) return id;
    if (target.entryIds?.length) {
      const newId = handleConvertToLocal(target);
      removeFromCache(target.entryIds);
      void deleteCallback(`tracker/${monitoringID}/bulk`, { ids: target.entryIds }).then(() =>
        onMutated?.(),
      );
      return newId;
    }
    return target.id;
  };

  return { handleDeleteEventPoint, handleConvertEventPoint };
};
