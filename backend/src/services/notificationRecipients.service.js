// src/services/notificationRecipients.service.js
import mongoose from "mongoose";

/**
 * Trova tutti gli userId che hanno un certo permesso.
 * Utilizza aggregazione con $lookup per efficienza.
 */
export async function findUserIdsByPermission(
  ctx,
  { permissionName, buildingId = null, onlyActive = true, onlyOptIn = true }
) {
  const { User } = ctx.models;

  const matchStage = {};

  if (onlyActive) matchStage.status = "active";
  if (buildingId) matchStage.buildingIds = buildingId;
  if (onlyOptIn) matchStage.wantsNotifications = true;

  const pipeline = [
    { $match: matchStage },
    { $project: { _id: 1, roles: 1 } },
    { $unwind: { path: "$roles", preserveNullAndEmptyArrays: false } },
    {
      $lookup: {
        from: "roles",
        localField: "roles",
        foreignField: "_id",
        as: "role",
      },
    },
    { $unwind: { path: "$role", preserveNullAndEmptyArrays: false } },
    {
      $lookup: {
        from: "permissions",
        localField: "role.permission",
        foreignField: "_id",
        as: "permissions",
      },
    },
    { $unwind: { path: "$permissions", preserveNullAndEmptyArrays: false } },
    { $match: { "permissions.name": permissionName } },
    { $group: { _id: "$_id" } },
    { $project: { userId: { $toString: "$_id" } } },
  ];

  const results = await User.aggregate(pipeline);
  return results.map((r) => r.userId);
}