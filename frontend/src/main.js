import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./assets/main.scss";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

import PrimeVue from "@/plugins/primevue";
import "@/assets/styles/layout-fixes.css";

import "primevue/resources/themes/lara-light-blue/theme.css";
import "primevue/resources/primevue.css";
import "primeicons/primeicons.css";
import "primevue/resources/primevue.min.css";

// Aggiunta: axios globale con CSRF header + cookies
import axios from "axios";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// fondamentale: invia/riceve cookie (accessToken HttpOnly, refreshToken HttpOnly, csrfToken)
axios.defaults.withCredentials = true;

// Aggiunge sempre X-CSRF-Token se presente
axios.interceptors.request.use(
  (config) => {
    const csrf = getCookie("csrfToken");
    if (csrf) {
      config.headers = config.headers || {};
      config.headers["X-CSRF-Token"] = csrf;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const app = createApp(App);
const pinia = createPinia();

app.use(PrimeVue);
app.use(pinia);
app.use(router);
app.mount("#app");
