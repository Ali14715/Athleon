import axios, { type AxiosRequestHeaders, type AxiosResponse } from "axios";
import { toast } from "sonner";

// ============================================================================
// TYPE DEFINITIONS - Format API Response Standar
// ============================================================================

/**
 * Interface untuk format API response standar
 * Format: { status_code, message, data, success? }
 */
export interface ApiResponse<T = unknown> {
  status_code: number;
  message: string;
  data: T;
  /** @deprecated Gunakan isSuccess() helper untuk pengecekan */
  success?: boolean;
}

/**
 * Interface untuk paginated data
 */
export interface PaginatedData<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

/**
 * Interface untuk paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}

// ============================================================================
// HELPER FUNCTIONS - Untuk Gradual Migration ke Format Baru
// ============================================================================

/**
 * Cek apakah response sukses (status_code 2xx)
 * @example
 * const response = await api.get('/products');
 * if (isSuccess(response)) {
 *   console.log(response.data.data);
 * }
 */
export function isSuccess<T>(response: AxiosResponse<ApiResponse<T>>): boolean {
  const statusCode = response.data?.status_code ?? response.status;
  return statusCode >= 200 && statusCode < 300;
}

/**
 * Cek apakah response error (status_code >= 400)
 */
export function isError<T>(response: AxiosResponse<ApiResponse<T>>): boolean {
  const statusCode = response.data?.status_code ?? response.status;
  return statusCode >= 400;
}

/**
 * Cek apakah response client error (status_code 4xx)
 */
export function isClientError<T>(response: AxiosResponse<ApiResponse<T>>): boolean {
  const statusCode = response.data?.status_code ?? response.status;
  return statusCode >= 400 && statusCode < 500;
}

/**
 * Cek apakah response server error (status_code 5xx)
 */
export function isServerError<T>(response: AxiosResponse<ApiResponse<T>>): boolean {
  const statusCode = response.data?.status_code ?? response.status;
  return statusCode >= 500;
}

/**
 * Ambil data dari response dengan type safety
 * @example
 * const response = await api.get<ApiResponse<Product[]>>('/products');
 * const products = getData(response); // Product[]
 */
export function getData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return response.data.data;
}

/**
 * Ambil message dari response
 */
export function getMessage<T>(response: AxiosResponse<ApiResponse<T>>): string {
  return response.data.message;
}

/**
 * Ambil status code dari response
 */
export function getStatusCode<T>(response: AxiosResponse<ApiResponse<T>>): number {
  return response.data?.status_code ?? response.status;
}

/**
 * Ambil error message dari error response
 * Berguna untuk catch block
 * @example
 * try {
 *   await api.post('/orders', data);
 * } catch (error) {
 *   toast.error(getErrorMessage(error));
 * }
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message ?? "Terjadi kesalahan";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Terjadi kesalahan yang tidak diketahui";
}

/**
 * Ambil validation errors dari response (untuk status 422)
 * @example
 * try {
 *   await api.post('/register', data);
 * } catch (error) {
 *   const errors = getValidationErrors(error);
 *   // errors = { email: ['Email sudah terdaftar'], password: ['Password terlalu pendek'] }
 * }
 */
export function getValidationErrors(error: unknown): Record<string, string[]> | null {
  if (axios.isAxiosError(error) && error.response?.status === 422) {
    return error.response.data?.data ?? error.response.data?.errors ?? null;
  }
  return null;
}

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================

// Helper to get base URL at runtime (not build time)
const getBaseURL = (): string => {
  // Check env first - but only if it's not localhost in production
  const envBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
  
  // In browser, always prefer window.location.origin for production
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // If we're NOT on localhost, use the current origin regardless of env
    if (!origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      return origin;
    }
    // If we're on localhost, use env if available, otherwise use origin
    return envBase || origin;
  }
  
  // SSR fallback
  return envBase || "";
};

const baseURL = getBaseURL();

const api = axios.create({
  baseURL: baseURL || undefined,
  withCredentials: true,
});

let isTokenExpiredHandled = false;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const refreshToken = async (): Promise<string | null> => {
  try {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return null;

    const response = await axios.post(
      `${getBaseURL()}/api/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      }
    );

    // Handle new API format
    const newToken = response.data?.data?.token || response.data?.token;
    if (newToken) {
      localStorage.setItem("token", newToken);
      return newToken;
    }
    return null;
  } catch (error) {
    return null;
  }
};

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

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    // Only add Authorization header if token exists and is not empty
    if (token && token !== "undefined" && token !== "null") {
      const headers = (config.headers ?? {}) as AxiosRequestHeaders;
      headers.Authorization = `Bearer ${token}`;
      config.headers = headers;
    }
  }
  return config;
});

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

api.interceptors.response.use(
  (response) => {
    // =========================================================================
    // BACKWARD COMPATIBILITY: Inject 'success' dari 'status_code'
    // Ini memungkinkan kode lama yang menggunakan response.data.success tetap berfungsi
    // Di masa depan, setelah semua kode migrate, interceptor ini bisa dihapus
    // =========================================================================
    if (response.data && typeof response.data === 'object') {
      const statusCode = response.data.status_code ?? response.status;
      
      // Inject success jika belum ada
      if (response.data.success === undefined) {
        response.data.success = statusCode >= 200 && statusCode < 300;
      }
      
      // Inject status_code jika belum ada (untuk response lama yang masih pakai success)
      if (response.data.status_code === undefined) {
        response.data.status_code = statusCode;
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthRequest = !!originalRequest?.headers?.Authorization;
    const message = error.response?.data?.message ?? "";

    // Handle 401 with token refresh
    if (status === 401 && isAuthRequest && !originalRequest._retry) {
      const normalizedMessage = message.toLowerCase();
      
      // Check if it's a token expired error (not invalid credentials)
      if (
        normalizedMessage.includes("token expired") ||
        normalizedMessage.includes("token has expired")
      ) {
        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          
          try {
            const newToken = await refreshToken();
            
            if (newToken) {
              isRefreshing = false;
              onRefreshed(newToken);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            } else {
              // Refresh failed, logout user
              isRefreshing = false;
              handleTokenExpired();
            }
          } catch (refreshError) {
            isRefreshing = false;
            handleTokenExpired();
          }
        } else {
          // Wait for refresh to complete and retry
          return new Promise((resolve) => {
            addRefreshSubscriber((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            });
          });
        }
      } else if (normalizedMessage.includes("unauthorized") || normalizedMessage.includes("invalid")) {
        // Invalid token (not expired), logout immediately
        handleTokenExpired();
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// EXPORT
// ============================================================================

export default api;

/**
 * ============================================================================
 * MIGRATION GUIDE - Cara Gradual Migration ke Format Baru
 * ============================================================================
 * 
 * SEBELUM (kode lama):
 * ```typescript
 * const response = await api.get('/products');
 * if (response.data.success) {
 *   setProducts(response.data.data);
 * }
 * ```
 * 
 * SESUDAH (kode baru dengan helper):
 * ```typescript
 * import api, { isSuccess, getData, ApiResponse, getErrorMessage } from '@/lib/api';
 * 
 * const response = await api.get<ApiResponse<Product[]>>('/products');
 * if (isSuccess(response)) {
 *   setProducts(getData(response));
 * }
 * ```
 * 
 * DENGAN ERROR HANDLING:
 * ```typescript
 * try {
 *   const response = await api.post<ApiResponse<Order>>('/orders', orderData);
 *   if (isSuccess(response)) {
 *     toast.success(getMessage(response));
 *     navigate(`/orders/${getData(response).id}`);
 *   }
 * } catch (error) {
 *   toast.error(getErrorMessage(error));
 *   const validationErrors = getValidationErrors(error);
 *   if (validationErrors) {
 *     setErrors(validationErrors);
 *   }
 * }
 * ```
 * 
 * MANFAAT MIGRATION:
 * 1. Type safety - TypeScript akan membantu detect error
 * 2. Konsisten - Semua response mengikuti format yang sama
 * 3. Maintainable - Perubahan format cukup di satu tempat
 * 4. Readable - Helper functions membuat kode lebih jelas
 * ============================================================================
 */
