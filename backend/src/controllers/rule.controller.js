import mongoose from "mongoose";
import { getTenantModels } from "../utils/tenantModels.js";
import { normalizeAndAuthorizeBuildingIds } from "../utils/accessControl.js";

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/v1/rules
 * Query:
 *  - buildingIds=... (opzionale; se vuoto => tutti accessibili)
 *  - assetIds=a1,a2 (opzionale; filtra regole che hanno assetIds in quell’insieme)
 *  - q=... (ricerca per name)
 *  - page, limit
 */
export async function listRules(req, res) {
  try {
    const { Rule, Asset } = getTenantModels(req);

    const q = String(req.query.q || "").trim();
    const page = Math.max(1, parseInt(req.query.page || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "25", 10) || 25));

    const buildingIdsRaw = String(req.query.buildingIds || "").trim();
    const requestedBuildingIds = buildingIdsRaw
      ? buildingIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const buildingIds = await normalizeAndAuthorizeBuildingIds(req, requestedBuildingIds);

    // assetIds filter (opzionale)
    const assetIdsRaw = String(req.query.assetIds || "").trim();
    const assetIds = assetIdsRaw
      ? assetIdsRaw.split(",").map((s) => s.trim()).filter((id) => mongoose.isValidObjectId(id))
      : [];

    // Vincolo sicurezza: la lista regole deve riferire asset dentro buildingIds accessibili/selezionati.
    // Per farlo, ricavo assetIds autorizzati dai buildingIds.
    const assetsInBuildings = await Asset.find({ buildingId: { $in: buildingIds } })
      .select("_id")
      .lean();

    const allowedAssetIds = assetsInBuildings.map((a) => String(a._id));
    const allowedAssetSet = new Set(allowedAssetIds);

    const filter = {
      assetIds: { $in: allowedAssetIds }, // regole che toccano asset accessibili
    };

    if (assetIds.length > 0) {
      // ulteriore filtro: solo regole che includono asset selezionati (ma devono essere autorizzati)
      const forbidden = assetIds.filter((id) => !allowedAssetSet.has(id));
      if (forbidden.length) {
        return res.status(403).json({
          message: "Uno o più assetIds non sono autorizzati (fuori dagli edifici accessibili)",
          forbiddenAssetIds: forbidden,
        });
      }
      filter.assetIds = { $in: assetIds };
    }

    if (q) {
      const rx = new RegExp(escapeRegExp(q), "i");
      filter.name = rx;
    }

    const [total, items] = await Promise.all([
      Rule.countDocuments(filter),
      Rule.find(filter)
        .sort({ createdAt: -1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.json({ page, limit, total, items });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || "Errore lista regole",
      ...(err.details ? { details: err.details } : {}),
    });
  }
}

/**
 * POST /api/v1/rules
 * Body:
 *  - buildingIds: [ ... ]   (fase 1 nel frontend)
 *  - assetIds: [ ... ]      (fase 2 nel frontend)
 *  - name: string           (fase 3)
 *  - ...altri campi regola
 *
 * Sicurezza:
 *  - buildingIds deve essere subset di accessibili
 *  - assetIds deve appartenere a quegli buildingIds
 */
export async function createRule(req, res) {
  try {
    const { Rule, Asset } = getTenantModels(req);

    const name = String(req.body?.name || "").trim();
    const buildingIdsRequested = Array.isArray(req.body?.buildingIds) ? req.body.buildingIds.map(String) : [];
    const assetIdsRequested = Array.isArray(req.body?.assetIds) ? req.body.assetIds.map(String) : [];

    if (!name || name.length < 2) return res.status(400).json({ message: "name obbligatorio (min 2 caratteri)" });
    if (assetIdsRequested.length === 0) return res.status(400).json({ message: "assetIds obbligatorio (almeno 1)" });

    const buildingIds = await normalizeAndAuthorizeBuildingIds(req, buildingIdsRequested);

    // Ricavo asset autorizzati (solo in buildingIds selezionati)
    const assets = await Asset.find({ buildingId: { $in: buildingIds } }).select("_id").lean();
    const allowed = new Set(assets.map((a) => String(a._id)));

    const cleanAssetIds = [...new Set(assetIdsRequested)].filter((id) => mongoose.isValidObjectId(id));

    const forbidden = cleanAssetIds.filter((id) => !allowed.has(id));
    if (forbidden.length) {
      return res.status(403).json({
        message: "Uno o più assetIds non appartengono agli edifici selezionati/assegnati",
        forbiddenAssetIds: forbidden,
      });
    }

    const payload = {
      ...req.body,
      name,
      assetIds: cleanAssetIds,
      // buildingIds li puoi anche salvare se ti serve per query veloci, ma non è obbligatorio:
      buildingIds,
    };

    const created = await Rule.create(payload);
    return res.status(201).json(created.toObject());
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || "Errore creazione regola",
      ...(err.details ? { details: err.details } : {}),
    });
  }
}

/**
 * PUT /api/v1/rules/:id
 * Vincolo: non puoi aggiungere asset fuori dagli edifici accessibili
 */
export async function updateRule(req, res) {
  try {
    const { Rule, Asset } = getTenantModels(req);

    const id = String(req.params.id || "");
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "ruleId non valido" });

    const existing = await Rule.findById(id).lean();
    if (!existing) return res.status(404).json({ message: "Regola non trovata" });

    // Determino edifici accessibili (non necessariamente quelli salvati nella regola)
    // e limito assetIds aggiornati a quelli accessibili.
    const buildingIdsRaw = Array.isArray(req.body?.buildingIds) ? req.body.buildingIds.map(String) : null;
    const buildingIds = await normalizeAndAuthorizeBuildingIds(req, buildingIdsRaw);

    const assets = await Asset.find({ buildingId: { $in: buildingIds } }).select("_id").lean();
    const allowed = new Set(assets.map((a) => String(a._id)));

    const patch = { ...req.body };

    if (patch.name !== undefined) {
      patch.name = String(patch.name).trim();
      if (patch.name.length < 2) return res.status(400).json({ message: "name min 2 caratteri" });
    }

    if (patch.assetIds !== undefined) {
      if (!Array.isArray(patch.assetIds) || patch.assetIds.length === 0) {
        return res.status(400).json({ message: "assetIds deve essere un array non vuoto" });
      }

      const cleanAssetIds = [...new Set(patch.assetIds.map(String))].filter((x) => mongoose.isValidObjectId(x));
      const forbidden = cleanAssetIds.filter((x) => !allowed.has(x));
      if (forbidden.length) {
        return res.status(403).json({
          message: "Uno o più assetIds non sono autorizzati",
          forbiddenAssetIds: forbidden,
        });
      }
      patch.assetIds = cleanAssetIds;
    }

    // (opzionale) salva buildingIds per query future
    patch.buildingIds = buildingIds;

    const updated = await Rule.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    return res.json(updated);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || "Errore update regola",
      ...(err.details ? { details: err.details } : {}),
    });
  }
}

/**
 * DELETE /api/v1/rules/:id
 */
export async function deleteRule(req, res) {
  try {
    const { Rule } = getTenantModels(req);

    const id = String(req.params.id || "");
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "ruleId non valido" });

    const existing = await Rule.findById(id).lean();
    if (!existing) return res.status(404).json({ message: "Regola non trovata" });

    // Sicurezza minima: se la regola contiene buildingIds, autorizzo su quelli.
    // Se non li contiene, autorizzo implicitamente (ma resta filtrata dalle query in listRules).
    const buildingIds = Array.isArray(existing.buildingIds) ? existing.buildingIds.map(String) : [];
    if (buildingIds.length > 0) {
      await normalizeAndAuthorizeBuildingIds(req, buildingIds);
    }

    await Rule.deleteOne({ _id: id });
    return res.json({ deleted: true, ruleId: id });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || "Errore delete regola",
      ...(err.details ? { details: err.details } : {}),
    });
  }
}
