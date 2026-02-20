// controllers/role.controller.js
import mongoose from "mongoose";
import { getTenantModels } from "../utils/tenantModels.js";
import { BASE_PERMISSIONS } from "../config/permissions.base.js";

/**
 * In alcuni tenant già esistenti può capitare che il seed iniziale non abbia inserito
 * tutte le permission (es. "preferences:manage"). Questo helper fa upsert "soft":
 * crea solo le permission mancanti, senza toccare quelle già presenti.
 *
 * NB: assumiamo che lo schema Permission abbia almeno il campo `name`.
 */
async function ensurePermissionsExist(Permission, names) {
  const uniq = [...new Set((names || []).map(String).map((s) => s.trim()).filter(Boolean))];
  if (!uniq.length) return { created: [], existing: [] };

  const existingDocs = await Permission.find({ name: { $in: uniq } }).select("name").lean();
  const existingNames = new Set(existingDocs.map((p) => String(p.name)));

  const missing = uniq.filter((n) => !existingNames.has(n));

  if (!missing.length) return { created: [], existing: uniq };

  // upsert "blindato" (non fallisce se chiamato in parallelo)
  // usa bulkWrite per efficienza e atomicità per documento
  await Permission.bulkWrite(
    missing.map((name) => ({
      updateOne: {
        filter: { name },
        update: { $setOnInsert: { name } },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  return { created: missing, existing: uniq };
}

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

    // Tutti i ruoli DEVONO includere i permessi base
    const finalNames = [...BASE_PERMISSIONS, ...extraPermissions];
    const uniqNames = [...new Set(finalNames.map(String).map((s) => s.trim()))].filter(Boolean);

    // ✅ FIX: se il tenant è "vecchio" e manca qualche permission (es. preferences:manage),
    // la creiamo al volo per evitare blocchi lato UI.
    await ensurePermissionsExist(Permission, uniqNames);

    // Ora rileggo e valido in modo deterministico
    const permDocs = await Permission.find({ name: { $in: uniqNames } }).lean();
    const foundNames = new Set(permDocs.map((p) => p.name));
    const missing = uniqNames.filter((n) => !foundNames.has(n));

    if (missing.length) {
      // Questo può accadere solo se schema Permission è diverso (es. campo non "name")
      // o se ci sono vincoli che impediscono upsert.
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

    // Popola i permessi per mostrare i nomi nel frontend.
    // Manteniamo anche il campo `permission` per compatibilità.
    const roles = await Role.find({})
      .sort({ roleName: 1 })
      .populate({ path: "permission", select: "name" })
      .lean();

    const normalized = roles.map((r) => {
      const permissionNames = Array.isArray(r.permission)
        ? r.permission
            .map((p) => (typeof p === "string" ? p : p?.name))
            .filter(Boolean)
            .map(String)
        : [];

      return {
        ...r,
        permissionNames: Array.from(new Set(permissionNames)).sort((a, b) => a.localeCompare(b)),
      };
    });

    return res.json(normalized);
  } catch (err) {
    return res.status(500).json({ message: "Errore recupero ruoli", error: err.message });
  }
}

export async function listPermissions(req, res) {
  try {
    const { Permission } = getTenantModels(req);

    const perms = await Permission.find({}).sort({ name: 1 }).select("name").lean();

    // Risposta stabile per il frontend:
    // - allPermissions: string[]
    // - basePermissions: string[] (user_base)
    return res.json({
      allPermissions: perms.map((p) => String(p.name)),
      basePermissions: BASE_PERMISSIONS,
    });
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