// src/api/authService.js
import axios from "axios";
import { getDeviceFingerprint } from "../utils/fingerprint.js";

// STEP A
export async function loginStart(email, password) {
  // fingerprint serve già da ora: lo userai nello step B e nel refresh
  const fingerprint = await getDeviceFingerprint();
  localStorage.setItem("fingerprintHash", fingerprint.hash);

  return axios.post("/auth/login/start", { email, password });
}

// STEP B
export async function loginVerifyTotp(code) {
  const fingerprintHash = localStorage.getItem("fingerprintHash");
  const challengeToken = sessionStorage.getItem("loginChallengeToken");

  if (!fingerprintHash) throw new Error("fingerprintHash mancante");
  if (!challengeToken) throw new Error("challengeToken mancante o scaduto");

  return axios.post(
    "/auth/login/verify-totp",
    { code, fingerprintHash },
    {
      headers: { Authorization: `Bearer ${challengeToken}` },
      withCredentials: true,
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

export async function fetchMe() {
  const token = localStorage.getItem("accessToken");

  return axios.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}