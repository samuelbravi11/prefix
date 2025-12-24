/* NON SERVE PIU'
import axios from "axios";
import { getDeviceFingerprint } from "../utils/fingerprint.js";

// === funzione richiesta refresh token ===
async function refreshAccessToken() {
  const fingerprint = await getDeviceFingerprint();

  const res = await axios.post(
    "/auth/refresh",
    {
      fingerprintHash: fingerprint.hash
    },
    {
      withCredentials: true
    }
  );

  return res.data.accessToken;
}

// === setup globale dell'interceptor ===
export function setupAxiosRefresh() {
  axios.interceptors.response.use(
    res => res,
    async err => {
      const originalRequest = err.config;

      // NON tentare refresh su rotte di autenticazione
      if (
        originalRequest.url.includes("/auth/login") ||
        originalRequest.url.includes("/auth/register") ||
        originalRequest.url.includes("/auth/refresh")
      ) {
        return Promise.reject(err);
      }

      // tenta refresh SOLO se 401 e non già ritentato
      if (err.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await refreshAccessToken();

          // salva nuovo token
          localStorage.setItem("accessToken", newToken);

          // aggiorna request originale con token nuovo
          originalRequest.headers["Authorization"] = "Bearer " + newToken;

          return axios(originalRequest);
        } catch (refreshError) {
          // refresh fallito → logout
          localStorage.removeItem("accessToken");
          window.location.href = "/login";
        }
      }

      return Promise.reject(err);
    }
  );
}
*/