// src/services/preferences.service.js
import api from "@/services/api";

const LS_KEY = "prefix.preferences.v1";

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocal(prefs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs || {}));
  } catch {
    // ignore
  }
}

function isRouteNotFound(err) {
  const status = err?.response?.status;
  const msg = String(err?.response?.data?.message || "");
  return status === 404 || msg.toLowerCase().includes("route non trovata");
}

export const preferencesService = {
  async getMyPreferences() {
    try {
      const res = await api.get("/preferences/me");
      saveLocal(res.data);
      return res.data;
    } catch (err) {
      if (isRouteNotFound(err)) return loadLocal();
      throw err;
    }
  },

  async updateMyPreferences(payload) {
    try {
      const res = await api.put("/preferences/me", payload);
      saveLocal(res.data);
      return res.data;
    } catch (err) {
      if (isRouteNotFound(err)) {
        saveLocal(payload);
        return payload;
      }
      throw err;
    }
  },

  async triggerRulesCheck() {
    const res = await api.post("/scheduler/trigger/rules-check");
    return res.data;
  },

  async triggerAICheck() {
    const res = await api.post("/scheduler/trigger/ai-check");
    return res.data;
  },
};
