// services/token.service.js
import { SignJWT, jwtVerify, decodeJwt } from "jose";

// -----------------------------------------------------
// VALIDAZIONE ENV
// -----------------------------------------------------
if (!process.env.JWT_SECRET) {
  throw new Error("Missing env: JWT_SECRET");
}

if (!process.env.REFRESH_TOKEN_SECRET) {
  throw new Error("Missing env: REFRESH_TOKEN_SECRET");
}

if (!process.env.ACCESS_EXP) {
  throw new Error("Missing env: ACCESS_EXP");
}

if (!process.env.REFRESH_EXP) {
  throw new Error("Missing env: REFRESH_EXP");
}

const LOGIN_CHALLENGE_EXP = process.env.LOGIN_CHALLENGE_EXP || "2m";

const encoder = new TextEncoder();

const accessKey = encoder.encode(process.env.JWT_SECRET);
const refreshKey = encoder.encode(process.env.REFRESH_TOKEN_SECRET);

// fallback corretto
const LOGIN_CHALLENGE_SECRET =
  process.env.LOGIN_CHALLENGE_TOKEN_SECRET || process.env.JWT_SECRET;

const challengeKey = encoder.encode(LOGIN_CHALLENGE_SECRET);



// -----------------------------------------------------
// ACCESS TOKEN
// -----------------------------------------------------
// GENERA ACCESS TOKEN --> Serve per autenticare le richieste API, quindi per accedere alla dashboard e risorse protette
// breve durata (es. 15 minuti)
// a differenza del refresh token, ha validità breve ma posso usarlo quante volte voglio
// quando scade, uso il refresh token per ottenerne uno nuovo richiamando la route POST /auth/refresh --> l'endpoint verifica la firma del refresh token e fingerprint (diverso da login)
export async function generateAccessToken(payload) {
  // payload tipico: { userId, status }
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.ACCESS_EXP)
    .sign(accessKey);
}

export async function verifyAccessToken(token) {
  try {
    const { payload } = await jwtVerify(token, accessKey);
    return payload;
  } catch (err) {
    throw new Error("Access token invalido o scaduto");
  }
}

// -----------------------------------------------------
// REFRESH TOKEN
// -----------------------------------------------------
// GENERA REFRESH TOKEN --> Serve per ottenere nuovi access token senza rifare login, mandando il refresh token al server
// lunga durata (es. 7 giorni)
// invio il refresh token UNICAMENTE alla route: POST /auth/refresh e ricevo in cambio un access token fresco
// per evitare furti di refresh token, ad ogni refresh ne genero uno nuovo (rotazione) e invalido il precedente sostituendolo nel DB
// nel DB non salvo mai il token in chiaro ma solo (l'hash + uso fingerprint) per legarlo al device --> ottengo una sessione utente legata ad un device specifico
// ogni dispositivo → fingerprint diversa → genera refresh token diverso → tutti validi
export async function generateRefreshToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.REFRESH_EXP)
    .sign(refreshKey);
}

export async function verifyRefreshToken(token) {
  try {
    const { payload } = await jwtVerify(token, refreshKey);
    return payload;
  } catch (err) {
    throw new Error("Refresh token invalido o scaduto");
  }
}


// -----------------------------------------------------
// LOGIN CHALLENGE TOKEN (Step A -> Step B TOTP)
// -----------------------------------------------------
export async function generateLoginChallengeToken(payload) {
  // payload richiesto: { userId, tenantId, type: "login_challenge" }
  // NB: scadenza molto breve
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(LOGIN_CHALLENGE_EXP)
    .sign(challengeKey);
}

export async function verifyLoginChallengeToken(token) {
  try {
    const { payload } = await jwtVerify(token, challengeKey);

    if (payload?.type !== "login_challenge") {
      throw new Error("Invalid challenge type");
    }

    return payload;
  } catch (err) {
    throw new Error("Login challenge token invalido o scaduto");
  }
}


// -----------------------------------------------------
// DEBUG: decode senza verifica firma (solo client-side / debug)
// -----------------------------------------------------
export function decodeToken(token) {
  try {
    return decodeJwt(token);
  } catch {
    return null;
  }
}