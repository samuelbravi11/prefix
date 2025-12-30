/*
  normalizePath trasforma un URL concreto (con ID, query string, slash finali)
  in una forma astratta e stabile, usabile come chiave di sicurezza.

  esempio:
  GET /api/v1/users/12 --> /api/v1/users/:id
  GET /api/v1/users/87 --> /api/v1/users/:id
  GET /api/v1/users/999?mohammed=true --> /api/v1/users/:id
  
  Dal punto di vista della sicurezza (RBAC) queste richieste sono identiche, ma a livello di URL sono diverse, perché cambia l’ID
*/
export function normalizePath(path) {
  return path
    .split("?")[0]
    .replace(/\/[0-9a-fA-F]{24}(?=\/|$)/g, "/:id")  // ObjectId Mongo
    .replace(/\/\d+(?=\/|$)/g, "/:id")  // numeri
    .replace(/\/$/, "");
}
