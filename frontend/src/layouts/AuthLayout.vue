<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/stores/notification.store";
import { initSocket, closeSocket } from "@/services/socket.service.js";
import Sidebar from "@/components/Sidebar.vue";
import Navbar from "@/components/Navbar.vue";
import Settings from '@/components/Settings.vue'

/* AuthLayout.vue
  Layout contenitore per tutte le pagine che richiedono autenticazione.
  Include:
    - Sidebar
    - Navbar
    - <router-view /> per le pagine (Dashboard, Profilo, ecc.)
  Si occupa anche di fetchare notifiche e inizializzare il socket
*/

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const router = useRouter();

// Ref del contenitore scrollabile della dashboard
const mainScrollContainer = ref(null);

// Popup impostazioni
const showSettings = ref(false)
function openSettings() { showSettings.value = true }

//chiama l’API /notifications --> popola lo store --> aggiorna badge e lista
onMounted(async () => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    try {
      // Verifica se il token è scaduto (solo per evitare chiamate inutili)
      const isExpired = isTokenExpired(token);
      
      if (isExpired) {
        // Il token è scaduto, logout immediato
        authStore.logout();
        router.push("/login");
        return;
      }
      
      await authStore.fetchMe();

      if (authStore.isAuthenticated && authStore.user) {
        // Verifica che l'utente sia attivo
        if (authStore.user.status !== "active") {
          console.log("Utente non attivo, logout...");
          authStore.logout();
          return;
        }
        
        // Inizializza WebSocket per notifiche in tempo reale
        initSocket({
          userId: authStore.user._id,
          role: authStore.user.roles?.[0]?.roleName,
          buildingId: authStore.user.buildingId
        });
        
        await notificationStore.fetchNotifications();
      } else {
        // Se fetchMe non ha impostato isAuthenticated, qualcosa è andato storto
        authStore.logout();
        router.push("/login");
      }
    } catch (error) {
      console.error("Errore inizializzazione AuthLayout:", error);
      authStore.logout();
      router.push("/login");
    }
  } else {
    // Nessun token, reindirizza
    router.push("/login");
  }
});

onUnmounted(() => {
  closeSocket();
});

// Funzione helper per verificare se un token è scaduto (semplice, senza refresh)
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // Se non riesco a parsare, considero scaduto
  }
}
</script>

<template>
  <div class="d-flex vh-100">
    <!-- Passiamo il ref al componente Sidebar e evento per aprire popup -->
    <Sidebar :scroll-container="mainScrollContainer" @open-settings="openSettings"/>


    <div class="flex-grow-1 d-flex flex-column">
      <Navbar :scroll-container="mainScrollContainer" @open-settings="openSettings"/>
      <!-- Contenitore scrollabile dove entrano le pagine -->
      <div class="flex-grow-1 overflow-auto bg-light" ref="mainScrollContainer">
        <router-view />
      </div>
    </div>

    <!-- Popup impostazioni modulare -->
    <Settings v-model:show="showSettings" />
  </div>
</template>
