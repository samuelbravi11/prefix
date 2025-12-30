import { getBuildingsByUser } from "../repositories/building.repository.js";

export const getMyBuildings = async (req, res) => {
  try {
    const buildings = await getBuildingsByUser(req.user);
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
