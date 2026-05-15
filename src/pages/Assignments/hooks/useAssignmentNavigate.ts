import useNavigateWithQuery from "../../../hooks/useNavigate";
import { usePostCallback } from "../../../hooks/useApi";
import { USE_STATIC_IDS, MONITORING_ID, ASSIGNMENT_COMPLETED } from "../../../config";
import type { stateAssignments } from "../../Assignments/components/stateColors";

const STATIC_REDIRECT = `/monitor?company=9001&location=222&date=20251224&monitoringID=${MONITORING_ID}`;

const buildRedirect = (
  companyID: number,
  locationID: number,
  rawDate: string,
  monitoringID: string,
) =>
  `/monitor?company=${companyID}&location=${locationID}&date=${rawDate}&monitoringID=${monitoringID}`;

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

export const useAssignmentNavigate = () => {
  const navigate = useNavigateWithQuery();
  const postCallback = usePostCallback();

  const handleNavigate = async (a: NavigationAssignment) => {
    const url = USE_STATIC_IDS
      ? STATIC_REDIRECT
      : buildRedirect(a.location, a.store, a.rawDate, a.monitoringID);
    if (a.statusName === "resource.review.ready") {
      await postCallback(`monitoring/${a.monitoringID}/review/start`);
    } else if (a.statusName === "resource.review.completed" && ASSIGNMENT_COMPLETED === true) {
      return
    }
    navigate(url, USE_STATIC_IDS ? {} : { state: { assignment: a } });
  };

  return { handleNavigate };
};
