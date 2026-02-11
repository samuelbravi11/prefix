// controllers/rbacDecision.controller.js
import { getTenantModels } from "../utils/tenantModels.js";

/* CONTROLLER PDP
  Il PDP, tramite l’endpoint /rbac/decide, riceve esclusivamente informazioni semantiche (userId e permission), non la route originale.
  Il suo compito è caricare i ruoli dell’utente, i permessi associati ai ruoli (ed eventuali gerarchie) e determinare se la permission richiesta è concessa o meno.
  Il PDP restituisce una decisione PERMIT o DENY al proxy. Il codice quindi riprenderà dal PEP con una variabile di ritorno (PERMIT o DENY) 
  su cui poi si baserà per decidere se continuare con la chiamata RESTful API di nuovo verso il server interno (GET /api/v1/users/me --> dopo il PERMIT) oppure semplicemente restituisce errore (DENY)
*/
export default async function rbacDecisionController(req, res) {
  const { userId, permission } = req.body;

  try {
    if (!userId || !permission) {
      return res.json({ allow: false, reason: "Missing parameters" });
    }

    const { User, Role, AuditLog } = getTenantModels(req);

    const user = await User.findById(userId).populate("roles");

    // CHECK 1: utente esiste
    if (!user) {
      await AuditLog.create({
        entityType: "RBAC_DECISION",
        action: "DENY",
        byUser: null,
        details: { userId, permission, reason: "User not found" },
      });

      return res.json({ allow: false, reason: "User not found" });
    }

    // CHECK 2: utente attivo (QUI VA IL CHECK)
    if (user.status !== "active") {
      await AuditLog.create({
        entityType: "RBAC_DECISION",
        action: "DENY",
        byUser: user._id,
        details: { permission, reason: "User not active" },
      });

      return res.json({ allow: false, reason: "User not active" });
    }

    // CHECK 3: ha ruoli
    const roleIds = (user.roles || []).map(r => r._id);

    if (!roleIds.length) {
      await AuditLog.create({
        entityType: "RBAC_DECISION",
        action: "DENY",
        byUser: user._id,
        details: { permission, reason: "No roles assigned" },
      });

      return res.json({ allow: false, reason: "No roles assigned" });
    }

    // carica ruoli con permessi
    const roles = await Role.find({ _id: { $in: roleIds } })
      .populate("permission");

    const permissions = roles.flatMap(role =>
      Array.isArray(role.permission)
        ? role.permission.map(p => p.name)
        : []
    );

    const allow = permissions.includes(permission);

    await AuditLog.create({
      entityType: "RBAC_DECISION",
      action: allow ? "PERMIT" : "DENY",
      byUser: user._id,
      details: { permission, roleIds },
    });

    return res.json({
      allow,
      reason: allow ? "Permission granted" : "Permission denied",
      permission,
    });

  } catch (err) {
    return res.status(500).json({
      allow: false,
      reason: "Internal error",
    });
  }
}