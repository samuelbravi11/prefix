// La permission.map serve solo a collegare un’azione concreta dell’utente (HTTP method + route) a una permission string.
// Questo sarà fondamentale per poi prelevare le info sul DB e verificare se un utente può effettuare quella determinata azione (la permission string)
// La gerarchia è risolta dal PDP, NON qui.

export const PERMISSION_MAP = {
  /* -----------
  UTENTE ANONIMO
  ----------- */
  "POST /auth/register": "auth:register",


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
  
  "GET /api/v1/users/pending": "users:pending:view",
  "PUT /api/v1/users/:id/assign-role": "users:assign_role",
  "PUT /api/v1/users/:id/assign-building": "users:assign_building",


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
