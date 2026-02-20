<!-- src/components/PermissionsHelpButton.vue -->
<template>
  <div>
    <Button
      label="Visualizza permessi"
      icon="pi pi-info-circle"
      size="small"
      class="p-button-text"
      @click="visible = true"
    />

    <Dialog v-model:visible="visible" modal header="Permessi" :style="{ width: 'min(900px, 92vw)' }">
      <div class="text-muted mb-3">
        Tutti i ruoli hanno dei <b>permessi base</b> (sotto). I <b>permessi privilegiati</b> vengono assegnati solo a
        determinati ruoli (es. admin) da chi ha i permessi per gestire i ruoli.
      </div>

      <h5 class="mb-2">Permessi base</h5>
      <ul class="perm-list">
        <li v-for="(desc, key) in base" :key="key">
          <code>{{ key }}</code>
          <span class="ms-2">— {{ desc }}</span>
        </li>
      </ul>

      <h5 class="mt-4 mb-2">Permessi privilegiati</h5>
      <ul class="perm-list">
        <li v-for="(desc, key) in privileged" :key="key">
          <code>{{ key }}</code>
          <span class="ms-2">— {{ desc }}</span>
        </li>
      </ul>

      <div class="text-muted small mt-3">
        Nota: operazioni pubbliche come la registrazione possono essere disponibili senza un permesso assegnato.
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Button from "primevue/button";
import Dialog from "primevue/dialog";

import { PERMISSIONS_BASE, PERMISSIONS_PRIVILEGED } from "@/docs/permissions.catalog";

const visible = ref(false);

const base = PERMISSIONS_BASE;
const privileged = PERMISSIONS_PRIVILEGED;
</script>

<style scoped>
.perm-list {
  padding-left: 1.2rem;
}
.perm-list li {
  margin: 8px 0;
}
</style>
