import api from "@/services/api";

// Edifici associati all'utente (già esistente)
export function fetchMyBuildings() {
  return api.get("/buildings");
}

// Tutti gli edifici (tabella) con sorting/stats
export function fetchAllBuildings(params = {}) {
  return api.get("/buildings/all", { params });
}

export function createBuilding(payload) {
  return api.post("/buildings", payload);
}

export function updateBuilding(id, payload) {
  return api.put(`/buildings/${id}`, payload);
}

export function deleteBuilding(id) {
  return api.delete(`/buildings/${id}`);
}
