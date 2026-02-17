import mongoose from "mongoose";
import { getTenantModels } from "./tenantModels.js";

/**
 * Cerca permessi in vari punti (dipende da come il tuo auth middleware li attacca).
 * - req.user.permissions (array string)
 * - req.userPermissions (array string)
 * - req.user.inheritAllBuildings (boolean)
 * - req.user.isBootstrapAdmin (boolean)
 */
export function userHasPermission(req, permName) {
  if (req?.user?.isBootstrapAdmin) return true;
  if (req?.user?.inheritAllBuildings) return true;

  const p1 = Array.isArray(req?.user?.permissions) ? req.user.permissions : [];
  const p2 = Array.isArray(req?.userPermissions) ? req.userPermissions : [];
  return [...p1, ...p2].includes(permName);
}

/**
 * Restituisce l’insieme di buildingIds accessibili all’utente:
 * - se ha buildings:inherit_all => tutti gli edifici attivi
 * - altrimenti => req.user.buildingIds
 */
export async function getAccessibleBuildingIds(req) {
  const { Building } = getTenantModels(req);

  if (userHasPermission(req, "buildings:inherit_all")) {
    const all = await Building.find({ isActive: true }).select("_id").lean();
    return all.map((b) => String(b._id));
  }

  const ids = Array.isArray(req?.user?.buildingIds) ? req.user.buildingIds : [];
  return ids.map(String).filter((id) => mongoose.isValidObjectId(id));
}

/**
 * Valida e normalizza buildingIds richiesti (query/body):
 * - se buildingIds vuoto / non presente => "all" (cioè tutti quelli accessibili)
 * - se presente => deve essere subset di accessibili
 */
export async function normalizeAndAuthorizeBuildingIds(req, requestedBuildingIds) {
  const accessible = await getAccessibleBuildingIds(req);
  const accessibleSet = new Set(accessible);

  // all / empty => tutti accessibili
  if (!requestedBuildingIds || requestedBuildingIds.length === 0) {
    return accessible;
  }

  const norm = [...new Set(requestedBuildingIds.map(String))].filter((id) => mongoose.isValidObjectId(id));

  const forbidden = norm.filter((id) => !accessibleSet.has(id));
  if (forbidden.length) {
    const err = new Error("Accesso non autorizzato ad uno o più edifici");
    err.status = 403;
    err.details = { forbiddenBuildingIds: forbidden };
    throw err;
  }

  return norm;
}
