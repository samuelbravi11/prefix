<!-- src/views/AssetsRulesModule.vue -->
<template>
  <NoPermissions
    v-if="!hasAtLeastOneSection"
    hint="Non hai i permessi per nessuna sotto-funzionalità di Oggetti & Regole. Chiedi all’admin di associarti a un ruolo con più permessi."
  />

  <div v-else class="container-fluid py-3 module-stack">
    <section id="crea-oggetto" v-if="canCreateAsset" class="module-section">
      <CreateAsset />
    </section>

    <hr v-if="canCreateAsset && (canCreateRule || canViewAssets || canViewRules)" class="module-sep" />

    <section id="crea-regola" v-if="canCreateRule" class="module-section">
      <CreateRule />
    </section>

    <hr v-if="canCreateRule && (canViewAssets || canViewRules)" class="module-sep" />

    <section id="visualizza-oggetti" v-if="canViewAssets" class="module-section">
      <AssetsList />
    </section>

    <hr v-if="canViewAssets && canViewRules" class="module-sep" />

    <section id="visualizza-regole" v-if="canViewRules" class="module-section">
      <RulesList />
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import NoPermissions from "@/components/NoPermissions.vue";
import { usePermissions } from "@/composables/usePermissions";

import CreateAsset from "@/views/CreateAsset.vue";
import CreateRule from "@/views/CreateRuleWizard.vue";
import AssetsList from "@/views/AssetsList.vue";
import RulesList from "@/views/RulesList.vue";

const { hasAny, hasPermission } = usePermissions();

const canCreateAsset = computed(() => hasAny(["assets:manage"]));
const canCreateRule = computed(() => hasAny(["rules:manage"]));
const canViewAssets = computed(() => hasPermission("assets:view") || hasAny(["assets:manage"]));
const canViewRules = computed(() => hasPermission("rules:view") || hasAny(["rules:manage"]));

const hasAtLeastOneSection = computed(() => {
  return canCreateAsset.value || canCreateRule.value || canViewAssets.value || canViewRules.value;
});
</script>

<style scoped>
.module-section { margin-bottom: 40px; }
.module-sep { margin: 28px 0 48px; opacity: 0.10; }
</style>
