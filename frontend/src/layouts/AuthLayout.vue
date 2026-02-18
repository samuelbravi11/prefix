<template>
  <div class="d-flex vh-100 overflow-hidden">
    <!-- Sidebar -->
    <Sidebar @open-settings="showSettings = true" />

    <!-- Main -->
    <div class="d-flex flex-column flex-grow-1 overflow-hidden">
      <!-- Topbar -->
      <header class="topbar d-flex align-items-center justify-content-between px-4 py-3">
        <div class="d-flex align-items-center gap-3">
          <h5 class="mb-0 fw-semibold text-dark">
            {{ pageTitle }}
          </h5>

          <span class="text-muted small" v-if="subtitle">
            {{ subtitle }}
          </span>
        </div>

        <div class="d-flex align-items-center gap-2">
          <!-- unread counter -->
          <button
            v-if="notifStore.unreadCount > 0"
            class="btn btn-sm btn-outline-primary position-relative"
            @click="goToNotifications"
          >
            <i class="bi bi-bell me-1"></i>
            Notifiche
            <span class="notif-badge">
              {{ notifStore.unreadCount }}
            </span>
          </button>

          <!-- settings -->
          <button class="btn btn-sm btn-outline-secondary" @click="showSettings = true">
            <i class="bi bi-gear me-1"></i>
            Impostazioni
          </button>
        </div>
      </header>

      <!-- Content -->
      <main id="main-scroll" class="flex-grow-1 overflow-auto main-content">
        <router-view />
      </main>
    </div>

    <!-- Settings component -->
    <Settings v-model="showSettings" />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import Sidebar from "@/components/Sidebar.vue";
import Settings from "@/components/Settings.vue";

import { usePreferencesStore } from "@/stores/preferences.store";
import { useNotificationStore } from "@/stores/notification.store";

const route = useRoute();
const router = useRouter();

const prefsStore = usePreferencesStore();
const notifStore = useNotificationStore();

const showSettings = ref(false);

// ROUTE TITLES
const routeTitles = {
  "/home": "Quick Access",
  "/dashboard": "Dashboard",
  "/calendar": "Calendario Interventi",
  "/buildings-list": "Seleziona Edifici",
  "/gestione-edifici": "Gestione Edifici",
  "/gestione-utenti": "Gestione utenti",
  "/oggetti-regole": "Oggetti & Regole",
  "/interventi": "Interventi",
  "/notifiche": "Notifiche",
};

const pageTitle = computed(() => {
  return routeTitles[route.path] || "PreFix";
});

const subtitle = computed(() => {
  if (route.path === "/home") return "Accesso rapido alle funzionalità disponibili";
  if (route.path === "/notifiche") return "Centro notifiche e avvisi sistema";
  return "";
});

function goToNotifications() {
  router.push("/notifiche");
}

onMounted(async () => {
  try {
    await prefsStore.fetch();
    await notifStore.fetchUnreadCount();

    notifStore.startPolling(prefsStore.prefs.scheduler.pollingSeconds);
  } catch (e) {
    console.warn("Init preferences/notifications failed", e);
  }
});

watch(
  () => route.path,
  () => {
    showSettings.value = false;
  }
);
</script>

<style scoped>
.topbar {
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.main-content {
  background: #f7f9fc;
}

/* notification badge */
.notif-badge {
  background: #0d6efd;
  color: white;
  border-radius: 50%;
  font-size: 11px;
  padding: 2px 6px;
  margin-left: 6px;
}
</style>
