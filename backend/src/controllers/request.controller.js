// controllers/request.controller.js
import Request from "../models/Request.js";

/*
  GET /api/v1/requests
  Lista di tutte le richieste (Admin Centrale)
*/
export async function getAllRequests(req, res) {
  try {
    const requests = await Request.find()
      .populate("userId", "email role")
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
    const request = await Request.findById(req.params.id)
      .populate("userId", "email role")
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
      payload: { role },
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
    return res.status(400).json({
      message: "Status non valido",
    });
  }

  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Richiesta non trovata" });
    }

    request.status = status;
    request.decidedBy = req.user._id;
    request.decidedAt = new Date();

    await request.save();

    res.json(request);
  } catch (err) {
    res.status(500).json({
      message: "Errore aggiornamento richiesta",
      error: err.message,
    });
  }
}
