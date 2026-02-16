import bcrypt from "bcrypt";
import crypto from "crypto";

import { OnboardingStatus } from "../models/User.js";
import { getTenantModels } from "../utils/tenantModels.js";

import * as userService from "../services/user.service.js";

import {
  generateEmailOtp,
  applyEmailOtpToUser,
  verifyEmailOtp,
} from "../services/emailOtp.service.js";

import { sendEmailOtp } from "../services/email.service.js";
import { signRegistrationToken } from "../services/registrationToken.service.js";

import {
  generateTotpSecret,
  applyTotpSecretToUser,
  buildQrCodeDataUrl,
  createAndApplyTotpSetupToken,
  verifyTotpSetupToken,
  verifyTotpCode,
} from "../services/totp.service.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateLoginChallengeToken,
  verifyLoginChallengeToken,
} from "../services/token.service.js";

function setRefreshTokenCookie(res, refreshToken) {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,          // in dev false (http)
    sameSite: "lax",         // ok per same-origin
    path: "/auth",
    maxAge: 24 * 60 * 60 * 1000,  // 1d
  });
}

function setAccessTokenCookie(res, accessToken) {
  const isProd = process.env.NODE_ENV === "production";

  // accessToken serve su tutte le API protette (proxy)
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,          // in dev false (http)
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,  // 15m
  });
}

function setCsrfTokenCookie(res, csrfToken) {
  const isProd = process.env.NODE_ENV === "production";

  // NON HttpOnly: il frontend deve leggerlo e rimandarlo in header X-CSRF-Token
  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,  // 1d
  });
}

function clearAuthCookies(res) {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
  });

  res.clearCookie("csrfToken", {
    httpOnly: false,
    sameSite: "lax",
    secure: isProd,
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/auth",
  });
}

/**
 * Helper: verifica che l'utente appartenga al tenant della request.
 * Serve per prevenire confusione cross-tenant (subdomain diverso).
 */
function assertUserTenantMatch(req, userDoc) {
  // se nel tuo schema User tenantId è required, questa check è sempre valida
  if (!req.tenant?.tenantId) return false;
  if (!userDoc?.tenantId) return false;
  return String(userDoc.tenantId) === String(req.tenant.tenantId);
}

/* ---------------------------------------------------
   REGISTRAZIONE
--------------------------------------------------- */
export async function register(req, res) {
  try {
    if (!req.tenant) {
      return res.status(400).json({ message: "Missing tenant (use subdomain)" });
    }

    const { name, surname, email, password, fingerprintHash } = req.body;

    if (!name || !email || !password || !fingerprintHash) {
      return res.status(400).json({
        message: "Tutti i campi sono obbligatori",
        required: ["name", "email", "password", "fingerprintHash"],
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const { User } = await getTenantModels(req);

    const existing = await userService.findByEmail(User, normalizedEmail);
    if (existing) {
      return res.status(409).json({ message: "Utente già registrato" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      tenantId: req.tenant.tenantId,
      isBootstrapAdmin: false,

      name,
      surname: surname || "",
      email: normalizedEmail,

      emailVerified: false,
      onboardingStatus: OnboardingStatus.EMAIL_VERIFICATION,
      status: "disabled", // durante onboarding

      fingerprintHash,

      auth: {
        passwordHash,
        lastPasswordChangeAt: new Date(),
        refreshTokens: [],
      },
    });

    const otp = generateEmailOtp();
    const { expiresAt } = applyEmailOtpToUser(user, otp);

    await user.save();

    if (process.env.NODE_ENV !== "development") {
      console.log("[DEV OTP][REGISTER]", {
        email: user.email,
        otp,
        expiresAt: expiresAt.toISOString(),
      });
    }

    await sendEmailOtp({ to: user.email, otpCode: otp, expiresAt });

    const registrationToken = signRegistrationToken({
      userId: user._id.toString(),
      tenantId: req.tenant.tenantId,
      type: "registration",
    });

    return res.status(201).json({
      message: "Registrazione avviata. Verifica email.",
      registrationToken,
      next: "/auth/verify-email",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Errore server register",
      error: err.message,
    });
  }
}

/* ---------------------------------------------------
   VERIFY EMAIL OTP — /auth/verify-email
--------------------------------------------------- */
export async function verifyEmail(req, res) {
  try {
    if (!req.tenant) return res.status(400).json({ message: "Missing tenant" });

    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "OTP code mancante" });

    const { User } = await getTenantModels(req);

    const userId = req.registration?.userId;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User non trovato" });

    if (!assertUserTenantMatch(req, user)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    const ok = verifyEmailOtp(user, code);
    if (!ok) return res.status(400).json({ message: "OTP non valido o scaduto" });

    user.emailVerified = true;
    user.onboardingStatus = OnboardingStatus.TOTP_SETUP;
    await user.save();

    return res.json({
      message: "Email verificata. Procedi con TOTP setup.",
      next: "/auth/totp/setup",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Errore server verify-email",
      error: err.message,
    });
  }
}

/* ---------------------------------------------------
   TOTP SETUP — /auth/totp/setup
--------------------------------------------------- */
export async function totpSetup(req, res) {
  try {
    if (!req.tenant) return res.status(400).json({ message: "Missing tenant" });

    const { User } = await getTenantModels(req);

    const userId = req.registration?.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User non trovato" });

    if (!assertUserTenantMatch(req, user)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    const secret = generateTotpSecret();
    applyTotpSecretToUser(user, secret);

    const setupToken = createAndApplyTotpSetupToken(user);
    const qrDataUrl = await buildQrCodeDataUrl(user.email, secret);

    await user.save();

    return res.json({
      message: "TOTP secret generato",
      qrDataUrl,
      setupToken,
      next: "/auth/totp/verify",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Errore server totp/setup",
      error: err.message,
    });
  }
}

/* ---------------------------------------------------
   TOTP VERIFY — /auth/totp/verify
--------------------------------------------------- */
export async function totpVerify(req, res) {
  try {
    if (!req.tenant) return res.status(400).json({ message: "Missing tenant" });

    const { code, setupToken } = req.body;
    if (!code || !setupToken) {
      return res.status(400).json({
        message: "Missing fields",
        required: ["code", "setupToken"],
      });
    }

    const { User } = await getTenantModels(req);

    const userId = req.registration?.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User non trovato" });

    if (!assertUserTenantMatch(req, user)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    try {
      verifyTotpSetupToken(user, setupToken);
    } catch (e) {
      return res.status(401).json({ message: e.message });
    }

    const ok = verifyTotpCode(user, code);
    if (!ok) return res.status(400).json({ message: "TOTP code non valido" });

    applyTotpSecretToUser(user, user.totpSecret);
    user.totpEnabled = true;

    // onboarding completato (status -> pending)
    user.status = "pending";
    user.onboardingStatus = OnboardingStatus.COMPLETED;

    await user.save();

    return res.json({
      message: "TOTP verificato. Registrazione completata.",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Errore server totp/verify",
      error: err.message,
    });
  }
}

/* ---------------------------------------------------
   LOGIN STEP A — /auth/login/start
--------------------------------------------------- */
export async function loginStart(req, res) {
  try {
    if (!req.tenant) return res.status(400).json({ message: "Missing tenant" });

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Missing email/password" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const { User } = await getTenantModels(req);
    const user = await userService.findByEmail(User, normalizedEmail);

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (!assertUserTenantMatch(req, user)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    const ok = await bcrypt.compare(password, user.auth?.passwordHash || "");
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (user.status !== "active") {
      return res.status(403).json({ message: "Account non attivo" });
    }

    if (user.totpEnabled !== true) {
      return res.status(403).json({ message: "TOTP non abilitato" });
    }

    // challenge token breve
    const challengeToken = await generateLoginChallengeToken({
      userId: user._id.toString(),
      tenantId: req.tenant.tenantId,
      type: "login_challenge",
    });

    return res.json({
      message: "Login step A OK. Procedi con verify-totp",
      challengeToken,
      next: "/auth/login/verify-totp",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Errore server login/start",
      error: err.message,
    });
  }
}

/* ---------------------------------------------------
   LOGIN STEP B — /auth/login/verify-totp
--------------------------------------------------- */
export async function loginVerifyTotp(req, res) {
  try {
    if (!req.tenant) return res.status(400).json({ message: "Missing tenant" });

    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing Authorization Bearer challengeToken" });
    }

    const challengeToken = authHeader.split(" ")[1];

    let challengePayload;
    try {
      challengePayload = await verifyLoginChallengeToken(challengeToken);
    } catch (e) {
      return res.status(401).json({ message: e.message });
    }

    // check tenant inside token (extra hardening)
    if (String(challengePayload.tenantId) !== String(req.tenant.tenantId)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    const { code, fingerprintHash } = req.body;
    if (!code || !fingerprintHash) {
      return res.status(400).json({
        message: "Missing fields",
        required: ["code", "fingerprintHash"],
      });
    }

    if (fingerprintHash.length > 128) {
      return res.status(400).json({ message: "fingerprintHash troppo lungo" });
    }

    const { User } = await getTenantModels(req);
    const user = await User.findById(challengePayload.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!assertUserTenantMatch(req, user)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Account non attivo" });
    }

    if (user.totpEnabled !== true) {
      return res.status(403).json({ message: "TOTP non abilitato" });
    }

    if (!verifyTotpCode(user, code)) {
      return res.status(400).json({ message: "Invalid TOTP code" });
    }

    // OK: genera tokens come facevi prima
    const payload = { userId: user._id.toString(), status: user.status };

    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    await userService.addRefreshToken(User, user._id, refreshToken, fingerprintHash);

    // Cookies
    setRefreshTokenCookie(res, refreshToken);
    setAccessTokenCookie(res, accessToken);

    // CSRF token (double-submit cookie)
    const csrfToken = crypto.randomBytes(32).toString("hex");
    setCsrfTokenCookie(res, csrfToken);

    return res.json({
      message: "Login effettuato",
      // accessToken lasciato SOLO per debug/compat, ma il frontend NON deve salvarlo
      accessToken,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Errore server login/verify-totp",
      error: err.message,
    });
  }
}

/* ---------------------------------------------------
   REFRESH TOKEN
--------------------------------------------------- */
export async function refresh(req, res) {
  try {
    if (!req.tenant) return res.status(400).json({ message: "Missing tenant" });

    const refreshToken = req.cookies?.refreshToken;
    const { fingerprintHash } = req.body;

    if (!refreshToken) return res.status(401).json({ message: "Refresh token mancante" });
    if (!fingerprintHash) return res.status(400).json({ message: "Missing fingerprintHash" });

    if (fingerprintHash.length > 128) {
      return res.status(400).json({ message: "fingerprintHash troppo lungo" });
    }

    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: "Refresh token non valido o scaduto" });
    }

    // tenant-aware user lookup
    const { User } = await getTenantModels(req);
    const user = await User.findById(payload.userId);
    if (!user || user.status !== "active") {
      return res.status(403).json({ message: "Account non valido" });
    }

    // cross-tenant protection
    if (!assertUserTenantMatch(req, user)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    // mantieni payload coerente con login
    const newRefreshToken = await generateRefreshToken({
      userId: user._id.toString(),
      status: user.status,
    });

    const rotated = await userService.rotateRefreshToken(
      User,
      user._id,
      refreshToken,
      newRefreshToken,
      fingerprintHash
    );

    if (!rotated) {
      return res.status(401).json({ message: "Refresh token non valido per questo dispositivo" });
    }

    const newAccessToken = await generateAccessToken({
      userId: user._id.toString(),
      status: user.status,
    });

    setRefreshTokenCookie(res, newRefreshToken);
    setAccessTokenCookie(res, newAccessToken);

    // se il csrf cookie non esiste (edge-case), rigeneralo
    if (!req.cookies?.csrfToken) {
      const csrfToken = crypto.randomBytes(32).toString("hex");
      setCsrfTokenCookie(res, csrfToken);
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Errore server refresh", error: err.message });
  }
}

// LOGOUT LEGATO AL DISPOSITIVO CON FINGERPRINT --> DA CHIEDERE AL CLIENT IL FINGERPRINT
export async function logout(req, res) {
  try {
    if (!req.tenant) return res.status(400).json({ message: "Missing tenant" });

    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(200).json({ message: "Already logged out" });

    const { fingerprintHash } = req.body; // <-- chiedilo al client

    // validazione
    if (fingerprintHash && fingerprintHash.length > 128) {
      return res.status(400).json({ message: "fingerprintHash troppo lungo" });
    }

    const { User } = await getTenantModels(req);

    if (fingerprintHash) {
      await userService.revokeRefreshTokenForDevice(User, refreshToken, fingerprintHash);
    } else {
      await userService.revokeRefreshToken(User, refreshToken);
    }

    clearAuthCookies(res);

    return res.json({ message: "Logout successful" });
  } catch (err) {
    return res.status(500).json({ message: "Logout failed", error: err.message });
  }
}

/* ===================================================
   ME
=================================================== */
export async function me(req, res) {
  try {
    if (!req.tenant) return res.status(400).json({ message: "Missing tenant" });

    const cookieToken = req.cookies?.accessToken;
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    const token = cookieToken || bearerToken;
    if (!token) {
      return res.status(401).json({ message: "Non autenticato" });
    }

    const payload = await verifyAccessToken(token);

    const { User } = await getTenantModels(req);
    const user = await User.findById(payload.userId)
      .select("-auth.passwordHash -auth.refreshTokens")
      .lean();

    if (!user) return res.status(404).json({ message: "User non trovato" });

    if (!assertUserTenantMatch(req, user)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    return res.json(user);
  } catch (err) {
    return res.status(401).json({ message: "Token invalido o scaduto" });
  }
}

export async function csrf(req, res) {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  setCsrfTokenCookie(res, csrfToken);
  return res.json({ ok: true });
}