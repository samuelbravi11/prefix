<!-- src/views/CreateRuleWizard.vue -->
<template>
  <div class="card shadow-sm border-0">
    <div class="card-body">
      <Toast />

      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h4 class="mb-1">Crea regola</h4>
          <div class="text-muted small">
            Wizard: edifici → oggetti → dati regola.
          </div>
        </div>

        <Button label="Reset" icon="pi pi-refresh" size="small" class="p-button-text" @click="resetAll" />
      </div>

      <Steps :model="steps" :activeIndex="activeStep" class="mb-3" />

      <!-- STEP 1 -->
      <div v-if="activeStep === 0" class="mt-3">
        <label class="form-label">Seleziona edifici associati (multi)</label>
        <MultiSelect
          v-model="selectedBuildingIds"
          :options="buildingOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleziona edifici..."
          class="w-100"
          display="chip"
          :loading="loadingBuildings"
        />
        <div class="d-flex gap-2 mt-3">
          <Button label="Annulla" icon="pi pi-times" class="p-button-text" size="small" @click="resetAll" />
          <Button label="Continua" icon="pi pi-arrow-right" size="small" :disabled="selectedBuildingIds.length===0" @click="goStep2" />
        </div>
      </div>

      <!-- STEP 2 -->
      <div v-else-if="activeStep === 1" class="mt-3">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="fw-semibold">Seleziona oggetti</div>
          <Button label="Ricarica" icon="pi pi-refresh" size="small" class="p-button-text" :loading="loadingAssets" @click="loadAssetsForBuildings" />
        </div>

        <div class="text-muted small mb-2">
          Vengono mostrati solo gli oggetti appartenenti agli edifici selezionati.
        </div>

        <MultiSelect
          v-model="selectedAssetIds"
          :options="assetOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleziona oggetti..."
          class="w-100"
          display="chip"
          :loading="loadingAssets"
          filter
        />

        <div class="d-flex gap-2 mt-3">
          <Button label="Indietro" icon="pi pi-arrow-left" class="p-button-text" size="small" @click="activeStep=0" />
          <Button label="Annulla" icon="pi pi-times" class="p-button-text" size="small" @click="resetAll" />
          <Button label="Continua" icon="pi pi-arrow-right" size="small" :disabled="selectedAssetIds.length===0" @click="activeStep=2" />
        </div>
      </div>

      <!-- STEP 3 -->
      <div v-else class="mt-3">
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label">Nome regola *</label>
            <InputText v-model="form.name" class="w-100" placeholder="Es. Controllo pressione mensile" />
            <div v-if="errors.name" class="small text-danger mt-1">{{ errors.name }}</div>
          </div>

          <div class="col-md-6">
            <label class="form-label">Tipo</label>
            <Dropdown
              v-model="form.type"
              :options="ruleTypes"
              optionLabel="label"
              optionValue="value"
              class="w-100"
            />
          </div>

          <div class="col-md-6">
            <label class="form-label">Frequenza</label>
            <Dropdown
              v-model="form.frequency"
              :options="freqOptions"
              optionLabel="label"
              optionValue="value"
              class="w-100"
            />
          </div>

          <div class="col-12">
            <label class="form-label">Descrizione</label>
            <Textarea v-model="form.description" rows="3" class="w-100" placeholder="Descrizione regola..." />
          </div>
        </div>

        <div class="d-flex gap-2 mt-3">
          <Button label="Indietro" icon="pi pi-arrow-left" class="p-button-text" size="small" @click="activeStep=1" />
          <Button label="Annulla" icon="pi pi-times" class="p-button-text" size="small" @click="resetAll" />
          <Button label="Crea regola" icon="pi pi-check" size="small" :loading="saving" @click="createRule" />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";
import api from "@/services/api";

const toast = useToast();

const steps = [
  { label: "Edifici" },
  { label: "Oggetti" },
  { label: "Regola" },
];
const activeStep = ref(0);

const loadingBuildings = ref(false);
const buildingOptions = ref([]);
const selectedBuildingIds = ref([]);

const loadingAssets = ref(false);
const assetOptions = ref([]);
const selectedAssetIds = ref([]);

const saving = ref(false);

const form = reactive({
  name: "",
  type: "rule_based",
  frequency: "monthly",
  description: "",
});

const ruleTypes = [
  { label: "Regolistico", value: "rule_based" },
  { label: "Predittivo (AI)", value: "ai_based" },
];

const freqOptions = [
  { label: "Giornaliera", value: "daily" },
  { label: "Settimanale", value: "weekly" },
  { label: "Mensile", value: "monthly" },
  { label: "Trimestrale", value: "quarterly" },
  { label: "Annuale", value: "yearly" },
];

const errors = reactive({ name: "" });

function clearErrors() {
  errors.name = "";
}

function validate() {
  clearErrors();
  const n = String(form.name || "").trim();
  if (n.length < 2) {
    errors.name = "Nome obbligatorio (min 2 caratteri)";
    return false;
  }
  return true;
}

function resetAll() {
  activeStep.value = 0;
  selectedBuildingIds.value = [];
  selectedAssetIds.value = [];
  assetOptions.value = [];
  form.name = "";
  form.type = "rule_based";
  form.frequency = "monthly";
  form.description = "";
  clearErrors();
}

async function loadBuildings() {
  loadingBuildings.value = true;
  try {
    const res = await api.get("/buildings");
    const arr = Array.isArray(res.data) ? res.data : [];
    buildingOptions.value = arr.map((b) => ({ label: b.name, value: b._id })).sort((a, b) => a.label.localeCompare(b.label));
  } catch (e) {
    buildingOptions.value = [];
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare edifici associati", life: 3500 });
  } finally {
    loadingBuildings.value = false;
  }
}

async function loadAssetsForBuildings() {
  loadingAssets.value = true;
  try {
    // Endpoint standard: lista assets filtrata per buildingIds
    const res = await api.get("/assets", { params: { buildingIds: selectedBuildingIds.value } });
    const arr = Array.isArray(res.data) ? res.data : [];
    assetOptions.value = arr
      .map((a) => ({ label: `${a.name}${a.serial ? ` • ${a.serial}` : ""}`, value: a._id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (e) {
    assetOptions.value = [];
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare oggetti", life: 3500 });
  } finally {
    loadingAssets.value = false;
  }
}

async function goStep2() {
  await loadAssetsForBuildings();
  activeStep.value = 1;
}

async function createRule() {
  if (!validate()) return;
  saving.value = true;
  try {
    const payload = {
      buildingIds: selectedBuildingIds.value,
      assetIds: selectedAssetIds.value,
      name: String(form.name).trim(),
      type: form.type,
      frequency: form.frequency,
      description: String(form.description || "").trim(),
    };

    await api.post("/rules", payload);

    toast.add({ severity: "success", summary: "Ok", detail: "Regola creata", life: 2500 });
    resetAll();
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: e?.response?.data?.message || "Creazione regola fallita",
      life: 3500,
    });
  } finally {
    saving.value = false;
  }
}

onMounted(loadBuildings);
</script>
