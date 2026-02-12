// controllers/request.controller.js
import { getTenantModels } from "../utils/tenantModels.js";

/*
  GET /api/v1/requests
  Lista di tutte le richieste (Admin Centrale)
*/
export async function getAllRequests(req, res) {
  try {
    const { Request } = getTenantModels(req);

    const requests = await Request.find()
      .populate("userId", "email roles status")
      .populate("payload.buildingId", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(requests);
  } catch (err) {
    res.status(500).json({
      message: "Errore nel recupero richieste",
      error: err.message,
    });
  }
}

/*
  GET /api/v1/requests/:id
  Dettaglio richiesta
*/
export async function getRequestById(req, res) {
  try {
    const { Request } = getTenantModels(req);
    
    const request = await Request.findById(req.params.id)
      .populate("userId", "email roles status")
      .populate("payload.buildingId", "name")
      .lean();

    if (!request) {
      return res.status(404).json({ message: "Richiesta non trovata" });
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({
      message: "Errore nel recupero richiesta",
      error: err.message,
    });
  }
}

/*
  POST /api/v1/requests/assign-role
  Richiesta assegnazione ruolo
*/
export async function createAssignRoleRequest(req, res) {
  const { Request } = getTenantModels(req);
  const { userId, role } = req.body;

  if (!userId || !role) {
    return res.status(400).json({
      message: "userId e role sono obbligatori",
    });
  }

  try {
    const request = await Request.create({
      requestType: "ASSIGN_ROLE",
      userId,
      payload: { roleName: role },
      createdBy: req.user._id,
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({
      message: "Errore creazione richiesta ruolo",
      error: err.message,
    });
  }
}

/*
  POST /api/v1/requests/assign-building
  Richiesta assegnazione edificio
*/
export async function createAssignBuildingRequest(req, res) {
  const { Request } = getTenantModels(req);
  const { userId, buildingId } = req.body;

  if (!userId || !buildingId) {
    return res.status(400).json({
      message: "userId e buildingId sono obbligatori",
    });
  }

  try {
    const request = await Request.create({
      requestType: "ASSIGN_BUILDING",
      userId,
      payload: { buildingId },
      createdBy: req.user._id,
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({
      message: "Errore creazione richiesta edificio",
      error: err.message,
    });
  }
}

/*
  PUT /api/v1/requests/:id
  Approva o rifiuta una richiesta
*/
export async function updateRequest(req, res) {
  const { status } = req.body;

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ message: "Status non valido" });
  }

  try {
    const { Request, User, Role } = getTenantModels(req);

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Richiesta non trovata" });
    }

    // evita doppie decisioni
    if (request.status && request.status !== "PENDING") {
      return res.status(409).json({
        message: "Richiesta già gestita",
        currentStatus: request.status,
      });
    }

    request.status = status;
    request.decidedBy = req.user._id;
    request.decidedAt = new Date();

    await request.save();

    // Se rifiutata -> fine
    if (status === "REJECTED") {
      return res.json(request);
    }

    // ============ APPROVED ============
    // 1) carico utente target
    const user = await User.findById(request.userId);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // 2) calcolo ruolo obbligatorio
    // - se ASSIGN_ROLE: deve esserci roleName nel payload
    // - se ASSIGN_BUILDING: assegna comunque un ruolo base (user_base) se non admin
    let roleNameToSet = null;

    if (request.requestType === "ASSIGN_ROLE") {
      roleNameToSet = String(request.payload?.roleName || "").trim();
      if (!roleNameToSet) {
        return res.status(400).json({
          message: "payload.roleName mancante (obbligatorio per ASSIGN_ROLE)",
        });
      }
    } else {
      // fallback coerente con la tua logica: quando approvi una richiesta "generica"
      // vuoi attivare l’utente e dargli almeno il ruolo base
      roleNameToSet = "user_base";
    }

    const roleDoc = await Role.findOne({ roleName: roleNameToSet });
    if (!roleDoc) {
      return res.status(500).json({
        message: `Ruolo '${roleNameToSet}' non trovato (seed non eseguito correttamente)`,
      });
    }

    // 3) update ATOMICO: status=active + roles (solo se non bootstrap admin)
    //    se è bootstrap admin, non tocco i ruoli ma posso comunque attivare (se ti serve)
    const update = {
      $set: { status: "active" },
    };

    if (!user.isBootstrapAdmin) {
      update.$set.roles = [roleDoc._id];
    }

    // 4) Se approvo ASSIGN_BUILDING aggiungo buildingId senza duplicati
    if (request.requestType === "ASSIGN_BUILDING") {
      const buildingId = request.payload?.buildingId;
      if (!buildingId) {
        return res.status(400).json({
          message: "payload.buildingId mancante (obbligatorio per ASSIGN_BUILDING)",
        });
      }
      update.$addToSet = { buildingIds: buildingId };
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, update, { new: true })
      .select("_id name surname email status roles buildingIds isBootstrapAdmin")
      .populate("roles", "roleName");

    return res.json({
      request,
      user: updatedUser,
      message: "Richiesta approvata: utente attivato e ruolo impostato",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Errore aggiornamento richiesta",
      error: err.message,
    });
  }
}