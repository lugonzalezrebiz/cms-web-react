import { usePostQuery } from "../../../hooks/useApi";
import type { AssignmentCountResponse } from "../types";

const CARD_TYPES = [
  { type: "assigned", title: "Assignments" },
  { type: "started", title: "Started Assignments" },
  { type: "paused", title: "Paused Assignments" },
  { type: "completed-this-month", title: "Completed This Month" },
  { type: "ticket-open", title: "Tickets" },
] as const;

export const useAssignmentCount = () => {
  const { data, isLoading, isError } = usePostQuery<AssignmentCountResponse>(
    "location/assignment/count",
    {},
    { queryKey: ["location/assignment/count"] }
  );

  const countByType = Object.fromEntries(
    (data?.data ?? []).map(({ type, count }) => [type, count])
  );

  const cards = CARD_TYPES.map(({ type, title }) => ({
    title,
    current: countByType[type] ?? 0,
  }));

  return { cards, isLoading, isError };
};
