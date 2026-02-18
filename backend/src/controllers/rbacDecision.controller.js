// controllers/rbacDecision.controller.js

import User from "../models/User.js";
import Role from "../models/Role.js";
import AuditLog from "../models/AuditLog.js";
import Permission from "../models/Permission.js";
import { resolveAllRoles } from "../utils/resolveRoles.js";

/* CONTROLLER PDP
  Il PDP, tramite l’endpoint /rbac/decide, riceve esclusivamente informazioni semantiche (userId e permission), non la route originale.
  Il suo compito è caricare i ruoli dell’utente, i permessi associati ai ruoli (ed eventuali gerarchie) e determinare se la permission richiesta è concessa o meno.
  Il PDP restituisce una decisione PERMIT o DENY al proxy. Il codice quindi riprenderà dal PEP con una variabile di ritorno (PERMIT o DENY) 
  su cui poi si baserà per decidere se continuare con la chiamata RESTful API di nuovo verso il server interno (GET /api/v1/users/me --> dopo il PERMIT) oppure semplicemente restituisce errore (DENY)
*/
export default async function rbacDecisionController(req, res) {
  const { userId, permission } = req.body;

  console.log("=== RBAC DECISION ===");
  console.log("User ID:", userId);
  console.log("Permission required:", permission);
  console.log("Request body:", req.body);

  try {
    if (!userId || !permission) {
      console.log("Missing userId or permission");
      return res.json({ allow: false, reason: "Missing parameters" });
    }

    // Recupera utente con ruoli diretti
    const user = await User.findById(userId).populate("roles");
    console.log("User found:", user ? "Yes" : "No");

    // Se l'utente non esiste --> DENY
    if (!user) {
      return res.json({ allow: false, reason: "User not found" });
    }

    console.log("User roles:", user.roles);

    // Se l'utente non è associato ad un ruolo --> DENY
    if (!user.roles || user.roles.length === 0) {
      await AuditLog.create({
        entityType: "RBAC_DECISION",
        action: "DENY",
        byUser: user._id,  // ✅ ora l'utente esiste
        details: { permission, reason: "User has no roles assigned" }
      });

      return res.json({ allow: false });
    }

    // Estrai ID dei ruoli diretti
    const directRoleIds = user.roles.map(r => r._id);

    // Risolvi gerarchia (RUOLI EREDITATI)
    const allRoleIds = await resolveAllRoles(directRoleIds);

    console.log(
      "[RBAC DEBUG] Direct roles:",
      directRoleIds
    );
    console.log(
      "[RBAC DEBUG] All resolved roles:",
      allRoleIds
    );

    // Recupera TUTTI i ruoli (diretti + ereditati) con permessi
    const roles = await Role.find({ _id: { $in: allRoleIds } })
      .populate("permission");


    roles.forEach(r => {
      if (!Array.isArray(r.permission)) {
        console.warn(
          "[RBAC WARNING] Role without permissions:",
          r.roleName,
          r._id
        );
      }
    });

    // Costruisci lista permessi effettivi
    const permissions = roles.flatMap(role =>
      Array.isArray(role.permission)
        ? role.permission.map(p => p.name)
        : []
    );

    console.log("Resolved roles:", roles.map(r => r.name));
    console.log("Effective permissions:", permissions);

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

    return res.json({
      allow,
      reason: allow ? "Permission granted" : "User lacks required permission",
      permission
    });

  } catch (err) {
    console.error("PDP decision error:", err);
    return res.status(500).json({ allow: false });
  }
}