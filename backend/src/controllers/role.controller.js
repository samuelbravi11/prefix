// controllers/role.controller.js
import { getTenantModels } from "../utils/tenantModels.js";
import { BASE_PERMISSIONS } from "../config/permissions.base.js";

/**
 * POST /api/v1/roles
 * Body:
 * {
 *   roleName: "manutentore",
 *   includeBase: true,
 *   extraPermissions: ["events:stats:view", "interventions:view"]
 * }
 */
export async function createRole(req, res) {
  try {
    const { Role, Permission } = getTenantModels(req);

    const roleName = String(req.body.roleName || "").trim();
    const includeBase = Boolean(req.body.includeBase);
    const extraPermissions = Array.isArray(req.body.extraPermissions)
      ? req.body.extraPermissions.map(String)
      : [];

    if (!roleName) {
      return res.status(400).json({ message: "roleName mancante" });
    }

    // blocca nomi riservati (admin, user_base)
    if (["admin", "user_base"].includes(roleName)) {
      return res.status(400).json({ message: "roleName riservato" });
    }

    // evita duplicati
    const existing = await Role.findOne({ roleName }).lean();
    if (existing) {
      return res.status(409).json({ message: "Ruolo già esistente" });
    }

    // costruisci permission names finali
    const finalNames = [
      ...(includeBase ? BASE_PERMISSIONS : []),
      ...extraPermissions,
    ];

    // uniq
    const uniqNames = [...new Set(finalNames)];

    // valida: devono esistere come Permission nel DB
    const permDocs = await Permission.find({ name: { $in: uniqNames } }).lean();
    const foundNames = new Set(permDocs.map(p => p.name));
    const missing = uniqNames.filter(n => !foundNames.has(n));

    if (missing.length) {
      return res.status(400).json({
        message: "Alcune permission non esistono nel DB (seed incompleto o typo)",
        missing,
      });
    }

    const role = await Role.create({
      roleName,
      permission: permDocs.map(p => p._id),
    });

    return res.status(201).json({
      message: "Ruolo creato",
      roleId: role._id,
      roleName: role.roleName,
      permissions: uniqNames,
    });
  } catch (err) {
    return res.status(500).json({ message: "Errore creazione ruolo", error: err.message });
  }
}

/**
 * GET /api/v1/roles
 * ritorna ruoli con permission names (comodo per UI)
 */
export async function listRoles(req, res) {
  try {
    const { Role } = getTenantModels(req);
    const roles = await Role.find().populate("permission", "name").lean();

    return res.json(
      roles.map(r => ({
        _id: r._id,
        roleName: r.roleName,
        permissions: (r.permission || []).map(p => p.name),
      }))
    );
  } catch (err) {
    return res.status(500).json({ message: "Errore lista ruoli", error: err.message });
  }
}

/**
 * GET /api/v1/permissions
 * lista di tutte le permission selezionabili in UI
 */
export async function listPermissions(req, res) {
  try {
    const { Permission } = getTenantModels(req);
    const perms = await Permission.find().sort({ name: 1 }).lean();
    return res.json(perms.map(p => ({ name: p.name, description: p.description || "" })));
  } catch (err) {
    return res.status(500).json({ message: "Errore lista permission", error: err.message });
  }
}
