import { useMemo } from "react";
import type { TimelineSnapshot, CameraEventPoint } from "../../../components/timeline/types";
import type { SalesTransaction } from "./useSalesTransactions";

export const usePosData = (
  transactions: SalesTransaction[],
  snapshot: TimelineSnapshot,
) => {
  const posSnapshot = useMemo(() => {
    const seen = new Set<number>();
    const tracks = transactions
      .filter((tx) => {
        if (seen.has(tx.terminal.id)) return false;
        seen.add(tx.terminal.id);
        return true;
      })
      .map((tx) => ({
        id: tx.terminal.id,
        name: tx.terminal.code,
        category: "employees" as const,
        sessions: [] as { type: "in" | "out"; timestamp: string }[],
      }));
    return { ...snapshot, timeline: { ...snapshot.timeline, tracks } };
  }, [transactions, snapshot]);

  const posEventPoints = useMemo((): CameraEventPoint[] =>
    transactions.map((tx, i) => {
      const [, time] = tx.timestamp.split(" ");
      const [h, m, s] = (time ?? "00:00:00").split(":").map(Number);
      const timeSec = h * 3600 + m * 60 + (s ?? 0);
      return {
        id: 90000 + i,
        cameraId: tx.terminal.id,
        timeSec,
        startSec: Math.max(0, timeSec - 120),
        endSec: timeSec + 120,
        label: tx.zone.name,
        reviewed: false,
        value: false,
        mode: "POINT" as const,
      };
    }),
  [transactions]);

  return { posSnapshot, posEventPoints };
}
