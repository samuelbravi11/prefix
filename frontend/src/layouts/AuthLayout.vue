<script setup>
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/stores/notification.store";
import { initSocket, closeSocket } from "@/services/socket.service.js";
import Sidebar from "@/components/Sidebar.vue";
import Navbar from "@/components/Navbar.vue";

/* AuthLayout.vue
  Il layout è un contenitore di pagine. Qua dentro ci va tutto ciò che richiede l'autenticazione.
  Si occupa di fetchare le notifiche all'onMounted se l'utente è autenticato.

  Questo include:
  <AuthLayout>
    Sidebar
    Navbar
    <router-view /> <-- qui entrano le pagine (Dashboard, Profilo, ecc.)
  </AuthLayout>
*/

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const router = useRouter();

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
    <Sidebar />

    <div class="flex-grow-1 d-flex flex-column">
      <Navbar />
      <div class="flex-grow-1 overflow-auto">
        <router-view />
      </div>
    </div>
  </div>
</template>