import { SignJWT, jwtVerify } from "jose";

// --- VALIDAZIONE ENV ---
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

const encoder = new TextEncoder();
const accessKey = encoder.encode(process.env.JWT_SECRET);
const refreshKey = encoder.encode(process.env.REFRESH_TOKEN_SECRET);



// GENERA ACCESS TOKEN --> Serve per autenticare le richieste API, quindi per accedere alla dashboard e risorse protette
// breve durata (es. 15 minuti)
// a differenza del refresh token, ha validità breve ma posso usarlo quante volte voglio
// quando scade, uso il refresh token per ottenerne uno nuovo richiamando la route POST /auth/refresh --> l'endpoint verifica la firma del refresh token e fingerprint (diverso da login)
export async function generateAccessToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.ACCESS_EXP)
    .sign(accessKey);
}

export async function verifyAccessToken(token) {
  console.log("\n=== DEBUG TOKEN VERIFICATION ===");
  console.log("Token ricevuto:", token?.substring?.(0, 50) + "...");
  console.log("JWT_SECRET presente:", !!process.env.JWT_SECRET);
  
  try {
    const { payload } = await jwtVerify(token, accessKey);
    console.log("Token VALIDO - Payload:", payload);
    console.log("=== END DEBUG ===\n");
    return payload;
  } catch (err) {
    console.error("Token INVALIDO - Errore:", err.message);
    console.log("=== END DEBUG ===\n");
    throw new Error("Access token invalido o scaduto");
  }
}

// GENERA REFRESH TOKEN --> Serve per ottenere nuovi access token senza rifare login, mandando il refresh token al server
// lunga durata (es. 7 giorni)
// invio il refresh token UNICAMENTE alla route: POST /auth/refresh e ricevo in cambio un access token fresco
// per evitare furti di refresh token, ad ogni refresh ne genero uno nuovo (rotazione) e invalido il precedente sostituendolo nel DB
// nel DB non salvo mai il token in chiaro ma solo (l'hash + uso fingerprint) per legarlo al device --> ottengo una sessione utente legata ad un device specifico
// ogni dispositivo → fingerprint diversa → genera refresh token diverso → tutti validi
export async function generateRefreshToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.REFRESH_EXP)
    .sign(refreshKey); // <-- USA REFRESH KEY
}

export async function verifyRefreshToken(token) {
  try {
    const { payload } = await jwtVerify(token, refreshKey); // <-- USA REFRESH KEY
    return payload;
  } catch (err) {
    console.error("Refresh token invalido:", err.message);
    throw new Error("Refresh token invalido o scaduto");
  }
}

// DEBUG — decodifica senza verificare la firma
export async function decodeToken(token) {
  try {
    const { payload } = await jwtVerify(token, accessKey);
    return payload;
  } catch {
    return null;
  }
}