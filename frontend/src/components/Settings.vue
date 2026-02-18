<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Impostazioni"
    class="settings-dialog"
  >
    <div class="generic-section">
      <h5 class="mb-3">Tema</h5>

      <div class="row g-4">
        <div class="col-12 col-md-6">
          <label class="form-label">Tema</label>
          <Dropdown
            v-model="draft.theme.mode"
            :options="['system','light','dark']"
            class="w-100"
          />
        </div>

        <div class="col-12 col-md-6">
          <label class="form-label">Colore accent</label>
          <InputText v-model="draft.theme.accent" class="w-100" />
        </div>
      </div>
    </div>

    <div class="generic-section">
      <h5 class="mb-3">Notifiche</h5>

      <div class="d-flex align-items-center justify-content-between mb-4">
        <span>Abilita notifiche</span>
        <InputSwitch v-model="draft.notifications.enabled" />
      </div>

      <div class="d-flex align-items-center justify-content-between mb-3">
        <span>In-app</span>
        <InputSwitch v-model="draft.notifications.channels.inApp" />
      </div>

      <div class="d-flex align-items-center justify-content-between">
        <span>Email</span>
        <InputSwitch v-model="draft.notifications.channels.email" />
      </div>
    </div>

    <div class="generic-section">
      <h5 class="mb-3">Controlli</h5>

      <div class="row g-4 mb-4">
        <div class="col-12 col-md-4">
          <label>Controllo regolistico (min)</label>
          <InputNumber v-model="draft.controls.rulesInterval" class="w-100" />
        </div>

        <div class="col-12 col-md-4">
          <label>Controllo AI (min)</label>
          <InputNumber v-model="draft.controls.aiInterval" class="w-100" />
        </div>

        <div class="col-12 col-md-4">
          <label>Polling notifiche (sec)</label>
          <InputNumber v-model="draft.controls.pollingInterval" class="w-100" />
        </div>
      </div>

      <div class="d-flex gap-3 flex-wrap">
        <Button
          label="Esegui controllo regole ora"
          icon="pi pi-play"
          class="p-button-outlined"
          size="small"
          @click="triggerRulesNow"
        />

        <Button
          label="Esegui controllo AI ora"
          icon="pi pi-play"
          class="p-button-outlined"
          size="small"
          @click="triggerAiNow"
        />
      </div>
    </div>

    <template #footer>
      <Button label="Chiudi" class="p-button-text" @click="visible = false" />
      <Button label="Salva" icon="pi pi-check" @click="save" />
    </template>
  </Dialog>
</template>

<script setup>
import { computed, reactive, watch } from "vue";
import { useToast } from "primevue/usetoast";

import Dialog from "primevue/dialog";
import Toast from "primevue/toast";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import InputSwitch from "primevue/inputswitch";
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";

import { usePreferencesStore } from "@/stores/preferences.store";

const toast = useToast();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const prefsStore = usePreferencesStore();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const draft = reactive({
  theme: "system",
  accent: "#58a6ff",
  notifications: {
    enabled: true,
    channels: { inApp: true, email: false },
    minSeverity: "info",
    quietHours: { enabled: false, from: "22:00", to: "08:00" },
  },
  scheduler: {
    rulesCheckMinutes: 15,
    aiCheckMinutes: 60,
    pollingSeconds: 20,
  },
});

const themeOptions = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const severityOptions = [
  { label: "Info", value: "info" },
  { label: "Success", value: "success" },
  { label: "Warning", value: "warning" },
  { label: "Error", value: "error" },
];

watch(
  () => prefsStore.prefs,
  (p) => {
    if (!p) return;
    Object.assign(draft, JSON.parse(JSON.stringify(p)));
  },
  { immediate: true, deep: true }
);

watch(
  () => draft.theme,
  () => {
    prefsStore.prefs.theme = draft.theme;
    prefsStore.applyThemeToDom();
  }
);

watch(
  () => draft.accent,
  () => {
    prefsStore.prefs.accent = draft.accent;
    prefsStore.applyThemeToDom();
  }
);

async function save() {
  try {
    await prefsStore.save(draft);
    toast.add({ severity: "success", summary: "Salvato", detail: "Preferenze aggiornate", life: 2000 });
    visible.value = false;
  } catch {
    // error già gestito dallo store
  }
}

async function triggerRulesNow() {
  try {
    await prefsStore.triggerRulesNow();
    toast.add({ severity: "success", summary: "Ok", detail: "Controllo regole avviato", life: 2000 });
  } catch {
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile avviare controllo regole", life: 3500 });
  }
}

async function triggerAiNow() {
  try {
    await prefsStore.triggerAiNow();
    toast.add({ severity: "success", summary: "Ok", detail: "Controllo AI avviato", life: 2000 });
  } catch {
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile avviare controllo AI", life: 3500 });
  }
}
</script>

<style scoped>
.settings-wrap {
  padding: 4px 2px;
}

.color-input {
  width: 44px;
  height: 34px;
  padding: 0;
  border-radius: 8px;
}
</style>
