import { useMemo } from "react";
import type { CameraEventPoint, FlatRow } from "../types";

interface UseActivityRowsParams {
  menuItems: { id: number; name: string }[];
  cameraEventPoints: CameraEventPoint[];
}

export function useActivityRows({ menuItems }: UseActivityRowsParams) {
  const flatRows = useMemo(
    (): FlatRow[] =>
      menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        kind: "activity" as const,
        cameraNumber: 0,
        sessions: [],
      })),
    [menuItems],
  );

  return { flatRows, selectableRows: flatRows };
}
