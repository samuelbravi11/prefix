import RoleHierarchy from "../models/RoleHierarchy.js";

export async function resolveAllRoles(roleIds) {
  const visited = new Set(roleIds.map(String));
  const queue = [...roleIds];

  while (queue.length) {
    const current = queue.shift();

    const parents = await RoleHierarchy.find({ childRole: current });
    for (const p of parents) {
      if (!visited.has(String(p.parentRole))) {
        visited.add(String(p.parentRole));
        queue.push(p.parentRole);
      }
    }
  }

  return [...visited];
}
