<template>
  <nav class="navbar navbar-light bg-white px-4 shadow py-4">
    <div class="container-fluid">
      <span class="navbar-brand mb-0 h5">Dashboard</span>
      <div class="d-flex align-items-center navbar-icons">

        <!-- Utente -->
        <div class="icon-wrapper">
          <img :src="iconaUtente" class="icon-user" />
        </div>

        <!-- Settings -->
        <div class="icon-wrapper">
          <img :src="settings" class="icon" />
        </div>

        <!-- Notifiche -->
        <div class="icon-wrapper position-relative">
          <img
            :src="notifiche"
            class="icon"
            @click="showNotifications = !showNotifications"
          />

          <!-- Badge -->
          <span
            v-if="notificationCount > 0"
            class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
          >
            {{ notificationCount }}
          </span>

          <!-- Lista notifiche -->
          <NotificationList
            v-if="showNotifications"
            class="notification-dropdown"
          />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import notifiche from "@/assets/images/Notifiche.png"
import settings from "@/assets/images/Setting.png"
import iconaUtente from "@/assets/images/icona_utente.png"
import { ref } from "vue";
import NotificationList from "./NotificationList.vue";
import { useNotification } from "@/composables/useNotification";

const showNotifications = ref(false);

// Usando il composable per le notifiche --> ottenere il conteggio delle notifiche non lette
// Dopo aver fatto il login, il badge si aggiorna automaticamente, fetchando le notifiche sullo store (AuthLayout.vue)
const {
  unreadCount: notificationCount
} = useNotification();
</script>


<style scoped>
.navbar-icons {
  gap: 16px;
}

.icon-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon {
  height: 18px;
}

.icon-user {
  height: 24px;
}

.notification-dropdown {
  position: absolute;
  top: 120%; /* spinge il dropdown sotto la campanella */
  right: 0;
  min-width: 320px;
  z-index: 10000; /* sopra tutto */
}
</style>