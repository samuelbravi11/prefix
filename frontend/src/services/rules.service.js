import api from "@/services/api";

export const fetchRules = (params = {}) => api.get("/rules", { params });
export const createRule = (payload) => api.post("/rules", payload);
export const updateRule = (id, payload) => api.put(`/rules/${id}`, payload);
export const deleteRule = (id) => api.delete(`/rules/${id}`);
