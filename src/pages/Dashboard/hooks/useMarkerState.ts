import { useState } from "react";

export function useMarkerState(selectedTab: string, markerSec: number) {
  const [timestamp, setTimestamp] = useState("");
  const [posMarkerSec, setPosMarkerSec] = useState<number | null>(null);
  const activeMarkerSec = selectedTab === "2" ? (posMarkerSec ?? markerSec) : markerSec;
  return { timestamp, setTimestamp, posMarkerSec, setPosMarkerSec, activeMarkerSec };
}
