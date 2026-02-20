<!-- src/views/InterventionsModule.vue -->
<template>
  <NoPermissions
    v-if="!hasAtLeastOneSection"
    hint="Non hai i permessi per nessuna sotto-funzionalità di Report/Interventi. Chiedi all’admin di associarti a un ruolo con più permessi."
  />

  <div v-else class="container-fluid py-3 module-stack">
    <div class="d-flex justify-content-end mb-2">
      <PermissionsHelpButton />
    </div>

    <section id="crea-intervento" v-if="canCreate" class="module-section">
      <CreateIntervention />
    </section>

    <hr v-if="canCreate && (canBulkUpload || canView)" class="module-sep" />

    <section id="carica-interventi" v-if="canBulkUpload" class="module-section">
      <BulkUploadInterventions />
    </section>

    <hr v-if="canBulkUpload && canView" class="module-sep" />

    <section id="tabella-interventi" v-if="canView" class="module-section">
      <InterventionsTable />
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import NoPermissions from "@/components/NoPermissions.vue";
import { usePermissions } from "@/composables/usePermissions";

import CreateIntervention from "@/views/CreateIntervention.vue";
import BulkUploadInterventions from "@/views/BulkUploadInterventions.vue";
import InterventionsTable from "@/views/InterventionsTable.vue";
import PermissionsHelpButton from "@/components/PermissionsHelpButton.vue";

const { hasAny } = usePermissions();

// Permissions allineati a backend:
// - manage: create/delete
// - bulk_upload: bulk preview/commit
// - view: read list/table
const canCreate = computed(() => hasAny(["interventions:manage"]));
const canBulkUpload = computed(() => hasAny(["interventions:bulk_upload", "interventions:manage"]));
const canView = computed(() => hasAny(["interventions:view", "interventions:manage"]));

const hasAtLeastOneSection = computed(() => canCreate.value || canBulkUpload.value || canView.value);
</script>

<style scoped>
.module-section { margin-bottom: 40px; }
.module-sep { margin: 28px 0 48px; opacity: 0.10; }
</style>
