import dayjs from "dayjs";
import { useGet } from "./useApi";
import type { Notification } from "../components/NotificationMenu";

interface ApiNotification {
  id: number;
  type: "USER" | "GENERAL";
  date: string;
  message: string;
  meta: Record<string, unknown>;
  read?: boolean;
  sender?: number;
  active?: boolean;
}

interface NotificationsResponse {
  success: boolean;
  notifications: ApiNotification[];
}

function timeAgo(dateStr: string): string {
  const now = dayjs();
  const then = dayjs(dateStr);
  const mins = now.diff(then, "minute");
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = now.diff(then, "hour");
  if (hours < 24) return `${hours}h ago`;
  const days = now.diff(then, "day");
  if (days < 7) return `${days}d ago`;
  return then.format("MMM D, YYYY");
}

export const useNotifications=()=> {
  const { data, isPending, error } = useGet<NotificationsResponse>(
    "notification/all",
    undefined,
    { staleTime: 60_000 },
  );

  const notifications: Notification[] = (
    data?.success ? data.notifications : []
  ).map((n) => ({
    id: n.id,
    title: n.message,
    date: dayjs(n.date).format("MMMM D - YYYY"),
    unread: n.type === "GENERAL" ? false : !(n.read ?? false),
    timeAgo: timeAgo(n.date),
    // location: undefined,
    // store: undefined,
  }));

  return { notifications, isPending, error };
}
