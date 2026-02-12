// src/controllers/user.controller.js
import { getTenantModels } from "../utils/tenantModels.js";

/* =========================================================
   GET ME
   GET /api/v1/users/me
========================================================= */
export const getMe = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Non autenticato" });

    const { User } = getTenantModels(req);

    const user = await User.findById(req.user._id)
      .select("_id name surname email roles status buildingIds createdAt updatedAt")
      .populate("roles", "roleName")
      .lean();

    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    return res.json({ success: true, user });
  } catch (err) {
    console.error("Errore in getMe:", err);
    return res.status(500).json({ message: "Errore interno", error: err.message });
  }
};


/* =========================================================
   LIST PENDING USERS
   GET /api/v1/users/pending
========================================================= */
export const getPendingUsers = async (req, res) => {
  try {
    const { User } = getTenantModels(req);

    const users = await User.find({ status: "pending" })
      .select("_id name surname email roles status buildingIds createdAt")
      .populate("roles", "roleName")
      .lean();

    return res.json(users);
  } catch (err) {
    return res.status(500).json({
      message: "Errore nel recupero utenti pending",
      error: err.message,
    });
  }
};


/* =========================================================
   LIST ACTIVE AND DISABLED USERS
   GET /api/v1/users
========================================================= */
export const getManagedUsers = async (req, res) => {
  try {
    const { User } = getTenantModels(req);

    const users = await User.find({ status: { $in: ["active", "disabled"] } })
      .select("_id name surname email roles status buildingIds createdAt")
      .populate("roles", "roleName")
      .lean();

    return res.json(users);
  } catch (err) {
    return res.status(500).json({
      message: "Errore nel recupero utenti",
      error: err.message,
    });
  }
};


/* =========================================================
   APPROVE PENDING USER + SET ROLE (default user_base)
   PATCH /api/v1/users/:id/approve
   Body: { roleName?: string }  // se omesso -> user_base
========================================================= */
export const approvePendingUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleName } = req.body || {};

    const { User, Role } = getTenantModels(req);

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    if (user.status !== "pending") {
      return res.status(409).json({
        message: "Operazione consentita solo su utenti in stato 'pending'",
        currentStatus: user.status,
      });
    }

    let finalRoleName = (roleName && String(roleName).trim()) || "user_base";

    const role = await Role.findOne({ roleName: finalRoleName }).lean();
    if (!role) {
      // fallback: cerca un ruolo di default (es. user_base) – se manca, errore chiaro
      return res.status(500).json({
        message: `Ruolo '${finalRoleName}' non trovato. Controllare che il seed sia stato eseguito.`,
      });
    }

    user.status = "active";
    user.roles = [role._id];
    await user.save();

    return res.json({
      message: "Utente approvato",
      userId: user._id,
      status: user.status,
      role: finalRoleName,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Errore approvazione utente pending",
      error: err.message,
    });
  }
};


export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const rawRoleName = req.body?.roleName;

    const roleName = String(rawRoleName || "").trim();
    if (!roleName) return res.status(400).json({ message: "roleName mancante" });

    const { User, Role } = getTenantModels(req);

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    if (user.status === "pending") {
      return res.status(409).json({
        message: "Non puoi cambiare ruolo a un utente 'pending'. Usa /approve.",
        currentStatus: user.status,
      });
    }

    const role = await Role.findOne({ roleName }).lean();
    if (!role) return res.status(400).json({ message: `Ruolo '${roleName}' non esistente` });

    user.roles = [role._id];
    await user.save();

    return res.json({
      message: "Ruolo aggiornato",
      userId: user._id,
      status: user.status,
      role: role.roleName,
    });
  } catch (err) {
    return res.status(500).json({ message: "Errore update ruolo", error: err.message });
  }
};



/* =========================================================
   UPDATE STATUS (active <-> disabled)
   PATCH /api/v1/users/:id/status
   Body: { status: "active" | "disabled" }
========================================================= */
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const rawStatus = req.body?.status;     // opzionale
    const rawRoleName = req.body?.roleName; // opzionale

    const status = rawStatus ? String(rawStatus).trim().toLowerCase() : undefined;
    const roleName = rawRoleName ? String(rawRoleName).trim() : undefined;

    if (!status && !roleName) {
      return res.status(400).json({
        message: "Devi fornire almeno uno tra 'status' o 'roleName'",
      });
    }

    if (status && !["active", "disabled"].includes(status)) {
      return res.status(400).json({
        message: "status non valido",
        allowed: ["active", "disabled"],
      });
    }

    const { User, Role } = getTenantModels(req);

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    if (user.status === "pending") {
      return res.status(409).json({
        message: "Utente 'pending': usa /approve per attivarlo e (opzionalmente) assegnare il ruolo.",
        currentStatus: user.status,
      });
    }

    const updates = {};

    // ruolo (opzionale)
    if (roleName) {
      const role = await Role.findOne({ roleName }).lean();
      if (!role) return res.status(400).json({ message: `Ruolo '${roleName}' non esistente` });
      updates.roles = [role._id];
    }

    // status (opzionale) con transizioni consentite
    if (status) {
      const allowedTransition =
        (user.status === "active" && status === "disabled") ||
        (user.status === "disabled" && status === "active");

      if (!allowedTransition) {
        return res.status(409).json({
          message: "Transizione status non consentita",
          currentStatus: user.status,
          requestedStatus: status,
          allowedTransitions: ["active -> disabled", "disabled -> active"],
        });
      }

      updates.status = status;
    }

    const updated = await User.findByIdAndUpdate(id, updates, { new: true })
      .select("_id name surname email status roles buildingIds")
      .populate("roles", "roleName")
      .lean();

    return res.json({
      message: "Utente aggiornato",
      userId: updated._id,
      status: updated.status,
      role: updated.roles?.[0]?.roleName,
      applied: Object.keys(updates),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Errore update utente (status/role)",
      error: err.message,
    });
  }
};



/* =========================================================
   USERS BUILDINGS VIEW
   GET /api/v1/users/buildings?missing=true
========================================================= */
export const getUsersBuildings = async (req, res) => {
  try {
    const { User } = getTenantModels(req);

    const missing = String(req.query.missing || "").toLowerCase() === "true";
    const rawStatus = req.query.status;

    const allowedStatuses = ["pending", "active", "disabled"];
    let status = null;

    if (rawStatus !== undefined) {
      status = String(rawStatus).trim().toLowerCase();
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "status non valido",
          allowed: allowedStatuses,
        });
      }
    }

    const filter = {};

    if (missing) {
      filter.$or = [
        { buildingIds: { $exists: false } },
        { buildingIds: { $size: 0 } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    const users = await User.find(filter)
      .select("_id name surname email status roles buildingIds createdAt")
      .populate("roles", "roleName")
      .lean();

    return res.json(users);
  } catch (err) {
    return res.status(500).json({
      message: "Errore nel recupero users/buildings",
      error: err.message,
    });
  }
};


/* =========================================================
   UPDATE USER BUILDINGS
   PATCH /api/v1/users/:id/buildings
   Body: { buildingIds: string[] }
========================================================= */
export const updateUserBuildings = async (req, res) => {
  try {
    const { id } = req.params;
    const buildingIds = req.body?.buildingIds;

    if (!Array.isArray(buildingIds)) {
      return res.status(400).json({ message: "buildingIds deve essere un array" });
    }

    const { User, Building } = getTenantModels(req);

    // ✅ blocco pending
    const userDoc = await User.findById(id).select("_id status");
    if (!userDoc) return res.status(404).json({ message: "Utente non trovato" });

    if (userDoc.status === "pending") {
      return res.status(409).json({
        message: "Non puoi assegnare building a un utente 'pending'. Prima approvalo (status -> active).",
        currentStatus: userDoc.status,
      });
    }

    const uniqueIds = [...new Set(buildingIds.map(String))];

    const existingBuildings = await Building.find({ _id: { $in: uniqueIds } })
      .select("_id")
      .lean();

    if (existingBuildings.length !== uniqueIds.length) {
      return res.status(400).json({ message: "Uno o più building non esistono" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { buildingIds: uniqueIds },
      { new: true }
    )
      .select("_id name surname email status roles buildingIds")
      .populate("roles", "roleName")
      .lean();

    return res.json({ message: "Building aggiornati", user });
  } catch (err) {
    return res.status(500).json({ message: "Errore update buildings", error: err.message });
  }
};
