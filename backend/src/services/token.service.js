import { EncryptJWT, jwtDecrypt } from "jose";

// --- VALIDAZIONE ENV ---

if (!process.env.JWE_KEY_ACTIVE) {
  throw new Error("Missing env: JWE_KEY_ACTIVE (must be a 32-char random string)");
}

if (!process.env.ACCESS_EXP) {
  throw new Error("Missing env: ACCESS_EXP");
}

if (!process.env.REFRESH_EXP) {
  throw new Error("Missing env: REFRESH_EXP");
}


// --- PREPARA CHIAVI --

const encoder = new TextEncoder();

// La chiave attiva deve essere esattamente 32 bytes (256 bit)
const activeKey = encoder.encode(process.env.JWE_KEY_ACTIVE);

if (activeKey.length !== 32) {
  throw new Error(
    `JWE_KEY_ACTIVE must be 32 characters (got length ${activeKey.length}).`
  );
}

// Rotazione chiavi precedenti
const prevKeys =
  process.env.JWE_KEYS_PREVIOUS && process.env.JWE_KEYS_PREVIOUS !== "[]"
    ? JSON.parse(process.env.JWE_KEYS_PREVIOUS).map(k => {
        const encoded = encoder.encode(k);
        if (encoded.length !== 32) {
          throw new Error(`JWE_KEYS_PREVIOUS entry not 32 chars`);
        }
        return encoded;
      })
    : [];


// GENERA ACCESS TOKEN --> Serve per autenticare le richieste API, quindi per accedere alla dashboard e risorse protette
// breve durata (es. 15 minuti)
// a differenza del refresh token, ha validità breve ma posso usarlo quante volte voglio
// quando scade, uso il refresh token per ottenerne uno nuovo richiamando la route POST /auth/refresh --> l'endpoint verifica la firma del refresh token e fingerprint (diverso da login)
export async function generateAccessToken(payload) {
  return await new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(process.env.ACCESS_EXP)
    .encrypt(activeKey);
}


// VERIFICA ACCESS TOKEN
export async function verifyAccessToken(token) {
  // prova chiave attiva
  try {
    const { payload } = await jwtDecrypt(token, activeKey);
    return payload;
  } catch {}

  // prova chiavi vecchie
  for (const key of prevKeys) {
    try {
      const { payload } = await jwtDecrypt(token, key);
      return payload;
    } catch {}
  }

  throw new Error("Access token invalido o scaduto");
}


// GENERA REFRESH TOKEN --> Serve per ottenere nuovi access token senza rifare login, mandando il refresh token al server
// lunga durata (es. 7 giorni)
// invio il refresh token UNICAMENTE alla route: POST /auth/refresh e ricevo in cambio un access token fresco
// per evitare furti di refresh token, ad ogni refresh ne genero uno nuovo (rotazione) e invalido il precedente sostituendolo nel DB
// nel DB non salvo mai il token in chiaro ma solo l'hash + uso fingerprint per legarlo al device --> ottengo una sessione utente legata ad un device specifico
export async function generateRefreshToken(payload) {
  return await new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(process.env.REFRESH_EXP)
    .encrypt(activeKey);
}


// VERIFICA REFRESH TOKEN
export async function verifyRefreshToken(token) {
  try {
    const { payload } = await jwtDecrypt(token, activeKey);
    return payload;
  } catch {}

  for (const key of prevKeys) {
    try {
      const { payload } = await jwtDecrypt(token, key);
      return payload;
    } catch {}
  }

  throw new Error("Refresh token invalido o scaduto");
}

// UTILE PER DEBUG
export async function decodeToken(token) {
  try {
    const { payload } = await jwtDecrypt(token, activeKey);
    return payload;
  } catch {
    return null;
  }
}