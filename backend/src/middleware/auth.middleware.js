import { verifyAccessToken } from "../services/token.service.js";

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token mancante" });
    }

    const token = header.split(" ")[1];
    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalido o scaduto" });
  }
}

export default requireAuth;