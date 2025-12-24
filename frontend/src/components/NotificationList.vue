<template>
  <div class="bg-white shadow rounded p-3" style="width: 300px">
    <div v-if="notifications.length === 0">
      Nessuna notifica
    </div>

    <div
      v-for="n in notifications"
      :key="n._id"
      class="mb-2 p-2 border-bottom"
      :class="{ 'fw-bold': !n.read }"
      @click="markRead(n._id)"
      style="cursor: pointer"
    >
      <div>{{ n.title }}</div>
      <small class="text-muted">{{ n.message }}</small>
    </div>
  </div>
</template>

<script setup>
import { useNotification } from "@/composables/useNotification";

const {
  notifications,
  markAsRead
} = useNotification();
</script>

