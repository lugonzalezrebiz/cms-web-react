import useNavigateWithQuery from "./useNavigate";
import { usePostCallback } from "./useApi";

const useStartReview = () => {
  const navigate = useNavigateWithQuery();
  const postCallback = usePostCallback();

  return async (redirectUrl: string, monitoringID: string) => {
    await postCallback(`/monitoring/${monitoringID}/review/start`);
    navigate(redirectUrl);
  };
};

export default useStartReview;
