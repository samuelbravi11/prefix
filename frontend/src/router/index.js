import { createRouter, createWebHistory } from "vue-router";
import AuthLayout from "../layouts/AuthLayout.vue";
import { useAuthStore } from "@/stores/auth.store";

/* STRUTTURA DELLE ROTTE:

************************************
- Rotte pubbliche:
  /login --> Login.vue
  /register --> Register.vue

------------------------------------

- Rotte protette (richiedono autenticazione):
  / --> AuthLayout.vue
    - rotte figlie:
      "" (path vuoto) --> Dashboard.vue (rotta di default)
      "user-requests" --> UserRequests.vue
      (altre rotte protette possono essere aggiunte qui)
************************************

Layout AuthLayout.vue:
  - Vue monta AuthLayout
  - Sidebar e Navbar restano fisse
  - <router-view/> carica tutte le pagine principali (Dashboard, Assets, Notifications, ecc.)
  
  Solo la rotta di layout è protetta da autenticazione, le rotte figlie ereditano questa protezione automaticamente.
  Grazie ad AuthLayout, Sidebar e Navbar non si ricaricano ad ogni cambio di rotta figlia e
  inoltre carico le notifiche globali una volta sola all’avvio dell’applicazione.
*/

const routes = [
  {
    path: "/login",
    component: () => import("@/views/Login.vue"),
    meta: { public: true },
  },
  {
    path: "/register",
    component: () => import("@/views/Register.vue"),
    meta: { public: true },
  },
  {
    path: "/",
    component: () => import("@/layouts/AuthLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        redirect: "/dashboard",
      },
      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("@/views/Dashboard.vue"),
      },
      {
        path: "user-requests",
        name: "user-requests",
        component: () => import("@/views/UserRequests.vue"),
      },
      {
        path: "buildings-list",
        name: "buildings-list",
        component: () => import("@/views/BuildingsList.vue"),
      },
      {
        path: "calendar",
        name: "calendar",
        component: () => import("@/views/Calendar.vue"),
      },
      {
        path: "visualizzazione-tabellare",
        name: "visualizzazione-tabellare",
        component: () => import("@/views/VisualizzazioneTabellare.vue"),
      },
      {
        path: "notifiche",
        name: "notifiche",
        component: () => import("@/views/Notifiche.vue"),
      },
      {
        path: "gestione-utenti",
        name: "gestione-utenti",
        component: () => import("@/views/UserManagement.vue"),
      },
      {
        path: "assegna-edifici",
        name: "assegna-edifici",
        component: () => import("@/views/UserBuildingsManagement.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Route Guard globale --> controlla autenticazione prima di ogni cambio di rotta
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const token = localStorage.getItem("accessToken");

  // Se la rotta richiede autenticazione
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!token) {
      return next("/login");
    }

    // Se c'è token ma lo store non è stato inizializzato
    if (!authStore.isAuthenticated && !authStore.loading) {
      try {
        await authStore.fetchMe();

        if (!authStore.isAuthenticated) {
          return next("/login");
        }
      } catch (error) {
        console.error("Errore durante fetchMe:", error);
        return next("/login");
      }
    }
  }

  // Se la rotta è pubblica e l'utente è già autenticato, reindirizza alla dashboard
  if (to.meta.public && authStore.isAuthenticated) {
    return next("/dashboard");
  }

  next();
});

export default router;
