import api from "@/services/api";

export const createAssignBuildingRequest = (buildingId) =>
  api.post("/requests/assign-building", { buildingId });

export const fetchRequests = (params = {}) => api.get("/requests", { params });

export const updateRequestStatus = (requestId, status) =>
  api.put(`/requests/${requestId}`, { status });
