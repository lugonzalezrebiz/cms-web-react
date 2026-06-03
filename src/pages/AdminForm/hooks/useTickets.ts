import { useGet } from "../../../hooks/useApi";
import type { TicketsResponse } from "../types";

export const useTickets = () => {
  const { data, isLoading, isError } = useGet<TicketsResponse>("ticket");
  return {
    tickets: data?.tickets ?? [],
    isLoading,
    isError,
  };
};
