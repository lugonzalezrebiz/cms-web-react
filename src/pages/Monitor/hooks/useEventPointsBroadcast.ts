import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const useEventPointsBroadcast = (monitoringID: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = new BroadcastChannel("event-points-sync");
    channel.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "mutated" && e.data?.monitoringID === monitoringID) {
        void queryClient.invalidateQueries({
          queryKey: [`monitoring/${monitoringID}/load2`],
        });
      }
    });
    return () => channel.close();
  }, [monitoringID, queryClient]);

  const broadcastMutation = useCallback(() => {
    const channel = new BroadcastChannel("event-points-sync");
    channel.postMessage({ type: "mutated", monitoringID });
    channel.close();
  }, [monitoringID]);

  return { broadcastMutation };
};
