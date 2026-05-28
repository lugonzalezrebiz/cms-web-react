import { Colors } from "../theme";

export type stateAssignments =
  | "Ready"
  | "Assigned"
  | "Started"
  | "Paused"
  | "Resumed"
  | "Completed"
  | "Error"
  | "Reported"
  | "Open Ticket";

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
  "Open Ticket": { border: Colors.royalBlue, bg: Colors.royalBlue, color: Colors.white },
  Error: { border: Colors.blushRed, bg: Colors.palePink, color: Colors.blushRed },
};
