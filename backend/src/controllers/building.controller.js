import mongoose from "mongoose";
import * as buildingRepo from "../repositories/building.repository.js";

export async function getMyBuildings(req, res) {
  try {
    const buildings = await buildingRepo.getBuildingsByUser(req, req.user);
    return res.json(buildings);
  } catch (err) {
    console.error("[getMyBuildings] error:", err);
    return res.status(500).json({
      message: "Errore caricamento edifici",
      error: err.message,
    });
  }
}

/**
 * GET /api/v1/buildings/all
 * Query:
 *  - sortBy: name | createdAt | assetsCount | rulesCount
 *  - order: asc | desc
 *  - includeInactive: true|false (default false)
 *
 * Nota: per assetsCount/rulesCount uso aggregation (più pesante ma corretto per tabella).
 */
export async function getAllBuildings(req, res) {
  try {
    const sortBy = String(req.query.sortBy || "name");
    const order = String(req.query.order || "asc").toLowerCase() === "desc" ? -1 : 1;
    const includeInactive = String(req.query.includeInactive || "false") === "true";

    const allowedSort = new Set(["name", "createdAt", "assetsCount", "rulesCount"]);
    const normalizedSortBy = allowedSort.has(sortBy) ? sortBy : "name";

    const buildings = await buildingRepo.getAllBuildingsWithStats(req, {
      sortBy: normalizedSortBy,
      order,
      includeInactive,
    });

    return res.json(buildings);
  } catch (err) {
    console.error("[getAllBuildings] error:", err);
    return res.status(500).json({
      message: "Errore caricamento lista edifici",
      error: err.message,
    });
  }
}

/**
 * GET /api/v1/buildings/:id
 */
export async function getBuildingById(req, res) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "buildingId non valido" });
    }

    const building = await buildingRepo.getBuildingById(req, id);
    if (!building) {
      return res.status(404).json({ message: "Edificio non trovato" });
    }

    return res.json(building);
  } catch (err) {
    console.error("[getBuildingById] error:", err);
    return res.status(500).json({
      message: "Errore recupero edificio",
      error: err.message,
    });
  }
}

/**
 * POST /api/v1/buildings
 */
export async function createBuilding(req, res) {
  try {
    const payload = req.body || {};

    // validazioni minime (friendly)
    if (!payload.name || String(payload.name).trim().length < 2) {
      return res.status(400).json({ message: "Il campo 'name' è obbligatorio (min 2 caratteri)" });
    }

    const created = await buildingRepo.createBuilding(req, {
      name: String(payload.name).trim(),
      address: payload.address ? String(payload.address).trim() : "",
      city: payload.city ? String(payload.city).trim() : "",
      openingHours: payload.openingHours || {},
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("[createBuilding] error:", err);
    return res.status(500).json({
      message: "Errore creazione edificio",
      error: err.message,
    });
  }
}

/**
 * PUT /api/v1/buildings/:id
 */
export async function updateBuilding(req, res) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "buildingId non valido" });
    }

    const payload = req.body || {};

    // Sanitizzazione base: aggiorno solo campi ammessi
    const patch = {};
    if (payload.name !== undefined) patch.name = String(payload.name).trim();
    if (payload.address !== undefined) patch.address = String(payload.address).trim();
    if (payload.city !== undefined) patch.city = String(payload.city).trim();
    if (payload.openingHours !== undefined) patch.openingHours = payload.openingHours || {};
    if (payload.isActive !== undefined) patch.isActive = Boolean(payload.isActive);

    if (patch.name !== undefined && patch.name.length < 2) {
      return res.status(400).json({ message: "Il campo 'name' deve avere almeno 2 caratteri" });
    }

    const updated = await buildingRepo.updateBuilding(req, id, patch);
    if (!updated) return res.status(404).json({ message: "Edificio non trovato" });

    return res.json(updated);
  } catch (err) {
    console.error("[updateBuilding] error:", err);
    return res.status(500).json({
      message: "Errore aggiornamento edificio",
      error: err.message,
    });
  }
}

/**
 * DELETE /api/v1/buildings/:id
 * Elimina edificio in modo sicuro:
 * - blocca se esistono Asset associati
 * - blocca se esistono richieste PENDING su quell’edificio
 * - se ok: elimina building + pulizia riferimenti utenti + richieste
 */
export async function deleteBuilding(req, res) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "buildingId non valido" });
    }

    const result = await buildingRepo.deleteBuildingSafe(req, id);

    if (result?.code === "NOT_FOUND") {
      return res.status(404).json({ message: "Edificio non trovato" });
    }

    if (result?.code === "HAS_ASSETS") {
      return res.status(409).json({
        message: "Impossibile eliminare l’edificio: ci sono asset associati. Rimuovi prima gli asset.",
        assetsCount: result.assetsCount,
      });
    }

    if (result?.code === "HAS_PENDING_REQUESTS") {
      return res.status(409).json({
        message: "Impossibile eliminare l’edificio: ci sono richieste PENDING collegate.",
        pendingRequestsCount: result.pendingRequestsCount,
      });
    }

    return res.json({
      deleted: true,
      buildingId: id,
      cleanup: result.cleanup,
    });
  } catch (err) {
    console.error("[deleteBuilding] error:", err);
    return res.status(500).json({
      message: "Errore eliminazione edificio",
      error: err.message,
    });
  }
}