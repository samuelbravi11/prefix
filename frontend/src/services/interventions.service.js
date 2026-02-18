import api from "@/services/api";

export const fetchInterventions = (params = {}) => api.get("/interventions", { params });
export const fetchInterventionsTable = (params = {}) => api.get("/interventions/table", { params });

// Backend supports creating a single intervention object OR an array of intervention objects
export const createIntervention = (payload) => api.post("/interventions", payload);
export const deleteIntervention = (id) => api.delete(`/interventions/${id}`);

// Backend expects body = JSON array of rows
export const previewBulkInterventions = (rows = []) => api.post("/interventions/bulk/preview", rows);
export const commitBulkInterventions = (rows = []) => api.post("/interventions/bulk/commit", rows);
