// middleware/rbacGuard.js
import { PERMISSION_MAP } from "../config/permissions.map.js";
import { normalizePath } from "../utils/normalizePath.js";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || "http://localhost:4000";

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
        route: `${method} ${normalizedPath}`,
        hint: "Aggiungi questa route in PERMISSION_MAP oppure correggi normalizePath",
      });
    }

    const originalHost =
      req.headers["x-forwarded-host"] ||
      req.headers["x-original-host"] ||
      req.headers.host;

    // qua il proxy deve chiedere al PDP se l'utente ha il permesso richiesto
    // per questo chiamo la route interna del PDP che ho esposto appositamente per il proxy
    // il suo compito è solo quello di fare da tramite tra il proxy e il PDP vero e proprio (rbacDecisionController)
    const response = await fetch(`${INTERNAL_API_URL}/rbac/decide`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-proxy": "true",
        "x-internal-secret": process.env.INTERNAL_PROXY_SECRET || "",
        "x-forwarded-host": originalHost,
      },
      body: JSON.stringify({
        userId: req.user?._id,
        permission: requiredPermission,
      }),
    });

    // Salvo la risposta del PDP
    const decision = await response.json();

    // Se PDP nega, blocca la richiesta
    if (!decision.allow) {
      return res.status(403).json({
        message: "Permesso mancante",
        requiredPermission,
        route: `${method} ${normalizedPath}`,
        detail: decision.reason || "Permission denied by PDP",
      });
    }

    // Tutto ok --> il proxy inoltra finalmente la richiesta originale al server interno tramite il reverse proxy (internalProxy).
    // La richiesta originale (quella mandata dal client) prosegue il suo flusso normale verso il server interno.
    return next();
  } catch (err) {
    console.error("RBAC Guard error:", err);
    return res.status(500).json({ message: "RBAC error" });
  }
}