<!-- src/views/AssetsList.vue -->
<template>
  <div class="card shadow-sm border-0">
    <div class="card-body">
      <Toast />

      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h4 class="mb-1">Visualizza e modifica oggetti</h4>
          <div class="text-muted small">
            Filtra per uno o più edifici associati e cerca per nome.
          </div>
        </div>

        <Button label="Ricarica" icon="pi pi-refresh" size="small" class="p-button-text" :loading="loading" @click="loadAssets" />
      </div>

      <div class="row g-2 align-items-end mb-3">
        <div class="col-12 col-lg-6">
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
          />
        </div>

        <div class="col-12 col-lg-4">
          <label class="form-label">Ricerca</label>
          <InputText v-model="q" class="w-100 p-inputtext-sm" placeholder="Nome oggetto..." />
        </div>

        <div class="col-12 col-lg-2 d-flex gap-2">
          <Button label="Applica" icon="pi pi-filter" size="small" class="w-100" @click="loadAssets" />
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
        <Column field="category" header="Categoria" />
        <Column field="serial" header="Serial" />
        <Column field="buildingName" header="Edificio" />
        <Column header="Azioni" style="width: 120px;">
          <template #body="{ data }">
            <Button label="Modifica" icon="pi pi-pencil" size="small" class="p-button-text" @click.stop="openEdit({ data })" />
          </template>
        </Column>
      </DataTable>

      <Dialog v-model:visible="dlg.visible" header="Modifica oggetto" modal :style="{ width: '650px' }">
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label">Nome *</label>
            <InputText v-model="form.name" class="w-100" />
            <div v-if="errors.name" class="small text-danger mt-1">{{ errors.name }}</div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Categoria</label>
            <InputText v-model="form.category" class="w-100" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Serial</label>
            <InputText v-model="form.serial" class="w-100" />
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

const buildingOptions = ref([]);
const filterBuildingIds = ref([]);

const assets = ref([]);
const q = ref("");

const dlg = reactive({ visible: false, saving: false, asset: null });
const form = reactive({ name: "", category: "", serial: "", description: "" });
const errors = reactive({ name: "" });

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

const filtered = computed(() => {
  const query = normalize(q.value);
  if (!query) return assets.value;
  return assets.value.filter((a) => normalize(a.name).includes(query));
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

async function loadAssets() {
  loading.value = true;
  try {
    const params = {};
    if (filterBuildingIds.value.length) params.buildingIds = filterBuildingIds.value;

    const res = await api.get("/assets", { params });
    const arr = Array.isArray(res.data) ? res.data : [];

    // Se il backend non include buildingName, lasciamo fallback
    assets.value = arr.map((a) => ({
      ...a,
      buildingName: a.buildingName || a.building?.name || a.buildingId || "—",
    }));
  } catch (e) {
    assets.value = [];
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare oggetti", life: 3500 });
  } finally {
    loading.value = false;
  }
}

function openEdit(evt) {
  const a = evt?.data || evt?.data?.data || evt?.data; // tollerante
  const asset = evt?.data || evt?.data?.data || evt?.data || evt?.data?.asset || evt?.asset || evt?.data;
  const selected = evt?.data || evt?.data?.data || evt?.data || evt?.asset || evt?.data?.asset;

  const x = evt?.data ? evt.data : (evt?.data?.data ? evt.data.data : evt?.data);
  const item = x || asset || selected;
  if (!item) return;

  dlg.asset = item;
  dlg.visible = true;

  form.name = item.name || "";
  form.category = item.category || "";
  form.serial = item.serial || "";
  form.description = item.description || "";
  clearErrors();
}

async function save() {
  if (!validate()) return;
  dlg.saving = true;
  try {
    const id = dlg.asset?._id;
    const payload = {
      name: String(form.name).trim(),
      category: String(form.category || "").trim(),
      serial: String(form.serial || "").trim(),
      description: String(form.description || "").trim(),
    };
    await api.put(`/assets/${id}`, payload);
    toast.add({ severity: "success", summary: "Ok", detail: "Oggetto aggiornato", life: 2500 });
    dlg.visible = false;
    await loadAssets();
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: e?.response?.data?.message || "Salvataggio fallito", life: 3500 });
  } finally {
    dlg.saving = false;
  }
}

onMounted(async () => {
  await loadBuildings();
  await loadAssets();
});
</script>
