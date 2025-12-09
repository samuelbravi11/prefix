// src/middlewares/requireAuth.js

import { verifyAccessToken } from "../services/token.service.js";


async function requireAuth(req, res, next) {
  try {
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