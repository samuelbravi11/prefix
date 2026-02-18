<!-- src/views/CreateIntervention.vue -->
<template>
  <div class="card shadow-sm border-0">
    <div class="card-body">
      <Toast />

      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h4 class="mb-1">Crea intervento</h4>
          <div class="text-muted small">
            Seleziona edifici e oggetti associati, poi inserisci i dati dell’intervento.
          </div>
        </div>

        <Button label="Reset" icon="pi pi-refresh" size="small" class="p-button-text" @click="resetAll" />
      </div>

      <!-- Step selezione -->
      <div class="row g-3 align-items-end">
        <div class="col-12 col-lg-6">
          <label class="form-label">Edifici (multi)</label>
          <MultiSelect
            v-model="selectedBuildingIds"
            :options="buildingOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleziona edifici..."
            class="w-100"
            display="chip"
            :loading="loadingBuildings"
            @change="onBuildingsChange"
          />
          <div class="text-muted small mt-1">
            Gli oggetti vengono caricati solo dagli edifici selezionati.
          </div>
        </div>

        <div class="col-12 col-lg-6">
          <label class="form-label">Oggetti (multi)</label>
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
          <div class="text-muted small mt-1">
            Puoi selezionare oggetti anche di edifici diversi (purché selezionati sopra).
          </div>
        </div>

        <div class="col-12 d-flex gap-2">
          <Button
            label="Inserisci dati intervento"
            icon="pi pi-arrow-right"
            size="small"
            :disabled="selectedAssetIds.length === 0"
            @click="dlg.visible = true"
          />
          <Button
            label="Annulla selezione"
            icon="pi pi-times"
            size="small"
            class="p-button-text"
            :disabled="selectedBuildingIds.length === 0 && selectedAssetIds.length === 0"
            @click="resetSelection"
          />
        </div>
      </div>

      <!-- Dialog form -->
      <Dialog v-model:visible="dlg.visible" header="Dati intervento" modal :style="{ width: '760px' }">
        <div class="row g-3">
          <div class="col-12 col-lg-4">
            <label class="form-label">Data intervento *</label>
            <Calendar v-model="form.performedAt" class="w-100" dateFormat="dd/mm/yy" showIcon />
            <div v-if="errors.performedAt" class="small text-danger mt-1">{{ errors.performedAt }}</div>
          </div>

          <div class="col-12 col-lg-4">
            <label class="form-label">Tipo *</label>
            <Dropdown
              v-model="form.type"
              :options="typeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-100"
              placeholder="Seleziona..."
            />
            <div v-if="errors.type" class="small text-danger mt-1">{{ errors.type }}</div>
          </div>

          <div class="col-12 col-lg-4">
            <label class="form-label">Durata (minuti)</label>
            <InputNumber v-model="form.durationMinutes" class="w-100" :min="0" mode="decimal" />
          </div>

          <div class="col-12 col-lg-6">
            <label class="form-label">Esito</label>
            <Dropdown
              v-model="form.outcome"
              :options="outcomeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-100"
            />
          </div>

          <div class="col-12 col-lg-6">
            <label class="form-label">Severità</label>
            <Dropdown
              v-model="form.severity"
              :options="severityOptions"
              optionLabel="label"
              optionValue="value"
              class="w-100"
            />
          </div>

          <div class="col-12">
            <label class="form-label">Descrizione / Note</label>
            <Textarea v-model="form.description" rows="4" class="w-100" placeholder="Dettagli intervento..." />
          </div>

          <div class="col-12">
            <div class="small text-muted">
              Verranno creati <strong>{{ selectedAssetIds.length }}</strong> interventi (uno per ogni oggetto selezionato).
            </div>
          </div>
        </div>

        <template #footer>
          <Button label="Annulla" class="p-button-text" :disabled="dlg.saving" @click="dlg.visible=false" />
          <Button label="Crea" icon="pi pi-check" size="small" :loading="dlg.saving" @click="createInterventions" />
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";
import api from "@/services/api";

const toast = useToast();

const loadingBuildings = ref(false);
const loadingAssets = ref(false);

const buildingOptions = ref([]);
const assetOptions = ref([]);

const selectedBuildingIds = ref([]);
const selectedAssetIds = ref([]);

// mappa assetId -> { buildingId, name }
const assetIndex = ref(new Map());

const dlg = reactive({ visible: false, saving: false });

const form = reactive({
  performedAt: null,
  type: null,
  outcome: "ok",
  severity: "medium",
  description: "",
  durationMinutes: null,
});

const typeOptions = [
  { label: "Manutenzione", value: "maintenance" },
  { label: "Ispezione", value: "inspection" },
  { label: "Guasto", value: "failure" },
  { label: "Riparazione", value: "repair" },
];

const outcomeOptions = [
  { label: "OK", value: "ok" },
  { label: "KO", value: "ko" },
  { label: "Parziale", value: "partial" },
];

const severityOptions = [
  { label: "Bassa", value: "low" },
  { label: "Media", value: "medium" },
  { label: "Alta", value: "high" },
];

const errors = reactive({ performedAt: "", type: "" });

function clearErrors() {
  errors.performedAt = "";
  errors.type = "";
}

function validate() {
  clearErrors();

  if (!form.performedAt) {
    errors.performedAt = "Data obbligatoria";
    return false;
  }

  if (!form.type) {
    errors.type = "Tipo obbligatorio";
    return false;
  }

  if (selectedAssetIds.value.length === 0) {
    toast.add({ severity: "warn", summary: "Attenzione", detail: "Seleziona almeno un oggetto", life: 2500 });
    return false;
  }

  // verifica che ogni asset abbia un buildingId noto
  for (const assetId of selectedAssetIds.value) {
    const meta = assetIndex.value.get(assetId);
    if (!meta?.buildingId) {
      toast.add({ severity: "error", summary: "Errore", detail: "Asset selezionato non valido", life: 3500 });
      return false;
    }
  }

  return true;
}

function resetSelection() {
  selectedBuildingIds.value = [];
  selectedAssetIds.value = [];
  assetOptions.value = [];
  assetIndex.value = new Map();
}

function resetAll() {
  resetSelection();
  dlg.visible = false;
  dlg.saving = false;
  form.performedAt = null;
  form.type = null;
  form.outcome = "ok";
  form.severity = "medium";
  form.description = "";
  form.durationMinutes = null;
  clearErrors();
}

async function loadBuildings() {
  loadingBuildings.value = true;
  try {
    const res = await api.get("/buildings");
    const arr = Array.isArray(res.data) ? res.data : [];
    buildingOptions.value = arr
      .map((b) => ({ label: b.name, value: b._id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    buildingOptions.value = [];
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare edifici associati", life: 3500 });
  } finally {
    loadingBuildings.value = false;
  }
}

async function loadAssets() {
  loadingAssets.value = true;
  try {
    const params = {};
    if (selectedBuildingIds.value.length) params.buildingIds = selectedBuildingIds.value;

    const res = await api.get("/assets", { params });
    const arr = Array.isArray(res.data) ? res.data : [];

    const idx = new Map();
    assetOptions.value = arr
      .map((a) => {
        idx.set(a._id, { buildingId: a.buildingId, name: a.name });
        return {
          label: `${a.name}${a.serial ? ` • ${a.serial}` : ""}`,
          value: a._id,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    assetIndex.value = idx;
  } catch {
    assetOptions.value = [];
    assetIndex.value = new Map();
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare oggetti", life: 3500 });
  } finally {
    loadingAssets.value = false;
  }
}

async function onBuildingsChange() {
  // reset oggetti se cambiano edifici
  selectedAssetIds.value = [];
  await loadAssets();
}

async function createInterventions() {
  if (!validate()) return;

  dlg.saving = true;
  try {
    const rows = selectedAssetIds.value.map((assetId) => {
      const meta = assetIndex.value.get(assetId);
      return {
        assetId,
        buildingId: meta.buildingId,
        type: form.type,
        outcome: form.outcome,
        severity: form.severity,
        description: String(form.description || "").trim(),
        performedAt: form.performedAt,
        durationMinutes: form.durationMinutes != null ? Number(form.durationMinutes) : undefined,
      };
    });

    // Backend accetta array
    await api.post("/interventions", rows);

    toast.add({ severity: "success", summary: "Ok", detail: "Intervento/i creati", life: 2500 });
    resetAll();
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: e?.response?.data?.message || "Creazione interventi fallita",
      life: 3500,
    });
  } finally {
    dlg.saving = false;
  }
}

onMounted(loadBuildings);
</script>
