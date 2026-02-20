import mongoose from "mongoose";
import { getTenantModels } from "../utils/tenantModels.js";
import { userHasPermission } from "../utils/accessControl.js";

export const getBuildingsByUser = async (req, user) => {
  const { Building } = getTenantModels(req);

  if (!user?._id) throw new Error("Invalid user");

  // Admin / privilegiati: eredita tutti gli edifici
  if (user?.inheritAllBuildings || userHasPermission(req, "buildings:inherit_all")) {
    return Building.find({ isActive: true }).lean();
  }

  const idsRaw = Array.isArray(user.buildingIds) ? user.buildingIds : [];
  if (idsRaw.length === 0) return [];

  const ids = idsRaw.map(String).filter((id) => mongoose.isValidObjectId(id));
  if (ids.length === 0) return [];

  return Building.find({ _id: { $in: ids }, isActive: true }).lean();
};

export async function getBuildingById(req, buildingId) {
  const { Building } = getTenantModels(req);
  return Building.findById(buildingId).lean();
}

export async function createBuilding(req, data) {
  const { Building } = getTenantModels(req);
  const doc = await Building.create(data);
  return doc.toObject();
}

export async function updateBuilding(req, buildingId, patch) {
  const { Building } = getTenantModels(req);
  return Building.findByIdAndUpdate(buildingId, { $set: patch }, { new: true }).lean();
}

export async function getAllBuildingsWithStats(req, { sortBy, order, includeInactive }) {
  const { Building, Asset, Rule } = getTenantModels(req);

  // UI helper: per la tabella "visualizza edifici" il frontend mostra se l'edificio
  // è già associato all'utente corrente.
  // - Se l'utente eredita tutti gli edifici -> sempre true
  // - Altrimenti -> true se _id è presente in user.buildingIds
  const inheritAll = Boolean(req.user?.inheritAllBuildings) || userHasPermission(req, "buildings:inherit_all");
  const rawUserIds = Array.isArray(req.user?.buildingIds) ? req.user.buildingIds : [];
  const associatedIds = inheritAll
    ? []
    : rawUserIds
        .map(String)
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id));

  const assetCol = Asset.collection.name;
  const ruleCol = Rule.collection.name;

  const match = includeInactive ? {} : { isActive: true };

  const pipeline = [
    { $match: match },
    // flag association per UX (richiesta assegnazione / edit)
    {
      $addFields: {
        isAssociated: inheritAll ? true : { $in: ["$_id", associatedIds] },
      },
    },
    {
      $lookup: {
        from: assetCol,
        let: { bid: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$buildingId", "$$bid"] } } },
          { $project: { _id: 1 } },
        ],
        as: "_assets",
      },
    },
    {
      $addFields: {
        assetsCount: { $size: "$_assets" },
        _assetIds: { $map: { input: "$_assets", as: "a", in: "$$a._id" } },
      },
    },
    {
      $lookup: {
        from: ruleCol,
        let: { aids: "$_assetIds" },
        pipeline: [
          { $match: { $expr: { $gt: [{ $size: { $setIntersection: ["$assetIds", "$$aids"] } }, 0] } } },
          { $project: { _id: 1 } },
        ],
        as: "_rules",
      },
    },
    { $addFields: { rulesCount: { $size: "$_rules" } } },
    { $project: { _assets: 0, _assetIds: 0, _rules: 0 } },
  ];

  pipeline.push({ $sort: { [sortBy]: order } });

  return Building.aggregate(pipeline);
}

export async function deleteBuildingSafe(req, buildingId) {
  const { Building, Asset, Request, User } = getTenantModels(req);

  const b = await Building.findById(buildingId).lean();
  if (!b) return { code: "NOT_FOUND" };

  const assetsCount = await Asset.countDocuments({ buildingId });
  if (assetsCount > 0) return { code: "HAS_ASSETS", assetsCount };

  const pendingRequestsCount = await Request.countDocuments({
    requestType: "ASSIGN_BUILDING",
    status: "PENDING",
    "payload.buildingId": buildingId,
  });
  if (pendingRequestsCount > 0) return { code: "HAS_PENDING_REQUESTS", pendingRequestsCount };

  await Building.deleteOne({ _id: buildingId });

  const users = await User.updateMany({ buildingIds: buildingId }, { $pull: { buildingIds: buildingId } });

  const requests = await Request.deleteMany({
    requestType: "ASSIGN_BUILDING",
    "payload.buildingId": buildingId,
  });

  return {
    code: "DELETED",
    cleanup: { usersModified: users.modifiedCount, requestsDeleted: requests.deletedCount },
  };
}