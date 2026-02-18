import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

const routes = [
  { path: "/login", component: () => import("@/views/Login.vue"), meta: { public: true } },
  { path: "/login/totp", component: () => import("@/views/LoginTotp.vue"), meta: { public: true } },
  { path: "/bootstrap", component: () => import("@/views/Bootstrap.vue"), meta: { public: true } },
  { path: "/register", component: () => import("@/views/Register.vue"), meta: { public: true } },

  {
    path: "/",
    component: () => import("@/layouts/AuthLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: "/home" },

      { path: "home", name: "home", component: () => import("@/views/HomeQuickAccess.vue") },

      // specifiche
      { path: "calendar", name: "calendar", component: () => import("@/views/Calendar.vue") },
      { path: "buildings-list", name: "buildings-list", component: () => import("@/views/BuildingsList.vue") },
      { path: "notifiche", name: "notifiche", component: () => import("@/views/Notifiche.vue") },

      // generiche
      { path: "dashboard", name: "dashboard", component: () => import("@/views/Dashboard.vue") },
      { path: "gestione-utenti", name: "gestione-utenti", component: () => import("@/views/UsersModule.vue") },
      { path: "gestione-edifici", name: "gestione-edifici", component: () => import("@/views/BuildingsModule.vue") },
      { path: "oggetti-regole", name: "oggetti-regole", component: () => import("@/views/AssetsRulesModule.vue") },
      { path: "interventi", name: "interventi", component: () => import("@/views/InterventionsModule.vue") },

      // fallback interno
      { path: ":pathMatch(.*)*", redirect: "/home" },
    ],
  },

  // fallback globale
  { path: "/:pathMatch(.*)*", redirect: "/home" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  const isPublic = Boolean(to.meta.public);
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);

  // fetchMe solo quando serve (route protette o utente già loggato)
  if (!authStore.initialized && !authStore.loading && (requiresAuth || authStore.isAuthenticated)) {
    try {
      await authStore.fetchMe();
    } catch {
      // se fetchMe fallisce, lasciamo gestire dai controlli sotto
    }
  }

  // se la route richiede auth e non sei loggato
  if (requiresAuth && !authStore.isAuthenticated) return next("/login");

  // se vai su route pubblica ma sei già loggato
  if (isPublic && authStore.isAuthenticated) return next("/home");

  return next();
});

export default router;