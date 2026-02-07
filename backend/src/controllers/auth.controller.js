import User, { OnboardingStatus } from "../models/User.js";

import bcrypt from "bcrypt";
import userService from "../services/user.service.js";

import { generateEmailOtp, applyEmailOtpToUser } from "../services/emailOtp.service.js";
import { sendEmailOtp } from "../services/email.service.js";
import { signRegistrationToken } from "../services/registrationToken.service.js";

import { verifyEmailOtp } from "../services/emailOtp.service.js";
import {
  generateTotpSecret,
  applyTotpSecretToUser,
  buildQrCodeDataUrl,
  createAndApplyTotpSetupToken,
  verifyTotpSetupToken,
  verifyTotpCode,
} from "../services/totp.service.js";


function setRefreshTokenCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 giorni
  });
}

/* ---------------------------------------------------
   REGISTRAZIONE
--------------------------------------------------- */
/**
 * POST /auth/register
 * - Pubblico
 * - Crea utente in onboarding EMAIL_VERIFICATION
 * - status business rimane "disabled" finché non finisce TOTP
 * - genera OTP email e la invia
 * - ritorna registrationToken per step successivi
*/
export async function register(req, res) {
  try {
    const { name, surname, email, password, fingerprintHash } = req.body;

    if (!name || !email || !password || !fingerprintHash) {
      return res.status(400).json({
        message: "Tutti i campi sono obbligatori",
        required: ["name", "email", "password", "fingerprintHash"],
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await userService.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ message: "Utente già registrato" });
    }

    // password hash
    const passwordHash = await bcrypt.hash(password, 10);

    // creo utente (onboarding)
    const user = new User({
      name,
      surname: surname || "",
      email: normalizedEmail,

      emailVerified: false,
      onboardingStatus: OnboardingStatus.EMAIL_VERIFICATION,

      // durante onboarding NON è ancora pending
      status: "disabled",

      fingerprintHash,

      auth: {
        passwordHash,
        lastPasswordChangeAt: new Date(),
        refreshTokens: [],
      },
    });

    // genera otp e salva hash+expiry sul doc
    const otp = generateEmailOtp();
    const { expiresAt } = applyEmailOtpToUser(user, otp);

    await user.save();

    console.log("[REGISTER] created user:", user._id.toString(), user.email);
    console.log("[REGISTER] otp expiresAt:", expiresAt.toISOString());

    // invio OTP con Resend
    await sendEmailOtp({ to: user.email, otpCode: otp, expiresAt });

    // registration token per proseguire onboarding
    const registrationToken = signRegistrationToken({ userId: user._id.toString() });

    return res.status(201).json({
      message: "Registrazione avviata. Verifica l'OTP email per continuare.",
      registrationToken,
      next: "POST /auth/verify-email",
    });
  } catch (err) {
    console.error("Errore registrazione:", err);
    return res.status(500).json({
      message: "Errore interno registrazione",
      error: err.message,
    });
  }
}


/**
 * POST /auth/verify-email
 * Step onboarding:
 * - richiede registrationToken (middleware)
 * - verifica OTP email (hash+expires)
 * - passa a TOTP_SETUP
 */
export async function verifyEmail(req, res) {
  try {
    const userId = req.registrationUserId;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Missing OTP code" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // guard step
    if (user.onboardingStatus !== OnboardingStatus.EMAIL_VERIFICATION) {
      return res.status(409).json({
        message: "Invalid onboarding step",
        expected: OnboardingStatus.EMAIL_VERIFICATION,
        current: user.onboardingStatus,
      });
    }

    const ok = verifyEmailOtp(user, code);
    if (!ok) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // update onboarding
    user.emailVerified = true;
    user.onboardingStatus = OnboardingStatus.TOTP_SETUP;

    // cleanup OTP
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
 * Step onboarding:
 * - richiede registrationToken
 * - genera secret totp e salva cifrato
 * - genera QR code (dataUrl)
 * - genera totpSetupToken breve da rimandare al verify
 */
export async function totpSetup(req, res) {
  try {
    const userId = req.registrationUserId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // guard: email verified + stato corretto
    if (!user.emailVerified || user.onboardingStatus !== OnboardingStatus.TOTP_SETUP) {
      return res.status(409).json({
        message: "Invalid onboarding step",
        expected: OnboardingStatus.TOTP_SETUP,
        emailVerified: user.emailVerified,
        current: user.onboardingStatus,
      });
    }

    // genera secret
    const secret = generateTotpSecret({ email: user.email, issuer: "PreFix" });

    // salva secret cifrato
    applyTotpSecretToUser(user, secret.base32);

    // token breve per legare setup -> verify (anti-bypass step)
    const { token: totpSetupToken, expiresAt } = createAndApplyTotpSetupToken(user);

    await user.save();

    // genera QR server side
    const qrCodeDataUrl = await buildQrCodeDataUrl(secret.otpauth_url);

    return res.json({
      message: "TOTP secret generated. Scan QR and verify with your app.",
      totpSetupToken,
      totpSetupTokenExpiresAt: expiresAt.toISOString(),
      qrCodeDataUrl,
      // opzionale per debug/manual setup (in prod puoi rimuovere)
      otpauthUrl: secret.otpauth_url,
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
 * Step onboarding:
 * - richiede registrationToken
 * - verifica totpSetupToken breve (hash+expiry)
 * - verifica TOTP code
 * - se ok: totpEnabled=true, onboarding DONE, status -> pending
 */
export async function totpVerify(req, res) {
  try {
    const userId = req.registrationUserId;
    const { totpSetupToken, code } = req.body;

    if (!totpSetupToken || !code) {
      return res.status(400).json({
        message: "Missing fields",
        required: ["totpSetupToken", "code"],
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // guard step
    if (!user.emailVerified || user.onboardingStatus !== OnboardingStatus.TOTP_SETUP) {
      return res.status(409).json({
        message: "Invalid onboarding step",
        expected: OnboardingStatus.TOTP_SETUP,
        current: user.onboardingStatus,
      });
    }

    // verifica token breve setup->verify
    const tokenOk = verifyTotpSetupToken(user, totpSetupToken);
    if (!tokenOk) {
      return res.status(400).json({ message: "Invalid or expired totpSetupToken" });
    }

    // verifica codice TOTP
    const totpOk = verifyTotpCode(user, code);
    if (!totpOk) {
      return res.status(400).json({ message: "Invalid TOTP code" });
    }

    // finalizzo onboarding
    user.totpEnabled = true;
    user.onboardingStatus = OnboardingStatus.DONE;

    // status business: ora attende admin
    user.status = "pending";

    // cleanup token breve
    user.totpSetupTokenHash = null;
    user.totpSetupTokenExpiresAt = null;

    await user.save();

    return res.json({
      message: "TOTP verified. Registration completed. Awaiting admin approval.",
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
   LOGIN
--------------------------------------------------- */
export async function login(req, res) {
  try {
    const { email, password, fingerprintHash } = req.body;

    const user = await userService.verifyLogin(email, password);
    if (!user) {
      return res.status(401).json({ message: "Credenziali errate" });
    }

    if (user.status !== "active") {
      await AuditLog.create({
        entityType: "AUTH",
        entityId: user._id,
        action: "LOGIN_DENY",
        byUser: user._id,
        details: { status: user.status }
      });

      return res.status(403).json({
        message: "Account non attivo. Contatta un amministratore."
      });
    }

    const payload = {
      userId: user._id.toString(),
      status: user.status
    };

    // USA LE FUNZIONI CORRETTE
    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    await userService.addRefreshToken(user._id, refreshToken, fingerprintHash);
    setRefreshTokenCookie(res, refreshToken);

    await AuditLog.create({
      entityType: "AUTH",
      entityId: user._id,
      action: "LOGIN_SUCCESS",
      byUser: user._id
    });

    return res.json({
      message: "Login effettuato",
      accessToken,
      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Errore login:", err);
    return res.status(500).json({ message: "Errore server login" });
  }
}

/* ---------------------------------------------------
   REFRESH TOKEN
--------------------------------------------------- */
export async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const { fingerprintHash } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token mancante" });
    }

    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch (error) {
      console.error("Errore verifica refresh token:", error);
      return res.status(401).json({ message: "Refresh token non valido o scaduto" });
    }

    const user = await User.findById(payload.userId);
    if (!user || user.status !== "active") {
      return res.status(403).json({ message: "Account non valido" });
    }

    const userId = user._id.toString();
    
    // Genera nuovo refresh token
    const newRefreshToken = await generateRefreshToken({ userId });

    // Ruota i token
    const rotated = await userService.rotateRefreshToken(
      user._id,
      refreshToken,
      newRefreshToken,
      fingerprintHash
    );

    if (!rotated) {
      return res.status(401).json({
        message: "Refresh token non valido per questo dispositivo"
      });
    }

    // Genera nuovo access token CON STATUS
    const newAccessToken = await generateAccessToken({ 
      userId,
      status: user.status  // <-- IMPORTANTE: Includi lo status
    });
    
    // Imposta il nuovo refresh token nel cookie
    setRefreshTokenCookie(res, newRefreshToken);

    await AuditLog.create({
      entityType: "AUTH",
      entityId: user._id,
      action: "REFRESH_SUCCESS",
      byUser: user._id
    });

    return res.json({ 
      accessToken: newAccessToken 
    });

  } catch (err) {
    console.error("Errore refresh token:", err);
    return res.status(500).json({ message: "Errore server refresh" });
  }
}

/* ===================================================
   LOGOUT
=================================================== */
export async function logout(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(200).json({ message: "Already logged out" });
    }

    // hash del refresh token
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // rimuove SOLO quel refresh token
    await User.updateOne(
      { "auth.refreshTokens.tokenHash": tokenHash },
      { $pull: { "auth.refreshTokens": { tokenHash } } }
    );

    // cancella cookie - USA LO STESSO PATH DEL LOGIN!
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });

    return res.json({ message: "Logout successful" });

  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Logout failed" });
  }
}

/* ===================================================
   ME
=================================================== */
export const me = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Non autenticato" });
    }

    const token = authHeader.split(" ")[1];
    
    // USO LA FUNZIONE CORRETTA DAL token.service.js
    const payload = await verifyAccessToken(token);
    
    // DEBUG: log del payload
    console.log("[AUTH/ME] Payload dal token:", payload);
    
    // Recupera utente dal DB
    const user = await User.findById(payload.userId)
      .select("_id name surname email roles status buildingId createdAt updatedAt")
      .populate("roles", "roleName");

    if (!user) {
      console.log("[AUTH/ME] Utente non trovato per ID:", payload.userId);
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // DEBUG: log dello status
    console.log("[AUTH/ME] Status utente dal DB:", user.status);
    console.log("[AUTH/ME] Utente completo:", user);

    // Verifica che l'utente sia attivo (usa "active" minuscolo!)
    if (user.status !== "active") {
      console.log("[AUTH/ME] Utente non attivo. Status:", user.status);
      return res.status(403).json({ 
        message: "Utente non attivo",
        status: user.status 
      });
    }

    // Restituisci i dati dell'utente
    const responseData = {
      _id: user._id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      roles: user.roles,
      status: user.status,
      buildingId: user.buildingId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    console.log("[AUTH/ME] Risposta:", responseData);
    return res.json(responseData);

  } catch (err) {
    console.error("Errore in /auth/me:", err);
    
    if (err.message === "Access token invalido o scaduto") {
      return res.status(401).json({ message: "Token non valido o scaduto" });
    }
    
    return res.status(500).json({ message: "Errore interno del server" });
  }
};