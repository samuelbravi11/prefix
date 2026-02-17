import { getTenantModels } from "../utils/tenantModels.js";

// Middleware per il controllo dello stato dell'utente
// - active: ok --> carico dati dell'utente + permissions
// - other: not ok --> utente non attivo
export default async function requireActiveUser(req, res, next) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    const { User, Role, Permission } = getTenantModels(req);

    // carico l’utente vero
    const user = await User.findById(req.user._id).lean();

    if (!user) {
      return res.status(401).json({ message: "Utente non trovato" });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Utente non attivo",
        status: user.status,
      });
    }

    // ✅ carico permissions dal ruolo (serve per buildings:inherit_all)
    const roleIds = (user.roles || []).map((id) => id.toString());

    let permissions = [];
    if (roleIds.length) {
      const roles = await Role.find({ _id: { $in: roleIds } })
        .select("_id permission")
        .lean();

      const permIds = roles.flatMap((r) => r.permission || []).map((id) => id.toString());

      if (permIds.length) {
        const perms = await Permission.find({ _id: { $in: permIds } })
          .select("name")
          .lean();
        permissions = [...new Set(perms.map((p) => p.name))];
      }
    }

    const inheritAllBuildings =
      user.isBootstrapAdmin === true || permissions.includes("buildings:inherit_all");

    // arricchisco req.user --> costruisco dati utente
    req.user = {
      _id: user._id,
      status: user.status,
      roleIds: user.roles || [],
      buildingIds: user.buildingIds || [],
      isBootstrapAdmin: user.isBootstrapAdmin === true,
      permissions,
      inheritAllBuildings,
    };

    next();
  } catch (err) {
    console.error("[requireActiveUser] error:", err);
    res.status(500).json({ message: "Errore verifica utente" });
  }
}
