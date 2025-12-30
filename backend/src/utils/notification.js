import User from "../models/User.js";
import Role from "../models/Role.js";

/**
  Risolve il destinatario di una notifica dato ruolo e edificio.
  - Esclude SEMPRE admin_centrale
  - Se non trova utenti validi → ritorna null
  @param {Object} params
  @param {string} params.role - ruolo target (es. "admin_locale")
  @param {ObjectId} params.buildingId
  @returns {ObjectId|null}
 */
export const resolveUserByRoleAndBuilding = async ({ roleName, buildingId }) => {
  if (!roleName || !buildingId) return null;

  // recupero il ruolo
  const role = await Role.findOne({ roleName }).select("_id");
  if (!role) {
    console.warn("[resolveUser] role not found:", roleName);
    return null;
  }

  // cerco un utente con quel ruolo e edificio
  const user = await User.findOne({
    roles: role._id,
    associatedBuildingIds: buildingId,
    status: "active"
  }).select("_id roles associatedBuildingIds");

  return user ? user._id : null;
};
