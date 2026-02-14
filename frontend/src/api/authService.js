import authApi from "@/services/authApi";
import { getDeviceFingerprint } from "../utils/fingerprint.js";

// STEP A
export async function loginStart(email, password) {
  const fingerprint = await getDeviceFingerprint();
  localStorage.setItem("fingerprintHash", fingerprint.hash);

  return authApi.post("/login/start", { email, password }, {
    headers: { "Content-Type": "application/json" },
  });
}

// STEP B
export async function loginVerifyTotp(code) {
  const fingerprintHash = localStorage.getItem("fingerprintHash");
  const challengeToken = sessionStorage.getItem("loginChallengeToken");

  if (!fingerprintHash) throw new Error("fingerprintHash mancante");
  if (!challengeToken) throw new Error("challengeToken mancante o scaduto");

  return authApi.post("/login/verify-totp", { code, fingerprintHash }, {
    headers: { Authorization: `Bearer ${challengeToken}` },
  });
}

export async function register({ email, password, name, surname = "" }) {
  const fingerprint = await getDeviceFingerprint();

  return authApi.post(
    "/register",
    {
      email,
      password,
      name,
      surname,
      fingerprintHash: fingerprint.hash,
    }
  );
}

export async function fetchMe() {
  return authApi.get("/me");
}