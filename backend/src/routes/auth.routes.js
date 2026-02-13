import { Router } from "express";
import authAudit from "../middleware/authAudit.middleware.js";
import * as authController from "../controllers/auth.controller.js";
import { requireRegistrationToken } from "../middleware/registrationToken.middleware.js";
import { bootstrapStart } from "../controllers/bootstrap.controller.js";


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




// Crea nel tenant DB utente admin_centrale con onboarding iniziale come nel tuo register
router.post("/bootstrap/start", authAudit("BOOTSTRAP_START"), bootstrapStart);



/**
 * LOGIN
 * il login è un processo in 2 step (passwordless OTP):
 * 1) POST /auth/login/start → invio email → ritorna loginChallengeToken (JWT breve)
 * 2) POST /auth/login/verify-totp → invio loginChallengeToken + TOTP code → ritorna accessToken + refreshToken
 * 
 * La challenge token funziona cosi:
 * - il server riceve l'email nello step 1, verifica che esista un utente con quell'email e se si genera un JWT breve (es. 3 minuti) con userId + tenantId + type: "login_challenge".
 * Firma del Challenge Token: il server prende l'Header e il Payload, li unisce e genera un hash usando la sua Secret Key. Il risultato è il loginChallengeToken.
 * - il client riceve la challenge token e la conserva (es. in memoria) per usarla nello step 2. Il client invia il loginChallengeToken nell'header Authorization: Bearer <token> e il codice TOTP nel corpo della richiesta.
 * - il server:
 * 1) Verifica la firma:
    Il server riceve il token. Prima di leggere i dati, ricalcola l'hash usando la sua Secret Key.
    Se l'hash ricalcolato non corrisponde alla firma nel token, la richiesta viene rigettata immediatamente (qualcuno ha manomesso il token).
  2) Verifica dei Claim:
    Controlla exp: Il token è scaduto?
    Controlla type: È un "login_challenge"? (Se l'utente provasse a usare un vecchio accessToken qui, il server lo boccerebbe perché il tipo non corrisponde).
  3) Verifica del TOTP:
    Solo se il token è valido, il server estrae lo userId dal payload e verifica se il codice TOTP fornito dall'utente è corretto per quell'utente.
  4) Emissione Token Finali:
    Se tutto è corretto, il server genera due nuovi JWT (accessToken e refreshToken), firmandoli sempre con la sua Secret Key.

 * In questo modo evitiamo di inviare l'email del userId direttamente nello step 2, e aggiungiamo un livello di sicurezza (il JWT breve) che lega la richiesta di login al successivo invio del TOTP code
 * inoltre, se un attacker intercettasse la challenge token, non potrebbe usarla per ottenere accessToken + refreshToken senza anche il TOTP code, e dato che la challenge token ha una scadenza breve, il rischio è limitato
*/
router.post("/login/start", authController.loginStart);

router.post("/login/verify-totp", authController.loginVerifyTotp);



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