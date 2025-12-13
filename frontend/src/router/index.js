// router/index.js
import { createRouter, createWebHistory } from "vue-router";

import Login from "@/views/Login.vue";
import Register from "@/views/Register.vue";
import Dashboard from "@/views/Dashboard.vue";

const routes = [
  {
    path: "/login",
    component: Login,
    meta: { public: true }
  },
  {
    path: "/register",
    component: Register,
    meta: { public: true }
  },
  {
    path: "/dashboard",
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: "/",
    redirect: "/dashboard"
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Global Route Guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem("accessToken");

  // Se non autenticato e la route richiede auth → login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next("/login");
  }

  // Se autenticato e tenta di andare su login/register → dashboard
  if (isAuthenticated && to.meta.public) {
    return next("/dashboard");
  }

  next();
});

export default router;
