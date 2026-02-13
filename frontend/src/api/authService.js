import axios from "axios";
import { getDeviceFingerprint } from "../utils/fingerprint.js";

// Legge l'URL base dalle variabili d'ambiente (impostata su Render)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function login(email, password) {
  const fingerprint = await getDeviceFingerprint();
  
  console.log("[VUE DEBUG] Chiamando login a:", `${API_BASE_URL}/auth/login`);
  console.log("[VUE DEBUG] Fingerprint hash:", fingerprint.hash);

  localStorage.setItem("fingerprintHash", fingerprint.hash);

  return axios.post(`${API_BASE_URL}/auth/login`, {
    email,
    password,
    fingerprintHash: fingerprint.hash
  }, {
    withCredentials: true
  });
}

export async function register({ email, password, name, surname = "" }) {
  const fingerprint = await getDeviceFingerprint();

  return axios.post(`${API_BASE_URL}/auth/register`, {
    email,
    password,
    name,
    surname,
    fingerprintHash: fingerprint.hash
  }, {
    withCredentials: true
  });
}

export async function fetchMe() {
  const token = localStorage.getItem("accessToken");
  return axios.get(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}