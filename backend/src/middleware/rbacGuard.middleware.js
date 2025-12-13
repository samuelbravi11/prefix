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

    // Chiamata al proxy (me stesso), non al server interno
    // Questo perché tutte le chiamate che passano per /rbac/decide passeranno per internalProxy (vedi proxyApp.js in fondo)
    const response = await fetch("http://localhost:5000/rbac/decide", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: req.user.id,
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
    next();
  } catch (err) {
    console.error("RBAC Guard error:", err);
    res.status(500).json({ message: "RBAC error" });
  }
}