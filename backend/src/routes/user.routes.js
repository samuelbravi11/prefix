// routes/user.routes.js
import express from "express";
import * as userController from "../controllers/user.controller.js";
import * as userAssignment from "../controllers/userAssignment.controller.js";

const router = express.Router();

/*
  GET /api/v1/users
  Restituisce la lista di tutti gli utenti
  (tipicamente Admin Centrale)
*/
router.get("/", userController.getAllUsers);

/*
  GET /api/v1/users/me
  Restituisce i dati dell’utente loggato
*/
router.get("/me", userController.getMe);

/*
  GET /api/v1/users/pending
  Restituisce gli utenti in attesa di approvazione
  (Admin Centrale)
*/
router.get("/pending", userController.getPendingUsers);

/*
  PUT /api/v1/users/:id/assign-role
  Assegna un ruolo a un utente
  (Admin Centrale)
*/
router.put("/:id/assign-role", userAssignment.assignUserRole);

/*
  PUT /api/v1/users/:id/assign-building
  Assegna uno o più edifici a un utente
  (Admin Centrale)
*/
router.put("/:id/assign-building", userAssignment.assignUserBuilding);


export default router;