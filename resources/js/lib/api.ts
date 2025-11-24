import axios, { type AxiosRequestHeaders } from "axios";
import { toast } from "sonner";

const baseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

const api = axios.create({
  baseURL: baseURL || undefined,
  withCredentials: true,
});

let isTokenExpiredHandled = false;

const handleTokenExpired = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (!isTokenExpiredHandled) {
    isTokenExpiredHandled = true;
    toast.error("Sesi berakhir, silakan login ulang.");
  }

  localStorage.removeItem("token");
  sessionStorage.removeItem("user");

  window.dispatchEvent(new CustomEvent("auth:tokenExpired"));

  setTimeout(() => {
    window.location.href = "/login";
  }, 1200);
};

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      const headers = (config.headers ?? {}) as AxiosRequestHeaders;
      headers.Authorization = `Bearer ${token}`;
      config.headers = headers;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthRequest = !!error.config?.headers?.Authorization;
    const message = error.response?.data?.message ?? "";

    if (status === 401 && isAuthRequest) {
      const normalizedMessage = message.toLowerCase();
      if (
        normalizedMessage.includes("token expired") ||
        normalizedMessage.includes("token has expired") ||
        normalizedMessage.includes("unauthorized")
      ) {
        handleTokenExpired();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
