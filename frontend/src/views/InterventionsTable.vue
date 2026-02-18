<!-- src/views/InterventionsTable.vue -->
<template>
  <div class="card shadow-sm border-0">
    <div class="card-body">
      <Toast />

      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h4 class="mb-1">Visualizzazione tabellare interventi</h4>
          <div class="text-muted small">
            Seleziona uno o più edifici (o tutti) per visualizzare gli interventi.
          </div>
        </div>

        <Button
          label="Ricarica"
          icon="pi pi-refresh"
          size="small"
          class="p-button-text"
          :loading="loading"
          @click="loadInterventions"
        />
      </div>

      <!-- FILTRI -->
      <div class="filters mb-3">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-lg-8">
            <label class="form-label">Edifici (multi)</label>
            <MultiSelect
              v-model="selectedBuildingIds"
              :options="buildingOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Tutti gli edifici associati"
              class="w-100"
              display="chip"
              :loading="loadingBuildings"
              @change="onBuildingsChange"
            />
          </div>

          <div class="col-12 col-lg-4">
            <label class="form-label">Ricerca (descrizione/tipo)</label>
            <InputText v-model="q" class="w-100" placeholder="Cerca..." />
          </div>
        </div>

        <div class="row g-3 align-items-center mt-1">
          <div class="col-12 col-lg-8">
            <div class="text-muted small">
              Se non selezioni nulla, vengono mostrati gli interventi di tutti gli edifici associati.
            </div>
          </div>

          <div class="col-12 col-lg-4 d-flex gap-2 justify-content-start justify-content-lg-end">
            <Button label="Applica" icon="pi pi-filter" size="small" @click="loadInterventions" />
            <Button label="Reset" icon="pi pi-times" size="small" class="p-button-text" @click="resetFilters" />
          </div>
        </div>
      </div>

      <DataTable
        :value="filtered"
        dataKey="_id"
        class="p-datatable-sm"
        responsiveLayout="scroll"
        paginator
        :rows="10"
        :loading="loading"
        emptyMessage="Nessun intervento trovato."
      >
        <Column field="performedAt" header="Data" style="width: 140px">
          <template #body="{ data }">{{ formatDate(data.performedAt) }}</template>
        </Column>

        <Column field="type" header="Tipo" style="width: 160px" />
        <Column field="outcome" header="Esito" style="width: 140px" />
        <Column field="severity" header="Severità" style="width: 140px" />

        <Column field="buildingName" header="Edificio" style="width: 220px" />
        <Column field="assetName" header="Oggetto" style="width: 260px" />

        <Column field="description" header="Descrizione" />
        <Column field="durationMinutes" header="Durata" style="width: 120px">
          <template #body="{ data }">{{ formatDuration(data.durationMinutes) }}</template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useToast } from "primevue/usetoast";
import api from "@/services/api";

import Toast from "primevue/toast";
import Button from "primevue/button";
import MultiSelect from "primevue/multiselect";
import InputText from "primevue/inputtext";
import DataTable from "primevue/datatable";
import Column from "primevue/column";

const toast = useToast();

const loading = ref(false);
const loadingBuildings = ref(false);
const loadingAssets = ref(false);

const buildingOptions = ref([]);
const selectedBuildingIds = ref([]);

const buildingNameById = ref(new Map());
const assetNameById = ref(new Map());

const interventions = ref([]);
const q = ref("");

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

const filtered = computed(() => {
  const query = normalize(q.value);
  if (!query) return interventions.value;
  return interventions.value.filter((x) =>
    normalize(`${x.type} ${x.description || ""} ${x.buildingName || ""} ${x.assetName || ""}`).includes(query)
  );
});

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString("it-IT");
  } catch {
    return "-";
  }
}

function formatDuration(n) {
  if (n == null || n === "") return "—";
  const v = Number(n);
  if (Number.isNaN(v)) return "—";
  return `${v} min`;
}

async function loadBuildings() {
  loadingBuildings.value = true;
  try {
    const res = await api.get("/buildings");
    const arr = Array.isArray(res.data) ? res.data : [];

    const map = new Map();
    arr.forEach((b) => map.set(String(b._id), b.name));
    buildingNameById.value = map;

    buildingOptions.value = arr
      .map((b) => ({ label: b.name, value: b._id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    buildingOptions.value = [];
    buildingNameById.value = new Map();
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

    const map = new Map();
    arr.forEach((a) => map.set(String(a._id), a.name));
    assetNameById.value = map;
  } catch {
    assetNameById.value = new Map();
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare oggetti", life: 3500 });
  } finally {
    loadingAssets.value = false;
  }
}

async function loadInterventions() {
  loading.value = true;
  try {
    const params = {};
    if (selectedBuildingIds.value.length) params.buildingIds = selectedBuildingIds.value;

    const res = await api.get("/interventions", { params });
    const arr = Array.isArray(res.data) ? res.data : [];

    interventions.value = arr.map((it) => ({
      ...it,
      buildingName: buildingNameById.value.get(String(it.buildingId)) || String(it.buildingId || "—"),
      assetName: assetNameById.value.get(String(it.assetId)) || String(it.assetId || "—"),
    }));
  } catch (e) {
    interventions.value = [];
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: e?.response?.data?.message || "Impossibile caricare interventi",
      life: 3500,
    });
  } finally {
    loading.value = false;
  }
}

async function onBuildingsChange() {
  // aggiorna cache assets per mapping nomi (rispettando filtro edifici)
  await loadAssets();
}

function resetFilters() {
  selectedBuildingIds.value = [];
  q.value = "";
  // ripristina asset cache globale (tutti edifici associati)
  loadAssets().then(loadInterventions);
}

onMounted(async () => {
  await loadBuildings();
  await loadAssets();
  await loadInterventions();
});
</script>

<style scoped>
:deep(.p-multiselect),
:deep(.p-inputtext) {
  height: 42px;
}

:deep(.p-multiselect .p-multiselect-label) {
  display: flex;
  align-items: center;
}

.filters {
  padding: 6px 0 0;
}
</style>
