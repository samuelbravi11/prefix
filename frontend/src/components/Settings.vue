<!-- src/components/Settings.vue -->
<template>
  <Dialog
    v-model:visible="visible"
    header="Impostazioni"
    modal
    :style="{ width: '760px', maxWidth: '96vw' }"
    @hide="onHide"
  >
    <Toast />

    <div class="text-muted small mb-3">
      Tutti i ruoli hanno dei permessi base. Le preferenze vengono salvate sul tuo profilo.
    </div>

    <div class="d-flex justify-content-end gap-2 mb-3">
      <Button
        label="Ricarica"
        icon="pi pi-refresh"
        size="small"
        class="p-button-text"
        :loading="loading"
        @click="reload"
      />
      <Button
        label="Salva"
        icon="pi pi-save"
        size="small"
        :loading="saving"
        :disabled="!dirty"
        @click="save"
      />
    </div>

    <div class="row g-3">
      <div class="col-12 col-lg-6">
        <label class="form-label">Tema</label>
        <Dropdown
          v-model="draft.theme"
          :options="themeOptions"
          optionLabel="label"
          optionValue="value"
          class="w-100"
          placeholder="Seleziona tema"
        />
        <div class="text-muted small mt-1">"System" segue le impostazioni del tuo sistema operativo.</div>
      </div>

      <div class="col-12 col-lg-6">
        <label class="form-label">Accent color</label>
        <Dropdown
          v-model="draft.accent"
          :options="accentOptions"
          optionLabel="label"
          optionValue="value"
          class="w-100"
          placeholder="Seleziona colore"
        />
      </div>

      <div class="col-12">
        <div class="form-check form-switch mt-2">
          <input id="schedulerEnabled" class="form-check-input" type="checkbox" v-model="draft.schedulerEnabled" />
          <label class="form-check-label" for="schedulerEnabled">
            Abilita controlli Scheduler (solo se il tuo ruolo lo prevede)
          </label>
        </div>
        <div class="text-muted small">Se disabilitato, la UI nasconde i controlli di avvio/stop dello Scheduler.</div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useToast } from "primevue/usetoast";
import { usePreferencesStore } from "@/stores/preferences.store";

import Dialog from "primevue/dialog";
import Toast from "primevue/toast";
import Button from "primevue/button";
import Dropdown from "primevue/dropdown";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const toast = useToast();
const prefsStore = usePreferencesStore();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const loading = ref(false);
const saving = ref(false);
const initialized = ref(false);

const themeOptions = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const accentOptions = [
  { label: "Indigo", value: "indigo" },
  { label: "Blue", value: "blue" },
  { label: "Green", value: "green" },
  { label: "Orange", value: "orange" },
  { label: "Pink", value: "pink" },
];

const draft = ref({
  theme: "system",
  accent: "indigo",
  schedulerEnabled: true,
});

const dirty = computed(() => {
  const p = prefsStore.prefs || {};
  return (
    String(draft.value.theme) !== String(p.theme || "system") ||
    String(draft.value.accent) !== String(p.accent || "indigo") ||
    Boolean(draft.value.schedulerEnabled) !== Boolean(p.schedulerEnabled ?? true)
  );
});

function syncDraftFromStore() {
  const p = prefsStore.prefs || {};
  draft.value = {
    theme: p.theme || "system",
    accent: p.accent || "indigo",
    schedulerEnabled: p.schedulerEnabled ?? true,
  };
}

async function reload() {
  loading.value = true;
  try {
    await prefsStore.loadMe();
    syncDraftFromStore();
  } catch {
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare preferenze", life: 3500 });
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  try {
    await prefsStore.saveMe({
      theme: draft.value.theme,
      accent: draft.value.accent,
      schedulerEnabled: draft.value.schedulerEnabled,
    });
    toast.add({ severity: "success", summary: "Salvato", detail: "Preferenze aggiornate", life: 2500 });
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: e?.response?.data?.message || "Impossibile salvare preferenze",
      life: 3500,
    });
  } finally {
    saving.value = false;
  }
}

function onHide() {
  // lascia il componente in uno stato pulito quando si chiude
  syncDraftFromStore();
}

// Carica preferenze SOLO quando l'utente apre la finestra.
watch(
  () => visible.value,
  async (isOpen) => {
    if (isOpen && !initialized.value) {
      initialized.value = true;
      await reload();
    }
  }
);

watch(
  () => prefsStore.prefs,
  () => {
    if (visible.value) syncDraftFromStore();
  },
  { deep: true }
);
</script>

<style scoped>
:deep(.p-dropdown) {
  height: 42px;
}

:deep(.p-dropdown .p-dropdown-label) {
  display: flex;
  align-items: center;
}
</style>