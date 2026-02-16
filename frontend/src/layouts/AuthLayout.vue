<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/stores/notification.store";
import { initSocket, closeSocket } from "@/services/socket.service.js";

import Sidebar from "@/components/Sidebar.vue";
import Navbar from "@/components/Navbar.vue";
import Settings from "@/components/Settings.vue";
import UserData from "@/components/UserData.vue";

/*
  AuthLayout.vue
  - verifica sessione (fetchMe) usando cookie HttpOnly
  - init socket realtime (cookie-based)
  - fetch notifiche
*/

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const router = useRouter();

const mainScrollContainer = ref(null);
const currentPageTitle = ref("Dashboard");

const showSettings = ref(false);
const showUserData = ref(false);

function openSettings() {
  showSettings.value = true;
}
function openUserData() {
  showUserData.value = true;
}
function updatePageTitle(title) {
  currentPageTitle.value = title;
}

onMounted(async () => {
  try {
    await authStore.fetchMe();

    if (!authStore.isAuthenticated || !authStore.user) {
      return router.push("/login");
    }

    if (authStore.user.status !== "active") {
      await authStore.logout();
      return router.push("/login");
    }

    // Inizializza socket (cookie-based)
    initSocket({
      userId: authStore.user._id,
      role: authStore.user.roles?.[0]?.roleName,
      buildingIds: authStore.user.buildingIds || [],
    });

    // carica notifiche iniziali
    await notificationStore.fetchNotifications();
  } catch (err) {
    console.error("Errore inizializzazione AuthLayout:", err);
    await authStore.logout();
    router.push("/login");
  }
});

onUnmounted(() => {
  closeSocket();
});
</script>

<template>
  <div class="d-flex vh-100">
    <Sidebar
      :scroll-container="mainScrollContainer"
      @open-settings="openSettings"
      @update-page-title="updatePageTitle"
    />

    <div class="flex-grow-1 d-flex flex-column">
      <Navbar
        :page-title="currentPageTitle"
        :scroll-container="mainScrollContainer"
        @open-settings="openSettings"
        @open-userdata="openUserData"
      />

      <div class="flex-grow-1 overflow-auto bg-light" ref="mainScrollContainer">
        <router-view />
      </div>
    </div>

    <Settings v-model:show="showSettings" />
    <UserData v-model:show="showUserData" />
  </div>
</template>