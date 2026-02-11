import { validateAssignableRole } from "../validators/userRole.validator.js";
import { getTenantModels } from "../utils/tenantModels.js";

export default async function assignUserRoleController(req, res) {
  try {
    const { role } = req.body;
    const { id } = req.params;

    validateAssignableRole(role);

    const { User, Role } = getTenantModels(req);

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    const roleDoc = await Role.findOne({ roleName: role });
    if (!roleDoc) {
      return res.status(400).json({ message: `Ruolo '${role}' non esistente` });
    }

    user.roles = [roleDoc._id];
    await user.save();

    return res.json({
      message: "Ruolo assegnato correttamente",
      userId: user._id,
      role: roleDoc.roleName,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}