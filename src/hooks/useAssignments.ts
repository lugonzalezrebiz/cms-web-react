import dayjs from "dayjs";
import { usePostQuery } from "./useApi";

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
    state: "New" as const,
    location: a.companyID,
    store: a.locationID,
    date: dayjs(a.date).format("MMMM DD - YYYY"),
    comments: a.details.comments ? 1 : 0,
    monitoringID: a.monitoringID,
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
