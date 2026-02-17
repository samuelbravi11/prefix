import mongoose from "mongoose";
import { getTenantModels } from "../utils/tenantModels.js";
import { normalizeAndAuthorizeBuildingIds } from "../utils/accessControl.js";

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/v1/assets
 * Query:
 *  - buildingIds=id1,id2 (opzionale; se vuoto => tutti accessibili)
 *  - q=string (ricerca su name)
 *  - page, limit
 */
export async function listAssets(req, res) {
  try {
    const { Asset } = getTenantModels(req);

    const q = String(req.query.q || "").trim();
    const page = Math.max(1, parseInt(req.query.page || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "25", 10) || 25));

    const buildingIdsRaw = String(req.query.buildingIds || "").trim();
    const requestedBuildingIds = buildingIdsRaw
      ? buildingIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const buildingIds = await normalizeAndAuthorizeBuildingIds(req, requestedBuildingIds);

    const filter = { buildingId: { $in: buildingIds } };

    if (q) {
      const rx = new RegExp(escapeRegExp(q), "i");
      filter.name = rx;
    }

    const [total, items] = await Promise.all([
      Asset.countDocuments(filter),
      Asset.find(filter)
        .sort({ createdAt: -1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.json({ page, limit, total, items });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || "Errore lista asset",
      ...(err.details ? { details: err.details } : {}),
    });
  }
}

/**
 * POST /api/v1/assets
 * Body:
 *  - buildingId (obbligatorio)
 *  - name (obbligatorio)
 *  - altri campi a tua scelta (type, description, ecc.)
 */
export async function createAsset(req, res) {
  try {
    const { Asset } = getTenantModels(req);

    const buildingId = String(req.body?.buildingId || "").trim();
    const name = String(req.body?.name || "").trim();

    if (!mongoose.isValidObjectId(buildingId)) {
      return res.status(400).json({ message: "buildingId non valido" });
    }
    if (!name || name.length < 2) {
      return res.status(400).json({ message: "name obbligatorio (min 2 caratteri)" });
    }

    // autorizzazione edificio (deve essere accessibile)
    await normalizeAndAuthorizeBuildingIds(req, [buildingId]);

    const payload = {
      ...req.body,
      buildingId,
      name,
    };

    const created = await Asset.create(payload);
    return res.status(201).json(created.toObject());
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || "Errore creazione asset",
      ...(err.details ? { details: err.details } : {}),
    });
  }
}

/**
 * PUT /api/v1/assets/:id
 */
export async function updateAsset(req, res) {
  try {
    const { Asset } = getTenantModels(req);

    const id = String(req.params.id || "");
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "assetId non valido" });

    const existing = await Asset.findById(id).lean();
    if (!existing) return res.status(404).json({ message: "Asset non trovato" });

    // autorizza rispetto al building dell’asset esistente
    await normalizeAndAuthorizeBuildingIds(req, [String(existing.buildingId)]);

    const patch = { ...req.body };

    if (patch.name !== undefined) {
      patch.name = String(patch.name).trim();
      if (patch.name.length < 2) return res.status(400).json({ message: "name min 2 caratteri" });
    }

    // Se provano a cambiare buildingId, blocco (evita bypass)
    if (patch.buildingId && String(patch.buildingId) !== String(existing.buildingId)) {
      return res.status(400).json({ message: "Non è consentito cambiare buildingId di un asset" });
    }

    const updated = await Asset.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    return res.json(updated);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || "Errore update asset",
      ...(err.details ? { details: err.details } : {}),
    });
  }
}

/**
 * DELETE /api/v1/assets/:id
 * Regola conservativa: blocca se esistono Rule che referenziano l’asset
 */
export async function deleteAsset(req, res) {
  try {
    const { Asset, Rule } = getTenantModels(req);

    const id = String(req.params.id || "");
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "assetId non valido" });

    const existing = await Asset.findById(id).lean();
    if (!existing) return res.status(404).json({ message: "Asset non trovato" });

    await normalizeAndAuthorizeBuildingIds(req, [String(existing.buildingId)]);

    const rulesCount = await Rule.countDocuments({ assetIds: id });
    if (rulesCount > 0) {
      return res.status(409).json({
        message: "Impossibile eliminare l’asset: esistono regole collegate. Rimuovi prima le regole.",
        rulesCount,
      });
    }

    await Asset.deleteOne({ _id: id });
    return res.json({ deleted: true, assetId: id });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || "Errore delete asset",
      ...(err.details ? { details: err.details } : {}),
    });
  }
}
