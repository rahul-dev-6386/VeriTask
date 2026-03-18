import axios from "axios";

const defaultApiBaseUrl =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://veritask.onrender.com";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl,
  withCredentials: true,
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (
      status === 401 &&
      code === "TOKEN_EXPIRED" &&
      !originalRequest?._retry &&
      originalRequest?.url !== "/refresh"
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = api.post("/refresh").finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;
      return api(originalRequest);
    }

    throw error;
  }
);

export const getErrorMessage = (error, fallback = "Something went wrong.") => {
  const data = error.response?.data;

  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).join(", ");
  }

  return data?.message || fallback;
};

export default api;
