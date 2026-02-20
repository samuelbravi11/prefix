// src/docs/permissions.catalog.js
// Catalogo descrittivo dei permessi usati dal backend/proxy.
//
// IMPORTANTE:
// - Alcuni endpoint sono pubblici/impliciti e NON richiedono permessi assegnati (es. registrazione tenant/bootstrap).
// - auth:register non deve essere considerato un permesso “privilegiato”: è parte del flusso pubblico/implicito.
// - Tutti i ruoli includono SEMPRE i permessi base (user_base), quindi l'app rimane utilizzabile.

export const PERMISSIONS_BASE = {
  "area_riservata:access": "Accesso all’area riservata e lettura del profilo (/users/me).",
  "preferences:manage":
    "Legge/salva le preferenze utente (tema, accent e toggle UI dello scheduler).",
  "auth:login": "Esegue login e refresh token (utente registrato).",
  "auth:logout": "Logout dell’utente.",
  "notifications:view": "Visualizza notifiche e contatore non lette.",
  "notifications:manage": "Segna notifiche come lette / mark-all-read.",
  "buildings:view": "Visualizza edifici associati e dettagli base.",
  "assets:view": "Visualizza beni/asset associati (lettura).",
  "interventions:view": "Visualizza interventi associati (tabella/lista).",
};

export const PERMISSIONS_PRIVILEGED = {
  // Users / RBAC
  "users:active:view": "Elenca utenti attivi/gestibili.",
  "users:pending:view": "Elenca utenti in stato pending.",
  "users:approve": "Approva un utente pending impostandone ruolo e stato.",
  "users:update_role": "Modifica il ruolo di un utente.",
  "users:update_status": "Attiva/disattiva un utente (status).",
  "users:info:view": "Ricerca e visualizza informazioni dettagliate sugli utenti.",
  "users:buildings:view": "Visualizza assegnazioni edifici per utenti.",
  "users:buildings:update": "Aggiorna/assegna edifici a utenti (manuale o tramite richieste).",

  // Roles & permissions
  "roles:view": "Visualizza ruoli esistenti e relative configurazioni.",
  "roles:manage": "Crea/modifica/elimina ruoli.",
  "permissions:view": "Elenca permessi disponibili (lista completa).",

  // Scheduler / platform
  "scheduler:view": "Legge lo stato dello scheduler.",
  "scheduler:manage": "Avvia/ferma lo scheduler.",

  // Rules & maintenance
  "rules:view": "Visualizza regole e configurazioni manutentive.",
  "rules:manage": "Crea/modifica regole e parametri di manutenzione.",

  // Requests / assignments
  "requests:view": "Visualizza richieste (es. assegnazione edifici).",
  "requests:manage": "Approva/rifiuta/gestisce richieste.",

  // Interventions management
  "interventions:manage": "Crea/aggiorna/cancella interventi.",
  "interventions:bulk_upload": "Caricamento massivo interventi (preview/commit).",

  // Buildings management
  "buildings:manage": "Crea/modifica/elimina edifici.",
  "buildings:assign": "Assegna edifici a utenti.",

  // Dashboard
  "dashboard:view": "Visualizza statistiche dashboard.",
};