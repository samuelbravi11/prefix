import { getTenantModels } from "../utils/tenantModels.js";

/*
  Restituisce tutti i buildings a cui un utente è associato.
  L’utente deve essere già autenticato (id affidabile).
 */
export const getBuildingsByUser = async (ctx, user) => {
  const { Building } = ctx.models;
  if (!user?._id) throw new Error("Invalid user");
  if (!user.buildingIds?.length) return [];
  return Building.find({ _id: { $in: user.buildingIds } }).lean();
};

