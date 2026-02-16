import authApi from "@/services/authApi";
import { getDeviceFingerprint } from "../utils/fingerprint.js";

// STEP A (login)
export async function loginStart(email, password) {
  const fingerprint = await getDeviceFingerprint();
  localStorage.setItem("fingerprintHash", fingerprint.hash);

  return authApi.post(
    "/login/start",
    { email, password },
    { headers: { "Content-Type": "application/json" } }
  );
}

// STEP B (login)
export async function loginVerifyTotp(code) {
  const fingerprintHash = localStorage.getItem("fingerprintHash");
  const challengeToken = sessionStorage.getItem("loginChallengeToken");

  if (!fingerprintHash) throw new Error("fingerprintHash mancante");
  if (!challengeToken) throw new Error("challengeToken mancante o scaduto");

  return authApi.post(
    "/login/verify-totp",
    { code, fingerprintHash },
    { headers: { Authorization: `Bearer ${challengeToken}` } }
  );
}

// ===== REGISTRAZIONE NORMALE (onboarding) =====

export async function register({ email, password, name, surname = "" }) {
  const fingerprint = await getDeviceFingerprint();

  return authApi.post("/register", {
    email,
    password,
    name,
    surname,
    fingerprintHash: fingerprint.hash,
  });
}

export async function verifyEmailOtp({ registrationToken, code }) {
  if (!registrationToken) throw new Error("registrationToken mancante");
  return authApi.post(
    "/verify-email",
    { code },
    { headers: { Authorization: `Bearer ${registrationToken}` } }
  );
}

export async function totpSetup({ registrationToken }) {
  if (!registrationToken) throw new Error("registrationToken mancante");
  return authApi.post(
    "/totp/setup",
    {},
    { headers: { Authorization: `Bearer ${registrationToken}` } }
  );
}

export async function totpVerify({ registrationToken, totpSetupToken, code }) {
  if (!registrationToken) throw new Error("registrationToken mancante");
  return authApi.post(
    "/totp/verify",
    { totpSetupToken, code },
    { headers: { Authorization: `Bearer ${registrationToken}` } }
  );
}

// ===== BOOTSTRAP ADMIN =====
// token arriva dal link /bootstrap?token=...
export async function bootstrapStart({ token, name, surname = "", password }) {
  const fingerprint = await getDeviceFingerprint();

  return authApi.post("/bootstrap/start", {
    token,
    name,
    surname,
    password,
    fingerprintHash: fingerprint.hash,
  });
}

export async function fetchMe() {
  return authApi.get("/me");
}