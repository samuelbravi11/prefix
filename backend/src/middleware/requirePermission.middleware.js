// src/middleware/requirePermission.middleware.js
import { getTenantModels } from "../utils/tenantModels.js";

/**
 * Middleware RBAC lato server (tenant-aware).
 * Richiede che req.user._id sia presente (quindi dopo auth middleware che decodifica JWT).
 */
export function requirePermission(requiredPermission) {
  return async function (req, res, next) {
    try {
      if (!requiredPermission) {
        return res.status(500).json({ message: "Missing requiredPermission in middleware" });
      }

      if (!req.user?._id) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const { User, Role } = getTenantModels(req);

      const user = await User.findById(req.user._id)
        .select("_id status roles")
        .populate({
          path: "roles",
          select: "_id roleName permission",
          populate: { path: "permission", select: "name" },
        });

      if (!user) return res.status(401).json({ message: "Utente non trovato" });

      // opzionale: se vuoi bloccare sempre chi non è active
      if (user.status !== "active") {
        return res.status(403).json({ message: "Utente non attivo", status: user.status });
      }

      const perms = new Set();
      for (const roleDoc of user.roles || []) {
        for (const p of roleDoc.permission || []) {
          if (p?.name) perms.add(p.name);
        }
      }

      if (!perms.has(requiredPermission)) {
        return res.status(403).json({
          message: "Permesso mancante",
          required: requiredPermission,
        });
      }

      return next();
    } catch (err) {
      return res.status(500).json({ message: "Errore verifica permessi", error: err.message });
    }
  };
}
