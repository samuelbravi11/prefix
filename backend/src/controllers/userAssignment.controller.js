// controllers/userAssignment.controller.js
import User from "../models/User.js";

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
export const assignUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({
      message: "Campo 'role' mancante",
    });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).lean();

    if (!user) {
      return res.status(404).json({
        message: "Utente non trovato",
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Errore durante l'assegnazione del ruolo",
      error: err.message,
    });
  }
};

/*
  PUT /api/v1/users/:id/assign-building
  Assegna uno o più edifici a un utente
  Usato da Admin Centrale
*/
export const assignUserBuilding = async (req, res) => {
  const { id } = req.params;
  const { buildingIds } = req.body;

  if (!Array.isArray(buildingIds)) {
    return res.status(400).json({
      message: "buildingIds deve essere un array di ObjectId",
    });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { buildingIds },
      { new: true }
    ).lean();

    if (!user) {
      return res.status(404).json({
        message: "Utente non trovato",
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Errore durante l'assegnazione degli edifici",
      error: err.message,
    });
  }
};
