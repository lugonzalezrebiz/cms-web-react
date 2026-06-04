import dayjs from "dayjs";
import { usePostQuery } from "./useApi";
import type { stateAssignments } from "../pages/Assignments/components/stateColors";
import utc from "dayjs/plugin/utc";

export interface AssignmentDetail {
  date: string;
  state: stateAssignments;
}

export interface GroupedAssignment {
  companyDisplay: string;
  locationDisplay: string;
  companyID: number;
  locationID: number;
  details: AssignmentDetail[];
}

dayjs.extend(utc);

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
  locationName: string | null;
  companyID: number;
  companyName: string | null;
  statusID: number;
  statusName: string;
  details: AssignmentDetails;
}

interface AssignmentsResponse {
  success: boolean;
  data: AssignmentItem[];
}

const useUserAssignments = ({ userID }: { userID: number | null }) => {
  const { data, isLoading, isPending, isError } = usePostQuery<
    AssignmentsResponse,
    { userID: number }
  >("location/assignments", { userID: userID ?? 0 }, {
    queryKey: ["location/assignments", "user", userID],
    enabled: userID !== null,
  });

  const grouped = (data?.data ?? []).reduce<Record<string, GroupedAssignment>>(
    (acc, a) => {
      const key = `${a.companyID}-${a.locationID}`;
      if (!acc[key]) {
        acc[key] = {
          companyDisplay: a.companyName
            ? `${a.companyName} (${a.companyID})`
            : String(a.companyID),
          locationDisplay: a.locationName
            ? `${a.locationName} (${a.locationID})`
            : String(a.locationID),
          companyID: a.companyID,
          locationID: a.locationID,
          details: [],
        };
      }
      acc[key].details.push({
        date: dayjs.utc(a.date).format("MMMM DD - YYYY"),
        state: parseStatusName(a.statusName),
      });
      return acc;
    },
    {},
  );

  const groupedList = Object.values(grouped);

  return { groupedList, isLoading, isPending, isError };
};

export default useUserAssignments;
