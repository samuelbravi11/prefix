<script setup>
import { useNotificationStore } from "@/stores/notification.store";

const store = useNotificationStore();
</script>

<template>
  <div class="notification-bell">
    <span v-if="unreadCount > 0">
      {{ unreadCount }}
    </span>
  </div>
</template>
