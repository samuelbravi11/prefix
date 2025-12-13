// controllers/rbacDecision.controller.js

import User from "../models/User.js";
import Role from "../models/Role.js";
import AuditLog from "../models/AuditLog.js";
import { resolveAllRoles } from "../utils/resolveRoles.js";

/* CONTROLLER PDP
  Il PDP, tramite l’endpoint /rbac/decide, riceve esclusivamente informazioni semantiche (userId e permission), non la route originale.
  Il suo compito è caricare i ruoli dell’utente, i permessi associati ai ruoli (ed eventuali gerarchie) e determinare se la permission richiesta è concessa o meno.
  Il PDP restituisce una decisione PERMIT o DENY al proxy. Il codice quindi riprenderà dal PEP con una variabile di ritorno (PERMIT o DENY) 
  su cui poi si baserà per decidere se continuare con la chiamata RESTful API di nuovo verso il server interno (GET /api/v1/users/me --> dopo il PERMIT) oppure semplicemente restituisce errore (DENY)
*/
export default async function rbacDecisionController(req, res) {
  const { userId, permission } = req.body;

  try {
    // Recupera utente con ruoli diretti
    const user = await User.findById(userId).populate("roles");

    // Se l'utente non esiste --> DENY
    if (!user) {
      await AuditLog.create({
        userId,
        permission,
        decision: "DENY",
        reason: "User not found"
      });

      return res.json({ allow: false });
    }

    // Se l'utente non è associato ad un ruolo --> DENY
    if (!user.roles || user.roles.length === 0) {
      await AuditLog.create({
        userId,
        permission,
        decision: "DENY",
        reason: "User has no roles assigned"
      });

      return res.json({ allow: false });
    }

    // Estrai ID dei ruoli diretti
    const directRoleIds = user.roles.map(r => r._id);

    // Risolvi gerarchia (RUOLI EREDITATI)
    const allRoleIds = await resolveAllRoles(directRoleIds);

    // Recupera TUTTI i ruoli (diretti + ereditati) con permessi
    const roles = await Role.find({ _id: { $in: allRoleIds } })
      .populate("permissions");

    // Costruisci lista permessi effettivi
    const permissions = roles.flatMap(role =>
      role.permissions.map(p => p.name)
    );

    // Decisione
    const allow = permissions.includes(permission);

    // Audit
    AuditLog.create({
      entityType: "RBAC_DECISION",
      entityId: null,
      action: allow ? "PERMIT" : "DENY",
      byUser: user._id,
      details: { permission, reason: allow ? "Permission granted" : "Permission denied", roles }
    });

    return res.json({ allow });

  } catch (err) {
    console.error("PDP decision error:", err);
    return res.status(500).json({ allow: false });
  }
}