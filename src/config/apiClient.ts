import axios from "axios";
import type { RawAxiosRequestConfig } from "axios";
import { URL_API } from "./"

export const apiClient = axios.create({
  baseURL: URL_API,
});

export type RequestConfig = RawAxiosRequestConfig