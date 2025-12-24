// middleware/rbacGuard.js
import { PERMISSION_MAP } from "../permissions.map.js";
import { normalizePath } from "../utils/normalizePath.js";

// MIDDLEWARE DI PEP
export default async function rbacGuard(req, res, next) {
  try {
    // Estrai informazioni dalla richiesta
    const method = req.method;
    const normalizedPath = normalizePath(req.baseUrl + req.path);

    // Mappatura da richiesta a permesso
    const permissionKey = `${method} ${normalizedPath}`;
    const requiredPermission = PERMISSION_MAP[permissionKey];

    if (!requiredPermission) {
      return res.status(403).json({
        message: "Permission not mapped",
        detail: permissionKey
      });
    }

    // qua il proxy deve chiedere al PDP se l'utente ha il permesso richiesto
    // per questo chiamo la route interna del PDP che ho esposto appositamente per il proxy
    // il suo compito è solo quello di fare da tramite tra il proxy e il PDP vero e proprio (rbacDecisionController)
    const response = await fetch("http://localhost:4000/rbac/decide", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-proxy": "true" 
      },
      body: JSON.stringify({
        userId: req.user.userId,
        permission: requiredPermission
      })
    });

    // Salvo la risposta del PDP
    const decision = await response.json();

    // Se PDP nega, blocca la richiesta
    if (!decision.allow) {
      return res.status(403).json({
        message: "Forbidden",
        reason: decision.reason
      });
    }

    // Tutto ok --> il proxy inoltra finalmente la richiesta originale al server interno tramite il reverse proxy (internalProxy).
    // La richiesta originale (quella mandata dal client) prosegue il suo flusso normale verso il server interno.
    next();
  } catch (err) {
    console.error("RBAC Guard error:", err);
    res.status(500).json({ message: "RBAC error" });
  }
}