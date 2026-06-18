import dayjs from "dayjs";
import { usePostQuery } from "./useApi";
import type { stateAssignments } from "../components/stateColors";
import utc from "dayjs/plugin/utc";
import { parseStatusName, type AssignmentItem, type AssignmentsResponse } from "./utils";

dayjs.extend(utc);

export type Assignment = {
  state: stateAssignments;
  statusName: string;
  statusID: number;
  location: number;
  store: number;
  userID: number;
  date: string;
  rawDate: string;
  comments: number;
  monitoringID: string;
  open: string | null;
  close: string | null;
  items: { activity: string; complement: string }[];
  commentsTex: string[];
};

const useAssignments = ({
  companyID,
  locationID,
}: {
  companyID: number | null;
  locationID?: number | null;
}) => {
  const body = {
    companyID: companyID ?? 0,
    ...(locationID ? { locationID } : {}),
  };

  const { data, isLoading, isPending, isError } = usePostQuery<
    AssignmentsResponse,
    typeof body
  >("location/assignments", body, {
    queryKey: ["location/assignments", companyID, locationID ?? null],
    enabled: companyID !== null,
  });

  const formatTime = (time: string | null) => (time ? time.slice(0, 5) : "-");

  const assignments = (data?.data ?? []).map((a) => ({
    state: parseStatusName(a.statusName),
    statusName: a.statusName,
    statusID: a.statusID,
    location: a.companyID,
    locationName: a.locationName,
    store: a.locationID,
    companyName: a.companyName,
    userID: a.userID,
    date: dayjs.utc(a.date).format("MMMM DD - YYYY"),
    rawDate: dayjs.utc(a.date).format("YYYYMMDD"),
    comments: a.details.comments ? 1 : 0,
    monitoringID: a.monitoringID,
    open: a.details.open,
    close: a.details.close,
    items: [
      { activity: "Date", complement: dayjs.utc(a.date).format("MMM DD, YYYY") },
      { activity: "Open", complement: formatTime(a.details.open) },
      { activity: "Close", complement: formatTime(a.details.close) },
      { activity: "DVR", complement: formatTime(a.details.dvr) },
      { activity: "Diff", complement: String(a.details.offsetDiff) },
      { activity: "Interval", complement: String(a.details.offsetInterval) },
    ],
    commentsTex: a.details.comments ? [a.details.comments] : [],
  }));

  return { assignments, isLoading, isPending, isError };
};

export default useAssignments;
