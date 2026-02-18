import { defineStore } from "pinia";
import authApi from "@/services/authApi";
import api from "@/services/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    permissions: [],
    inheritAllBuildings: false,
    isAuthenticated: false,
    loading: false,
    initialized: false,
  }),

  actions: {
    async fetchMe() {
      this.loading = true;

      try {
        // CSRF token (double submit cookie)
        await authApi.get("/csrf");

        // Profilo completo (RBAC)
        const res = await api.get("/users/me");
        this.user = res.data?.user || null;
        this.permissions = Array.isArray(res.data?.permissions) ? res.data.permissions : [];
        this.inheritAllBuildings = Boolean(res.data?.inheritAllBuildings);

        this.isAuthenticated = true;
      } catch (err) {
        this.user = null;
        this.permissions = [];
        this.inheritAllBuildings = false;
        this.isAuthenticated = false;
      } finally {
        this.loading = false;
        this.initialized = true;
      }
    },

    async logout() {
      try {
        await authApi.post("/logout", {
          fingerprintHash: localStorage.getItem("fingerprintHash"),
        });
      } catch (err) {
        console.error("logout error", err);
      } finally {
        this.user = null;
        this.permissions = [];
        this.inheritAllBuildings = false;
        this.isAuthenticated = false;
        this.initialized = true;

        localStorage.removeItem("fingerprintHash");
        window.location.href = "/login";
      }
    },
  },
});
