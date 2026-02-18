// src/stores/preferences.store.js
import { defineStore } from "pinia";
import { preferencesService } from "@/services/preferences.service";

const DEFAULT_PREFS = {
  theme: "system",
  accent: "#58a6ff",
  notifications: {
    enabled: true,
    channels: { inApp: true, email: false },
    typesEnabled: {},
    minSeverity: "info",
    quietHours: { enabled: false, from: "22:00", to: "08:00" },
    digest: { enabled: false, everyMinutes: 60 },
  },
  scheduler: {
    rulesCheckMinutes: 15,
    aiCheckMinutes: 60,
    pollingSeconds: 20,
  },
};

export const usePreferencesStore = defineStore("preferencesStore", {
  state: () => ({
    loading: false,
    saving: false,
    error: null,
    prefs: { ...DEFAULT_PREFS },
  }),

  actions: {
    applyThemeToDom() {
      const theme = this.prefs.theme || "system";
      const accent = this.prefs.accent || "#58a6ff";

      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.style.setProperty("--accent", accent);
    },

    async fetch() {
      this.loading = true;
      this.error = null;
      try {
        const data = await preferencesService.getMyPreferences();
        this.prefs = { ...DEFAULT_PREFS, ...(data || {}) };

        this.prefs.notifications = { ...DEFAULT_PREFS.notifications, ...(this.prefs.notifications || {}) };
        this.prefs.notifications.channels = {
          ...DEFAULT_PREFS.notifications.channels,
          ...(this.prefs.notifications.channels || {}),
        };
        this.prefs.notifications.quietHours = {
          ...DEFAULT_PREFS.notifications.quietHours,
          ...(this.prefs.notifications.quietHours || {}),
        };
        this.prefs.notifications.digest = {
          ...DEFAULT_PREFS.notifications.digest,
          ...(this.prefs.notifications.digest || {}),
        };
        this.prefs.scheduler = { ...DEFAULT_PREFS.scheduler, ...(this.prefs.scheduler || {}) };

        this.applyThemeToDom();
      } catch (e) {
        const msg = e?.response?.data?.message || "Impossibile caricare preferenze";
        if (!String(msg).toLowerCase().includes("route non trovata")) {
          this.error = msg;
        }
      } finally {
        this.loading = false;
      }
    },

    async save(payload) {
      this.saving = true;
      this.error = null;
      try {
        const saved = await preferencesService.updateMyPreferences(payload);
        this.prefs = { ...DEFAULT_PREFS, ...(saved || payload || {}) };
        this.applyThemeToDom();
      } catch (e) {
        const msg = e?.response?.data?.message || "Salvataggio preferenze fallito";
        if (!String(msg).toLowerCase().includes("route non trovata")) {
          this.error = msg;
        }
        throw e;
      } finally {
        this.saving = false;
      }
    },

    async triggerRulesNow() {
      return preferencesService.triggerRulesCheck();
    },

    async triggerAiNow() {
      return preferencesService.triggerAICheck();
    },
  },
});
