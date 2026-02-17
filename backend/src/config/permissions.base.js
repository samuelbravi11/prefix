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

  // Auth base (utente registrato)
  "auth:login",

  // Notifiche (lettura)
  "notifications:view",

  // Dashboard base
  "dashboard:view",

  // Eventi (lettura)
  "events:view",

  // Buildings:
  // - associati (vista “mia”)
  "buildings:view_associated",
  // - tabella “tutti” necessaria per selezionare un edificio e fare richiesta assegnazione
  "buildings:view_all",

  // Richieste (utente secondario/base)
  "requests:assign_building:create",
  // (opzionale, se vuoi che anche user_base possa chiedere un ruolo)
  // "requests:assign_role:create",

  // Oggetti e regole (lettura)
  "assets:view",
  "rules:view",

  // Interventi:
  // - lettura (tabella/report)
  "interventions:view",
  // - creazione e bulk upload (se vuoi che user_base possa inserire interventi)
  "interventions:manage",
  "interventions:bulk_upload",
];