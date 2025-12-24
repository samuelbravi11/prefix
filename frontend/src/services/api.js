// src/services/api.js
import axios from "axios";

// Crea un'istanza di axios per le API protette
const api = axios.create({
  baseURL: "/api/v1",
});

// Stato per gestire il refresh del token
let isRefreshing = false;
let failedQueue = [];

/**
 * Processa la coda di richieste fallite dopo il refresh del token
 * @param {Error|null} error - Errore da passare alle promise in coda
 * @param {string|null} token - Nuovo token da usare per le richieste in coda
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      // Timeout per evitare promise bloccate
      setTimeout(() => {
        prom.resolve(token);
      }, 0);
    }
  });
  failedQueue = [];
};

/**
 * Interceptor per aggiungere il token JWT a tutte le richieste API
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor per gestire le risposte e il refresh del token
 */
api.interceptors.response.use(
  (response) => {
    // Se la risposta è ok, la restituiamo direttamente
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Se l'errore è 401 (Unauthorized) e non abbiamo già ritentato la richiesta
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Se stiamo già cercando di fare refresh, evita loop
      if (originalRequest.url === "/auth/refresh") {
        console.log("Refresh token fallito, logout...");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("fingerprintHash");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // Se siamo già in fase di refresh, mettiamo la richiesta in coda
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Segna che stiamo ritentando questa richiesta
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("Token scaduto, tentativo di refresh...");

        // Usa axios diretta (non l'istanza api) per evitare loop
        // Invia la richiesta di refresh con withCredentials per i cookie
        const refreshResponse = await axios.post(
          "/auth/refresh",
          {
            fingerprintHash: localStorage.getItem("fingerprintHash")
          },
          {
            withCredentials: true, // IMPORTANTE: invia il cookie refreshToken
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const newAccessToken = refreshResponse.data.accessToken;
        
        // Salva il nuovo token in localStorage
        localStorage.setItem("accessToken", newAccessToken);
        console.log("Token rinnovato con successo");
        
        // Processa tutte le richieste in coda con il nuovo token
        processQueue(null, newAccessToken);
        
        // Aggiorna l'header della richiesta originale e ritentala
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error("Refresh token fallito:", refreshError);
        
        // Se il refresh fallisce, logout dell'utente
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        
        // Se non siamo già sulla login, reindirizziamo
        if (window.location.pathname !== "/login") {
          console.log("Reindirizzamento a login...");
          window.location.href = "/login";
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Se è un altro errore 401 (dopo il retry o per altri motivi)
    if (error.response?.status === 401) {
      console.log("Accesso non autorizzato, effettua il login");
      localStorage.removeItem("accessToken");
      
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Per tutti gli altri errori, rifiuta normalmente
    return Promise.reject(error);
  }
);

export default api;