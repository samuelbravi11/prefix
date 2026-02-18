<!-- src/views/BuildingsModule.vue -->
<template>
  <NoPermissions
    v-if="!hasAtLeastOneSection"
    hint="Non hai i permessi per nessuna sotto-funzionalità di Gestione Edifici. Chiedi all’admin di associarti a un ruolo con più permessi."
  />

  <div v-else class="container-fluid py-3 module-stack">
    <section id="visualizza-edifici" v-if="canView" class="module-section">
      <BuildingsManagement />
    </section>

    <hr v-if="canView && canCreate" class="module-sep" />

    <section id="crea-edificio" v-if="canCreate" class="module-section">
      <CreateBuilding />
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import NoPermissions from "@/components/NoPermissions.vue";
import { usePermissions } from "@/composables/usePermissions";

import BuildingsManagement from "@/views/BuildingsManagement.vue";
import CreateBuilding from "@/views/CreateBuilding.vue";

const { hasAny } = usePermissions();

const canView = computed(() => hasAny(["buildings:view_all", "buildings:view_associated", "buildings:manage"]));
const canCreate = computed(() => hasAny(["buildings:manage"]));

const hasAtLeastOneSection = computed(() => canView.value || canCreate.value);
</script>

<style scoped>
.module-section { margin-bottom: 40px; }
.module-sep { margin: 28px 0 48px; opacity: 0.10; }
</style>
