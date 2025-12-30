import Building from "../models/Building.js";

/*
  Restituisce tutti i buildings a cui un utente è associato.
  L’utente deve essere già autenticato (id affidabile).
 */
export const getBuildingsByUser = async (user) => {
  if (!user || !user._id) {
    throw new Error("Invalid user passed to getBuildingsByUser");
  }

  if (!user.buildingIds || user.buildingIds.length === 0) {
    return [];
  }

  return Building.find({
    _id: { $in: user.buildingIds },
  }).lean();
};
