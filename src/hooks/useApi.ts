import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import useAuth from "./useAuth";
import { apiClient, type RequestConfig } from "../config/apiClient";

export const useGet = <T>(
  url: string,
  config?: RequestConfig,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) => {
  const { token } = useAuth();
  return useQuery<T>({
    queryKey: [url],
    queryFn: async () => {
      const res = await apiClient.get<T>(url, {
        ...config,
        headers: {
          ...(config?.headers || {}),
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      return res.data;
    },
    ...options,
  });
};

export const usePost = <TData = unknown, TVariables = unknown>(
  url: string,
  options?: UseMutationOptions<TData, Error, TVariables> & {
    invalidateKey?: string[];
    requestConfig?: RequestConfig;
  }
) => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (data: TVariables) => {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await apiClient.post<TData>(url, data, {
        ...(options?.requestConfig || {}),
        headers: {
          ...(options?.requestConfig?.headers || {}),
          ...(headers || {}),
        },
      });
      return res.data;
    },
    onSuccess: (data, variables, context, meta) => {
      if (options?.invalidateKey) {
        queryClient.invalidateQueries({ queryKey: options.invalidateKey });
      }
      options?.onSuccess?.(data, variables, context, meta);
    },
    ...options,
  });
};
