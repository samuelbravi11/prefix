<template>
  <div class="p-3">
    <Toast />
    <ConfirmDialog />

    <div class="d-flex align-items-center justify-content-between mb-3">
      <div>
        <h4 class="mb-1">Gestione utenti</h4>
        <div class="text-muted">Approva i pending e gestisci ruolo/stato degli utenti attivi o disabilitati.</div>
      </div>

      <Button
        label="Ricarica"
        icon="pi pi-refresh"
        :loading="loading"
        @click="reloadAll"
      />
    </div>

    <Toolbar class="mb-3">
      <template #start>
        <div class="d-flex gap-2 align-items-center flex-wrap">
          <span class="fw-semibold">Modalità:</span>
          <Dropdown
            v-model="mode"
            :options="modes"
            optionLabel="label"
            optionValue="value"
            class="w-18rem"
          />
          <span class="text-muted">Seleziona se lavorare sui pending o sugli utenti attivi/disabilitati.</span>
        </div>
      </template>

      <template #end>
        <div class="d-flex gap-2 align-items-center">
          <span class="fw-semibold">Filtro:</span>
          <InputText v-model="globalFilter" placeholder="Cerca per nome/email..." class="w-20rem" />
        </div>
      </template>
    </Toolbar>

    <!-- =========================
         PENDING USERS
    ========================== -->
    <div v-if="mode === 'pending'">
      <div class="mb-2 d-flex align-items-center justify-content-between">
        <div class="fw-semibold">Utenti pending</div>
        <Tag :value="`${pendingUsers.length} utenti`" severity="info" />
      </div>

      <DataTable
        :value="pendingUsersFiltered"
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
        <Column header="Status">
          <template #body="{ data }">
            <Tag value="pending" severity="warning" />
          </template>
        </Column>

        <Column header="Ruolo attuale">
          <template #body="{ data }">
            <span class="text-muted">{{ getRoleName(data) || "-" }}</span>
          </template>
        </Column>

        <Column header="Azione" style="width: 420px;">
          <template #body="{ data }">
            <div class="d-flex gap-2 align-items-center flex-wrap">
              <Dropdown
                v-model="approveRoleDraft[data._id]"
                :options="roleOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleziona ruolo (default user_base)"
                class="w-18rem"
              />
              <Button
                label="Approva"
                icon="pi pi-check"
                severity="success"
                :loading="rowBusy[data._id] === true"
                @click="confirmApprove(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- =========================
         ACTIVE / DISABLED USERS
    ========================== -->
    <div v-else>
      <div class="mb-2 d-flex align-items-center justify-content-between">
        <div class="fw-semibold">Utenti attivi o disabilitati</div>
        <Tag :value="`${managedUsers.length} utenti`" severity="info" />
      </div>

      <DataTable
        :value="managedUsersFiltered"
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
            <Tag
              :value="data.status"
              :severity="statusSeverity(data.status)"
            />
          </template>
        </Column>

        <Column header="Ruolo" style="width: 220px;">
          <template #body="{ data }">
            <Dropdown
              v-model="roleDraft[data._id]"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              class="w-14rem"
              placeholder="Ruolo"
            />
          </template>
        </Column>

        <Column header="Azioni" style="width: 420px;">
          <template #body="{ data }">
            <div class="d-flex gap-2 align-items-center flex-wrap">
              <Button
                label="Salva ruolo"
                icon="pi pi-save"
                severity="primary"
                :disabled="!isRoleChanged(data)"
                :loading="rowBusy[data._id] === true"
                @click="confirmSaveRole(data)"
              />

              <Button
                v-if="data.status === 'active'"
                label="Disattiva"
                icon="pi pi-ban"
                severity="warning"
                :loading="rowBusy[data._id] === true"
                @click="confirmToggleStatus(data)"
              />
              <Button
                v-else
                label="Riattiva"
                icon="pi pi-check-circle"
                severity="success"
                :loading="rowBusy[data._id] === true"
                @click="confirmToggleStatus(data)"
              />

              <Button
                label="Salva entrambi"
                icon="pi pi-sync"
                severity="secondary"
                :disabled="!isRoleChanged(data)"
                :loading="rowBusy[data._id] === true"
                @click="confirmSaveBoth(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <div class="text-muted mt-2">
        Nota: “Salva entrambi” invia una sola PATCH (<code>/users/:id/status</code>) con <code>status</code> e <code>roleName</code>.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";

import {
  fetchPendingUsers,
  fetchManagedUsers,
  approveUser,
  updateUserStatusOrRole,
} from "@/services/userAdmin.service";

const toast = useToast();
const confirm = useConfirm();

const loading = ref(false);
const globalFilter = ref("");

const mode = ref("pending");
const modes = [
  { label: "Solo utenti pending", value: "pending" },
  { label: "Solo utenti attivi/disabilitati", value: "managed" },
];

// qui metti i ruoli reali del tuo sistema (o caricali da API roles se vuoi)
const roleOptions = [
  { label: "user_base", value: "user_base" },
  { label: "admin_locale", value: "admin_locale" },
  { label: "admin_centrale", value: "admin_centrale" },
  { label: "impresa", value: "impresa" },
];

const pendingUsers = ref([]);
const managedUsers = ref([]);

// draft per dropdown
const approveRoleDraft = reactive({});
const roleDraft = reactive({});

// busy per riga
const rowBusy = reactive({});

function getRoleName(u) {
  const r = u.roles?.[0];
  return typeof r === "string" ? r : r?.roleName;
}

function statusSeverity(status) {
  if (status === "active") return "success";
  if (status === "disabled") return "danger";
  if (status === "pending") return "warning";
  return "info";
}

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

const pendingUsersFiltered = computed(() => {
  const q = normalize(globalFilter.value);
  if (!q) return pendingUsers.value;
  return pendingUsers.value.filter((u) => {
    const hay = `${u.name} ${u.surname} ${u.email}`.toLowerCase();
    return hay.includes(q);
  });
});

const managedUsersFiltered = computed(() => {
  const q = normalize(globalFilter.value);
  if (!q) return managedUsers.value;
  return managedUsers.value.filter((u) => {
    const hay = `${u.name} ${u.surname} ${u.email}`.toLowerCase();
    return hay.includes(q);
  });
});

async function reloadAll() {
  loading.value = true;
  try {
    const [pRes, mRes] = await Promise.all([
      fetchPendingUsers(),
      fetchManagedUsers(),
    ]);

    pendingUsers.value = Array.isArray(pRes.data) ? pRes.data : [];
    managedUsers.value = Array.isArray(mRes.data) ? mRes.data : [];

    // init draft
    for (const u of pendingUsers.value) {
      if (!(u._id in approveRoleDraft)) approveRoleDraft[u._id] = "";
    }
    for (const u of managedUsers.value) {
      roleDraft[u._id] = getRoleName(u) || "user_base";
    }
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: err?.response?.data?.message || "Errore nel caricamento utenti",
      life: 3500,
    });
  } finally {
    loading.value = false;
  }
}

onMounted(reloadAll);

function setRowBusy(id, v) {
  rowBusy[id] = v;
}

function isRoleChanged(user) {
  return (roleDraft[user._id] || "") !== (getRoleName(user) || "");
}

// -------- Pending: Approve
function confirmApprove(user) {
  const selectedRole = approveRoleDraft[user._id] || "";
  confirm.require({
    message: `Confermi l'approvazione di ${user.email}?${selectedRole ? ` Ruolo: ${selectedRole}` : " (ruolo default user_base)"}`,
    header: "Approva utente",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Approva",
    rejectLabel: "Annulla",
    accept: async () => {
      await doApprove(user);
    },
  });
}

async function doApprove(user) {
  setRowBusy(user._id, true);
  try {
    const roleName = approveRoleDraft[user._id] || undefined;
    await approveUser(user._id, roleName);

    toast.add({
      severity: "success",
      summary: "Ok",
      detail: "Utente approvato",
      life: 2500,
    });

    await reloadAll();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: err?.response?.data?.message || "Errore approvazione",
      life: 3500,
    });
  } finally {
    setRowBusy(user._id, false);
  }
}

// -------- Managed: role only
function confirmSaveRole(user) {
  const newRole = roleDraft[user._id];
  confirm.require({
    message: `Confermi cambio ruolo per ${user.email} → ${newRole}?`,
    header: "Aggiorna ruolo",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Salva",
    rejectLabel: "Annulla",
    accept: async () => {
      await doUpdate(user, { roleName: newRole });
    },
  });
}

// -------- Managed: toggle status only
function confirmToggleStatus(user) {
  const nextStatus = user.status === "active" ? "disabled" : "active";
  confirm.require({
    message: `Confermi cambio status per ${user.email} → ${nextStatus}?`,
    header: "Aggiorna status",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Conferma",
    rejectLabel: "Annulla",
    accept: async () => {
      await doUpdate(user, { status: nextStatus });
    },
  });
}

// -------- Managed: both (single PATCH)
function confirmSaveBoth(user) {
  const nextStatus = user.status === "active" ? "disabled" : "active";
  const newRole = roleDraft[user._id];

  confirm.require({
    message: `Confermi aggiornamento per ${user.email}? Status → ${nextStatus}, Ruolo → ${newRole}`,
    header: "Aggiorna status + ruolo",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Conferma",
    rejectLabel: "Annulla",
    accept: async () => {
      await doUpdate(user, { status: nextStatus, roleName: newRole });
    },
  });
}

async function doUpdate(user, payload) {
  setRowBusy(user._id, true);
  try {
    await updateUserStatusOrRole(user._id, payload);

    toast.add({
      severity: "success",
      summary: "Ok",
      detail: "Utente aggiornato",
      life: 2500,
    });

    await reloadAll();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: err?.response?.data?.message || "Errore aggiornamento utente",
      life: 3500,
    });
  } finally {
    setRowBusy(user._id, false);
  }
}
</script>

<style scoped>
.w-18rem { width: 18rem; }
.w-20rem { width: 20rem; }
</style>
