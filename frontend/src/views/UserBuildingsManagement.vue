<template>
  <NoPermissions v-if="!canEnter" hint="Permessi richiesti: users:building:view / users:building:update e/o requests:manage" />

  <div v-else class="p-3">
    <Toast />
    <ConfirmDialog />

    <div class="d-flex align-items-center justify-content-between mb-3">
      <div>
        <h4 class="mb-1">Assegnazione edifici</h4>
        <div class="text-muted">
          Gestisci richieste di assegnazione e/o assegna manualmente edifici agli utenti.
        </div>
      </div>

      <Button
        label="Ricarica"
        icon="pi pi-refresh"
        :loading="loading"
        size="small"
        class="p-button-text"
        @click="reloadAll"
      />
    </div>

    <TabView>
      <!-- TAB 1: RICHIESTE -->
      <TabPanel header="Richieste assegnazione" v-if="canManageRequests">
        <div class="mb-2 text-muted">
          Qui vedi le richieste inviate dagli utenti per essere assegnati ad un edificio.
        </div>

        <DataTable
          :value="requestsSorted"
          dataKey="_id"
          paginator
          :rows="10"
          :loading="loading"
          class="p-datatable-sm"
          responsiveLayout="scroll"
          emptyMessage="Nessuna richiesta trovata."
        >
          <Column header="Data" style="width: 170px;">
            <template #body="{ data }">{{ formatDateTime(data.createdAt) }}</template>
          </Column>

          <Column header="Utente">
            <template #body="{ data }">
              <div class="fw-semibold">{{ data.userName || "-" }}</div>
              <div class="small text-muted">{{ data.userEmail || "-" }}</div>
            </template>
          </Column>

          <Column header="Edificio">
            <template #body="{ data }">
              <span class="fw-semibold">{{ buildingNameById(data.buildingId) }}</span>
            </template>
          </Column>

          <Column header="Stato" style="width: 140px;">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="statusSeverity(data.status)" />
            </template>
          </Column>

          <Column header="Azioni" style="width: 220px;">
            <template #body="{ data }">
              <div class="d-flex gap-2">
                <Button
                  label="Accetta"
                  icon="pi pi-check"
                  severity="success"
                  size="small"
                  :loading="rowBusy[data._id] === true"
                  :disabled="data.status !== 'PENDING'"
                  @click="confirmAccept(data)"
                />
                <Button
                  label="Rifiuta"
                  icon="pi pi-times"
                  severity="danger"
                  size="small"
                  :loading="rowBusy[data._id] === true"
                  :disabled="data.status !== 'PENDING'"
                  @click="confirmReject(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <div class="text-muted mt-2 small">
          Nota: le richieste vengono aggiornate e l’utente riceve una notifica (lato backend).
        </div>
      </TabPanel>

      <!-- TAB 2: ASSEGNAZIONE MANUALE -->
      <TabPanel header="Assegnazione manuale" v-if="canManualAssign">
        <Toolbar class="mb-3">
          <template #start>
            <div class="d-flex gap-2 align-items-center flex-wrap">
              <span class="fw-semibold">Mostra:</span>
              <Dropdown
                v-model="missing"
                :options="missingOptions"
                optionLabel="label"
                optionValue="value"
                class="w-18rem"
                @change="reloadUsers"
              />
              <span class="text-muted">Filtra la lista per utenti senza edificio.</span>
            </div>
          </template>

          <template #end>
            <div class="d-flex gap-2 align-items-center">
              <span class="fw-semibold">Filtro:</span>
              <InputText v-model="globalFilter" placeholder="Cerca per nome/email..." class="w-20rem" />
            </div>
          </template>
        </Toolbar>

        <DataTable
          :value="usersFiltered"
          dataKey="_id"
          paginator
          :rows="10"
          :loading="loading"
          class="p-datatable-sm"
          responsiveLayout="scroll"
          emptyMessage="Nessun utente trovato."
          @row-click="openAssignDialog"
        >
          <Column field="name" header="Nome" />
          <Column field="surname" header="Cognome" />
          <Column field="email" header="Email" />

          <Column header="Status" style="width: 130px;">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="statusSeverity(data.status)" />
            </template>
          </Column>

          <Column header="Edifici attuali" style="min-width: 260px;">
            <template #body="{ data }">
              <div v-if="(data.buildingIds || []).length === 0" class="text-muted">—</div>
              <div v-else class="d-flex flex-wrap gap-1">
                <Tag
                  v-for="bid in data.buildingIds"
                  :key="String(bid)"
                  :value="buildingNameById(bid)"
                  severity="info"
                />
              </div>
            </template>
          </Column>

          <Column header="Suggerimento" style="width: 220px;">
            <template #body>
              <span class="text-muted small">Clicca la riga per assegnare</span>
            </template>
          </Column>
        </DataTable>

        <div class="text-muted mt-2">
          Nota: vengono mostrati solo gli utenti <b>active</b>, poichè quelli in stato <b>pending</b> o <b>disabled</b> devono prima essere accettati/riattivati.
        </div>

        <!-- Dialog assegnazione -->
        <Dialog v-model:visible="assignDialog.visible" header="Assegna edifici all’utente" modal :style="{ width: '760px' }">
          <div v-if="assignDialog.user" class="mb-3">
            <div class="fw-semibold">{{ assignDialog.user.name }} {{ assignDialog.user.surname }}</div>
            <div class="text-muted small">{{ assignDialog.user.email }}</div>
          </div>

          <div class="mb-2 text-muted small">
            Seleziona uno o più edifici da assegnare, poi conferma.
          </div>

          <MultiSelect
            v-model="assignDialog.selectedBuildingIds"
            :options="buildingOptions"
            optionLabel="label"
            optionValue="value"
            display="chip"
            filter
            class="w-100"
            placeholder="Seleziona edifici..."
          />

          <template #footer>
            <Button label="Annulla" class="p-button-text" :disabled="assignDialog.saving" @click="closeAssignDialog" />
            <Button
              label="Conferma"
              icon="pi pi-check"
              size="small"
              :loading="assignDialog.saving"
              @click="confirmAssignBuildings"
            />
          </template>
        </Dialog>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import NoPermissions from "@/components/NoPermissions.vue";
import { usePermissions } from "@/composables/usePermissions";

import { fetchUsersBuildings, updateUserBuildings } from "@/services/userAdmin.service";
import { fetchAllBuildings as fetchAllBuildingsAll } from "@/services/buildings.service";
import { fetchRequests, updateRequestStatus } from "@/services/requests.service";

const toast = useToast();
const confirm = useConfirm();
const { hasAny, hasPermission } = usePermissions();

const canEnter = computed(() =>
  hasAny(["users:building:view", "users:building:update", "requests:manage"])
);
const canManageRequests = computed(() => hasPermission("requests:manage"));
const canManualAssign = computed(() => hasPermission("users:building:update"));

const loading = ref(false);
const globalFilter = ref("");

const users = ref([]);
const buildings = ref([]);
const requests = ref([]);

const rowBusy = reactive({});

const missing = ref(true);
const missingOptions = [
  { label: "Solo utenti senza edificio", value: true },
  { label: "Tutti gli utenti", value: false },
];

const buildingOptions = computed(() =>
  (buildings.value || [])
    .map((b) => ({ label: b.name || b._id, value: String(b._id) }))
    .sort((a, b) => a.label.localeCompare(b.label))
);

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

function statusSeverity(st) {
  if (st === "active") return "success";
  if (st === "disabled") return "danger";
  if (st === "pending") return "warning";
  if (st === "PENDING") return "warning";
  if (st === "APPROVED") return "success";
  if (st === "REJECTED") return "danger";
  return "info";
}

function buildingNameById(id) {
  const s = String(id);
  const found = (buildings.value || []).find((b) => String(b._id) === s);
  return found?.name || s;
}

function setRowBusy(id, v) {
  rowBusy[id] = v;
}

function formatDateTime(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString("it-IT");
  } catch {
    return "-";
  }
}

const usersFiltered = computed(() => {
  const activeUsers = (users.value || []).filter((u) => u.status === "active");
  const q = normalize(globalFilter.value);
  if (!q) return activeUsers;
  return activeUsers.filter((u) => normalize(`${u.name} ${u.surname} ${u.email}`).includes(q));
});

const requestsSorted = computed(() => {
  return (requests.value || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

const assignDialog = reactive({
  visible: false,
  saving: false,
  user: null,
  selectedBuildingIds: [],
});

function openAssignDialog(evt) {
  if (!canManualAssign.value) return;
  const user = evt?.data;
  if (!user) return;

  assignDialog.user = user;
  assignDialog.selectedBuildingIds = Array.isArray(user.buildingIds) ? user.buildingIds.map(String) : [];
  assignDialog.visible = true;
}

function closeAssignDialog() {
  assignDialog.visible = false;
  assignDialog.saving = false;
  assignDialog.user = null;
  assignDialog.selectedBuildingIds = [];
}

async function confirmAssignBuildings() {
  if (!assignDialog.user) return;

  confirm.require({
    message: `Confermare assegnazione edifici per ${assignDialog.user.email}?`,
    header: "Conferma",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Conferma",
    rejectLabel: "Annulla",
    accept: async () => {
      assignDialog.saving = true;
      try {
        await updateUserBuildings(assignDialog.user._id, assignDialog.selectedBuildingIds);
        toast.add({ severity: "success", summary: "Ok", detail: "Edifici assegnati", life: 2500 });
        closeAssignDialog();
        await reloadUsers();
      } catch (err) {
        toast.add({
          severity: "error",
          summary: "Errore",
          detail: err?.response?.data?.message || "Operazione fallita",
          life: 3500,
        });
      } finally {
        assignDialog.saving = false;
      }
    },
  });
}

/** RICHIESTE */
async function reloadRequests() {
  if (!canManageRequests.value) return;

  try {
    const res = await fetchRequests({ type: "ASSIGN_BUILDING", status: "PENDING" });
    requests.value = Array.isArray(res.data) ? res.data : [];
  } catch {
    try {
      const res2 = await fetchRequests();
      requests.value = Array.isArray(res2.data) ? res2.data : [];
    } catch (e2) {
      console.error("Errore caricamento richieste:", e2);
      requests.value = [];
    }
  }
}

function confirmAccept(req) {
  confirm.require({
    message: `Accettare la richiesta per ${req.userEmail || "utente"} su "${buildingNameById(req.buildingId)}"?`,
    header: "Conferma",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Accetta",
    rejectLabel: "Annulla",
    accept: async () => {
      setRowBusy(req._id, true);
      try {
        await updateRequestStatus(req._id, "APPROVED");
        toast.add({ severity: "success", summary: "Ok", detail: "Richiesta accettata", life: 2500 });
        await reloadAll();
      } catch (err) {
        toast.add({
          severity: "error",
          summary: "Errore",
          detail: err?.response?.data?.message || "Operazione fallita",
          life: 3500,
        });
      } finally {
        setRowBusy(req._id, false);
      }
    },
  });
}

function confirmReject(req) {
  confirm.require({
    message: `Rifiutare la richiesta per ${req.userEmail || "utente"} su "${buildingNameById(req.buildingId)}"?`,
    header: "Conferma",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Rifiuta",
    rejectLabel: "Annulla",
    accept: async () => {
      setRowBusy(req._id, true);
      try {
        await updateRequestStatus(req._id, "REJECTED");
        toast.add({ severity: "success", summary: "Ok", detail: "Richiesta rifiutata", life: 2500 });
        await reloadAll();
      } catch (err) {
        toast.add({
          severity: "error",
          summary: "Errore",
          detail: err?.response?.data?.message || "Operazione fallita",
          life: 3500,
        });
      } finally {
        setRowBusy(req._id, false);
      }
    },
  });
}

/** UTENTI */
async function reloadUsers() {
  const uRes = await fetchUsersBuildings({
    missing: missing.value ? "true" : "false",
    status: "active",
  });
  users.value = Array.isArray(uRes.data) ? uRes.data : [];
}

async function reloadBuildings() {
  const bRes = await fetchAllBuildingsAll();
  buildings.value = Array.isArray(bRes.data) ? bRes.data : [];
}

/** ENTRYPOINT */
async function reloadAll() {
  loading.value = true;
  try {
    await Promise.all([reloadBuildings(), reloadUsers(), reloadRequests()]);
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: err?.response?.data?.message || "Errore nel caricamento dati",
      life: 3500,
    });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  reloadAll();
});
</script>
