<template>
  <div class="bg-white shadow rounded p-3" style="width: 300px">
    <div v-if="notifications.length === 0">
      Nessuna notifica non letta
    </div>

    <div
      v-for="n in notifications"
      :key="n._id"
      class="mb-2 p-2 border-bottom"
      :class="{ 'fw-bold': !n.read }"
      @click="markAsRead(n._id)"
      style="cursor: pointer"
    >
      <div>{{ n.title }}</div>
      <small class="text-muted">{{ n.message }}</small>
      <small class="text-muted d-block mt-1">{{ formatDate(n.createdAt) }}</small>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useNotification } from "@/composables/useNotification";
import { useNotificationStore } from "@/stores/notification.store";

const {
  notifications,
  markAsRead
} = useNotification();

const store = useNotificationStore();

// Funzione per formattare la data
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins} min fa`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ore fa`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} giorni fa`;
};

// Carica le notifiche quando il componente viene montato
onMounted(() => {
  store.fetchNotifications();
});
</script>