import mongoose from "mongoose";
import { getTenantModels } from "../utils/tenantModels.js";

/**
 * GET /api/v1/requests
 * Filtri (query):
 *  - requestType: ASSIGN_ROLE | ASSIGN_BUILDING
 *  - status: PENDING | APPROVED | REJECTED
 *  - userId: ObjectId
 *  - buildingId: ObjectId (solo per ASSIGN_BUILDING)
 *  - onlyActiveUsers: true|false (default true)
 *  - page, limit (default page=1, limit=50)
 *  - sort: createdAt | updatedAt (default createdAt)
 *  - order: asc|desc (default desc)
 */
export async function getAllRequests(req, res) {
  try {
    const { Request, User, Building } = getTenantModels(req);

    const {
      requestType,
      status,
      userId,
      buildingId,
      onlyActiveUsers = "true",
      page = "1",
      limit = "50",
      sort = "createdAt",
      order = "desc",
    } = req.query || {};

    const filter = {};

    if (requestType) {
      const rt = String(requestType).trim().toUpperCase();
      if (!["ASSIGN_ROLE", "ASSIGN_BUILDING"].includes(rt)) {
        return res.status(400).json({ message: "requestType non valido" });
      }
      filter.requestType = rt;
    }

    if (status) {
      const st = String(status).trim().toUpperCase();
      if (!["PENDING", "APPROVED", "REJECTED"].includes(st)) {
        return res.status(400).json({ message: "status non valido" });
      }
      filter.status = st;
    }

    if (userId) filter.userId = userId;

    if (buildingId) {
      filter.requestType = "ASSIGN_BUILDING";
      filter["payload.buildingId"] = buildingId;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

    const sortField = ["createdAt", "updatedAt"].includes(String(sort)) ? String(sort) : "createdAt";
    const sortOrder = String(order).toLowerCase() === "asc" ? 1 : -1;

    const raw = await Request.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    if (raw.length === 0) {
      return res.json({ page: pageNum, limit: limitNum, total: 0, items: [] });
    }

    const userIds = [...new Set(raw.map((r) => String(r.userId)).filter(Boolean))];
    const buildingIds = [
      ...new Set(
        raw
          .map((r) => r?.payload?.buildingId)
          .filter(Boolean)
          .map((id) => String(id))
      ),
    ];

    const onlyActive = String(onlyActiveUsers) === "true";

    const users = await User.find({
      _id: { $in: userIds },
      ...(onlyActive ? { status: "active" } : {}),
    })
      .select("_id name surname email status buildingIds roles")
      .populate("roles", "roleName")
      .lean();

    const usersMap = new Map(users.map((u) => [String(u._id), u]));

    const buildings = await Building.find({ _id: { $in: buildingIds }, isActive: true })
      .select("_id name address city isActive createdAt")
      .lean();

    const buildingsMap = new Map(buildings.map((b) => [String(b._id), b]));

    const items = raw
      .map((r) => {
        const u = usersMap.get(String(r.userId)) || null;
        const bId = r?.payload?.buildingId ? String(r.payload.buildingId) : null;
        const b = bId ? buildingsMap.get(bId) || null : null;

        return { ...r, user: u, building: b };
      })
      .filter((r) => (onlyActive ? Boolean(r.user) : true));

    const total = await Request.countDocuments(filter);

    return res.json({ page: pageNum, limit: limitNum, total, items });
  } catch (err) {
    console.error("[getAllRequests] error:", err);
    return res.status(500).json({ message: "Errore recupero richieste", error: err.message });
  }
}

/**
 * GET /api/v1/requests/:id
 */
export async function getRequestById(req, res) {
  try {
    const { Request } = getTenantModels(req);
    const request = await Request.findById(req.params.id).lean();
    if (!request) return res.status(404).json({ message: "Richiesta non trovata" });
    return res.json(request);
  } catch (err) {
    return res.status(500).json({ message: "Errore recupero richiesta", error: err.message });
  }
}

/**
 * POST /api/v1/requests/assign-role
 * ✅ Sicurezza: ignoro userId dal client, uso req.user._id
 */
export async function createAssignRoleRequest(req, res) {
  const { Request } = getTenantModels(req);
  const roleName = String(req.body?.roleName || "").trim();

  const userId = req.user?._id;
  if (!userId || !mongoose.isValidObjectId(String(userId))) {
    return res.status(401).json({ message: "Utente non autenticato" });
  }
  if (!roleName) {
    return res.status(400).json({ message: "roleName è obbligatorio" });
  }

  try {
    const exists = await Request.findOne({
      requestType: "ASSIGN_ROLE",
      userId,
      "payload.role": roleName,
      status: "PENDING",
    }).lean();

    if (exists) {
      return res.status(409).json({
        message: "Esiste già una richiesta PENDING per questo ruolo",
        requestId: exists._id,
      });
    }

    const request = await Request.create({
      requestType: "ASSIGN_ROLE",
      userId,
      payload: { role: roleName },
      createdBy: userId,
    });

    return res.status(201).json(request);
  } catch (err) {
    return res.status(500).json({ message: "Errore creazione richiesta ruolo", error: err.message });
  }
}

/**
 * POST /api/v1/requests/assign-building
 * ✅ Sicurezza: ignoro userId dal client, uso req.user._id
 */
export async function createAssignBuildingRequest(req, res) {
  const { Request, Building } = getTenantModels(req);
  const buildingId = String(req.body?.buildingId || "").trim();

  const userId = req.user?._id;
  if (!userId || !mongoose.isValidObjectId(String(userId))) {
    return res.status(401).json({ message: "Utente non autenticato" });
  }
  if (!mongoose.isValidObjectId(buildingId)) {
    return res.status(400).json({ message: "buildingId non valido" });
  }

  try {
    const b = await Building.findOne({ _id: buildingId, isActive: true }).select("_id").lean();
    if (!b) {
      return res.status(404).json({ message: "Edificio non trovato o non attivo" });
    }

    const exists = await Request.findOne({
      requestType: "ASSIGN_BUILDING",
      userId,
      "payload.buildingId": buildingId,
      status: "PENDING",
    }).lean();

    if (exists) {
      return res.status(409).json({
        message: "Esiste già una richiesta PENDING per questo edificio",
        requestId: exists._id,
      });
    }

    const request = await Request.create({
      requestType: "ASSIGN_BUILDING",
      userId,
      payload: { buildingId },
      createdBy: userId,
    });

    return res.status(201).json(request);
  } catch (err) {
    return res.status(500).json({
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
    const { Request, User, Role, Notification } = getTenantModels(req);

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Richiesta non trovata" });

    if (request.status && request.status !== "PENDING") {
      return res.status(409).json({ message: "Richiesta già gestita", currentStatus: request.status });
    }

    request.status = status;
    request.decidedBy = req.user._id;
    request.decidedAt = new Date();
    await request.save();

    const user = await User.findById(request.userId).select(
      "_id email name surname isBootstrapAdmin status roles buildingIds"
    );
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    if (status === "REJECTED") {
      await Notification.create({
        type: "ATTIVAZIONE_UTENTE",
        recipient: { userId: user._id },
        targetBuildingId: request.payload?.buildingId || null,
        title: "Richiesta rifiutata",
        message:
          request.requestType === "ASSIGN_BUILDING"
            ? "La tua richiesta di assegnazione edificio è stata rifiutata."
            : "La tua richiesta di assegnazione ruolo è stata rifiutata.",
        priority: "medium",
        relatedEventId: null,
        read: false,
        readAt: null,
      });
      return res.json({ request, message: "Richiesta rifiutata" });
    }

    let roleNameToSet = null;

    if (request.requestType === "ASSIGN_ROLE") {
      roleNameToSet = String(request.payload?.roleName || request.payload?.role || "").trim();
      if (!roleNameToSet) {
        return res.status(400).json({ message: "payload.role mancante (obbligatorio per ASSIGN_ROLE)" });
      }
    } else {
      roleNameToSet = "user_base";
    }

    const roleDoc = await Role.findOne({ roleName: roleNameToSet });
    if (!roleDoc) {
      return res.status(500).json({ message: `Ruolo '${roleNameToSet}' non trovato (seed non eseguito correttamente)` });
    }

    const update = { $set: { status: "active" } };

    if (!user.isBootstrapAdmin) {
      update.$set.roles = [roleDoc._id];
    }

    if (request.requestType === "ASSIGN_BUILDING") {
      const bId = request.payload?.buildingId;
      if (!bId) return res.status(400).json({ message: "payload.buildingId mancante (obbligatorio per ASSIGN_BUILDING)" });
      update.$addToSet = { buildingIds: bId };
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, update, { new: true })
      .select("_id name surname email status roles buildingIds isBootstrapAdmin")
      .populate("roles", "roleName");

    await Notification.create({
      type: "ATTIVAZIONE_UTENTE",
      recipient: { userId: user._id },
      targetBuildingId: request.payload?.buildingId || null,
      title: "Richiesta approvata",
      message:
        request.requestType === "ASSIGN_BUILDING"
          ? "La tua richiesta di assegnazione edificio è stata approvata."
          : "La tua richiesta di assegnazione ruolo è stata approvata.",
      priority: "low",
      relatedEventId: null,
      read: false,
      readAt: null,
    });

    return res.json({ request, user: updatedUser, message: "Richiesta approvata: utente aggiornato" });
  } catch (err) {
    return res.status(500).json({ message: "Errore aggiornamento richiesta", error: err.message });
  }
}
