// La permission.map serve solo a collegare un’azione concreta dell’utente (HTTP method + route) a una permission string.
// Questo sarà fondamentale per poi prelevare le info sul DB e verificare se un utente può effettuare quella determinata azione (la permission string)
// La gerarchia è risolta dal PDP, NON qui.

export const PERMISSION_MAP = {
  /* -----------
  UTENTE ANONIMO
  ----------- */
  "POST /auth/register": "auth:register",
  "POST /auth/verify-email": "auth:register",
  "POST /auth/totp/setup": "auth:register",
  "POST /auth/totp/verify": "auth:register",


  /* --------------
  UTENTE REGISTRATO
  -------------- */
  "POST /auth/login": "auth:login",
  "POST /auth/logout": "auth:login",
  "GET /auth/me": "auth:login",

  "GET /api/v1/users/me": "area_riservata:access",

  "GET /api/v1/notifications": "notifications:view",
  "PATCH /api/v1/notifications/:id/read": "notifications:view",
  "PATCH /api/v1/notifications/read-all": "notifications:view",

  //"GET /api/v1/calendar": "calendar:view",

  "GET /api/v1/events": "events:view",
  "GET /api/v1/events/:id": "events:view",
  "GET /api/v1/events/stats": "events:stats:view",

  "GET /api/v1/interventions": "interventions:view",
  "GET /api/v1/interventions/:id": "interventions:view",

  "GET /api/v1/dashboard/stats": "dashboard:view",
  
  "GET /api/v1/buildings": "buildings:view_associated",


  /* --------------
  UTENTE SECONDARIO
  -------------- */
  "POST /api/v1/requests/assign-building": "requests:assign_building:create",
  "POST /api/v1/requests/assign-role": "requests:assign_role:create",


  /* -----------
  ADMIN CENTRALE
  ----------- */
  "GET /api/v1/requests": "requests:manage",
  "GET /api/v1/requests/:id": "requests:manage",
  "PUT /api/v1/requests/:id": "requests:manage",
  
  // ✅ rotta reale (se tieni i controller "userAssignment")
  "PUT /api/v1/users/:id/assign-buildings": "users:building:update",
  // TODO QUESTA QUA SOTTO DA CAMBIARE
  "PUT /api/v1/users/:id/assign-building": "users:assign_building",
  
  // roles management --> TODO --> DA RIVEDERE TUTTI I PERMESSI
  "POST /api/v1/roles": "roles:manage",
  "GET /api/v1/roles": "roles:manage",
  "GET /api/v1/permissions": "roles:manage",
  // questo c'era già
  "PUT /api/v1/users/:id/assign-role": "users:assign_role",

  // TODO --> nuove anche queste
  "GET /api/v1/users/pending": "users:pending:view",          // vedere pending
  // "GET /api/v1/users": "users:active:view",           // vedere active
  // QUESTO SOPRA NO, QUELLO SOTTO MEGLIO
  "GET /api/v1/users": "users:active:view",

  "PATCH /api/v1/users/:id/approve": "users:pending:approve",       // attivare + assegnare ruolo (default user_base)
  "PATCH /api/v1/users/:id/role": "users:role:update",           // cambiare ruolo a user attivo
  // "PATCH /api/v1/users/:id/status": "users:status:disable",        // disattivare user attivo
  // QUESTO SOPRA NO, QUELLO SOTTO MEGLIO
  "PATCH /api/v1/users/:id/status": "users:status:update",


  "GET /api/v1/users/buildings": "users:building:view",         // lista utenti e filtro missing building
  "PATCH /api/v1/users/:id/buildings": "users:building:update",       // modificare buildingIds


  /* ---------
  ADMIN LOCALE
  --------- */
  "POST /api/v1/rules": "maintenance_rules:manage",
  "PUT /api/v1/rules/:id": "maintenance_rules:manage",
  "DELETE /api/v1/rules/:id": "maintenance_rules:manage",

  "POST /api/v1/assets": "assets:manage",
  "PUT /api/v1/assets/:id": "assets:manage",
  "DELETE /api/v1/assets/:id": "assets:manage"
};

/*
// config/permissions.map.js
export const PERMISSION_MAP = {
  // --- base app ---
  "GET /api/v1/users/me": "me:read",

  // --- notifications ---
  "GET /api/v1/notifications": "notifications:read",
  "PATCH /api/v1/notifications/:id/read": "notifications:write",
  "PATCH /api/v1/notifications/read-all": "notifications:write",

  // --- buildings ---
  "GET /api/v1/buildings": "buildings:read",

  // --- dashboard ---
  "GET /api/v1/dashboard/stats": "dashboard:read",

  // --- events ---
  "GET /api/v1/events": "events:read",
  "GET /api/v1/events/:id": "events:read",

  // --- interventions ---
  "GET /api/v1/interventions": "interventions:read",
  "GET /api/v1/interventions/:id": "interventions:read",

  // --- admin operations (tutte comunque in admin) ---
  "GET /api/v1/requests": "requests:read",
  "GET /api/v1/requests/:id": "requests:read",
  "PUT /api/v1/requests/:id": "requests:write",

  "GET /api/v1/users/pending": "users:read",
  "PUT /api/v1/users/:id/assign-role": "users:write",
  "PUT /api/v1/users/:id/assign-building": "users:write",
};
*/
