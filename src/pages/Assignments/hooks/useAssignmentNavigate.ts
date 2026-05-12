import useNavigateWithQuery from "../../../hooks/useNavigate";
import { usePostCallback } from "../../../hooks/useApi";
import { USE_STATIC_IDS, MONITORING_ID } from "../../../config";

const STATIC_REDIRECT = `/monitor?company=9001&location=222&date=20260407&monitoringID=${MONITORING_ID}`;

const buildRedirect = (
  companyID: number,
  locationID: number,
  rawDate: string,
  monitoringID: string,
) =>
  `/monitor?company=${companyID}&location=${locationID}&date=${rawDate}&monitoringID=${monitoringID}`;

export const useAssignmentNavigate = () => {
  const navigate = useNavigateWithQuery();
  const postCallback = usePostCallback();

  const handleNavigate = async (a: {
    location: number;
    store: number;
    rawDate: string;
    monitoringID: string;
    statusName: string;
  }) => {
    const url = USE_STATIC_IDS
      ? STATIC_REDIRECT
      : buildRedirect(a.location, a.store, a.rawDate, a.monitoringID);
     if (a.statusName === "resource.review.ready") {
       await postCallback(`monitoring/${a.monitoringID}/review/start`);
     }
    navigate(url);
  };

  return { handleNavigate };
};
