<template>
  <div class="container-fluid py-3">
    <div class="mb-3">
      <h4 class="mb-1">Oggetti & Regole</h4>
      <div class="text-muted small">
        Gestisci gli oggetti e le regole solo per gli edifici a cui sei associato.
      </div>
    </div>

    <NoPermissions
      v-if="availableTabs.length === 0"
      hint="Non hai permessi per visualizzare Oggetti o Regole. Chiedi all’admin un ruolo con più permessi."
    />

    <template v-else>
      <TabView>
        <!-- ASSETS TAB -->
        <TabPanel v-if="showAssets" header="Oggetti">
          <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
              <div class="row g-2 align-items-end">
                <div class="col-md-6">
                  <label class="form-label">Filtra edifici</label>
                  <MultiSelect
                    v-model="assetFilters.buildingIds"
                    :options="myBuildingsOptions"
                    optionLabel="label"
                    optionValue="value"
                    display="chip"
                    filter
                    class="w-100"
                    placeholder="Seleziona edifici..."
                    @change="fetchAssets"
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label">Cerca nome oggetto</label>
                  <InputText
                    v-model="assetFilters.search"
                    class="w-100"
                    placeholder="es. Caldaia..."
                    @keyup.enter="fetchAssets"
                  />
                </div>

                <div class="col-md-2 d-flex gap-2">
                  <Button label="Cerca" icon="pi pi-search" class="p-button-sm w-100" @click="fetchAssets" />
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center mt-3">
                <div class="small text-muted">
                  Mostrati solo oggetti dei tuoi edifici associati.
                </div>
                <Button
                  v-if="canAssetsManage"
                  label="Crea oggetto"
                  icon="pi pi-plus"
                  class="p-button-sm"
                  @click="openCreateAssetStep1"
                />
              </div>
            </div>
          </div>

          <DataTable
            :value="assets"
            :loading="assetsLoading"
            dataKey="_id"
            responsiveLayout="scroll"
            class="p-datatable-sm"
            @row-click="onAssetRowClick"
          >
            <Column field="name" header="Nome"></Column>
            <Column header="Edificio">
              <template #body="{ data }">
                {{ buildingNameById(data.buildingId) }}
              </template>
            </Column>
            <Column field="category" header="Categoria"></Column>
            <Column field="serialNumber" header="Seriale"></Column>
            <Column header="Azioni" v-if="canAssetsManage">
              <template #body="{ data }">
                <Button label="Modifica" icon="pi pi-pencil" class="p-button-text p-button-sm" @click.stop="openEditAsset(data)" />
              </template>
            </Column>
          </DataTable>

          <!-- ASSET CREATE STEP 1 -->
          <Dialog v-model:visible="assetWizard.step1" header="Crea oggetto - Seleziona edifici" modal :style="{ width: '720px' }">
            <div class="mb-2 text-muted small">
              Seleziona uno o più edifici associati a te, poi continua per inserire i dati dell’oggetto.
            </div>
            <MultiSelect
              v-model="assetWizard.selectedBuildings"
              :options="myBuildingsOptions"
              optionLabel="label"
              optionValue="value"
              display="chip"
              filter
              class="w-100"
              placeholder="Seleziona edifici..."
            />

            <template #footer>
              <Button label="Annulla" class="p-button-text" @click="closeAssetWizard" />
              <Button
                label="Continua"
                icon="pi pi-arrow-right"
                class="p-button-sm"
                :disabled="assetWizard.selectedBuildings.length === 0"
                @click="assetWizardGoStep2"
              />
            </template>
          </Dialog>

          <!-- ASSET CREATE/EDIT STEP 2 -->
          <Dialog
            v-model:visible="assetWizard.step2"
            :header="assetWizard.isEdit ? 'Modifica oggetto' : 'Crea oggetto'"
            modal
            :style="{ width: '720px' }"
          >
            <div v-if="!assetWizard.isEdit" class="small text-muted mb-2">
              L’oggetto verrà creato per il building selezionato (se ne hai scelti più di uno, lo creerai uno alla volta).
            </div>

            <div v-if="!assetWizard.isEdit" class="mb-3">
              <label class="form-label">Edificio</label>
              <Dropdown
                v-model="assetForm.buildingId"
                :options="assetWizardBuildingOptions"
                optionLabel="label"
                optionValue="value"
                class="w-100"
              />
            </div>

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Nome *</label>
                <InputText v-model="assetForm.name" class="w-100" />
                <div v-if="assetErrors.name" class="small text-danger mt-1">{{ assetErrors.name }}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Categoria</label>
                <InputText v-model="assetForm.category" class="w-100" placeholder="Es. HVAC" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Seriale</label>
                <InputText v-model="assetForm.serialNumber" class="w-100" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Note</label>
                <InputText v-model="assetForm.notes" class="w-100" />
              </div>
            </div>

            <template #footer>
              <Button label="Annulla" class="p-button-text" :disabled="assetWizard.saving" @click="closeAssetWizard" />
              <Button
                :label="assetWizard.isEdit ? 'Salva' : 'Crea'"
                icon="pi pi-check"
                class="p-button-sm"
                :loading="assetWizard.saving"
                @click="saveAsset"
              />
            </template>
          </Dialog>
        </TabPanel>

        <!-- RULES TAB -->
        <TabPanel v-if="showRules" header="Regole">
          <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
              <div class="row g-2 align-items-end">
                <div class="col-md-5">
                  <label class="form-label">Filtra edifici</label>
                  <MultiSelect
                    v-model="ruleFilters.buildingIds"
                    :options="myBuildingsOptions"
                    optionLabel="label"
                    optionValue="value"
                    display="chip"
                    filter
                    class="w-100"
                    placeholder="Seleziona edifici..."
                    @change="onRuleBuildingsChange"
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label">Filtra oggetti</label>
                  <MultiSelect
                    v-model="ruleFilters.assetIds"
                    :options="rulesAssetOptions"
                    optionLabel="label"
                    optionValue="value"
                    display="chip"
                    filter
                    class="w-100"
                    placeholder="Seleziona oggetti..."
                    @change="fetchRules"
                  />
                </div>

                <div class="col-md-3">
                  <label class="form-label">Cerca nome regola</label>
                  <InputText v-model="ruleFilters.search" class="w-100" placeholder="es. check_temp" @keyup.enter="fetchRules" />
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center mt-3">
                <div class="small text-muted">
                  Puoi filtrare per uno o più building e per oggetti associati.
                </div>
                <Button
                  v-if="canRulesManage"
                  label="Crea regola"
                  icon="pi pi-plus"
                  class="p-button-sm"
                  @click="openCreateRuleStep1"
                />
              </div>
            </div>
          </div>

          <DataTable
            :value="rules"
            :loading="rulesLoading"
            dataKey="_id"
            responsiveLayout="scroll"
            class="p-datatable-sm"
            @row-click="onRuleRowClick"
          >
            <Column field="name" header="Nome"></Column>
            <Column header="Oggetto">
              <template #body="{ data }">
                {{ assetNameById(data.assetId) }}
              </template>
            </Column>
            <Column header="Edificio">
              <template #body="{ data }">
                {{ buildingNameById(assetBuildingId(data.assetId)) }}
              </template>
            </Column>
            <Column field="severity" header="Severità"></Column>
            <Column header="Azioni" v-if="canRulesManage">
              <template #body="{ data }">
                <Button label="Modifica" icon="pi pi-pencil" class="p-button-text p-button-sm" @click.stop="openEditRule(data)" />
              </template>
            </Column>
          </DataTable>

          <!-- RULE WIZARD STEP 1 -->
          <Dialog v-model:visible="ruleWizard.step1" header="Crea regola - Seleziona edifici" modal :style="{ width: '760px' }">
            <div class="mb-2 text-muted small">
              Seleziona uno o più edifici associati. Potrai scegliere gli oggetti SOLO di questi edifici.
            </div>

            <MultiSelect
              v-model="ruleWizard.selectedBuildings"
              :options="myBuildingsOptions"
              optionLabel="label"
              optionValue="value"
              display="chip"
              filter
              class="w-100"
              placeholder="Seleziona edifici..."
            />

            <template #footer>
              <Button label="Annulla" class="p-button-text" @click="closeRuleWizard" />
              <Button
                label="Continua"
                icon="pi pi-arrow-right"
                class="p-button-sm"
                :disabled="ruleWizard.selectedBuildings.length === 0"
                @click="ruleWizardGoStep2"
              />
            </template>
          </Dialog>

          <!-- RULE WIZARD STEP 2 -->
          <Dialog v-model:visible="ruleWizard.step2" header="Crea regola - Seleziona oggetti" modal :style="{ width: '760px' }">
            <div class="mb-2 text-muted small">
              Seleziona gli oggetti a cui applicare la regola (solo oggetti dei building selezionati).
            </div>

            <MultiSelect
              v-model="ruleWizard.selectedAssets"
              :options="ruleWizardAssetsOptions"
              optionLabel="label"
              optionValue="value"
              display="chip"
              filter
              class="w-100"
              placeholder="Seleziona oggetti..."
            />

            <template #footer>
              <Button label="Indietro" class="p-button-text" @click="backToRuleStep1" />
              <Button label="Annulla" class="p-button-text" @click="closeRuleWizard" />
              <Button
                label="Continua"
                icon="pi pi-arrow-right"
                class="p-button-sm"
                :disabled="ruleWizard.selectedAssets.length === 0"
                @click="ruleWizardGoStep3"
              />
            </template>
          </Dialog>

          <!-- RULE CREATE/EDIT STEP 3 -->
          <Dialog
            v-model:visible="ruleWizard.step3"
            :header="ruleWizard.isEdit ? 'Modifica regola' : 'Crea regola'"
            modal
            :style="{ width: '760px' }"
          >
            <div v-if="!ruleWizard.isEdit" class="small text-muted mb-2">
              Se hai selezionato più oggetti, la regola verrà creata una volta per ciascun oggetto.
            </div>

            <div v-if="!ruleWizard.isEdit" class="mb-3">
              <label class="form-label">Oggetto</label>
              <Dropdown
                v-model="ruleForm.assetId"
                :options="ruleWizardAssetsDropdown"
                optionLabel="label"
                optionValue="value"
                class="w-100"
              />
            </div>

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Nome regola *</label>
                <InputText v-model="ruleForm.name" class="w-100" />
                <div v-if="ruleErrors.name" class="small text-danger mt-1">{{ ruleErrors.name }}</div>
              </div>

              <div class="col-md-6">
                <label class="form-label">Severità</label>
                <Dropdown
                  v-model="ruleForm.severity"
                  :options="severityOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-100"
                />
              </div>

              <div class="col-12">
                <label class="form-label">Descrizione</label>
                <Textarea v-model="ruleForm.description" rows="3" class="w-100" />
              </div>

              <div class="col-12">
                <label class="form-label">Condizione (JSON / testo)</label>
                <Textarea v-model="ruleForm.condition" rows="4" class="w-100" placeholder='{ "field": "temp", "op": ">", "value": 80 }' />
              </div>
            </div>

            <template #footer>
              <Button label="Annulla" class="p-button-text" :disabled="ruleWizard.saving" @click="closeRuleWizard" />
              <Button
                :label="ruleWizard.isEdit ? 'Salva' : 'Crea'"
                icon="pi pi-check"
                class="p-button-sm"
                :loading="ruleWizard.saving"
                @click="saveRule"
              />
            </template>
          </Dialog>
        </TabPanel>
      </TabView>
    </template>

    <Toast />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";
import api from "@/services/api";
import NoPermissions from "@/components/NoPermissions.vue";
import { usePermissions } from "@/composables/usePermissions";

const toast = useToast();
const { hasPermission } = usePermissions();

const showAssets = computed(() => hasPermission("assets:view"));
const showRules = computed(() => hasPermission("rules:view"));
const canAssetsManage = computed(() => hasPermission("assets:manage"));
const canRulesManage = computed(() => hasPermission("rules:manage"));

const availableTabs = computed(() => {
  const tabs = [];
  if (showAssets.value) tabs.push("assets");
  if (showRules.value) tabs.push("rules");
  return tabs;
});

/** Buildings associati (per filtri e wizard) */
const myBuildings = ref([]);
const myBuildingsOptions = computed(() =>
  (myBuildings.value || [])
    .map((b) => ({ label: b.name, value: b._id }))
    .sort((a, b) => a.label.localeCompare(b.label))
);

function buildingNameById(id) {
  const b = (myBuildings.value || []).find((x) => x._id === id);
  return b?.name || "-";
}

/** Assets */
const assetsLoading = ref(false);
const assets = ref([]);

const assetFilters = reactive({
  buildingIds: [],
  search: "",
});

const assetWizard = reactive({
  step1: false,
  step2: false,
  isEdit: false,
  saving: false,
  selectedBuildings: [],
  editAsset: null,
});

const assetForm = reactive({
  buildingId: "",
  name: "",
  category: "",
  serialNumber: "",
  notes: "",
});

const assetErrors = reactive({ name: "" });

const assetWizardBuildingOptions = computed(() => {
  const ids = assetWizard.selectedBuildings;
  return myBuildingsOptions.value.filter((o) => ids.includes(o.value));
});

function clearAssetErrors() {
  assetErrors.name = "";
}
function validateAsset() {
  clearAssetErrors();
  if (String(assetForm.name || "").trim().length < 2) {
    assetErrors.name = "Nome oggetto obbligatorio (min 2 caratteri)";
    return false;
  }
  if (!assetWizard.isEdit && !assetForm.buildingId) {
    toast.add({ severity: "warn", summary: "Attenzione", detail: "Seleziona un edificio", life: 2500 });
    return false;
  }
  return true;
}

async function fetchAssets() {
  if (!showAssets.value) return;
  assetsLoading.value = true;
  try {
    const params = {};
    if (assetFilters.buildingIds.length) params.buildingIds = assetFilters.buildingIds.join(",");
    if (assetFilters.search) params.search = assetFilters.search;

    const res = await api.get("/assets", { params });
    assets.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare oggetti", life: 3500 });
  } finally {
    assetsLoading.value = false;
  }
}

function openCreateAssetStep1() {
  assetWizard.isEdit = false;
  assetWizard.selectedBuildings = [];
  assetWizard.step1 = true;
}

function assetWizardGoStep2() {
  assetWizard.step1 = false;
  assetWizard.step2 = true;
  assetForm.buildingId = assetWizard.selectedBuildings[0] || "";
  assetForm.name = "";
  assetForm.category = "";
  assetForm.serialNumber = "";
  assetForm.notes = "";
  clearAssetErrors();
}

function openEditAsset(a) {
  assetWizard.isEdit = true;
  assetWizard.editAsset = a;
  assetWizard.step2 = true;
  assetForm.buildingId = a.buildingId || "";
  assetForm.name = a.name || "";
  assetForm.category = a.category || "";
  assetForm.serialNumber = a.serialNumber || "";
  assetForm.notes = a.notes || "";
  clearAssetErrors();
}

function closeAssetWizard() {
  assetWizard.step1 = false;
  assetWizard.step2 = false;
  assetWizard.saving = false;
  assetWizard.editAsset = null;
  clearAssetErrors();
}

function onAssetRowClick(evt) {
  if (!canAssetsManage.value) return;
  const a = evt.data;
  if (a) openEditAsset(a);
}

async function saveAsset() {
  if (!validateAsset()) return;

  assetWizard.saving = true;
  try {
    const payload = {
      buildingId: assetForm.buildingId,
      name: String(assetForm.name).trim(),
      category: String(assetForm.category || "").trim(),
      serialNumber: String(assetForm.serialNumber || "").trim(),
      notes: String(assetForm.notes || "").trim(),
    };

    if (assetWizard.isEdit) {
      await api.put(`/assets/${assetWizard.editAsset._id}`, payload);
      toast.add({ severity: "success", summary: "Ok", detail: "Oggetto aggiornato", life: 2500 });
    } else {
      await api.post("/assets", payload);
      toast.add({ severity: "success", summary: "Ok", detail: "Oggetto creato", life: 2500 });
    }

    closeAssetWizard();
    await fetchAssets();
    await refreshRuleAssetsIfNeeded();
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: e?.response?.data?.message || "Operazione fallita",
      life: 3500,
    });
  } finally {
    assetWizard.saving = false;
  }
}

/** Rules */
const rulesLoading = ref(false);
const rules = ref([]);

const ruleFilters = reactive({
  buildingIds: [],
  assetIds: [],
  search: "",
});

const severityOptions = [
  { label: "LOW", value: "LOW" },
  { label: "MEDIUM", value: "MEDIUM" },
  { label: "HIGH", value: "HIGH" },
];

const rulesAssetOptions = ref([]); // assets filtrati per buildings selezionati (per filtro tabella)
const assetIndex = ref([]); // cache assets per mapping name/buildingId

function assetNameById(id) {
  const a = (assetIndex.value || []).find((x) => x._id === id);
  return a?.name || "-";
}

function assetBuildingId(assetId) {
  const a = (assetIndex.value || []).find((x) => x._id === assetId);
  return a?.buildingId || "";
}

async function refreshRuleAssetsIfNeeded() {
  if (!showRules.value) return;

  // Carico assets associati (o filtrati per buildings selezionati)
  try {
    const params = {};
    if (ruleFilters.buildingIds.length) params.buildingIds = ruleFilters.buildingIds.join(",");
    const res = await api.get("/assets", { params });
    const list = Array.isArray(res.data) ? res.data : [];
    assetIndex.value = list;

    rulesAssetOptions.value = list
      .map((a) => ({ label: `${a.name} — ${buildingNameById(a.buildingId)}`, value: a._id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    // ignore
  }
}

async function onRuleBuildingsChange() {
  ruleFilters.assetIds = [];
  await refreshRuleAssetsIfNeeded();
  await fetchRules();
}

async function fetchRules() {
  if (!showRules.value) return;

  rulesLoading.value = true;
  try {
    const params = {};
    if (ruleFilters.buildingIds.length) params.buildingIds = ruleFilters.buildingIds.join(",");
    if (ruleFilters.assetIds.length) params.assetIds = ruleFilters.assetIds.join(",");
    if (ruleFilters.search) params.search = ruleFilters.search;

    const res = await api.get("/rules", { params });
    rules.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare regole", life: 3500 });
  } finally {
    rulesLoading.value = false;
  }
}

const ruleWizard = reactive({
  step1: false,
  step2: false,
  step3: false,
  isEdit: false,
  saving: false,
  selectedBuildings: [],
  selectedAssets: [],
  editRule: null,
});

const ruleWizardAssetsOptions = computed(() => {
  const allowedBuildings = new Set(ruleWizard.selectedBuildings);
  return (assetIndex.value || [])
    .filter((a) => allowedBuildings.has(a.buildingId))
    .map((a) => ({ label: `${a.name} — ${buildingNameById(a.buildingId)}`, value: a._id }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const ruleWizardAssetsDropdown = computed(() => ruleWizardAssetsOptions.value);

const ruleForm = reactive({
  assetId: "",
  name: "",
  severity: "MEDIUM",
  description: "",
  condition: "",
});

const ruleErrors = reactive({ name: "" });

function clearRuleErrors() {
  ruleErrors.name = "";
}
function validateRule() {
  clearRuleErrors();
  if (String(ruleForm.name || "").trim().length < 2) {
    ruleErrors.name = "Nome regola obbligatorio (min 2 caratteri)";
    return false;
  }
  if (!ruleWizard.isEdit && !ruleForm.assetId) {
    toast.add({ severity: "warn", summary: "Attenzione", detail: "Seleziona un oggetto", life: 2500 });
    return false;
  }
  return true;
}

function openCreateRuleStep1() {
  ruleWizard.isEdit = false;
  ruleWizard.selectedBuildings = [];
  ruleWizard.selectedAssets = [];
  ruleWizard.step1 = true;
}

async function ruleWizardGoStep2() {
  await refreshRuleAssetsIfNeeded();
  ruleWizard.step1 = false;
  ruleWizard.step2 = true;
  ruleWizard.selectedAssets = [];
}

function backToRuleStep1() {
  ruleWizard.step2 = false;
  ruleWizard.step1 = true;
}

function ruleWizardGoStep3() {
  ruleWizard.step2 = false;
  ruleWizard.step3 = true;
  ruleForm.assetId = ruleWizard.selectedAssets[0] || "";
  ruleForm.name = "";
  ruleForm.severity = "MEDIUM";
  ruleForm.description = "";
  ruleForm.condition = "";
  clearRuleErrors();
}

function openEditRule(r) {
  ruleWizard.isEdit = true;
  ruleWizard.editRule = r;
  ruleWizard.step3 = true;
  ruleForm.assetId = r.assetId || "";
  ruleForm.name = r.name || "";
  ruleForm.severity = r.severity || "MEDIUM";
  ruleForm.description = r.description || "";
  ruleForm.condition = typeof r.condition === "string" ? r.condition : JSON.stringify(r.condition || {}, null, 2);
  clearRuleErrors();
}

function closeRuleWizard() {
  ruleWizard.step1 = false;
  ruleWizard.step2 = false;
  ruleWizard.step3 = false;
  ruleWizard.saving = false;
  ruleWizard.editRule = null;
  clearRuleErrors();
}

function onRuleRowClick(evt) {
  if (!canRulesManage.value) return;
  const r = evt.data;
  if (r) openEditRule(r);
}

async function saveRule() {
  if (!validateRule()) return;

  ruleWizard.saving = true;
  try {
    // condition può essere JSON o testo: invio stringa e backend gestisce/valida
    const payload = {
      assetId: ruleForm.assetId,
      name: String(ruleForm.name).trim(),
      severity: ruleForm.severity,
      description: String(ruleForm.description || "").trim(),
      condition: ruleForm.condition,
    };

    if (ruleWizard.isEdit) {
      await api.put(`/rules/${ruleWizard.editRule._id}`, payload);
      toast.add({ severity: "success", summary: "Ok", detail: "Regola aggiornata", life: 2500 });
    } else {
      await api.post("/rules", payload);
      toast.add({ severity: "success", summary: "Ok", detail: "Regola creata", life: 2500 });
    }

    closeRuleWizard();
    await fetchRules();
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: e?.response?.data?.message || "Operazione fallita",
      life: 3500,
    });
  } finally {
    ruleWizard.saving = false;
  }
}

/** Init */
async function fetchMyBuildings() {
  try {
    const res = await api.get("/buildings");
    myBuildings.value = Array.isArray(res.data) ? res.data : [];
  } catch {
    myBuildings.value = [];
  }
}

onMounted(async () => {
  await fetchMyBuildings();
  // preload assets index per mapping
  await refreshRuleAssetsIfNeeded();

  if (showAssets.value) await fetchAssets();
  if (showRules.value) await fetchRules();
});
</script>
