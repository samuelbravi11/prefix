// src/seed/seedTenantMinimum.js
import { PERMISSION_MAP } from "../config/permissions.map.js";
import { BASE_PERMISSIONS } from "../config/permissions.base.js";

import { RoleSchema } from "../models/Role.js";
import { PermissionSchema } from "../models/Permission.js";

/**
 * Seed minimo nel DB tenant:
 * - crea tutte le Permission presenti nel PERMISSION_MAP
 * - crea/aggiorna ruolo "admin" con TUTTE le permission
 * - crea/aggiorna ruolo "user_base" con le permission di BASE_PERMISSIONS
 *
 * Ritorna { adminRole, baseRole }
 */
export async function seedTenantMinimum(conn) {
  const Role = conn.models.Role || conn.model("Role", RoleSchema);
  const Permission = conn.models.Permission || conn.model("Permission", PermissionSchema);

  // Tutte le permission "possibili"
  const allPermissionNames = [...new Set(Object.values(PERMISSION_MAP))];

  // 1) upsert permissions
  const permDocsByName = new Map();
  for (const name of allPermissionNames) {
    const perm = await Permission.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, description: "" } },
      { upsert: true, new: true }
    );
    permDocsByName.set(name, perm);
  }

  // Helper: name[] -> ObjectId[]
  const toPermIds = (names) => {
    const uniq = [...new Set(names)];
    const ids = [];
    for (const n of uniq) {
      const doc = permDocsByName.get(n);
      if (!doc) {
        // se sbagli a scrivere una permission in BASE_PERMISSIONS, preferisco fallire subito
        throw new Error(`BASE_PERMISSIONS contains unknown permission: '${n}'`);
      }
      ids.push(doc._id);
    }
    return ids;
  };

  // 2) ruolo admin = tutte le permission
  const adminRole = await Role.findOneAndUpdate(
    { roleName: "admin" },
    { $set: { roleName: "admin", permission: toPermIds(allPermissionNames) } },
    { upsert: true, new: true }
  );

  // 3) ruolo user_base = subset
  const baseRole = await Role.findOneAndUpdate(
    { roleName: "user_base" },
    { $set: { roleName: "user_base", permission: toPermIds(BASE_PERMISSIONS) } },
    { upsert: true, new: true }
  );

  return { adminRole, baseRole };
}
