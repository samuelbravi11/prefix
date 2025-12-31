// routes/request.routes.js
import express from "express";
import * as requestController from "../controllers/request.controller.js";

const router = express.Router();

/*
  GET /api/v1/requests
  (Admin Centrale)
*/
router.get("/", requestController.getAllRequests);

/*
  GET /api/v1/requests/:id
*/
router.get("/:id", requestController.getRequestById);

/*
  POST /api/v1/requests/assign-role
  Utente secondario
*/
router.post(
  "/assign-role",
  requestController.createAssignRoleRequest
);

/*
  POST /api/v1/requests/assign-building
  Utente secondario
*/
router.post(
  "/assign-building",
  requestController.createAssignBuildingRequest
);

/*
  PUT /api/v1/requests/:id
  Admin Centrale (approve / reject)
*/
router.put("/:id", requestController.updateRequest);

export default router;
