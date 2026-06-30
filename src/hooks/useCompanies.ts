import { useGet } from "./useApi";

interface Location {
  id: number;
  name: string;
}

export interface Company {
  id: number;
  name: string;
  locations: Location[];
}

interface CompaniesResponse {
  companies: Company[];
}

const useCompanies = () => {
  const { data, isLoading, isError } = useGet<CompaniesResponse>("company/all");

  const companies = data?.companies ?? [];

  const companyFilters = companies.map((c) => ({ label: `${c.name}(${c.id})`, value: String(c.id) }));

  const getStoreFilters = (companyId: string) => {
    const selected = companies.find((c) => String(c.id) === companyId);
    return [
      { label: "All Stores", value: "" },
      ...(selected?.locations ?? []).map((l) => ({ label: `${l.name}(${l.id})`, value: String(l.id) })),
    ];
  };

  return { companyFilters, getStoreFilters, isLoading, isError };
};

export default useCompanies;
