import { verifyAccessToken } from "../services/token.service.js";

/* RICHIESTA TOKEN
  La Guard controlla il token
  - token mancante o invalido --> 401 Unauthorized
  - token valido --> la Guard sa chi è l’utente --> il middleware continua (next()) passando alla fase di autorizzazione (verifica ruoli dell'utente)
*/
async function requireAuth(req, res, next) {
  try {
    console.log("\nHEADER:", req.headers.authorization);
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token mancante" });
    }

    const token = header.split(" ")[1];

    // Decripta + validazione JWE
    const payload = await verifyAccessToken(token);

    req.user = payload;
    return next();
  } catch (error) {
    console.error("ERRORE AUTH:", error);
    return res.status(401).json({ message: "Token invalido o scaduto" });
  }
}

export default requireAuth;