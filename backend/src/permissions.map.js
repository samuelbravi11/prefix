// La permission.map serve solo a collegare un’azione concreta dell’utente (HTTP method + route) a una permission string.
// Questo sarà fondamentale per poi prelevare le info sul DB e verificare se un utente può effettuare quella determinata azione (la permission string)
// La gerarchia è risolta dal PDP, NON qui.

export const PERMISSION_MAP = {
  /* ============================
     AUTH / ACCESSO
  ============================ */
  "POST /auth/register": "auth:register",
  "POST /auth/login": "auth:login",

  /* ============================
     AREA RISERVATA (tutti i registrati)
  ============================ */
  "GET /api/v1/me": "area_riservata:access",

  /* ============================
     DASHBOARD
  ============================ */
  "GET /api/v1/dashboard/locale": "dashboard:locale:view",
  "GET /api/v1/dashboard/impresa": "dashboard:impresa:view",
  "GET /api/v1/dashboard/globale": "dashboard:globale:view",

  /* ============================
     REQUESTS
  ============================ */
  "POST /api/v1/requests/assign-building":
    "requests:assign_building:create",

  /* ============================
     ADMIN CENTRALE – UTENTI
  ============================ */
  "GET /api/v1/users/pending": "users:pending:view",
  "PUT /api/v1/users/:id/assign-role": "users:assign_role",
  "PUT /api/v1/users/:id/assign-building": "users:assign_building",

  /* ============================
     NOTIFICHE / CALENDARIO
  ============================ */
  "GET /api/v1/notifications": "notifications:view",
  "GET /api/v1/calendar": "calendar:view",
};
