import User from "../models/User.js";
import Role from "../models/Role.js";
import { validateAssignableRole } from "../validators/userRole.validator.js";

export default async function assignUserRoleController(req, res) {
  try {
    const { role } = req.body;
    const { id } = req.params;

    // Validazione di dominio (ruolo assegnabile)
    validateAssignableRole(role);

    // Verifica esistenza utente
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // Recupero ruolo dal DB (verifica che il ruolo da settare esista davvero)
    const roleDoc = await Role.findOne({ roleName: role });
    if (!roleDoc) {
      return res.status(400).json({
        message: `Ruolo '${role}' non esistente`
      });
    }

    // Assegna il ruolo (ObjectId)
    user.roles = [roleDoc._id]; // SOLO ruolo principale
    await user.save();

    return res.json({
      message: "Ruolo assegnato correttamente",
      userId: user._id,
      role: roleDoc.roleName
    });

  } catch (err) {
    return res.status(400).json({
      message: err.message
    });
  }
}