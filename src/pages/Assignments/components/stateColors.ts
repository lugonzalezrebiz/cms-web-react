import { Colors } from "../../../theme";
import { type stateAssignments } from "../types";

export const stateColors: Record<
  stateAssignments,
  { border: string; bg: string; color: string }
> = {
  Ready: { border: Colors.leafGreen, bg: Colors.mintFoam, color: Colors.leafGreen },
  Completed: { border: Colors.leafGreen, bg: Colors.mintFoam, color: Colors.leafGreen },
  Paused: { border: Colors.goldenAmber, bg: Colors.creamYellow, color: Colors.goldenAmber },
  Started: { border: Colors.goldenAmber, bg: Colors.creamYellow, color: Colors.goldenAmber },
  Resumed: { border: Colors.goldenAmber, bg: Colors.creamYellow, color: Colors.goldenAmber },
  Assigned: { border: Colors.royalBlue, bg: Colors.lightSkyBlue, color: Colors.royalBlue },
  Reported: { border: Colors.royalBlue, bg: Colors.lightSkyBlue, color: Colors.royalBlue },
  Error: { border: Colors.blushRed, bg: Colors.palePink, color: Colors.blushRed },
};
