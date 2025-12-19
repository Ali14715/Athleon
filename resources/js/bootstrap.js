import axios from 'axios';
window.axios = axios;

// Set default base URL - use current origin in production, env in development
const getBaseURL = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // If NOT on localhost, always use current origin
    if (!origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      return origin;
    }
    // On localhost, use env if available
    return envBase || origin;
  }
  return envBase || "";
};

axios.defaults.baseURL = getBaseURL();
window.axios.defaults.baseURL = getBaseURL();
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
