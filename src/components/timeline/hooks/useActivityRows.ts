import { useMemo } from "react";
import type { CameraEventPoint, FlatRow } from "../types";

interface UseActivityRowsParams {
  menuItems: { id: number; name: string }[];
  cameraEventPoints: CameraEventPoint[];
  rangeSessions?: Record<number, { type: "in" | "out"; timestamp: string }[]>;
}

export function useActivityRows({ menuItems, rangeSessions }: UseActivityRowsParams) {
  const flatRows = useMemo(
    (): FlatRow[] =>
      menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        kind: "activity" as const,
        cameraNumber: 0,
        sessions: rangeSessions?.[item.id] ?? [],
      })),
    [menuItems, rangeSessions],
  );

  return { flatRows, selectableRows: flatRows };
}
