import api from "@/services/api";

export const fetchAssets = (params = {}) => api.get("/assets", { params });
export const createAsset = (payload) => api.post("/assets", payload);
export const updateAsset = (id, payload) => api.put(`/assets/${id}`, payload);
export const deleteAsset = (id) => api.delete(`/assets/${id}`);
