// src/services/authApi.js
import axios from "axios";

/**
 * authApi:
 * - usa /auth/* (proxy_guard)
 * - withCredentials: true per inviare/ricevere cookie (refreshToken, accessToken)
 * - aggiunge header CSRF sulle richieste state-changing
 */

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

const authApi = axios.create({
  baseURL: "/auth",
  withCredentials: true,
});

authApi.interceptors.request.use(
  (config) => {
    const csrf = getCookie("csrfToken");
    if (csrf) {
      config.headers = config.headers || {};
      config.headers["X-CSRF-Token"] = csrf;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default authApi;
