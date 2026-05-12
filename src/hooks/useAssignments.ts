import dayjs from "dayjs";
import { usePostQuery } from "./useApi";
import type { stateAssignments } from "../pages/Assignments/components/stateColors";

const VALID_STATES: stateAssignments[] = [
  "Ready", "Assigned", "Started", "Paused", "Resumed", "Completed", "Error", "Reported",
];

const parseStatusName = (statusName: string): stateAssignments => {
  const last = statusName.split(".").pop() ?? "";
  const capitalized = (last.charAt(0).toUpperCase() + last.slice(1)) as stateAssignments;
  return VALID_STATES.includes(capitalized) ? capitalized : "Ready";
};

interface AssignmentDetails {
  open: string | null;
  close: string | null;
  dvr: string | null;
  offsetDiff: number;
  offsetInterval: number;
  comments: string | null;
}

interface AssignmentItem {
  assignmentID: string;
  monitoringID: string;
  userID: number;
  date: string;
  locationID: number;
  locationName: string;
  companyID: number;
  companyName: string;
  statusID: number;
  statusName: string;
  details: AssignmentDetails;
}

interface AssignmentsResponse {
  success: boolean;
  data: AssignmentItem[];
}

interface AssignmentsPayload {
  companyID: number;
  locationID?: number;
}

const useAssignments = (companyID: number | null, locationID?: number | null) => {
  const body: AssignmentsPayload = { companyID: companyID ?? 0 };
  if (locationID) body.locationID = locationID;

  const { data, isLoading, isError } = usePostQuery<AssignmentsResponse, AssignmentsPayload>(
    "location/assignments",
    body,
    {
      queryKey: ["location/assignments", companyID, locationID ?? null],
      enabled: companyID !== null,
    }
  );

  const formatTime = (time: string | null) => (time ? time.slice(0, 5) : "-");

  const assignments = (data?.data ?? []).map((a) => ({
    state: parseStatusName(a.statusName),
    statusName: a.statusName,
    location: a.companyID,
    store: a.locationID,
    userID: a.userID,
    date: dayjs(a.date).format("MMMM DD - YYYY"),
    rawDate: dayjs(a.date).format("YYYYMMDD"),
    comments: a.details.comments ? 1 : 0,
    monitoringID: a.monitoringID,
    open: a.details.open,
    close: a.details.close,
    items: [
      { activity: "Date", complement: dayjs(a.date).format("MMM DD, YYYY") },
      { activity: "Open", complement: formatTime(a.details.open) },
      { activity: "Close", complement: formatTime(a.details.close) },
      { activity: "DVR", complement: formatTime(a.details.dvr) },
      { activity: "Diff", complement: String(a.details.offsetDiff) },
      { activity: "Interval", complement: String(a.details.offsetInterval) },
    ],
    commentsTex: a.details.comments ? [a.details.comments] : [],
  }));

  return { assignments, isLoading, isError };
};

export default useAssignments;
