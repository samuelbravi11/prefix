// src/services/api.js
import axios from "axios";
import authApi from "@/services/authApi";

/**
 * api:
 * - usa /api/v1/* (proxy_guard)
 * - usa cookie HttpOnly (accessToken) -> niente Authorization header
 * - gestisce refresh automatico quando accessToken scade (401)
 * - aggiunge CSRF header (double-submit cookie) per richieste state-changing
 */

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function isPublicPath(pathname) {
  const p = pathname || "/";
  const PUBLIC_PREFIXES = ["/login", "/bootstrap", "/register", "/forgot", "/reset"];
  if (PUBLIC_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`))) return true;
  if (p === "/auth" || p.startsWith("/auth/")) return true;
  return false;
}

const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true, // fondamentale per inviare cookie HttpOnly
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(true);
  });
  failedQueue = [];
};

// Request interceptor: aggiunge X-CSRF-Token se presente
api.interceptors.request.use(
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

// Response interceptor: se 401 -> refresh e ritenta (SOLO su rotte protette)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;

    // Se non è 401, lascia passare
    if (status !== 401) return Promise.reject(error);

    const currentPath = window.location?.pathname || "/";

    // 🔒 Se siamo su route pubblica (bootstrap/login/register), NON fare refresh e NON redirect.
    // Serve per evitare che pagine pubbliche vengano "buttate fuori" quando fanno (anche accidentalmente) call protette.
    if (isPublicPath(currentPath)) {
      return Promise.reject(error);
    }

    // Evita loop infinito
    if (originalRequest._retry) {
      if (currentPath !== "/login") window.location.href = "/login";
      return Promise.reject(error);
    }

    // Non tentare refresh se stai già chiamando refresh
    if (originalRequest.url?.includes("/auth/refresh")) {
      if (currentPath !== "/login") window.location.href = "/login";
      return Promise.reject(error);
    }

    // Se manca fingerprintHash non ha senso tentare refresh (non possiamo completare la richiesta)
    const fingerprintHash = localStorage.getItem("fingerprintHash");
    if (!fingerprintHash) {
      if (currentPath !== "/login") window.location.href = "/login";
      return Promise.reject(error);
    }

    // Se refresh già in corso: metti in coda
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          originalRequest._retry = true;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await authApi.post(
        "/refresh",
        { fingerprintHash },
        { headers: { "Content-Type": "application/json" } }
      );

      processQueue(null);

      // ritenta richiesta originale (cookie accessToken aggiornato)
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      if (currentPath !== "/login") window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;