// src/config/permissions.base.js

/**
 * Permessi MINIMI per un utente "user_base".
 * Qui ci metti solo ciò che vuoi permettere a chiunque sia "utente normale".
 *
 * Nota:
 * - Non mettere qui permessi "admin".
 * - Mantieni questa lista piccola e intenzionale.
 */
export const BASE_PERMISSIONS = [
  // Area riservata / accesso
  "area_riservata:access",

  // Profilo / auth
  "auth:login",

  // Notifiche (lettura)
  "notifications:view",

  // Dashboard base
  "dashboard:view",

  // Eventi / interventi (lettura)
  "events:view",
  "interventions:view",

  // Buildings (solo associati)
  "buildings:view_associated",

  // (opzionale) richieste utente secondario
  // "requests:assign_building:create",
  // "requests:assign_role:create",
];
