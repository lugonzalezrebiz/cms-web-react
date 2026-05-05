import { useCallback } from "react";
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
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

export const usePostQuery = <TData = unknown, TBody = unknown>(
  url: string,
  body: TBody,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'> & {
    queryKey?: unknown[];
    requestConfig?: RequestConfig;
  }
) => {
  const { token } = useAuth();
  return useQuery<TData>({
    queryKey: options?.queryKey ?? [url, body],
    queryFn: async () => {
      const res = await apiClient.post<TData>(url, body, {
        ...(options?.requestConfig || {}),
        headers: {
          ...(options?.requestConfig?.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return res.data;
    },
    ...options,
  });
};

export const usePostQueries = <TData = unknown, TBody = unknown, TCombined = UseQueryResult<TData, Error>[]>(
  url: string,
  bodies: TBody[],
  options: {
    queryKey?: (body: TBody, index: number) => unknown[];
    requestConfig?: RequestConfig;
    staleTime?: number;
    enabled?: boolean;
    combine?: (results: UseQueryResult<TData, Error>[]) => TCombined;
  } = {}
) => {
  const { token } = useAuth();
  return useQueries({
    queries: bodies.map((body, i) => ({
      queryKey: options.queryKey ? options.queryKey(body, i) : [url, body],
      queryFn: async (): Promise<TData> => {
        const res = await apiClient.post<TData>(url, body, {
          ...(options.requestConfig || {}),
          headers: {
            ...(options.requestConfig?.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        return res.data;
      },
      enabled: options.enabled ?? true,
      staleTime: options.staleTime,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    combine: options.combine as any,
  }) as TCombined;
};

export const useGetCallback = <T = unknown>() => {
  const { token } = useAuth();
  return useCallback(
    (url: string, config?: RequestConfig): Promise<T> =>
      apiClient
        .get<T>(url, {
          ...config,
          headers: {
            ...(config?.headers || {}),
            Authorization: token ? `Bearer ${token}` : "",
          },
        })
        .then((res) => res.data),
    [token],
  );
};

export const usePostCallback = <T = unknown>(options?: { invalidateKey?: string[] }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useCallback(
    async (url: string, body?: unknown, config?: RequestConfig): Promise<T> => {
      const data = await apiClient
        .post<T>(url, body, {
          ...config,
          headers: {
            ...(config?.headers || {}),
            Authorization: token ? `Bearer ${token}` : "",
          },
        })
        .then((res) => res.data);
      if (options?.invalidateKey) {
        queryClient.invalidateQueries({ queryKey: options.invalidateKey });
      }
      return data;
    },
    [token, queryClient, options?.invalidateKey],
  );
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
