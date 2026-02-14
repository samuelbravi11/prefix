// src/services/authApi.js
import axios from "axios";

/**
 * authApi:
 * - usa /auth/* (Nginx fa proxy su /auth/ verso proxy_guard)
 * - withCredentials: true per inviare/ricevere cookie (refreshToken)
 */
const authApi = axios.create({
  baseURL: "/auth",
  withCredentials: true,
});

// Se vuoi: allega accessToken anche su /auth (es. /auth/me)
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default authApi;
