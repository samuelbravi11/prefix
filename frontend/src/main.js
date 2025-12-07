import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/main.scss'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setupAxiosRefresh } from "./api/tokenService"

setupAxiosRefresh();

createApp(App).use(router).mount('#app');
