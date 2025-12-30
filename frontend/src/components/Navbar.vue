<template>
  <nav class="navbar navbar-light bg-white border-bottom shadow-sm px-4 py-4">
    <div class="container-fluid">

      <!-- Titolo dinamico -->
      <span class="navbar-brand mb-0 h5">{{ pageTitle }}</span>

      <!-- Icone -->
      <div class="d-flex align-items-center gap-3 navbar-icons">
        <!-- Profilo -->
        <div class="icon-wrapper" @click="$emit('open-userdata')" title="Profilo">
          <img :src="iconaUtente" class="icon-user" alt="Profilo" />
        </div>

        <!-- Impostazioni -->
        <div class="icon-wrapper" @click="$emit('open-settings')" title="Impostazioni">
          <img :src="settingsIcon" class="icon" alt="Settings" />
        </div>

        <!-- Notifiche -->
        <div class="icon-wrapper position-relative">
          <img :src="notifiche" class="icon" alt="Notifiche" @click="toggleNotifications" />

          <!-- Badge -->
          <span v-if="notificationCount > 0"
            class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {{ notificationCount > 9 ? '9+' : notificationCount }}
          </span>

          <!-- Lista notifiche -->
          <NotificationList v-if="showNotifications" class="notification-dropdown" @close="showNotifications = false" />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import notifiche from "@/assets/images/Notifiche.png"
import settingsIcon from "@/assets/images/Setting.png"
import iconaUtente from "@/assets/images/icona_utente.png"
import { ref } from "vue";
import NotificationList from "./NotificationList.vue";
import { useNotification } from "@/composables/useNotification";

// Aggiungi la prop per il titolo
defineProps({
  pageTitle: {
    type: String,
    default: 'Dashboard'
  }
})

const showNotifications = ref(false);

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
};

// Chiudi notifiche quando si clicca fuori
import { onMounted, onUnmounted } from 'vue';
const handleClickOutside = (event) => {
  if (showNotifications.value &&
    !event.target.closest('.icon-wrapper') &&
    !event.target.closest('.notification-dropdown')) {
    showNotifications.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Usando il composable per le notifiche
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
  transition: background-color 0.2s;
  border-radius: 50%;
}

.icon-wrapper:hover {
  background-color: #f8f9fa;
}

.icon {
  height: 18px;
  width: 18px;
}

.icon-user {
  height: 24px;
  width: 24px;
}

.notification-dropdown {
  position: absolute;
  top: 120%;
  right: 0;
  min-width: 320px;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>