import { useGet } from "../../../hooks/useApi";
import { type User, type UsersResponse } from "../types";

export type { User };

const useUsers = () => {
  const { data, isLoading, isError } = useGet<UsersResponse>("user");
  return {
    users: data?.users ?? [],
    isLoading,
    isError,
  };
};

export default useUsers;
