<template>
  <div class="p-3">
    <Toast />
    <ConfirmDialog />

    <div class="d-flex align-items-center justify-content-between mb-3">
      <div>
        <h4 class="mb-1">Assegnazione edifici agli utenti</h4>
        <div class="text-muted">
          Filtra utenti senza edifici associati e assegna uno o più building (non consentito per utenti pending).
        </div>
      </div>

      <Button
        label="Ricarica"
        icon="pi pi-refresh"
        :loading="loading"
        @click="reload"
      />
    </div>

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
          />

          <span class="fw-semibold ms-2">Status:</span>
          <Dropdown
            v-model="status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-18rem"
          />

          <span class="text-muted">
            Tip: imposta <b>missing=true</b> e <b>status=active</b> per la lista “operativa”.
          </span>
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
    >
      <Column field="name" header="Nome" />
      <Column field="surname" header="Cognome" />
      <Column field="email" header="Email" />

      <Column header="Status" style="width: 130px;">
        <template #body="{ data }">
          <Tag :value="data.status" :severity="statusSeverity(data.status)" />
        </template>
      </Column>

      <Column header="Building attuali" style="min-width: 260px;">
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

      <Column header="Nuova assegnazione" style="min-width: 340px;">
        <template #body="{ data }">
          <div class="d-flex gap-2 align-items-center flex-wrap">
            <Dropdown
              v-model="buildingDraft[data._id]"
              :options="buildingOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleziona building"
              class="w-18rem"
              :disabled="data.status === 'pending'"
            />

            <Button
              label="Aggiungi"
              icon="pi pi-plus"
              severity="secondary"
              :disabled="data.status === 'pending' || !buildingDraft[data._id]"
              :loading="rowBusy[data._id] === true"
              @click="addBuilding(data)"
            />

            <Button
              label="Sovrascrivi"
              icon="pi pi-refresh"
              severity="warning"
              :disabled="data.status === 'pending' || !buildingDraft[data._id]"
              :loading="rowBusy[data._id] === true"
              @click="overwriteBuildings(data)"
            />
          </div>

          <div v-if="data.status === 'pending'" class="text-muted small mt-1">
            Non puoi assegnare building a utenti pending: prima devono essere approvati (status=active).
          </div>
        </template>
      </Column>

      <Column header="Rimuovi" style="width: 220px;">
        <template #body="{ data }">
          <Button
            label="Svuota edifici"
            icon="pi pi-trash"
            severity="danger"
            :disabled="data.status === 'pending' || (data.buildingIds || []).length === 0"
            :loading="rowBusy[data._id] === true"
            @click="clearBuildings(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";

import {
  fetchUsersBuildings,
  fetchAllBuildings,
  updateUserBuildings,
} from "@/services/userAdmin.service";

const toast = useToast();
const confirm = useConfirm();

const loading = ref(false);
const globalFilter = ref("");

const users = ref([]);
const buildings = ref([]);

const buildingDraft = reactive({});
const rowBusy = reactive({});

const missing = ref(true);
const missingOptions = [
  { label: "Solo utenti senza building (missing=true)", value: true },
  { label: "Tutti gli utenti (missing=false)", value: false },
];

const status = ref("active");
const statusOptions = [
  { label: "Tutti", value: null },
  { label: "Active", value: "active" },
  { label: "Disabled", value: "disabled" },
  { label: "Pending", value: "pending" },
];

function statusSeverity(st) {
  if (st === "active") return "success";
  if (st === "disabled") return "danger";
  if (st === "pending") return "warning";
  return "info";
}

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

const usersFiltered = computed(() => {
  const q = normalize(globalFilter.value);
  if (!q) return users.value;
  return users.value.filter((u) => {
    const hay = `${u.name} ${u.surname} ${u.email}`.toLowerCase();
    return hay.includes(q);
  });
});

const buildingOptions = computed(() =>
  buildings.value.map((b) => ({
    label: b.name || b.buildingName || b.title || b._id,
    value: b._id,
  }))
);

function buildingNameById(id) {
  const s = String(id);
  const found = buildings.value.find((b) => String(b._id) === s);
  return found?.name || found?.buildingName || found?.title || s;
}

function setRowBusy(id, v) {
  rowBusy[id] = v;
}

async function reload() {
  loading.value = true;
  try {
    const [bRes, uRes] = await Promise.all([
      fetchAllBuildings(),
      fetchUsersBuildings({
        missing: missing.value ? "true" : "false",
        ...(status.value ? { status: status.value } : {}),
      }),
    ]);

    buildings.value = Array.isArray(bRes.data) ? bRes.data : [];
    users.value = Array.isArray(uRes.data) ? uRes.data : [];

    for (const u of users.value) {
      if (!(u._id in buildingDraft)) buildingDraft[u._id] = "";
    }
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

onMounted(reload);

// ✅ ricarica automatico quando cambiano filtri
watch([missing, status], async () => {
  await reload();
});

async function addBuilding(user) {
  const bid = buildingDraft[user._id];
  if (!bid) return;

  const current = Array.isArray(user.buildingIds) ? user.buildingIds.map(String) : [];
  const next = Array.from(new Set([...current, String(bid)]));

  confirm.require({
    message: `Aggiungere building a ${user.email}?`,
    header: "Conferma",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Conferma",
    rejectLabel: "Annulla",
    accept: async () => {
      await saveBuildings(user, next);
    },
  });
}

async function overwriteBuildings(user) {
  const bid = buildingDraft[user._id];
  if (!bid) return;

  confirm.require({
    message: `Sovrascrivere i building di ${user.email} con: ${buildingNameById(bid)}?`,
    header: "Conferma",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Conferma",
    rejectLabel: "Annulla",
    accept: async () => {
      await saveBuildings(user, [String(bid)]);
    },
  });
}

async function clearBuildings(user) {
  confirm.require({
    message: `Svuotare tutti i building associati a ${user.email}?`,
    header: "Conferma",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Svuota",
    rejectLabel: "Annulla",
    accept: async () => {
      await saveBuildings(user, []);
    },
  });
}

async function saveBuildings(user, buildingIds) {
  setRowBusy(user._id, true);
  try {
    await updateUserBuildings(user._id, buildingIds);

    toast.add({
      severity: "success",
      summary: "Ok",
      detail: "Edifici aggiornati",
      life: 2500,
    });

    await reload();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: err?.response?.data?.message || "Errore aggiornamento edifici",
      life: 3500,
    });
  } finally {
    setRowBusy(user._id, false);
  }
}
</script>
