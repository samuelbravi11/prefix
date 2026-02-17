// controllers/role.controller.js
import mongoose from "mongoose";
import { getTenantModels } from "../utils/tenantModels.js";
import { BASE_PERMISSIONS } from "../config/permissions.base.js";

export async function createRole(req, res) {
  try {
    const { Role, Permission } = getTenantModels(req);

    const roleName = String(req.body.roleName || "").trim();
    const extraPermissions = Array.isArray(req.body.extraPermissions)
      ? req.body.extraPermissions.map(String)
      : [];

    if (!roleName) {
      return res.status(400).json({ message: "roleName mancante" });
    }

    if (["admin", "user_base"].includes(roleName)) {
      return res.status(400).json({ message: "roleName riservato" });
    }

    const existing = await Role.findOne({ roleName }).lean();
    if (existing) {
      return res.status(409).json({ message: "Ruolo già esistente" });
    }

    const finalNames = [...BASE_PERMISSIONS, ...extraPermissions];
    const uniqNames = [...new Set(finalNames)].filter(Boolean);

    const permDocs = await Permission.find({ name: { $in: uniqNames } }).lean();
    const foundNames = new Set(permDocs.map((p) => p.name));
    const missing = uniqNames.filter((n) => !foundNames.has(n));

    if (missing.length) {
      return res.status(400).json({
        message: "Alcune permission non esistono nel DB (seed incompleto o typo)",
        missing,
      });
    }

    const role = await Role.create({
      roleName,
      permission: permDocs.map((p) => p._id),
    });

    return res.status(201).json({
      message: "Ruolo creato",
      roleId: role._id,
      roleName: role.roleName,
      permissions: uniqNames,
      basePermissions: BASE_PERMISSIONS,
    });
  } catch (err) {
    return res.status(500).json({ message: "Errore creazione ruolo", error: err.message });
  }
}

export async function listRoles(req, res) {
  try {
    const { Role } = getTenantModels(req);
    const roles = await Role.find({}).sort({ roleName: 1 }).lean();
    return res.json(roles);
  } catch (err) {
    return res.status(500).json({ message: "Errore recupero ruoli", error: err.message });
  }
}

export async function listPermissions(req, res) {
  try {
    const { Permission } = getTenantModels(req);
    const perms = await Permission.find({}).sort({ name: 1 }).lean();
    return res.json(perms);
  } catch (err) {
    return res.status(500).json({ message: "Errore recupero permessi", error: err.message });
  }
}

/**
 * DELETE /api/v1/roles/:id
 */
export async function deleteRole(req, res) {
  try {
    const { Role, User } = getTenantModels(req);
    const id = String(req.params.id || "").trim();

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "roleId non valido" });
    }

    const role = await Role.findById(id).select("_id roleName").lean();
    if (!role) return res.status(404).json({ message: "Ruolo non trovato" });

    if (["admin", "user_base"].includes(role.roleName)) {
      return res.status(400).json({ message: "Impossibile eliminare un ruolo riservato" });
    }

    const usersUsing = await User.countDocuments({ roles: id });
    if (usersUsing > 0) {
      return res.status(409).json({
        message: "Impossibile eliminare: ruolo ancora assegnato ad utenti",
        usersCount: usersUsing,
      });
    }

    await Role.deleteOne({ _id: id });

    return res.json({ deleted: true, roleId: id });
  } catch (err) {
    return res.status(500).json({ message: "Errore eliminazione ruolo", error: err.message });
  }
}
