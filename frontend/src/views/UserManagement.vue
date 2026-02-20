<template>
  <NoPermissions
    v-if="!canEnter"
    hint="Permessi richiesti: users:pending:view/users:active:view e (users:approve, users:update_status, users:update_role)"
  />

  <div v-else class="card shadow-sm border-0">
    <div class="card-body p-3">
      <Toast />
      <ConfirmDialog />

      <div class="d-flex align-items-start justify-content-between mb-3 gap-3">
        <div>
          <h4 class="mb-1">Gestione stato e ruolo</h4>
          <div class="text-muted small">
            Approva i pending e gestisci ruolo/stato degli utenti attivi o disabilitati.
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

      <Toolbar class="mb-3">
        <template #start>
          <div class="d-flex gap-2 align-items-center flex-wrap">
            <span class="fw-semibold small">Modalità:</span>
            <Dropdown
              v-model="mode"
              :options="modes"
              optionLabel="label"
              optionValue="value"
              class="w-14rem p-inputtext-sm"
            />
          </div>
        </template>

        <template #end>
          <div class="d-flex gap-2 align-items-center">
            <span class="fw-semibold small">Filtro:</span>
            <InputText v-model="globalFilter" placeholder="Nome/email..." class="w-16rem p-inputtext-sm" />
          </div>
        </template>
      </Toolbar>

      <!-- PENDING -->
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
          emptyMessage="Nessun utente pending."
        >
          <Column field="name" header="Nome" />
          <Column field="surname" header="Cognome" />
          <Column field="email" header="Email" />
          <Column header="Status" style="width: 120px;">
            <template #body><Tag value="pending" severity="warning" /></template>
          </Column>

          <Column header="Ruolo attuale" style="width: 160px;">
            <template #body="{ data }">
              <span class="text-muted small">{{ getRoleName(data) || "-" }}</span>
            </template>
          </Column>

          <Column header="Azione" style="width: 360px;">
            <template #body="{ data }">
              <div class="d-flex gap-2 align-items-center flex-wrap">
                <Dropdown
                  v-model="approveRoleDraft[data._id]"
                  :options="roleOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Ruolo (default user_base)"
                  class="w-14rem p-inputtext-sm"
                />
                <Button
                  label="Approva"
                  icon="pi pi-check"
                  severity="success"
                  :loading="rowBusy[data._id] === true"
                  :disabled="!canApprovePending"
                  size="small"
                  @click="confirmApprove(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- MANAGED -->
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
          emptyMessage="Nessun utente trovato."
        >
          <Column field="name" header="Nome" />
          <Column field="surname" header="Cognome" />
          <Column field="email" header="Email" />

          <Column header="Status" style="width: 260px;">
            <template #body="{ data }">
              <div>
                <Tag :value="statusDraft[data._id] || data.status" :severity="statusSeverity(statusDraft[data._id] || data.status)" />

                <div class="mt-2">
                  <Dropdown
                    v-if="!isBootstrap(data)"
                    v-model="statusDraft[data._id]"
                    :options="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-14rem p-inputtext-sm"
                    placeholder="Status"
                    :disabled="!canUpdateStatus"
                  />
                </div>

                <div v-if="isBootstrap(data)" class="text-muted small mt-1">
                  Bootstrap admin: status protetto.
                </div>
              </div>
            </template>
          </Column>

          <Column header="Ruolo" style="width: 260px;">
            <template #body="{ data }">
              <template v-if="isBootstrap(data)">
                <div class="fw-semibold">
                  {{ formatRoleLabel(data.roleName, data.isBootstrapAdmin) }}
                </div>
                <div class="text-muted small mt-1">Bootstrap admin: ruolo protetto.</div>
              </template>

              <template v-else>
                <Dropdown
                  v-model="roleDraft[data._id]"
                  :options="roleOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-14rem p-inputtext-sm"
                  placeholder="Ruolo"
                  :disabled="!canUpdateRole"
                />
              </template>
            </template>
          </Column>

          <Column header="Azioni" style="width: 160px;">
            <template #body="{ data }">
              <Button
                label="Salva"
                icon="pi pi-save"
                severity="primary"
                :disabled="isBootstrap(data) || rowBusy[data._id] === true || !isRowDirty(data) || (!canUpdateRole && !canUpdateStatus)"
                :loading="rowBusy[data._id] === true"
                size="small"
                @click="confirmSaveRow(data)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import NoPermissions from "@/components/NoPermissions.vue";
import { usePermissions } from "@/composables/usePermissions";
import api from "@/services/api";

import {
  fetchPendingUsers,
  fetchManagedUsers,
  approveUser,
  updateUserRole,
  updateUserStatus,
} from "@/services/userAdmin.service";

const toast = useToast();
const confirm = useConfirm();
const { hasAny, hasPermission } = usePermissions();

const canEnter = computed(() =>
  hasAny(["users:pending:view", "users:active:view", "users:approve", "users:update_status", "users:update_role"])
);

const canApprovePending = computed(() => hasPermission("users:approve"));
const canUpdateStatus = computed(() => hasPermission("users:update_status"));
const canUpdateRole = computed(() => hasPermission("users:update_role"));

const loading = ref(false);
const globalFilter = ref("");

const mode = ref("pending");
const modes = [
  { label: "Utenti pending", value: "pending" },
  { label: "Utenti attivi/disabilitati", value: "managed" },
];

const pendingUsers = ref([]);
const managedUsers = ref([]);

// ruoli caricati da backend (fallback)
const roleOptions = ref([
  { label: "user_base", value: "user_base" },
  { label: "admin", value: "admin" },
]);

const approveRoleDraft = reactive({});
const roleDraft = reactive({});
const statusDraft = reactive({});
const rowBusy = reactive({});

const statusOptions = [
  { label: "active", value: "active" },
  { label: "disabled", value: "disabled" },
];

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

function getRoleName(u) {
  // backend espone roleName direttamente; fallback per versioni precedenti
  if (u?.roleName) return u.roleName;
  const r = u?.roles?.[0];
  return typeof r === "string" ? r : r?.roleName;
}

function formatRoleLabel(roleName, isBootstrapAdmin) {
  const base = roleName || "user_base";
  return isBootstrapAdmin ? `${base} (bootstrap)` : base;
}

function statusSeverity(status) {
  if (status === "active") return "success";
  if (status === "disabled") return "danger";
  if (status === "pending") return "warning";
  return "info";
}

function isBootstrap(u) {
  return u?.isBootstrapAdmin === true;
}

// UX: bootstrap non deve cambiare stato (né disattiva né riattiva)
function isStatusChangeBlocked(u) {
  return isBootstrap(u);
}

const pendingUsersFiltered = computed(() => {
  const q = normalize(globalFilter.value);
  if (!q) return pendingUsers.value;
  return pendingUsers.value.filter((u) => normalize(`${u.name} ${u.surname} ${u.email}`).includes(q));
});

const managedUsersFiltered = computed(() => {
  const q = normalize(globalFilter.value);
  if (!q) return managedUsers.value;
  return managedUsers.value.filter((u) => normalize(`${u.name} ${u.surname} ${u.email}`).includes(q));
});

function setRowBusy(id, v) {
  rowBusy[id] = v;
}

function isRoleChanged(user) {
  const current = getRoleName(user) || "user_base";
  const draft = roleDraft[user._id] || current;
  return draft !== current;
}

function isStatusChanged(user) {
  const current = user.status;
  const draft = statusDraft[user._id] || current;
  return draft !== current;
}

function isRowDirty(user) {
  return isRoleChanged(user) || isStatusChanged(user);
}

async function loadRoles() {
  try {
    const res = await api.get("/roles");
    const roles = Array.isArray(res.data) ? res.data : [];
    let opts = roles
      .map((r) => ({ label: r.roleName, value: r.roleName }))
      .sort((a, b) => a.label.localeCompare(b.label));

    // garantisci che i due ruoli base esistano sempre in UI
    const required = ["admin", "user_base"];
    for (const rn of required) {
      if (!opts.some((o) => o.value === rn)) opts.unshift({ label: rn, value: rn });
    }
    if (opts.length) roleOptions.value = opts;
  } catch {
    // fallback: lascia roleOptions default
  }
}

async function reloadAll() {
  loading.value = true;
  try {
    await loadRoles();

    const [pRes, mRes] = await Promise.all([fetchPendingUsers(), fetchManagedUsers()]);
    pendingUsers.value = Array.isArray(pRes.data) ? pRes.data : [];
    managedUsers.value = Array.isArray(mRes.data) ? mRes.data : [];

    for (const u of pendingUsers.value) {
      if (!(u._id in approveRoleDraft)) approveRoleDraft[u._id] = "user_base";
    }
    for (const u of managedUsers.value) {
      if (!(u._id in roleDraft)) roleDraft[u._id] = getRoleName(u) || "user_base";
      if (!(u._id in statusDraft)) statusDraft[u._id] = u.status;
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

function confirmSaveRow(user) {
  if (isBootstrap(user)) return;

  const nextRole = roleDraft[user._id] || getRoleName(user) || "user_base";
  const nextStatus = statusDraft[user._id] || user.status;

  const changes = [];
  if (isRoleChanged(user)) changes.push(`ruolo → ${nextRole}`);
  if (isStatusChanged(user)) changes.push(`status → ${nextStatus}`);

  confirm.require({
    message: `Salvare modifiche per ${user.email}? (${changes.join(", ")})`,
    header: "Conferma",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Salva",
    rejectLabel: "Annulla",
    accept: async () => {
      setRowBusy(user._id, true);
      try {
        // salva solo ciò che è cambiato
        if (isRoleChanged(user) && canUpdateRole.value) {
          await updateUserRole(user._id, nextRole);
        }
        if (isStatusChanged(user) && canUpdateStatus.value) {
          await updateUserStatus(user._id, nextStatus);
        }

        toast.add({ severity: "success", summary: "Ok", detail: "Salvato", life: 2200 });
        await reloadAll();
      } catch (err) {
        toast.add({
          severity: "error",
          summary: "Errore",
          detail: err?.response?.data?.message || "Salvataggio fallito",
          life: 3500,
        });
      } finally {
        setRowBusy(user._id, false);
      }
    },
  });
}

function confirmApprove(user) {
  const roleName = approveRoleDraft[user._id] || "user_base";

  confirm.require({
    message: `Approvare l'utente ${user.email} con ruolo "${roleName}"?`,
    header: "Conferma",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Approva",
    rejectLabel: "Annulla",
    accept: async () => {
      setRowBusy(user._id, true);
      try {
        await approveUser(user._id, roleName);
        toast.add({ severity: "success", summary: "Ok", detail: "Utente approvato", life: 2500 });
        await reloadAll();
      } catch (err) {
        toast.add({
          severity: "error",
          summary: "Errore",
          detail: err?.response?.data?.message || "Approva fallita",
          life: 3500,
        });
      } finally {
        setRowBusy(user._id, false);
      }
    },
  });
}

onMounted(reloadAll);
</script>
