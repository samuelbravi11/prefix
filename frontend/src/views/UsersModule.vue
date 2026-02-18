<template>
  <NoPermissions
    v-if="!hasAtLeastOneSection"
    hint="Non hai i permessi per nessuna sotto-funzionalità di Gestione Utenti. Chiedi all’admin di associarti a un ruolo con più permessi."
  />

  <div v-else class="container-fluid py-3 module-stack">
    <section id="gestione-stato-ruolo" v-if="canStatusRole" class="module-section">
      <UserManagement />
    </section>

    <hr v-if="canStatusRole && (canAssignBuildings || canUsersInfo || canCreateRole)" class="module-sep" />

    <section id="assegnazione-edifici" v-if="canAssignBuildings" class="module-section">
      <UserBuildingsManagement />
    </section>

    <hr v-if="canAssignBuildings && (canUsersInfo || canCreateRole)" class="module-sep" />

    <section id="info-utenti" v-if="canUsersInfo" class="module-section">
      <UsersInfo />
    </section>

    <hr v-if="canUsersInfo && canCreateRole" class="module-sep" />

    <section id="crea-ruolo" v-if="canCreateRole" class="module-section">
      <RolesManagement />
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import NoPermissions from "@/components/NoPermissions.vue";
import { usePermissions } from "@/composables/usePermissions";

import UserManagement from "@/views/UserManagement.vue";
import UserBuildingsManagement from "@/views/UserBuildingsManagement.vue";
import UsersInfo from "@/views/UsersInfo.vue";
import RolesManagement from "@/views/RolesManagement.vue";

const { hasAny, hasPermission } = usePermissions();

const canStatusRole = computed(() =>
  hasAny([
    "users:pending:view",
    "users:active:view",
    "users:pending:approve",
    "users:status:update",
    "users:role:update",
  ])
);

const canAssignBuildings = computed(() =>
  hasAny(["requests:manage", "users:building:update", "users:building:view"])
);

const canUsersInfo = computed(() => hasPermission("users:read_info"));
const canCreateRole = computed(() => hasPermission("roles:manage"));

const hasAtLeastOneSection = computed(() => {
  return canStatusRole.value || canAssignBuildings.value || canUsersInfo.value || canCreateRole.value;
});
</script>

<style scoped>
.module-section { margin-bottom: 40px; }
.module-sep { margin: 28px 0 48px; opacity: 0.10; }
</style>
