import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/main.scss'

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
const pinia = createPinia();

/* Pinia store --> state manager ufficiale di Vue
funzionamento:
- creo lo store
- lo inietto nell’app Vue (app.use(pinia))
- in ogni componente posso usare lo store (import { useXXXStore } from '...')
- lo store mantiene lo stato globale dell’app (es. utente loggato, notifiche, ecc)
*/
app.use(pinia);
app.use(router);
app.mount("#app");
