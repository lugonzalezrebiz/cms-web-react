import dayjs from "dayjs";
import { useGet, usePostQuery } from "./useApi";
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

interface LocationEntry {
  companyID: number;
  locationIDs: number[];
}

interface UserLocationResponse {
  success: boolean;
  userID: number;
  assignments: LocationEntry[];
}

export const userLocationQueryKey = (userID: number) => [`user/${userID}/location`];

const useUserAssignments = ({ userID }: { userID: number | null }) => {
  const enabled = userID !== null;

  const { data: locationData, isLoading: locationsLoading, isError: locationsError } =
    useGet<UserLocationResponse>(
      `user/${userID ?? 0}/location`,
      undefined,
      { enabled },
    );

  const { data: assignmentsData, isLoading: assignmentsLoading, isError: assignmentsError } =
    usePostQuery<AssignmentsResponse, { userID: number }>(
      "location/assignments",
      { userID: userID ?? 0 },
      { queryKey: ["location/assignments", "user", userID], enabled },
    );

  const detailsMap = (assignmentsData?.data ?? []).reduce<Record<string, AssignmentDetail[]>>(
    (acc, a) => {
      const key = `${a.companyID}-${a.locationID}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        date: dayjs.utc(a.date).format("MMMM DD - YYYY"),
        state: parseStatusName(a.statusName),
      });
      return acc;
    },
    {},
  );

  const companyNameMap = (assignmentsData?.data ?? []).reduce<Record<number, string | null>>(
    (acc, a) => {
      if (!(a.companyID in acc)) acc[a.companyID] = a.companyName;
      return acc;
    },
    {},
  );

  const locationNameMap = (assignmentsData?.data ?? []).reduce<Record<string, string | null>>(
    (acc, a) => {
      const key = `${a.companyID}-${a.locationID}`;
      if (!(key in acc)) acc[key] = a.locationName;
      return acc;
    },
    {},
  );

  const groupedList: GroupedAssignment[] = (locationData?.assignments ?? []).flatMap(
    ({ companyID, locationIDs }) =>
      locationIDs.map((locationID) => {
        const key = `${companyID}-${locationID}`;
        const companyName = companyNameMap[companyID] ?? null;
        const locationName = locationNameMap[key] ?? null;
        return {
          companyDisplay: companyName ? `${companyName} (${companyID})` : String(companyID),
          locationDisplay: locationName ? `${locationName} (${locationID})` : String(locationID),
          companyID,
          locationID,
          details: detailsMap[key] ?? [],
        };
      }),
  );

  return {
    groupedList,
    isLoading: locationsLoading || assignmentsLoading,
    isPending: locationsLoading || assignmentsLoading,
    isError: locationsError || assignmentsError,
  };
};

export default useUserAssignments;
