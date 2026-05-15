export type stateAssignments =
  | "Ready"
  | "Assigned"
  | "Started"
  | "Paused"
  | "Resumed"
  | "Completed"
  | "Error"
  | "Reported";

export type Assignment = {
  state: stateAssignments;
  location: number;
  store: number;
  date: string;
  comments: number;
  items: { activity: string; complement: string }[];
  commentsTex: string[];
};

export type NavigationAssignment = {
  location: number;
  store: number;
  rawDate: string;
  monitoringID: string;
  statusName: string;
  state: stateAssignments;
  date: string;
  userID: number;
  open: string | null;
  close: string | null;
  items: { activity: string; complement: string }[];
  commentsTex: string[];
};
