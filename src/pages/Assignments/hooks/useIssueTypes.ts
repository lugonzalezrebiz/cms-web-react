import { useGet } from "../../../hooks/useApi";

interface IssueType {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

interface IssueTypesResponse {
  success: boolean;
  issueTypes: IssueType[];
}

const useIssueTypes = () => {
  const { data, isLoading, isError } = useGet<IssueTypesResponse>(
    `ticket/issue-type`,
    { params: { active: true } },
  );

  const options =
    data?.issueTypes.map((t) => ({
      label: t.name,
      value: String(t.id),
      group: t.description,
    })) ?? [];

  return { options, isLoading, isError };
};

export default useIssueTypes;
