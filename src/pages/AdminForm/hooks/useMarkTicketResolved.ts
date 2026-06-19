import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "../../../hooks/useApi";
import type { TicketsResponse } from "../types";

export const useMarkTicketResolved = () => {
  const queryClient = useQueryClient();

  const { mutate, isPending, variables } = usePatch<unknown, number>(
    (ticketId) => `ticket/${ticketId}/status`,
    {
      invalidateKey: ["ticket"],
      getBody: () => ({ status: "resolved" }),
      onSuccess: (_, ticketId) => {
        queryClient.setQueryData<TicketsResponse>(["ticket"], (old) => {
          if (!old) return old;
          return {
            ...old,
            tickets: old.tickets.map((t) =>
              t.id === ticketId ? { ...t, status: "resolved" } : t,
            ),
          };
        });
        queryClient.invalidateQueries({ queryKey: ["location/assignment/count"] });
      },
    },
  );

  const markAsResolved = (id: number, onSuccess?: () => void) =>
    mutate(id, { onSuccess });

  const isTicketPending = (id: number) => isPending && variables === id;

  return { markAsResolved, isTicketPending };
};
