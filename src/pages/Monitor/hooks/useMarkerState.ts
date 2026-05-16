import { useState } from "react";

export const useMarkerState = () => {
  const [timestamp, setTimestamp] = useState("");
  return { timestamp, setTimestamp };
}
