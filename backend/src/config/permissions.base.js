// src/config/permissions.base.js

/**
 * Permessi MINIMI per un utente "user_base".
 *
 * NOTE IMPORTANTI:
 * - I permessi base sono SEMPRE inclusi in qualsiasi ruolo (anche admin e ruoli custom),
 *   così l'app rimane utilizzabile.
 * - La registrazione (tenant/bootstrap/auth/register) NON deve dipendere da permessi RBAC:
 *   è un flusso pubblico/implicito o protetto da seed_key/token bootstrap.
 */
export const BASE_PERMISSIONS = [
  // Area riservata / accesso
  "area_riservata:access",

  // Preferenze utente (tema/accent, toggle UI scheduler)
  "preferences:manage",

  // Auth base (utente registrato)
  "auth:login",
  "auth:logout",

  // Notifiche
  "notifications:view",
  "notifications:manage",

  // Dashboard base
  "dashboard:view",

  // Eventi (calendario interventi)
  "events:view",

  // Buildings:
  // - associati (vista “mia”)
  "buildings:view_associated",
  // - tabella “tutti” necessaria per selezionare un edificio e fare richiesta assegnazione
  "buildings:view_all",

  // Richieste (utente base): richiesta assegnazione edificio
  "requests:assign_building:create",

  // Oggetti/Asset e regole: lettura
  "assets:view",
  "rules:view",

  // Interventi: lettura tabellare/lista
  "interventions:view",

  // Se vuoi che l’utente base POSSA creare e fare bulk upload, lascia questi.
  // Se invece vuoi che siano privilegiati, SPOSTALI nei permessi privilegiati e NON qui.
  "interventions:manage",
  "interventions:bulk_upload",
];