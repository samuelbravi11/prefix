/*
    normalizePath trasforma un URL concreto (con ID, query string, slash finali)
    in una forma astratta e stabile, usabile come chiave di sicurezza.

    esempio:
    GET /api/v1/users/12
    GET /api/v1/users/87
    GET /api/v1/users/999
    Dal punto di vista della sicurezza (RBAC) queste richieste sono identiche, ma a livello di URL sono diverse, perché cambia l’ID:
    /api/v1/users/:id
*/

export function normalizePath(path) {
  return path
    .split("?")[0]
    .replace(/\/\d+/g, "/:id")
    .replace(/\/$/, "");
}
