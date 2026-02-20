// src/services/userAdmin.service.js
import api from "@/services/api";

// USERS
export const fetchPendingUsers = () => api.get("/users/pending");
export const fetchManagedUsers = () => api.get("/users");

// APPROVE PENDING
export const approveUser = (userId, roleName) =>
  api.patch(`/users/${userId}/approve`, roleName ? { roleName } : {});

// UPDATE STATUS (active <-> disabled)
export const updateUserStatus = (userId, status) =>
  api.patch(`/users/${userId}/status`, { status });

// UPDATE ROLE (active/disabled only)
export const updateUserRole = (userId, roleName) =>
  api.patch(`/users/${userId}/role`, { roleName });

// BUILDINGS MANAGEMENT
export const fetchUsersBuildings = (params = {}) => api.get("/users/buildings", { params });

// assign buildings
export const updateUserBuildings = (userId, buildingIds) => api.patch(`/users/${userId}/buildings`, { buildingIds });

// list buildings (for dropdown)
// Per amministrazione/gestione richieste serve la lista completa, non solo "my buildings"
export const fetchAllBuildings = (params = {}) => api.get("/buildings/all", { params });