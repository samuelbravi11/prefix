// src/services/notificationRecipients.service.js

/**
 * Trova tutti gli userId che hanno un certo permesso.
 * Opzionale:
 * - buildingId: limita a utenti che hanno quel buildingId in user.buildingIds
 * - onlyActive: limita a user.status === "active"
 * - onlyOptIn: limita a user.wantsNotifications === true
 */
export async function findUserIdsByPermission(
  ctx,
  { permissionName, buildingId = null, onlyActive = true, onlyOptIn = true }
) {
  const { User, Role } = ctx.models;

  const userFilter = {};
  if (onlyActive) userFilter.status = "active";
  if (buildingId) userFilter.buildingIds = buildingId;

  // opt-in notifications
  if (onlyOptIn) userFilter.wantsNotifications = true;

  const users = await User.find(userFilter).select("_id roles").lean();
  if (!users.length) return [];

  const roleIds = [
    ...new Set(
      users.flatMap((u) => (Array.isArray(u.roles) ? u.roles.map(String) : []))
    ),
  ];
  if (!roleIds.length) return [];

  const roles = await Role.find({ _id: { $in: roleIds } })
    .populate("permission", "name")
    .lean();

  const rolePerms = new Map();
  for (const r of roles) {
    const perms = Array.isArray(r.permission)
      ? r.permission.map((p) => p?.name).filter(Boolean)
      : [];
    rolePerms.set(String(r._id), new Set(perms));
  }

  const allowed = [];
  for (const u of users) {
    const uRoleIds = Array.isArray(u.roles) ? u.roles.map(String) : [];
    const has = uRoleIds.some((rid) => rolePerms.get(rid)?.has(permissionName));
    if (has) allowed.push(String(u._id));
  }

  return allowed;
}
