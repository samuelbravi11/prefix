// controllers/userAssignment.controller.js
import { getTenantModels } from "../utils/tenantModels.js";

/*
  Controller di ASSEGNAZIONE UTENTE
  Contiene TUTTE le operazioni di assegnazione:
  - ruolo
  - edifici
  (in futuro: status, permessi, ecc.)
*/

/*
  PUT /api/v1/users/:id/assign-role
  Assegna un ruolo a un utente
  Usato da Admin Centrale
*/
export async function assignUserRole(req, res) {
  try {
    const { id } = req.params;
    const { roleName } = req.body;

    if (!roleName) return res.status(400).json({ message: "roleName mancante" });

    const { User, Role } = getTenantModels(req);

    const roleDoc = await Role.findOne({ roleName }).select("_id roleName").lean();
    if (!roleDoc) return res.status(404).json({ message: `Ruolo '${roleName}' non trovato` });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    user.roles = [roleDoc._id];
    await user.save();

    return res.json({ message: "Ruolo assegnato", userId: user._id, roleName: roleDoc.roleName });
  } catch (err) {
    return res.status(500).json({ message: "Errore assegnazione ruolo", error: err.message });
  }
}


/*
  PUT /api/v1/users/:id/assign-building
  Assegna uno o più edifici a un utente
  Usato da Admin Centrale
*/
export async function assignUserBuildings(req, res) {
  try {
    const { id } = req.params;
    const { buildingIds } = req.body;

    if (!Array.isArray(buildingIds)) {
      return res.status(400).json({ message: "buildingIds deve essere un array" });
    }

    const { User, Building } = getTenantModels(req);

    const userDoc = await User.findById(id).select("_id status");
    if (!userDoc) return res.status(404).json({ message: "Utente non trovato" });

    if (userDoc.status !== "active") {
      return res.status(409).json({
        message: "Puoi assegnare edifici solo a utenti 'active'.",
        currentStatus: userDoc.status,
      });
    }

    const uniqueIds = [...new Set(buildingIds.map(String))];

    const existing = await Building.find({ _id: { $in: uniqueIds }, isActive: true })
      .select("_id")
      .lean();

    if (existing.length !== uniqueIds.length) {
      return res.status(400).json({ message: "Uno o più building non esistono oppure non sono attivi" });
    }

    const user = await User.findByIdAndUpdate(id, { buildingIds: uniqueIds }, { new: true }).lean();
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    return res.json({ message: "Edifici assegnati", user });
  } catch (err) {
    return res.status(500).json({ message: "Errore assegnazione edifici", error: err.message });
  }
}
