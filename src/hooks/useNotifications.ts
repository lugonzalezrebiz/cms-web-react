import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useEffect, useRef } from "react";
import { useGet, usePostCallback } from "./useApi";
import type { Notification } from "../components/NotificationMenu";
import { formatEnumLabel } from "../utils/format";

dayjs.extend(utc);

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

function formatNotificationTitle(n: ApiNotification): string {
  if (n.meta?.type === "incident_logged") {
    const { userName, incidentType, incidentReason, severity } = n.meta as {
      userName?: string;
      incidentType?: string;
      incidentReason?: string;
      severity?: string;
    };
    if (userName && incidentType && incidentReason && severity) {
      return `Incident ${formatEnumLabel(incidentType)} (${formatEnumLabel(
        incidentReason,
      )}) logged for ${userName}, severity ${formatEnumLabel(severity)}.`;
    }
  }
  return n.message;
}

function timeAgo(dateStr: string): string {
  const now = dayjs();
  const then = dayjs.utc(dateStr);
  const mins = now.diff(then, "minute");
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = now.diff(then, "hour");
  if (hours < 24) return `${hours}h ago`;
  const days = now.diff(then, "day");
  if (days < 7) return `${days}d ago`;
  return then.format("MMM D, YYYY");
}

export const useNotifications = (open: boolean) => {
  const { data, isPending, error } = useGet<NotificationsResponse>(
    "notification/all",
    undefined,
    { staleTime: 60_000 },
  );

  const notifications: Notification[] = (
    data?.success ? data.notifications : []
  ).map((n) => ({
    id: n.id,
    title: formatNotificationTitle(n),
    date: dayjs.utc(n.date).format("MMMM D - YYYY"),
    unread: n.type === "GENERAL" ? false : !(n.read ?? false),
    timeAgo: timeAgo(n.date),
    meta: n.meta,
    // location: undefined,
    // store: undefined,
  }));

  const post = usePostCallback({ invalidateKey: ["notification/all"] });
  const notificationsRef = useRef(notifications);

  useEffect(() => {
    notificationsRef.current = notifications;
  });

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      notificationsRef.current
        .filter((n) => n.unread)
        .forEach(({ id }) => {
          post(`notification/${id}/read`).catch(() => {});
        });
    }, 5_000);
    return () => clearTimeout(timer);
  }, [open, post]);

  const markAsRead = (id: number) => {
    post(`notification/${id}/read`).catch(() => {});
  };

  return { notifications, isPending, error, markAsRead };
};
