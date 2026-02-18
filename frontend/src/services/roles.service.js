import api from "@/services/api";

export const fetchRoles = () => api.get("/roles");
export const fetchPermissions = () => api.get("/permissions");
export const createRole = (payload) => api.post("/roles", payload);
export const deleteRole = (id) => api.delete(`/roles/${id}`);
