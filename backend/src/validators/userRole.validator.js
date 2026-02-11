/*
import {
  ASSIGNABLE_ROLES,
  FORBIDDEN_ASSIGNMENT_ROLES
} from "../config/roles.config.js";

// funzione che valuta che il ruolo di un utente esista e che non sia astratto
// vedi role.config.js per i dettagli sui ruoli assegnabili e non
export function validateAssignableRole(role) {
  if (!role) {
    throw new Error("Ruolo mancante");
  }

  if (FORBIDDEN_ASSIGNMENT_ROLES.includes(role)) {
    throw new Error(
      `Il ruolo '${role}' è un ruolo astratto e non assegnabile`
    );
  }

  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new Error(`Ruolo '${role}' non valido`);
  }
}
*/