import { useQueryClient } from "@tanstack/react-query";
import { useDeleteCallback } from "../../../hooks/useApi";
import type { CameraEventPoint } from "../../../components/timeline/types";
import type { MonitoringResponse } from "../../../components/timeline/hooks/useMonitoring";

export const useDeleteEventPoint = (
  monitoringID: string,
  allEventPoints: CameraEventPoint[],
  handleRemoveEventPoint: (id: number) => void,
  handleRegisterPreloadedDelete: (point: CameraEventPoint) => void,
  handleConvertToLocal: (point: CameraEventPoint) => number,
) => {
  const deleteCallback = useDeleteCallback();
  const queryClient = useQueryClient();

  const removeEntryIdsFromCache = (entryIds: number[]) => {
    const ids = new Set(entryIds.map(String));
    queryClient.setQueryData<MonitoringResponse>(
      [`monitoring/${monitoringID}/load2`],
      (old) => {
        if (!old?.success) return old;
        return {
          ...old,
          monitoring: {
            ...old.monitoring,
            events: old.monitoring.events
              .map((event) => ({
                ...event,
                entries: event.entries.filter((entry) =>
                  entry.type === "POINT"
                    ? !ids.has(entry.id)
                    : !ids.has(entry.startId) && !ids.has(entry.endId),
                ),
              }))
              .filter((event) => event.entries.length > 0),
          },
        };
      },
    );
  };

  const handleDeleteEventPoint = async (id: number) => {
    const target = allEventPoints.find((ep) => ep.id === id);
    if (target?.entryIds?.length) {
      handleRegisterPreloadedDelete(target);
      await deleteCallback(`tracker/${monitoringID}/bulk`, { ids: target.entryIds });
      removeEntryIdsFromCache(target.entryIds);
    } else {
      handleRemoveEventPoint(id);
    }
  };

  const handleStartEditEventPoint = async (id: number): Promise<number> => {
    const target = allEventPoints.find((ep) => ep.id === id);
    if (!target) return id;

    if (target.entryIds?.length) {
      const newId = handleConvertToLocal(target);
      deleteCallback(`tracker/${monitoringID}/bulk`, { ids: target.entryIds });
      removeEntryIdsFromCache(target.entryIds);
      return newId;
    }
    return id;
  };

  return { handleDeleteEventPoint, handleStartEditEventPoint };
};
