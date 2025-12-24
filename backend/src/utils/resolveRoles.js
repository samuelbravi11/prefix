import RoleHierarchy from "../models/RoleHierarchy.js";

export async function resolveAllRoles(directRoleIds) {
  if (!directRoleIds || directRoleIds.length === 0) {
    return [];
  }
  
  const resolved = new Set();
  const queue = [...directRoleIds];

  while (queue.length > 0) {
    const roleId = queue.shift();

    if (resolved.has(roleId.toString())) continue;
    resolved.add(roleId.toString());

    // trova tutti i figli
    const children = await RoleHierarchy.find({
      parentRole: roleId
    }).lean();

    for (const rel of children) {
      queue.push(rel.childRole);
    }
  }

  // ritorna TUTTI i ruoli (padre + figli)
  return Array.from(resolved);
}