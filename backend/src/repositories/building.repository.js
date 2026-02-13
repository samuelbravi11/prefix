import mongoose from "mongoose";
import { getTenantModels } from "../utils/tenantModels.js";

export const getBuildingsByUser = async (req, user) => {
  const { Building } = getTenantModels(req); // non serve await

  if (!user?._id) throw new Error("Invalid user");

  const idsRaw = Array.isArray(user.buildingIds) ? user.buildingIds : [];
  if (idsRaw.length === 0) return [];

  // evita cast error se ti arriva roba non ObjectId
  const ids = idsRaw
    .map(String)
    .filter((id) => mongoose.isValidObjectId(id));

  if (ids.length === 0) return [];

  return Building.find({ _id: { $in: ids } }).lean();
};
