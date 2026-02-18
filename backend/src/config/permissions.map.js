// src/config/permission.map.js
// La permission.map serve solo a collegare un’azione concreta dell’utente (HTTP method + route)
// a una permission string. La gerarchia/eredità è risolta dal PDP, NON qui.

export const PERMISSION_MAP = {
  /* =================
   * UTENTE ANONIMO
   * ================= */
  "POST /auth/register": "auth:register",
  "POST /auth/verify-email": "auth:register",
  "POST /auth/totp/setup": "auth:register",
  "POST /auth/totp/verify": "auth:register",

  /* =================
   * UTENTE REGISTRATO
   * ================= */
  "POST /auth/login": "auth:login",
  "POST /auth/logout": "auth:login",
  "GET /auth/me": "auth:login",

  // Area riservata (profilo/me)
  "GET /api/v1/users/me": "area_riservata:access",

  // Notifiche
  "GET /api/v1/notifications": "notifications:view",
  "GET /api/v1/notifications/unread-count": "notifications:view",
  "PATCH /api/v1/notifications/:id/read": "notifications:view",
  "PATCH /api/v1/notifications/read-all": "notifications:view",

  // Eventi / calendario interventi (già implementato)
  "GET /api/v1/events": "events:view",
  "GET /api/v1/events/:id": "events:view",
  "GET /api/v1/events/stats": "events:stats:view",

  // Dashboard
  "GET /api/v1/dashboard/stats": "dashboard:view",

  // Buildings: lista associati (utente vede solo ciò che ha)
  "GET /api/v1/buildings": "buildings:view_associated",

  /* =================
   * UTENTE SECONDARIO
   * ================= */
  // Richiesta assegnazione edificio / ruolo
  "POST /api/v1/requests/assign-building": "requests:assign_building:create",
  "POST /api/v1/requests/assign-role": "requests:assign_role:create",

  /* =================
   * ADMIN CENTRALE
   * ================= */
  // Gestione richieste (approva/rifiuta)
  "GET /api/v1/requests": "requests:manage",
  "GET /api/v1/requests/:id": "requests:manage",
  "PUT /api/v1/requests/:id": "requests:manage",

  // Roles management
  "POST /api/v1/roles": "roles:manage",
  "GET /api/v1/roles": "roles:manage",
  "DELETE /api/v1/roles/:id": "roles:manage",
  "GET /api/v1/permissions": "roles:manage",

  // Users: gestione stato/ruolo e informazioni
  "GET /api/v1/users/pending": "users:pending:view",
  "GET /api/v1/users": "users:active:view",
  "PATCH /api/v1/users/:id/approve": "users:pending:approve",
  "PATCH /api/v1/users/:id/role": "users:role:update",
  "PATCH /api/v1/users/:id/status": "users:status:update",

  // Users: assegnazione edifici
  "GET /api/v1/users/buildings": "users:building:view",
  "PATCH /api/v1/users/:id/buildings": "users:building:update",

  // Users: info (search)
  "GET /api/v1/users/search": "users:read_info",

  /* =================
   * ADMIN LOCALE
   * ================= */

  // Buildings: tabella "tutti" + dettaglio (per gestione/assegnazioni)
  "GET /api/v1/buildings/all": "buildings:view_all",
  "GET /api/v1/buildings/:id": "buildings:view_all",

  // Buildings: create/update/delete (protette)
  "POST /api/v1/buildings": "buildings:manage",
  "PUT /api/v1/buildings/:id": "buildings:manage",
  "DELETE /api/v1/buildings/:id": "buildings:manage",

  // Assets (Oggetti)
  "GET /api/v1/assets": "assets:view",
  "POST /api/v1/assets": "assets:manage",
  "PUT /api/v1/assets/:id": "assets:manage",
  "DELETE /api/v1/assets/:id": "assets:manage",

  // Rules (Regole)
  "GET /api/v1/rules": "rules:view",
  "POST /api/v1/rules": "rules:manage",
  "PUT /api/v1/rules/:id": "rules:manage",
  "DELETE /api/v1/rules/:id": "rules:manage",

  // Interventions (Report/Interventi)
  "GET /api/v1/interventions": "interventions:view",
  "GET /api/v1/interventions/:id": "interventions:view",
  "GET /api/v1/interventions/table": "interventions:view",

  "POST /api/v1/interventions": "interventions:manage",
  "DELETE /api/v1/interventions/:id": "interventions:manage",

  "POST /api/v1/interventions/bulk/preview": "interventions:bulk_upload",
  "POST /api/v1/interventions/bulk/commit": "interventions:bulk_upload",
};
