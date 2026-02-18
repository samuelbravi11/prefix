<!-- src/views/RulesList.vue -->
<template>
  <div class="card shadow-sm border-0">
    <div class="card-body">
      <Toast />

      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h4 class="mb-1">Visualizza e modifica regole</h4>
          <div class="text-muted small">
            Filtra per edifici e (opzionale) per oggetti associati. Cerca per nome regola.
          </div>
        </div>

        <Button label="Ricarica" icon="pi pi-refresh" size="small" class="p-button-text" :loading="loading" @click="loadRules" />
      </div>

      <div class="row g-3 align-items-end mb-3">
        <div class="col-12 col-lg-5">
          <label class="form-label">Filtra edifici</label>
          <MultiSelect
            v-model="filterBuildingIds"
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
          <label class="form-label">Filtra oggetti</label>
          <MultiSelect
            v-model="filterAssetIds"
            :options="assetOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Tutti gli oggetti (dei building selezionati)"
            class="w-100"
            display="chip"
            :loading="loadingAssets"
            filter
          />
        </div>

        <div class="col-12 col-lg-3">
          <label class="form-label">Ricerca</label>
          <InputText v-model="q" class="w-100 p-inputtext-sm" placeholder="Nome regola..." />
        </div>

        <div class="col-12 d-flex gap-2 mt-1">
          <Button label="Applica" icon="pi pi-filter" size="small" @click="loadRules" />
          <Button label="Reset filtri" icon="pi pi-times" size="small" class="p-button-text" @click="resetFilters" />
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
        @row-click="openEdit"
      >
        <Column field="name" header="Nome" />
        <Column field="type" header="Tipo" style="width: 160px;" />
        <Column field="frequency" header="Frequenza" style="width: 160px;" />
        <Column field="assetsCount" header="# Oggetti" style="width: 120px;">
          <template #body="{ data }">{{ data.assetsCount ?? (data.assetIds?.length ?? 0) }}</template>
        </Column>
        <Column header="Azioni" style="width: 120px;">
          <template #body="{ data }">
            <Button label="Modifica" icon="pi pi-pencil" size="small" class="p-button-text" @click.stop="openEdit({ data })" />
          </template>
        </Column>
      </DataTable>

      <Dialog v-model:visible="dlg.visible" header="Modifica regola" modal :style="{ width: '700px' }">
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label">Nome *</label>
            <InputText v-model="form.name" class="w-100" />
            <div v-if="errors.name" class="small text-danger mt-1">{{ errors.name }}</div>
          </div>

          <div class="col-md-6">
            <label class="form-label">Tipo</label>
            <Dropdown v-model="form.type" :options="ruleTypes" optionLabel="label" optionValue="value" class="w-100" />
          </div>

          <div class="col-md-6">
            <label class="form-label">Frequenza</label>
            <Dropdown v-model="form.frequency" :options="freqOptions" optionLabel="label" optionValue="value" class="w-100" />
          </div>

          <div class="col-12">
            <label class="form-label">Descrizione</label>
            <Textarea v-model="form.description" rows="3" class="w-100" />
          </div>
        </div>

        <template #footer>
          <Button label="Chiudi" class="p-button-text" :disabled="dlg.saving" @click="dlg.visible=false" />
          <Button label="Salva" icon="pi pi-check" size="small" :loading="dlg.saving" @click="save" />
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";
import api from "@/services/api";

const toast = useToast();

const loading = ref(false);
const loadingBuildings = ref(false);
const loadingAssets = ref(false);

const buildingOptions = ref([]);
const assetOptions = ref([]);

const filterBuildingIds = ref([]);
const filterAssetIds = ref([]);

const rules = ref([]);
const q = ref("");

const dlg = reactive({ visible: false, saving: false, rule: null });
const form = reactive({ name: "", type: "rule_based", frequency: "monthly", description: "" });
const errors = reactive({ name: "" });

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

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

const filtered = computed(() => {
  const query = normalize(q.value);
  if (!query) return rules.value;
  return rules.value.filter((r) => normalize(r.name).includes(query));
});

function clearErrors() { errors.name = ""; }
function validate() {
  clearErrors();
  if (String(form.name || "").trim().length < 2) {
    errors.name = "Nome obbligatorio (min 2 caratteri)";
    return false;
  }
  return true;
}

async function loadBuildings() {
  loadingBuildings.value = true;
  try {
    const res = await api.get("/buildings");
    const arr = Array.isArray(res.data) ? res.data : [];
    buildingOptions.value = arr.map((b) => ({ label: b.name, value: b._id })).sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    buildingOptions.value = [];
  } finally {
    loadingBuildings.value = false;
  }
}

async function loadAssetsForBuildings() {
  loadingAssets.value = true;
  try {
    const params = {};
    if (filterBuildingIds.value.length) params.buildingIds = filterBuildingIds.value;
    const res = await api.get("/assets", { params });
    const arr = Array.isArray(res.data) ? res.data : [];
    assetOptions.value = arr.map((a) => ({ label: a.name, value: a._id })).sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    assetOptions.value = [];
  } finally {
    loadingAssets.value = false;
  }
}

async function loadRules() {
  loading.value = true;
  try {
    const params = {};
    if (filterBuildingIds.value.length) params.buildingIds = filterBuildingIds.value;
    if (filterAssetIds.value.length) params.assetIds = filterAssetIds.value;

    const res = await api.get("/rules", { params });
    const arr = Array.isArray(res.data) ? res.data : [];
    rules.value = arr.map((r) => ({
      ...r,
      assetsCount: r.assetsCount ?? (Array.isArray(r.assetIds) ? r.assetIds.length : 0),
    }));
  } catch (e) {
    rules.value = [];
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare regole", life: 3500 });
  } finally {
    loading.value = false;
  }
}

async function onBuildingsChange() {
  // quando cambiano i building, ricarico la lista oggetti e resetto filtro oggetti
  filterAssetIds.value = [];
  await loadAssetsForBuildings();
}

function resetFilters() {
  filterBuildingIds.value = [];
  filterAssetIds.value = [];
  q.value = "";
  assetOptions.value = [];
  loadRules();
}

function openEdit(evt) {
  const r = evt?.data || evt?.data?.data || evt?.rule || evt?.data;
  if (!r) return;

  dlg.rule = r;
  dlg.visible = true;

  form.name = r.name || "";
  form.type = r.type || "rule_based";
  form.frequency = r.frequency || "monthly";
  form.description = r.description || "";
  clearErrors();
}

async function save() {
  if (!validate()) return;
  dlg.saving = true;
  try {
    const id = dlg.rule?._id;
    const payload = {
      name: String(form.name).trim(),
      type: form.type,
      frequency: form.frequency,
      description: String(form.description || "").trim(),
    };
    await api.put(`/rules/${id}`, payload);
    toast.add({ severity: "success", summary: "Ok", detail: "Regola aggiornata", life: 2500 });
    dlg.visible = false;
    await loadRules();
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: e?.response?.data?.message || "Salvataggio fallito", life: 3500 });
  } finally {
    dlg.saving = false;
  }
}

onMounted(async () => {
  await loadBuildings();
  await loadRules();
});
</script>
