// src/config/permission.map.js
// Collega una route (HTTP method + path) a una permission string.
// La gerarchia/eredità è risolta dal PDP, NON qui.
//
// IMPORTANTISSIMO:
// - Alcuni endpoint sono PUBLICI/IMPLICITI (registrazione bootstrap/onboarding).
//   In quei casi usiamo "__public__" e il proxy deve bypassare RBAC per quella route.

export const PERMISSION_MAP = {
  /* ---------------------------
   * AUTH
   * ------------------------- */

  // Flussi pubblici/impliciti (non RBAC)
  "POST /auth/register": "__public__",
  "POST /auth/verify-email": "__public__",
  "POST /auth/totp/setup": "__public__",
  "POST /auth/totp/verify": "__public__",
  "GET /auth/csrf": "__public__",

  // Login/logout/refresh (utente registrato)
  "POST /auth/login": "auth:login",
  "POST /auth/logout": "auth:logout",
  "POST /auth/refresh": "auth:login",
  "GET /auth/me": "auth:login",

  /* ---------------------------
   * AREA RISERVATA
   * ------------------------- */
  "GET /api/v1/users/me": "area_riservata:access",

  /* ---------------------------
   * PREFERENCES
   * ------------------------- */
  "GET /api/v1/preferences/me": "preferences:manage",
  "PUT /api/v1/preferences/me": "preferences:manage",

  /* ---------------------------
   * NOTIFICATIONS
   * ------------------------- */
  "GET /api/v1/notifications": "notifications:view",
  "GET /api/v1/notifications/unread-count": "notifications:view",
  "PATCH /api/v1/notifications/:id/read": "notifications:manage",
  "PATCH /api/v1/notifications/read-all": "notifications:manage",

  /* ---------------------------
   * EVENTS / CALENDARIO
   * ------------------------- */
  "GET /api/v1/events": "events:view",
  "GET /api/v1/events/:id": "events:view",
  "GET /api/v1/events/stats": "events:view", // se hai un permesso dedicato events:stats:view puoi metterlo qui

  /* ---------------------------
   * DASHBOARD
   * ------------------------- */
  "GET /api/v1/dashboard/stats": "dashboard:view",

  /* ---------------------------
   * SCHEDULER (privilegiati)
   * ------------------------- */
  "GET /api/v1/scheduler/status": "scheduler:view",
  "POST /api/v1/scheduler/start": "scheduler:manage",
  "POST /api/v1/scheduler/stop": "scheduler:manage",

  /* ---------------------------
   * BUILDINGS
   * ------------------------- */

  // lista associati
  "GET /api/v1/buildings": "buildings:view_associated",

  // lista "tutti" + dettaglio
  "GET /api/v1/buildings/all": "buildings:view_all",
  "GET /api/v1/buildings/:id": "buildings:view_all",

  // CRUD buildings (privilegiati)
  "POST /api/v1/buildings": "buildings:manage",
  "PUT /api/v1/buildings/:id": "buildings:manage",
  "DELETE /api/v1/buildings/:id": "buildings:manage",

  /* ---------------------------
   * REQUESTS (assegnazioni)
   * ------------------------- */

  // richiesta assegnazione edificio (utente base)
  "POST /api/v1/requests/assign-building": "requests:assign_building:create",

  // richiesta assegnazione ruolo (se la usi davvero)
  "POST /api/v1/requests/assign-role": "requests:assign_role:create",

  // gestione richieste (privilegiati)
  "GET /api/v1/requests": "requests:manage",
  "GET /api/v1/requests/:id": "requests:manage",
  "PUT /api/v1/requests/:id": "requests:manage",

  /* ---------------------------
   * ROLES & PERMISSIONS (privilegiati)
   * ------------------------- */
  "POST /api/v1/roles": "roles:manage",
  "GET /api/v1/roles": "roles:view",
  "DELETE /api/v1/roles/:id": "roles:manage",

  "GET /api/v1/permissions": "permissions:view",

  /* ---------------------------
   * USERS (privilegiati)
   * ------------------------- */

  // liste utenti
  "GET /api/v1/users/pending": "users:pending:view",
  "GET /api/v1/users": "users:active:view",
  "GET /api/v1/users/managed": "users:active:view",

  // approve pending
  // fix: nel tuo errore era POST, nel map vecchio era PATCH e permesso diverso
  "POST /api/v1/users/:id/approve": "users:approve",
  "PATCH /api/v1/users/:id/approve": "users:approve",

  // update role / status (coerenti col frontend)
  "PATCH /api/v1/users/:id/role": "users:update_role",
  "PATCH /api/v1/users/:id/status": "users:update_status",

  // buildings per user
  "GET /api/v1/users/buildings": "users:buildings:view",
  "PATCH /api/v1/users/:id/buildings": "users:buildings:update",

  // info/search
  "GET /api/v1/users/search": "users:info:view",

  /* ---------------------------
   * ASSETS (OGGETTI)
   * ------------------------- */
  "GET /api/v1/assets": "assets:view",
  "POST /api/v1/assets": "assets:manage",
  "PUT /api/v1/assets/:id": "assets:manage",
  "DELETE /api/v1/assets/:id": "assets:manage",

  // categories (tipologie asset)
  "GET /api/v1/categories": "assets:view",

  /* ---------------------------
   * RULES
   * ------------------------- */
  "GET /api/v1/rules": "rules:view",
  "POST /api/v1/rules": "rules:manage",
  "PUT /api/v1/rules/:id": "rules:manage",
  "DELETE /api/v1/rules/:id": "rules:manage",

  /* ---------------------------
   * INTERVENTIONS
   * ------------------------- */
  "GET /api/v1/interventions": "interventions:view",
  "GET /api/v1/interventions/:id": "interventions:view",
  "GET /api/v1/interventions/table": "interventions:view",

  "POST /api/v1/interventions": "interventions:manage",
  "DELETE /api/v1/interventions/:id": "interventions:manage",

  "POST /api/v1/interventions/bulk/preview": "interventions:bulk_upload",
  "POST /api/v1/interventions/bulk/commit": "interventions:bulk_upload",
};