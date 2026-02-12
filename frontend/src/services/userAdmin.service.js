// src/services/userAdmin.service.js
import api from "@/services/api";

// USERS
export const fetchPendingUsers = () => api.get("/users/pending");
export const fetchManagedUsers = () => api.get("/users");

// APPROVE PENDING
export const approveUser = (userId, roleName) =>
  api.patch(`/users/${userId}/approve`, roleName ? { roleName } : {});

// UPDATE STATUS +/OR ROLE (active/disabled only)
export const updateUserStatusOrRole = (userId, payload) =>
  api.patch(`/users/${userId}/status`, payload);

// BUILDINGS MANAGEMENT
export const fetchUsersBuildings = (params = {}) =>
  api.get("/users/buildings", { params });

// assign buildings
export const updateUserBuildings = (userId, buildingIds) =>
  api.patch(`/users/${userId}/buildings`, { buildingIds });

// list buildings (for dropdown)
export const fetchAllBuildings = () => api.get("/buildings");
