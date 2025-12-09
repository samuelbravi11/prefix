// controllers/rbacDecision.controller.js

import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import Permission from "../models/permission.model.js";

/**
 * PDP Decision Controller
 * Riceve dalla Guard (rbacGuard) la richiesta:
 * {
 *   userId,
 *   roles,       <-- opzionale: se non ci sono, li recuperiamo dal DB
 *   action,      <-- GET / POST / PUT / DELETE
 *   resource     <-- es: /api/v1/users
 * }
 */
export default async function rbacDecisionController(req, res) {
  try {
    const { userId, roles, action, resource } = req.body;

    // ------------------------------
    // Recuperiamo i ruoli dell’utente dal DB se non sono nel token
    // ------------------------------
    let userRoles = roles;

    if (!userRoles || userRoles.length === 0) {
      const user = await User.findById(userId).populate("roles");

      if (!user) {
        return res.json({
          allow: false,
          reason: "Utente inesistente",
        });
      }

      userRoles = user.roles.map(r => r.name);
    }

    // ------------------------------
    // Recuperiamo i permessi associati ai ruoli dal DB
    // ------------------------------
    const roleDocs = await Role.find({ name: { $in: userRoles } })
      .populate("permissions");

    const permissions = roleDocs.flatMap(role =>
      role.permissions.map(p => p.name)
    );

    // ------------------------------
    // Normalizziamo il metodo HTTP in un "action type"
    // ------------------------------
    const actionMap = {
      GET: "read",
      POST: "create",
      PUT: "update",
      DELETE: "delete",
    };

    const normalizedAction = actionMap[action] || "unknown";

    // ------------------------------
    // Creiamo il permesso richiesto dalla richiesta
    // es: "/api/v1/users" + ":" + "update"
    // → "api/v1/users:update"
    // ------------------------------
    const resourceKey = sanitizeResource(resource); // funzione sotto
    const requiredPermission = `${resourceKey}:${normalizedAction}`;

    // ------------------------------
    // Controlliamo se l’utente ha questo permesso
    // ------------------------------
    const allow = permissions.includes(requiredPermission);

    // ------------------------------
    // Ritorniamo la decisione alla Guard
    // ------------------------------
    return res.json({
      allow,
      requiredPermission,
      permissionsUserHas: permissions,
      rolesUserHas: userRoles,
      reason: allow ? "Permit" : "Permission missing"
    });

  } catch (error) {
    console.error("Errore PDP decisionale:", error);
    return res.status(500).json({
      allow: false,
      reason: "Errore interno del PDP"
    });
  }
}


/** Utility: rimuove ID e query dagli URL così /api/v1/users/123 → /api/v1/users */
function sanitizeResource(resource) {
  return resource.replace(/\/\d+/g, "").replace(/\/$/, "");
}