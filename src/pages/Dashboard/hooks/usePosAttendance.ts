import { useState, useMemo } from "react";
import { useSaveMonitoring } from "../../../components/timeline/hooks/useSaveMonitoring";
import type { SalesTransaction } from "./useSalesTransactions";

export type AttendedValue = "attended" | "unattended";

export function usePosAttendance() {
  const [attended, setAttended] = useState<AttendedValue | null>(null);
  const [currentTx, setCurrentTx] = useState<SalesTransaction | undefined>(undefined);

  const toggleAttended = (value: AttendedValue) =>
    setAttended((prev) => (prev === value ? null : value));

  const toMarkerSec = (tx: SalesTransaction) => {
    const [, time] = tx.timestamp.split(" ");
    const [h, m, s] = (time ?? "00:00:00").split(":").map(Number);
    return h * 3600 + m * 60 + (s ?? 0);
  };

  const sessionDate = currentTx?.timestamp.split(" ")[0] ?? "";

  const posAttendanceEventPoints = useMemo(() => {
    if (!currentTx) return [];
    const timeSec = toMarkerSec(currentTx);
    return [
      {
        id: 8 * 10000 + currentTx.terminal.id,
        cameraId: currentTx.terminal.id,
        timeSec,
        startSec: timeSec,
        endSec: timeSec,
        label: "Pay Station Attendance",
      },
    ];
  }, [currentTx]);

  const { handleDone } = useSaveMonitoring({
    trackers: [
      {
        id: 8,
        name: "Pay Station Attendance",
        attended: attended === "attended",
      },
    ],
    eventPoints: posAttendanceEventPoints,
    sessionDate,
  });

  return { attended, currentTx, setCurrentTx, toggleAttended, toMarkerSec, handleDone };
}
