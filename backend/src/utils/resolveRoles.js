/*
// utils/resolveRoles.js

export async function resolveAllRoles(RoleHierarchyModel, directRoleIds) {
  if (!directRoleIds || directRoleIds.length === 0) {
    return [];
  }

  const resolved = new Set();
  const queue = [...directRoleIds];

  while (queue.length > 0) {
    const roleId = queue.shift();
    const key = roleId.toString();

    if (resolved.has(key)) continue;

    resolved.add(key);

    // trova figli
    const children = await RoleHierarchyModel.find({
      parentRole: roleId,
    })
      .select("childRole")
      .lean();

    for (const rel of children) {
      queue.push(rel.childRole);
    }
  }

  return Array.from(resolved);
}
*/