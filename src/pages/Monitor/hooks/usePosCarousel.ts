import { useState, useMemo, useEffect } from "react";
import { useCarousel } from "../../../hooks/useCarousel";
import { useSaveMonitoring } from "../../../components/timeline/hooks/useSaveMonitoring";
import type { SalesTransaction } from "./useSalesTransactions";

export type AttendedValue = "attended" | "unattended";

const toMarkerSec = (timestamp: string): number => {
  const [, time] = timestamp.split(" ");
  const [h, m, s] = (time ?? "00:00:00").split(":").map(Number);
  return h * 3600 + m * 60 + (s ?? 0);
};

export const usePosCarousel = (
  transactions: SalesTransaction[],
  setPosMarkerSec: (sec: number | null) => void,
  monitoringID: string,
) => {
  const [attended, setAttended] = useState<AttendedValue | null>(null);

  const toggleAttended = (value: AttendedValue) =>
    setAttended((prev) => (prev === value ? null : value));

  const { current, goTo, prev, next } = useCarousel(
    transactions.length,
    (index) => {
      const tx = transactions[index];
      if (tx) setPosMarkerSec(toMarkerSec(tx.timestamp));
    },
  );

  useEffect(() => {
    const tx = transactions[current];
    if (tx) setPosMarkerSec(toMarkerSec(tx.timestamp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  const currentTx = transactions[current];
  const currentCameraId = currentTx?.terminal.id ?? 0;
  const currentTimeSec = currentTx ? toMarkerSec(currentTx.timestamp) : 0;
  const carouselSessionDate = currentTx?.timestamp.split(" ")[0] ?? "";

  const carouselEventPoints = useMemo(() => {
    if (!currentTx) return [];
    return [
      {
        id: 8 * 10000 + currentTx.terminal.id,
        cameraId: currentTx.terminal.id,
        timeSec: currentTimeSec,
        startSec: currentTimeSec,
        endSec: currentTimeSec,
        label: "Pay Station Attendance",
        reviewed: false,
        value: false,
        mode: "POINT" as const,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTx]);

  const { handleDone } = useSaveMonitoring({
    trackers: [{ id: 8, name: "Pay Station Attendance", attended: attended === "attended" }],
    eventPoints: carouselEventPoints,
    sessionDate: carouselSessionDate,
    monitoringID,
  });

  return {
    current,
    goTo,
    prev,
    next,
    currentTx,
    currentCameraId,
    currentTimeSec,
    attended,
    toggleAttended,
    handleDone,
  };
}
