import { verifyAccessToken } from "../services/token.service.js";

/*
  requireAuth (PROXY)
  - Preferisce il token in cookie HttpOnly: accessToken
  - Fallback su Authorization: Bearer <token> (utile per tool / swagger / debug)

  Se valido: imposta req.user = { _id }
*/
async function requireAuth(req, res, next) {
  try {
    // 1) Prefer HttpOnly cookie
    const cookieToken = req.cookies?.accessToken;

    // 2) Fallback: Authorization Bearer
    const header = req.headers.authorization || req.headers.Authorization || "";
    const bearerToken = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({ message: "Token mancante" });
    }

    // Validazione JWT
    const payload = await verifyAccessToken(token);

    // SOLO IDENTITÀ --> niente DB, niente ruoli
    req.user = {
      _id: payload.userId,
    };

    return next();
  } catch (error) {
    console.error("ERRORE AUTH:", error);
    return res.status(401).json({ message: "Token invalido o scaduto" });
  }
}

export default requireAuth;