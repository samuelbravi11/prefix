import { Router } from "express";
import authAudit from "../middleware/authAudit.middleware.js";
import * as authController from "../controllers/auth.controller.js";
import { requireRegistrationToken } from "../middleware/registrationToken.middleware.js";

const router = Router();

/**
 * AUTH ROUTES (REGISTRAZIONE)
 *
 * NOTA:
 * Queste rotte sono pubbliche, NON usano cookie.
 * Proteggiamo gli step 2-4 con registrationToken (Bearer) ottenuto a /register.
*/

/**
 * POST /auth/register
 * Crea utente (status=disabled) e invia OTP email.
 * Ritorna registrationToken per continuare onboarding.
 */
router.post(
  "/register",
  authAudit("USER_REGISTER"),
  authController.register
);

/**
 * POST /auth/verify-email
 * Step onboarding: verifica OTP email.
 * Richiede: Authorization Bearer <registrationToken>
*/
router.post("/verify-email", requireRegistrationToken, authController.verifyEmail);

/**
 * POST /auth/totp/setup
 * Step onboarding: genera seed TOTP e QR code.
 * Richiede: Authorization Bearer <registrationToken>
*/
router.post("/totp/setup", requireRegistrationToken, authController.totpSetup);

/**
 * POST /auth/totp/verify
 * Step onboarding: verifica TOTP code e finalizza registrazione (status -> pending).
 * Richiede: Authorization Bearer <registrationToken>
*/
router.post("/totp/verify", requireRegistrationToken, authController.totpVerify);






//******************************************************* */
router.post(
  "/login",
  authAudit("USER_LOGIN"),
  authController.login
);

router.post(
  "/refresh",
  authAudit("TOKEN_REFRESH"),
  authController.refresh
);

router.post(
  "/logout",
  authController.logout
);

router.get(
  "/me",
  authController.me
);

export default router;