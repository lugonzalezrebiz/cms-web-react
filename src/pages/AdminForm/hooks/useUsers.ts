import { REVIEWER_ROLE } from "../../../config";
import { useGet } from "../../../hooks/useApi";
import { type User, type UsersResponse } from "../types";

export type { User };

export const usersQueryKey = [`user?roleID=${REVIEWER_ROLE}`];

const useUsers = () => {
  const { data, isLoading, isError } = useGet<UsersResponse>(`user?roleID=${REVIEWER_ROLE}`);
  return {
    users: data?.users ?? [],
    isLoading,
    isError,
  };
};

export default useUsers;
