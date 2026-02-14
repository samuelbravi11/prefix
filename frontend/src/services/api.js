// src/services/api.js
import axios from "axios";
import authApi from "@/services/authApi";

/**
 * api:
 * - usa /api/v1/* (Nginx fa proxy su /api/ verso proxy_guard)
 * - gestisce refresh automatico quando accessToken scade (401)
 */
const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true, // ok tenerlo true (non fa male) e aiuta se in futuro usi cookie anche qui
});

// Stato per gestire il refresh del token
let isRefreshing = false;
let failedQueue = [];

/**
 * Risolve o rigetta tutte le richieste che stavano aspettando il refresh.
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

/**
 * Interceptor request: aggiunge Bearer accessToken
 */
api.interceptors.request.use(
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

/**
 * Interceptor response: se 401 -> refresh access token e ritenta
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se non c'è config (errore strano), propaga
    if (!originalRequest) return Promise.reject(error);

    // Solo per 401
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Evita loop infinito: se già ritentata, fai logout hard
    if (originalRequest._retry) {
      localStorage.removeItem("accessToken");
      if (window.location.pathname !== "/login") window.location.href = "/login";
      return Promise.reject(error);
    }

    // Se per qualche motivo qualcuno chiama refresh passando da api, blocca qui
    // (consigliato: refresh si fa SOLO con authApi)
    if (originalRequest.url?.includes("/auth/refresh")) {
      localStorage.removeItem("accessToken");
      if (window.location.pathname !== "/login") window.location.href = "/login";
      return Promise.reject(error);
    }

    // Se refresh già in corso: metti in coda
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest._retry = true;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Avvia refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Refresh tramite authApi (baseURL /auth)
      const refreshResponse = await authApi.post("/refresh", {
        fingerprintHash: localStorage.getItem("fingerprintHash"),
      }, {
        headers: { "Content-Type": "application/json" },
      });

      const newAccessToken = refreshResponse.data?.accessToken;
      if (!newAccessToken) {
        throw new Error("Refresh OK ma accessToken mancante in risposta");
      }

      // Salva nuovo token
      localStorage.setItem("accessToken", newAccessToken);

      // Sblocca coda
      processQueue(null, newAccessToken);

      // Ritenta richiesta originale
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Logout
      localStorage.removeItem("accessToken");
      if (window.location.pathname !== "/login") window.location.href = "/login";

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
