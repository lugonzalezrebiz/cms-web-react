import type { stateAssignments } from "../components/stateColors";

export const VALID_STATES: stateAssignments[] = [
  "Ready", "Assigned", "Started", "Paused", "Resumed", "Completed", "Error", "Reported",
];

export const parseStatusName = (statusName: string): stateAssignments => {
  const last = statusName.split(".").pop() ?? "";
  const capitalized = (last.charAt(0).toUpperCase() + last.slice(1)) as stateAssignments;
  return VALID_STATES.includes(capitalized) ? capitalized : "Ready";
};

export interface AssignmentDetails {
  open: string | null;
  close: string | null;
  dvr: string | null;
  offsetDiff: number;
  offsetInterval: number;
  comments: string | null;
}

export interface AssignmentItem {
  assignmentID: string;
  monitoringID: string;
  userID: number;
  date: string;
  locationID: number;
  locationName: string | null;
  companyID: number;
  companyName: string | null;
  statusID: number;
  statusName: string;
  details: AssignmentDetails;
}

export interface AssignmentsResponse {
  success: boolean;
  data: AssignmentItem[];
}
