<template>
  <div class="card shadow-sm border-0">
    <div class="card-body">
      <Toast />

      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h4 class="mb-1">Visualizza edifici</h4>
          <div class="text-muted small">Tabella edifici con ricerca e ordinamento.</div>
        </div>

        <Button
          label="Ricarica"
          icon="pi pi-refresh"
          size="small"
          class="p-button-text"
          :loading="loading"
          @click="loadBuildings"
        />
      </div>

      <div class="row g-3 align-items-end mb-3">
        <div class="col-12 col-lg-6">
          <InputText v-model="search" class="w-100" placeholder="Cerca edificio..." />
        </div>
      </div>

      <DataTable
        :value="filtered"
        dataKey="_id"
        paginator
        :rows="8"
        :rowsPerPageOptions="[8, 12, 20]"
        class="p-datatable-sm"
        responsiveLayout="scroll"
        emptyMessage="Nessun edificio trovato."
      >
        <Column field="name" header="Nome" sortable />
        <Column field="city" header="Città" sortable />
        <Column field="address" header="Indirizzo" />

        <Column header="Creato il" sortable>
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>

        <Column header="# Asset" sortable>
          <template #body="{ data }">{{ data.assetsCount ?? "—" }}</template>
        </Column>

        <Column header="# Regole" sortable>
          <template #body="{ data }">{{ data.rulesCount ?? "—" }}</template>
        </Column>

        <Column header="Stato">
          <template #body="{ data }">
            <span class="badge bg-secondary" v-if="!data.isAssociated">non assegnato</span>
            <span class="badge bg-success" v-else>assegnato</span>
          </template>
        </Column>

        <Column header="Azione" style="width: 220px">
          <template #body="{ data }">
            <div class="d-flex justify-content-end gap-2">
              <!-- richiesta assegnazione -->
              <Button
                v-if="!canEdit && !data.isAssociated"
                label="Richiedi"
                size="small"
                icon="pi pi-send"
                class="p-button-text"
                @click="requestAssignment(data)"
              />

              <!-- modifica edificio -->
              <Button
                v-if="canEdit"
                label="Modifica"
                size="small"
                icon="pi pi-pencil"
                class="p-button-text"
                @click="openEditDialog(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <!-- EDIT dialog (solo per chi può editare) -->
      <Dialog
        v-model:visible="editVisible"
        header="Modifica edificio"
        modal
        :style="{ width: '760px', maxWidth: '96vw' }"
      >
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label">Nome</label>
            <InputText v-model="editForm.name" class="w-100" />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Città</label>
            <InputText v-model="editForm.city" class="w-100" />
          </div>
          <div class="col-12">
            <label class="form-label">Indirizzo</label>
            <InputText v-model="editForm.address" class="w-100" />
          </div>
        </div>

        <template #footer>
          <Button label="Chiudi" class="p-button-text" icon="pi pi-times" @click="editVisible = false" />
          <Button label="Salva" icon="pi pi-check" :loading="saving" @click="submitEditBuilding" />
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";

import Toast from "primevue/toast";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import DataTable from "primevue/datatable";
import Column from "primevue/column";

import { usePermissions } from "@/composables/usePermissions";
import { fetchAllBuildings, updateBuilding as apiUpdateBuilding } from "@/services/buildings.service";
import { createAssignBuildingRequest } from "@/services/requests.service";

const toast = useToast();
const { hasPermission } = usePermissions();

// Backend: POST/PUT/DELETE buildings richiedono buildings:manage
const canEdit = computed(() => hasPermission("buildings:manage"));

const loading = ref(false);
const saving = ref(false);
const buildings = ref([]);
const search = ref("");

const editVisible = ref(false);
const editForm = reactive({ _id: "", name: "", city: "", address: "" });

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

async function loadBuildings() {
  loading.value = true;
  try {
    const res = await fetchAllBuildings();
    buildings.value = res?.data || [];
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare la lista edifici", life: 3500 });
  } finally {
    loading.value = false;
  }
}

const filtered = computed(() => {
  const q = (search.value || "").trim().toLowerCase();
  if (!q) return buildings.value;
  return buildings.value.filter((b) => (b.name || "").toLowerCase().includes(q));
});

function openEditDialog(b) {
  editForm._id = b._id || b.id;
  editForm.name = b.name || "";
  editForm.city = b.city || "";
  editForm.address = b.address || "";
  editVisible.value = true;
}

async function submitEditBuilding() {
  saving.value = true;
  try {
    await apiUpdateBuilding(editForm._id, {
      name: editForm.name,
      city: editForm.city,
      address: editForm.address,
    });
    toast.add({ severity: "success", summary: "Salvato", detail: "Edificio aggiornato", life: 2200 });
    editVisible.value = false;
    await loadBuildings();
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: e?.response?.data?.message || "Salvataggio fallito", life: 3500 });
  } finally {
    saving.value = false;
  }
}

async function requestAssignment(b) {
  try {
    await createAssignBuildingRequest(b._id || b.id);
    toast.add({ severity: "success", summary: "Inviata", detail: "Richiesta assegnazione inviata", life: 2500 });
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: e?.response?.data?.message || "Impossibile inviare richiesta", life: 3500 });
  }
}

onMounted(loadBuildings);
</script>

<style scoped>
.badge {
  padding: 0.35rem 0.55rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.8rem;
  color: white;
}
</style>
