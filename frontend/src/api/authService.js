import axios from "axios";
import { getDeviceFingerprint } from "../utils/fingerprint.js";

// ho configurato un vite_proxy su vite.config.js in grado che ad ogni percorso relativo mi traduca la path con l'url intero del server Proxy
// esempio: /auth/login --> http:localhost:5000/auth/login
const API_URL = "http://localhost:5000";

export async function login(email, password) {
  const fingerprint = await getDeviceFingerprint();
  
  console.log("[VUE DEBUG] Chiamando login a:", "/auth/login");
  console.log("[VUE DEBUG] Fingerprint hash:", fingerprint.hash);

  return axios.post(
    "/auth/login",
    {
      email,
      password,
      fingerprintHash: fingerprint.hash
    },
    {
      withCredentials: true
    }
  );
}

export async function register({ email, password, name, surname = "" }) {
  const fingerprint = await getDeviceFingerprint();

  return axios.post(
    "/auth/register",
    {
      email,
      password,
      name,
      surname,
      fingerprintHash: fingerprint.hash
    },
    {
      withCredentials: true
    }
  );
}