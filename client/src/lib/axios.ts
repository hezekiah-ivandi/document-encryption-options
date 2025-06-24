import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const tokenizedAxios = axios.create({
  baseURL: BACKEND_URL,
});

tokenizedAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
});
