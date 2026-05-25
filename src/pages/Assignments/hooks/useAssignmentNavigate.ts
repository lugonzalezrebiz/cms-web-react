import { useRef } from "react";
import { useNavigatePlain } from "../../../hooks/useNavigate";
import { usePostCallback } from "../../../hooks/useApi";
import { USE_STATIC_IDS, MONITORING_ID, ASSIGNMENT_COMPLETED } from "../../../config";
import type { Assignment } from "../../../hooks/useAssignments";

export type { Assignment as NavigationAssignment };

const STATIC_REDIRECT = `/monitor?company=9001&location=222&date=20251224&monitoringID=${MONITORING_ID}`;

const buildRedirect = (
  companyID: number,
  locationID: number,
  rawDate: string,
  monitoringID: string,
) =>
  `/monitor?company=${companyID}&location=${locationID}&date=${rawDate}&monitoringID=${monitoringID}`;

export const useAssignmentNavigate = () => {
  const navigate = useNavigatePlain();
  const postCallback = usePostCallback();
  const navigating = useRef(false);

  const handleNavigate = async (a: Assignment) => {
    if (navigating.current) return;
    navigating.current = true;
    try {
      const url = USE_STATIC_IDS
        ? STATIC_REDIRECT
        : buildRedirect(a.location, a.store, a.rawDate, a.monitoringID);
      if (a.statusName === "resource.review.ready") {
        await postCallback(`monitoring/${a.monitoringID}/review/start`);
      } else if (a.statusName === "resource.review.completed" && ASSIGNMENT_COMPLETED === true) {
        return;
      }
      navigate(url, USE_STATIC_IDS ? {} : { state: { assignment: a } });
    } finally {
      navigating.current = false;
    }
  };

  return { handleNavigate };
};
