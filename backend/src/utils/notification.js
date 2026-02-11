// src/utils/notification.js
export async function resolveUserByRoleAndBuilding(ctx, { roleName, buildingId }) {
  if (!roleName || !buildingId) return null;

  const { Role, User } = ctx.models;

  const role = await Role.findOne({ roleName }).select("_id").lean();
  if (!role) return null;

  const user = await User.findOne({
    roles: role._id,
    buildingIds: buildingId,
    status: "active",
    wantsNotifications: true,
  })
    .select("_id")
    .lean();

  return user ? String(user._id) : null;
}
