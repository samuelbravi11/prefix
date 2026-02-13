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
