import { usePatch } from "../../../hooks/useApi";

export const useMarkTicketResolved = () => {
  const { mutate: markAsResolved, isPending } = usePatch<unknown, number>(
    (ticketId) => `ticket/${ticketId}/status`,
    {
      invalidateKey: ["ticket"],
      getBody: () => ({ status: "resolved" }),
    }
  );
  return { markAsResolved, isPending };
};
