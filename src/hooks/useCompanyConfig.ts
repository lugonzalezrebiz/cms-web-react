import { useSearchParams } from "react-router-dom";
import { useGet } from "./useApi";

interface CompanyConfigItem {
  id: number;
  locationID: number | null;
  name: string;
  value: unknown;
}

interface CompanyConfigResponse {
  success: boolean;
  message: string;
  config: CompanyConfigItem[];
}

const DEFAULT_IMAGES_INTERVAL_SEC = 5;

const useCompanyConfig = () => {
  const [searchParams] = useSearchParams();
  const companyID = Number(searchParams.get("company") ?? 0);

  const { data, isLoading } = useGet<CompanyConfigResponse>(
    `company/${companyID}/config`,
    undefined,
    {
      enabled: !!companyID,
    },
  );

  const config = data?.success ? (data.config ?? []) : [];

  const imagesIntervalItem = config.find((item) => item.name === "images.interval");
  const imagesInterval = imagesIntervalItem
    ? Number(imagesIntervalItem.value)
    : DEFAULT_IMAGES_INTERVAL_SEC;

  return { config, imagesInterval, isLoading };
};

export default useCompanyConfig;
