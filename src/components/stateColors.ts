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
  | "Open"
  | "Resolved"
  | "Other"
  | "Closed"
  | "Pending_Reporter"
  | "Pending_Support"
  ;

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
  Open: { border: Colors.royalBlue, bg: Colors.lightSkyBlue, color: Colors.royalBlue },
  Other: { border: Colors.royalBlue, bg: Colors.lightSkyBlue, color: Colors.royalBlue },
  Resolved: { border: Colors.leafGreen, bg: Colors.mintFoam, color: Colors.leafGreen },
  Error: { border: Colors.blushRed, bg: Colors.palePink, color: Colors.blushRed },
  Closed: { border: Colors.blushRed, bg: Colors.palePink, color: Colors.blushRed },
  Pending_Reporter: { border: Colors.goldenAmber, bg: Colors.creamYellow, color: Colors.goldenAmber },
  Pending_Support: { border: Colors.goldenAmber, bg: Colors.creamYellow, color: Colors.goldenAmber },
};

export type ticketState = "Open" | "Resolved" | "Other" | "Closed" | "Pending_Reporter" | "Pending_Support";

export function normalizeTicketState(status: string): ticketState {
  const lower = status.toLowerCase();
  if (lower === "open") return "Open";
  if (lower === "resolved") return "Resolved";
  if (lower === "closed") return "Closed";
  if (lower === "pending_reporter") return "Pending_Reporter";
  if (lower === "pending_support") return "Pending_Support";
  return "Other";
}
