// src/controllers/intervention.controller.js
import mongoose from "mongoose";
import { getTenantModels } from "../utils/tenantModels.js";
import { getAccessibleBuildingIds, normalizeAndAuthorizeBuildingIds } from "../utils/accessControl.js";
import {
  getInterventionsQuery,
  getInterventionsTableQuery,
  insertInterventions,
} from "../repositories/intervention.repository.js";
import { parseCsvIds } from "../utils/queryParsing.js";

function isDangerousKey(key) {
  return key.startsWith("$") || key.includes(".");
}

function deepHasDangerousKeys(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (Array.isArray(obj)) return obj.some(deepHasDangerousKeys);

  for (const k of Object.keys(obj)) {
    if (isDangerousKey(k)) return true;
    if (deepHasDangerousKeys(obj[k])) return true;
  }
  return false;
}

function ensureSubset(requested, allowed) {
  const allowedSet = new Set(allowed);
  const notAllowed = requested.filter((id) => !allowedSet.has(id));
  if (notAllowed.length) {
    const err = new Error("Accesso negato: uno o più edifici non sono associati all’utente");
    err.status = 403;
    err.details = { notAllowedBuildingIds: notAllowed };
    throw err;
  }
}

async function validateInterventionRow(models, allowedBuildingIds, row, idx) {
  const { Asset, Building } = models;

  if (deepHasDangerousKeys(row)) {
    return { ok: false, index: idx, error: "Payload non valido (chiavi vietate: $ o .)" };
  }

  const assetId = String(row.assetId || "").trim();
  const buildingId = String(row.buildingId || "").trim();

  if (!mongoose.isValidObjectId(assetId)) return { ok: false, index: idx, error: "assetId non valido" };
  if (!mongoose.isValidObjectId(buildingId)) return { ok: false, index: idx, error: "buildingId non valido" };

  ensureSubset([buildingId], allowedBuildingIds);

  const b = await Building.findOne({ _id: buildingId, isActive: true }).select("_id").lean();
  if (!b) return { ok: false, index: idx, error: "Edificio non trovato o non attivo" };

  const asset = await Asset.findOne({ _id: assetId, buildingId }).select("_id buildingId").lean();
  if (!asset) return { ok: false, index: idx, error: "Asset non trovato o non appartiene all’edificio" };

  const performedAt = row.performedAt ? new Date(row.performedAt) : null;
  if (!performedAt || Number.isNaN(performedAt.getTime())) {
    return { ok: false, index: idx, error: "performedAt mancante o non valido" };
  }

  const type = String(row.type || "").trim();
  if (!["maintenance", "inspection", "failure", "repair"].includes(type)) {
    return { ok: false, index: idx, error: "type non valido" };
  }

  const normalized = {
    assetId,
    buildingId,
    type,
    outcome: row.outcome ? String(row.outcome).trim() : undefined,
    severity: row.severity ? String(row.severity).trim() : undefined,
    description: row.description ? String(row.description).trim() : "",
    performedAt,
    durationMinutes: row.durationMinutes !== undefined ? Number(row.durationMinutes) : undefined,
    calendarEventId: row.calendarEventId && mongoose.isValidObjectId(String(row.calendarEventId)) ? row.calendarEventId : null,
  };

  return { ok: true, index: idx, value: normalized };
}

/**
 * GET /api/v1/interventions
 */
export async function getInterventions(req, res) {
  try {
    const { Intervention } = getTenantModels(req);

    const buildingIds = parseCsvIds(req.query.buildingIds);
    const assetIds = parseCsvIds(req.query.assetIds);

    const accessible = await getAccessibleBuildingIds(req);
    const requestedBuildingIds = buildingIds.length ? buildingIds : accessible;
    ensureSubset(requestedBuildingIds, accessible);

    // IMPORTANT:
    // In una versione precedente getInterventionsQuery() restituiva un Promise/Array
    // e veniva passato direttamente a find(), causando:
    // "Parameter \"filter\" to find() must be an object, got [object Promise]".
    // Qui costruiamo un filter sincrono e sicuro.

    const filter = {};

    // building scoping (sempre)
    filter.buildingId = { $in: requestedBuildingIds };

    // asset scoping (opzionale)
    if (assetIds.length) filter.assetId = { $in: assetIds };

    // optional attributes
    if (req.query.type) filter.type = String(req.query.type);
    if (req.query.outcome) filter.outcome = String(req.query.outcome);
    if (req.query.severity) filter.severity = String(req.query.severity);

    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;
    if (from && !Number.isNaN(from.getTime())) filter.performedAt = { ...(filter.performedAt || {}), $gte: from };
    if (to && !Number.isNaN(to.getTime())) filter.performedAt = { ...(filter.performedAt || {}), $lte: to };

    const items = await Intervention.find(filter).sort({ performedAt: -1, _id: 1 }).lean();
    return res.json(items);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Errore caricamento interventi", ...(err.details ? { details: err.details } : {}) });
  }
}

/**
 * GET /api/v1/interventions/:id
 */
export async function getInterventionById(req, res) {
  try {
    const { Intervention } = getTenantModels(req);
    const id = String(req.params.id || "").trim();
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "interventionId non valido" });

    const doc = await Intervention.findById(id).lean();
    if (!doc) return res.status(404).json({ message: "Intervento non trovato" });

    // autorizza edificio dell'intervento
    await normalizeAndAuthorizeBuildingIds(req, [String(doc.buildingId)]);
    return res.json(doc);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Errore recupero intervento", ...(err.details ? { details: err.details } : {}) });
  }
}

/**
 * GET /api/v1/interventions/table
 */
export async function getInterventionsTable(req, res) {
  try {
    const { Intervention } = getTenantModels(req);

    const buildingIds = parseCsvIds(req.query.buildingIds);
    const accessible = await getAccessibleBuildingIds(req);
    const requestedBuildingIds = buildingIds.length ? buildingIds : accessible;
    ensureSubset(requestedBuildingIds, accessible);

    // vedi nota in getInterventions(): le funzioni repository ritornavano risultati,
    // non un filter. Costruiamo un filter standard e restituiamo {total, items}.
    const filter = { buildingId: { $in: requestedBuildingIds } };

    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;
    if (from && !Number.isNaN(from.getTime())) filter.performedAt = { ...(filter.performedAt || {}), $gte: from };
    if (to && !Number.isNaN(to.getTime())) filter.performedAt = { ...(filter.performedAt || {}), $lte: to };

    const items = await Intervention.find(filter).sort({ performedAt: -1, _id: 1 }).lean();
    return res.json({ total: items.length, items });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Errore tabellare interventi", ...(err.details ? { details: err.details } : {}) });
  }
}

/**
 * POST /api/v1/interventions
 * Crea uno o più interventi
 */
export async function createInterventions(req, res) {
  try {
    const models = getTenantModels(req);
    const accessible = await getAccessibleBuildingIds(req);

    const rows = Array.isArray(req.body) ? req.body : [req.body];
    if (!rows.length) return res.status(400).json({ message: "Nessun intervento da creare" });

    const validated = [];
    for (let i = 0; i < rows.length; i++) {
      const v = await validateInterventionRow(models, accessible, rows[i], i);
      if (!v.ok) {
        return res.status(400).json({ message: "Validazione fallita", error: v.error, index: v.index });
      }
      validated.push(v.value);
    }

    const inserted = await insertInterventions(models, validated);
    return res.status(201).json({ insertedCount: inserted.length, items: inserted });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Errore creazione interventi", ...(err.details ? { details: err.details } : {}) });
  }
}

/**
 * POST /api/v1/interventions/bulk/preview
 */
export async function previewBulkInterventions(req, res) {
  try {
    const models = getTenantModels(req);
    const accessible = await getAccessibleBuildingIds(req);

    const rows = Array.isArray(req.body) ? req.body : [];
    if (!rows.length) return res.status(400).json({ message: "Body deve essere un array non vuoto" });

    const results = [];
    for (let i = 0; i < rows.length; i++) {
      const v = await validateInterventionRow(models, accessible, rows[i], i);
      results.push(v);
    }

    const okCount = results.filter((r) => r.ok).length;
    const errorCount = results.length - okCount;

    return res.json({ okCount, errorCount, items: results });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Errore preview bulk", ...(err.details ? { details: err.details } : {}) });
  }
}

/**
 * POST /api/v1/interventions/bulk/commit
 */
export async function commitBulkInterventions(req, res) {
  try {
    const models = getTenantModels(req);
    const accessible = await getAccessibleBuildingIds(req);

    const rows = Array.isArray(req.body) ? req.body : [];
    if (!rows.length) return res.status(400).json({ message: "Body deve essere un array non vuoto" });

    const validated = [];
    for (let i = 0; i < rows.length; i++) {
      const v = await validateInterventionRow(models, accessible, rows[i], i);
      if (!v.ok) {
        return res.status(400).json({ message: "Validazione fallita", error: v.error, index: v.index });
      }
      validated.push(v.value);
    }

    const inserted = await insertInterventions(models, validated);
    return res.status(201).json({ insertedCount: inserted.length, items: inserted });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Errore commit bulk", ...(err.details ? { details: err.details } : {}) });
  }
}

/**
 * DELETE /api/v1/interventions/:id
 * Cancella un intervento (solo se il building è accessibile all'utente)
 */
export async function deleteIntervention(req, res) {
  try {
    const { Intervention } = getTenantModels(req);
    const id = String(req.params.id || "").trim();

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "interventionId non valido" });
    }

    const doc = await Intervention.findById(id).select("_id buildingId").lean();
    if (!doc) return res.status(404).json({ message: "Intervento non trovato" });

    await normalizeAndAuthorizeBuildingIds(req, [String(doc.buildingId)]);

    await Intervention.deleteOne({ _id: id });

    return res.json({ deleted: true, interventionId: id });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || "Errore eliminazione intervento",
      ...(err.details ? { details: err.details } : {}),
    });
  }
}
