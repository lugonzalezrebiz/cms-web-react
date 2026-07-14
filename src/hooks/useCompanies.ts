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

const MAX_NAME_LENGTH = 12;

const formatLabel = (name: string, id: number) => {
  const truncatedName =
    name.length > MAX_NAME_LENGTH ? `${name.slice(0, MAX_NAME_LENGTH)}...` : name;
  return `${truncatedName}(${id})`;
};

const useCompanies = () => {
  const { data, isLoading, isError } = useGet<CompaniesResponse>("company/all");

  const companies = data?.companies ?? [];

  const companyFilters = [
    { label: "All companies", value: "" },
    ...companies.map((c) => ({ label: formatLabel(c.name, c.id), value: String(c.id) })),
  ];

  const getStoreFilters = (companyId: string) => {
    const selected = companies.find((c) => String(c.id) === companyId);
    return [
      { label: "All Stores", value: "" },
      ...(selected?.locations ?? []).map((l) => ({ label: formatLabel(l.name, l.id), value: String(l.id) })),
    ];
  };

  return { companyFilters, getStoreFilters, isLoading, isError };
};

export default useCompanies;
