<template>
  <div class="flex-grow-1 overflow-auto p-4 bg-light">
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 class="mb-0">Interventi</h4>
          <div class="text-muted small">
            Gestisci interventi manuali e caricamenti bulk (se permesso).
          </div>
        </div>
      </div>

      <NoPermissions
        v-if="availableTabs.length === 0"
        title="Non hai i permessi"
        message="Non hai alcun permesso disponibile per questo modulo. Chiedi all’admin di assegnarti un ruolo con più permessi."
      />

      <template v-else>
        <TabView>
          <!-- TAB: TABLE -->
          <TabPanel v-if="canView" header="Visualizzazione tabellare">
            <div class="card border-0 shadow-sm mb-3">
              <div class="card-body">
                <div class="row g-2 align-items-end">
                  <div class="col-12 col-md-4">
                    <label class="form-label">Edifici</label>
                    <MultiSelect
                      v-model="filters.buildingIds"
                      :options="myBuildings"
                      optionLabel="name"
                      optionValue="_id"
                      placeholder="Seleziona uno o più edifici"
                      class="w-100"
                      display="chip"
                      :disabled="loadingBuildings"
                    />
                  </div>

                  <div class="col-6 col-md-3">
                    <label class="form-label">Da</label>
                    <InputText v-model="filters.from" class="w-100" placeholder="YYYY-MM-DD" />
                  </div>

                  <div class="col-6 col-md-3">
                    <label class="form-label">A</label>
                    <InputText v-model="filters.to" class="w-100" placeholder="YYYY-MM-DD" />
                  </div>

                  <div class="col-12 col-md-2 d-flex justify-content-end">
                    <Button
                      label="Aggiorna"
                      icon="pi pi-refresh"
                      class="p-button-sm"
                      :loading="tableLoading"
                      @click="fetchTable"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <DataTable
                  :value="table.items"
                  responsiveLayout="scroll"
                  stripedRows
                  class="p-datatable-sm"
                  :loading="tableLoading"
                >
                  <Column field="performedAt" header="Data" />
                  <Column field="type" header="Tipo" />
                  <Column field="operator" header="Operatore" />
                  <Column field="notes" header="Note" />
                  <Column field="assetId" header="Asset" />
                  <Column field="buildingId" header="Edificio" />
                  <Column v-if="canManage" header="Azioni">
                    <template #body="slotProps">
                      <Button
                        icon="pi pi-trash"
                        class="p-button-sm p-button-danger"
                        :disabled="deleteLoading"
                        @click="deleteOne(slotProps.data)"
                      />
                    </template>
                  </Column>
                </DataTable>

                <div v-if="!tableLoading" class="text-muted small mt-2">
                  Totale: <strong>{{ table.total }}</strong>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- TAB: CREATE -->
          <TabPanel v-if="canManage" header="Crea intervento">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <div class="row g-2">
                  <div class="col-12 col-md-6">
                    <label class="form-label">Asset</label>
                    <MultiSelect
                      v-model="createForm.assetIds"
                      :options="assets"
                      optionLabel="name"
                      optionValue="_id"
                      placeholder="Seleziona uno o più asset"
                      class="w-100"
                      display="chip"
                      :disabled="assetsLoading"
                    />
                  </div>

                  <div class="col-6 col-md-3">
                    <label class="form-label">Data</label>
                    <InputText v-model="createForm.performedAt" class="w-100" placeholder="YYYY-MM-DD" />
                  </div>

                  <div class="col-6 col-md-3">
                    <label class="form-label">Tipo</label>
                    <InputText v-model="createForm.type" class="w-100" placeholder="es. manutenzione" />
                  </div>

                  <div class="col-12 col-md-4">
                    <label class="form-label">Operatore</label>
                    <InputText v-model="createForm.operator" class="w-100" placeholder="Nome operatore" />
                  </div>

                  <div class="col-12 col-md-4">
                    <label class="form-label">Esito</label>
                    <Dropdown v-model="createForm.outcome" :options="outcomeOptions" class="w-100" />
                  </div>

                  <div class="col-12 col-md-4">
                    <label class="form-label">Note</label>
                    <InputText v-model="createForm.notes" class="w-100" placeholder="Note opzionali" />
                  </div>
                </div>

                <div class="d-flex justify-content-end mt-3">
                  <Button
                    label="Crea"
                    icon="pi pi-check"
                    class="p-button-sm p-button-success"
                    :loading="createLoading"
                    @click="createIntervention"
                  />
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- BULK UPLOAD -->
          <TabPanel v-if="canBulk" header="Carica interventi (JSON)">
            <div class="card border-0 shadow-sm mb-3">
              <div class="card-body">
                <div class="text-muted small mb-2">
                  Incolla un array JSON di interventi. Verrà eseguita una preview con validazione prima dell’inserimento.
                </div>

                <label class="form-label">JSON</label>
                <Textarea v-model="bulkJson" rows="10" class="w-100" placeholder='[{"assetId":"...","type":"...","notes":"..."}]' />

                <div class="d-flex gap-2 justify-content-end mt-3">
                  <Button label="Preview" icon="pi pi-search" class="p-button-sm" :loading="bulkLoading" @click="previewBulk" />
                  <Button
                    label="Conferma inserimento"
                    icon="pi pi-check"
                    class="p-button-sm p-button-success"
                    :disabled="bulkPreview.validRows.length === 0"
                    :loading="bulkCommitLoading"
                    @click="commitBulk"
                  />
                </div>
              </div>
            </div>

            <div v-if="bulkPreview.visible" class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="mb-2">Anteprima</h6>
                <div class="small text-muted mb-2">
                  Righe valide: <strong>{{ bulkPreview.validRows.length }}</strong> — Righe scartate: <strong>{{ bulkPreview.invalidRows.length }}</strong>
                </div>

                <div v-if="bulkPreview.invalidRows.length" class="alert alert-warning">
                  Alcune righe sono state scartate (formato non valido o non autorizzate).
                </div>

                <DataTable :value="bulkPreview.validRows" responsiveLayout="scroll" class="p-datatable-sm">
                  <Column field="assetId" header="assetId"></Column>
                  <Column field="type" header="type"></Column>
                  <Column field="operator" header="operator"></Column>
                  <Column field="performedAt" header="performedAt"></Column>
                </DataTable>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </template>

      <Toast />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";
import api from "@/services/api";
import NoPermissions from "@/components/NoPermissions.vue";
import { usePermissions } from "@/composables/usePermissions";

import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import MultiSelect from "primevue/multiselect";
import Dropdown from "primevue/dropdown";
import Toast from "primevue/toast";

const toast = useToast();
const { hasPermission } = usePermissions();

const canView = computed(() => hasPermission("interventions:view"));
const canManage = computed(() => hasPermission("interventions:manage"));
const canBulk = computed(() => hasPermission("interventions:bulk_upload"));

const availableTabs = computed(() => {
  const t = [];
  if (canView.value) t.push("table");
  if (canManage.value) t.push("create");
  if (canBulk.value) t.push("bulk");
  return t;
});

/** BUILDINGS */
const myBuildings = ref([]);
const loadingBuildings = ref(false);

async function fetchMyBuildings() {
  loadingBuildings.value = true;
  try {
    const res = await api.get("/buildings");
    myBuildings.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare edifici", life: 3500 });
  } finally {
    loadingBuildings.value = false;
  }
}

/** ASSETS */
const assets = ref([]);
const assetsLoading = ref(false);

async function fetchAssets() {
  assetsLoading.value = true;
  try {
    const res = await api.get("/assets");
    assets.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare asset", life: 3500 });
  } finally {
    assetsLoading.value = false;
  }
}

/** TABLE */
const filters = reactive({
  buildingIds: [],
  from: "",
  to: "",
});

const table = reactive({
  total: 0,
  items: [],
});

const tableLoading = ref(false);
const deleteLoading = ref(false);

async function fetchTable() {
  if (!canView.value) return;
  tableLoading.value = true;
  try {
    const params = {};
    if (Array.isArray(filters.buildingIds) && filters.buildingIds.length) params.buildingIds = filters.buildingIds;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    const res = await api.get("/interventions/table", { params });
    table.total = Number(res.data?.total || 0);
    table.items = Array.isArray(res.data?.items) ? res.data.items : [];
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: e?.response?.data?.message || "Caricamento fallito", life: 3500 });
  } finally {
    tableLoading.value = false;
  }
}

async function deleteOne(row) {
  if (!canManage.value) return;
  const id = row?._id || row?.id;
  if (!id) return;

  deleteLoading.value = true;
  try {
    await api.delete(`/interventions/${id}`);
    toast.add({ severity: "success", summary: "Ok", detail: "Intervento eliminato", life: 2200 });
    await fetchTable();
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: e?.response?.data?.message || "Eliminazione fallita", life: 3500 });
  } finally {
    deleteLoading.value = false;
  }
}

/** CREATE */
const outcomeOptions = ["OK", "KO"];
const createForm = reactive({
  assetIds: [],
  performedAt: "",
  type: "",
  operator: "",
  outcome: "OK",
  notes: "",
});
const createLoading = ref(false);

async function createIntervention() {
  if (!canManage.value) return;

  if (!Array.isArray(createForm.assetIds) || createForm.assetIds.length === 0) {
    toast.add({ severity: "warn", summary: "Dati mancanti", detail: "Seleziona almeno un asset", life: 3000 });
    return;
  }

  createLoading.value = true;
  try {
    await api.post("/interventions", {
      assetIds: createForm.assetIds,
      performedAt: createForm.performedAt,
      type: createForm.type,
      operator: createForm.operator,
      outcome: createForm.outcome,
      notes: createForm.notes,
    });

    toast.add({ severity: "success", summary: "Ok", detail: "Intervento creato", life: 2500 });

    createForm.assetIds = [];
    createForm.performedAt = "";
    createForm.type = "";
    createForm.operator = "";
    createForm.outcome = "OK";
    createForm.notes = "";

    await fetchTable();
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: e?.response?.data?.message || "Creazione intervento fallita",
      life: 3500,
    });
  } finally {
    createLoading.value = false;
  }
}

/** BULK */
const bulkJson = ref("");
const bulkLoading = ref(false);
const bulkCommitLoading = ref(false);

const bulkPreview = reactive({
  visible: false,
  validRows: [],
  invalidRows: [],
});

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function previewBulk() {
  if (!canBulk.value) return;

  const parsed = safeParseJson(bulkJson.value);
  if (!parsed || !Array.isArray(parsed)) {
    toast.add({ severity: "warn", summary: "Formato non valido", detail: "Inserisci un array JSON valido", life: 3000 });
    return;
  }

  bulkLoading.value = true;
  try {
    // Backend expects: body = array
    // Response: { okCount, errorCount, items: [{ ok, value?, error?, index? }] }
    const res = await api.post("/interventions/bulk/preview", parsed);
    const items = Array.isArray(res.data?.items) ? res.data.items : [];

    bulkPreview.visible = true;
    bulkPreview.validRows = items.filter((r) => r?.ok).map((r) => r.value);
    bulkPreview.invalidRows = items.filter((r) => !r?.ok).map((r) => ({ index: r.index, error: r.error }));
    toast.add({ severity: "info", summary: "Preview pronta", detail: "Controlla le righe valide prima di confermare", life: 2500 });
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: e?.response?.data?.message || "Preview fallita", life: 3500 });
  } finally {
    bulkLoading.value = false;
  }
}

async function commitBulk() {
  if (!canBulk.value) return;
  if (!bulkPreview.validRows.length) return;

  bulkCommitLoading.value = true;
  try {
    // Backend expects: body = array
    await api.post("/interventions/bulk/commit", bulkPreview.validRows);
    toast.add({ severity: "success", summary: "Ok", detail: "Interventi caricati", life: 2500 });

    bulkPreview.visible = false;
    bulkPreview.validRows = [];
    bulkPreview.invalidRows = [];
    bulkJson.value = "";

    await fetchTable();
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: e?.response?.data?.message || "Commit fallito", life: 3500 });
  } finally {
    bulkCommitLoading.value = false;
  }
}

/** init */
onMounted(async () => {
  await fetchMyBuildings();
  await fetchAssets();
  if (canView.value) await fetchTable();
});
</script>
