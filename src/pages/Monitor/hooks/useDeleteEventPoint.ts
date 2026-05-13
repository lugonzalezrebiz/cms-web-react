import { useQueryClient } from "@tanstack/react-query";
import { useDeleteCallback } from "../../../hooks/useApi";
import type { CameraEventPoint } from "../../../components/timeline/types";

export const useDeleteEventPoint = (
  monitoringID: string,
  allEventPoints: CameraEventPoint[],
  handleRemoveEventPoint: (id: number) => void,
  handleRegisterPreloadedDelete: (point: CameraEventPoint) => void,
  handleConvertToLocal: (point: CameraEventPoint) => number,
) => {
  const deleteCallback = useDeleteCallback();
  const queryClient = useQueryClient();

  const handleDeleteEventPoint = async (id: number) => {
    const target = allEventPoints.find((ep) => ep.id === id);
    if (target?.entryIds?.length) {
      // Register in undo history BEFORE the async DELETE so the snapshot is captured
      // with the point as a local copy. Undo restores it; handleDone re-saves it via save2.
      handleRegisterPreloadedDelete(target);
      await deleteCallback(`tracker/${monitoringID}/bulk`, { ids: target.entryIds });
      queryClient.invalidateQueries({ queryKey: [`monitoring/${monitoringID}/load2`] });
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
      void deleteCallback(`tracker/${monitoringID}/bulk`, { ids: target.entryIds }).then(() => {
        queryClient.invalidateQueries({ queryKey: [`monitoring/${monitoringID}/load2`] });
      });
      return newId;
    }
    return target.id;
  };

  return { handleDeleteEventPoint, handleConvertEventPoint };
};
