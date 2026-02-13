import bcrypt from "bcrypt";

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
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 giorni
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

    const registrationToken = signRegistrationToken({ userId: user._id.toString() });

    return res.status(201).json({
      message: "Registrazione avviata. Verifica l'OTP email per continuare.",
      registrationToken,
      next: "POST /auth/verify-email",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Errore interno registrazione",
      error: err.message,
    });
  }
}

/**
 * POST /auth/verify-email
 */
export async function verifyEmail(req, res) {
  try {
    if (!req.tenant) return res.status(400).json({ message: "Missing tenant" });

    const userId = req.registrationUserId;
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Missing OTP code" });

    const { User } = await getTenantModels(req);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // cross-tenant protection
    if (!assertUserTenantMatch(req, user)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    if (user.onboardingStatus !== OnboardingStatus.EMAIL_VERIFICATION) {
      return res.status(409).json({
        message: "Invalid onboarding step",
        expected: OnboardingStatus.EMAIL_VERIFICATION,
        current: user.onboardingStatus,
      });
    }

    if (!verifyEmailOtp(user, code)) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.emailVerified = true;
    user.onboardingStatus = OnboardingStatus.TOTP_SETUP;
    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;

    await user.save();

    return res.json({
      message: "Email verified. Proceed with TOTP setup.",
      next: "POST /auth/totp/setup",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Verify email error",
      error: err.message,
    });
  }
}

/**
 * POST /auth/totp/setup
 */
export async function totpSetup(req, res) {
  try {
    if (!req.tenant) return res.status(400).json({ message: "Missing tenant" });

    const userId = req.registrationUserId;

    const { User } = await getTenantModels(req);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // cross-tenant protection
    if (!assertUserTenantMatch(req, user)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    if (!user.emailVerified || user.onboardingStatus !== OnboardingStatus.TOTP_SETUP) {
      return res.status(409).json({
        message: "Invalid onboarding step",
        expected: OnboardingStatus.TOTP_SETUP,
        emailVerified: user.emailVerified,
        current: user.onboardingStatus,
      });
    }

    const secret = generateTotpSecret({ email: user.email, issuer: "PreFix" });
    applyTotpSecretToUser(user, secret.base32);

    const { token: totpSetupToken, expiresAt } = createAndApplyTotpSetupToken(user);
    await user.save();

    const qrCodeDataUrl = await buildQrCodeDataUrl(secret.otpauth_url);

    const isProd = process.env.NODE_ENV === "development";

    return res.json({
      message: "TOTP secret generated. Scan QR and verify with your app.",
      totpSetupToken,
      totpSetupTokenExpiresAt: expiresAt.toISOString(),
      qrCodeDataUrl,
      ...(isProd ? {} : { otpauthUrl: secret.otpauth_url }), // solo in sviluppo
      next: "POST /auth/totp/verify",
    });
  } catch (err) {
    return res.status(500).json({
      message: "TOTP setup error",
      error: err.message,
    });
  }
}

/**
 * POST /auth/totp/verify
 */
/**
 * POST /auth/totp/verify
 * Body: { totpSetupToken, code }
 * Middleware: requireRegistrationToken -> req.registrationUserId
 */
export async function totpVerify(req, res) {
  try {
    if (!req.tenant) return res.status(400).json({ message: "Missing tenant" });

    const userId = req.registrationUserId;
    const { totpSetupToken, code } = req.body;

    if (!totpSetupToken || !code) {
      return res.status(400).json({
        message: "Missing fields",
        required: ["totpSetupToken", "code"],
      });
    }

    const { User, Building } = await getTenantModels(req);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // cross-tenant protection
    if (!assertUserTenantMatch(req, user)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    if (!user.emailVerified || user.onboardingStatus !== OnboardingStatus.TOTP_SETUP) {
      return res.status(409).json({
        message: "Invalid onboarding step",
        expected: OnboardingStatus.TOTP_SETUP,
        current: user.onboardingStatus,
      });
    }

    if (!verifyTotpSetupToken(user, totpSetupToken)) {
      return res.status(400).json({ message: "Invalid or expired totpSetupToken" });
    }

    if (!verifyTotpCode(user, code)) {
      return res.status(400).json({ message: "Invalid TOTP code" });
    }

    // =========================
    // AUTO-ASSEGNAZIONE BUILDING (se esiste solo 1)
    // =========================
    const hasBuildingsAlready = Array.isArray(user.buildingIds) && user.buildingIds.length > 0;

    if (!hasBuildingsAlready) {
      const buildingsCount = await Building.countDocuments();
      if (buildingsCount === 1) {
        const onlyBuilding = await Building.findOne().select("_id").lean();
        if (onlyBuilding?._id) {
          user.buildingIds = [onlyBuilding._id];
        }
      }
    }

    // =========================
    // CHIUSURA ONBOARDING
    // =========================
    user.totpEnabled = true;
    user.onboardingStatus = OnboardingStatus.DONE;

    // bootstrap admin diventa subito active, gli altri pending
    user.status = user.isBootstrapAdmin ? "active" : "pending";

    user.totpSetupTokenHash = null;
    user.totpSetupTokenExpiresAt = null;

    await user.save();

    return res.json({
      message: user.isBootstrapAdmin
        ? "TOTP verified. Bootstrap admin activated."
        : "TOTP verified. Registration completed. Awaiting admin approval.",
      status: user.status,
    });
  } catch (err) {
    return res.status(500).json({
      message: "TOTP verify error",
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

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Missing fields",
        required: ["email", "password"],
      });
    }

    const { User } = await getTenantModels(req);
    const normalizedEmail = String(email).toLowerCase().trim();

    // riuso la tua verifyLogin (controlla bcrypt)
    const user = await userService.verifyLogin(User, normalizedEmail, password);
    if (!user) return res.status(401).json({ message: "Credenziali errate" });

    if (!assertUserTenantMatch(req, user)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Account non attivo. Contatta un amministratore." });
    }

    if (user.totpEnabled !== true) {
      return res.status(403).json({
        message: "TOTP non abilitato per questo account. Completa l'onboarding.",
      });
    }

    // Challenge token brevissimo con type dedicato
    const challengeToken = await generateLoginChallengeToken({
      userId: user._id.toString(),
      tenantId: req.tenant.tenantId,
      type: "login_challenge",
    });

    return res.json({
      message: "Credenziali ok. Inserisci il codice TOTP.",
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
    setRefreshTokenCookie(res, refreshToken);

    return res.json({
      message: "Login effettuato",
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
    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(500).json({ message: "Errore server refresh", error: err.message });
  }
}


/* ===================================================
   LOGOUT
=================================================== */
/*
export async function logout(req, res) {
  try {
    if (!req.tenant) return res.status(400).json({ message: "Missing tenant" });

    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(200).json({ message: "Already logged out" });

    const { User } = await getTenantModels(req);

    await userService.revokeRefreshToken(User, refreshToken); // ritorna true/false, puoi ignorarlo

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV !== "development",
      path: "/",
    });

    return res.json({ message: "Logout successful" });
  } catch (err) {
    return res.status(500).json({ message: "Logout failed", error: err.message });
  }
}
*/

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

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV !== "development",
      path: "/",
    });

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

    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Non autenticato" });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyAccessToken(token);

    const { User } = await getTenantModels(req);
    const user = await User.findById(payload.userId).select(
      "_id tenantId name surname email roles status createdAt updatedAt"
    );

    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    // ✅ cross-tenant protection
    if (!assertUserTenantMatch(req, user)) {
      return res.status(403).json({ message: "Tenant mismatch" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Utente non attivo", status: user.status });
    }

    return res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      roles: user.roles,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    if (err.message === "Access token invalido o scaduto") {
      return res.status(401).json({ message: "Token non valido o scaduto" });
    }
    return res.status(500).json({ message: "Errore interno del server", error: err.message });
  }
}
