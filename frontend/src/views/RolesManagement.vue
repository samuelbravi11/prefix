<template>
  <div class="card shadow-sm border-0">
    <div class="card-body p-3">
      <Toast />
      <ConfirmDialog />

      <div class="d-flex align-items-start justify-content-between mb-3 gap-3">
        <div>
          <h4 class="mb-1">Gestione Ruoli</h4>
          <div class="text-muted small">
            La creazione di un ruolo include automaticamente i permessi base di <code>user_base</code>.
          </div>
        </div>

        <div class="d-flex gap-2 align-items-center">
          <Button
            label="Ricarica"
            icon="pi pi-refresh"
            :loading="loading"
            size="small"
            class="p-button-text"
            @click="reloadAll"
          />
          <Button
            v-if="canManage"
            label="Crea ruolo"
            icon="pi pi-plus"
            size="small"
            @click="openCreate"
          />
        </div>
      </div>

      <NoPermissions v-if="!canManage" hint="Questa sezione richiede il permesso: roles:manage" />

      <template v-else>
        <Toolbar class="mb-3">
          <template #start>
            <div class="d-flex gap-2 align-items-center flex-wrap">
              <span class="fw-semibold small">Filtro:</span>
              <InputText v-model="globalFilter" placeholder="Cerca ruolo..." class="w-16rem p-inputtext-sm" />
            </div>
          </template>
          <template #end>
            <Tag :value="`${rolesFiltered.length} ruoli`" severity="info" />
          </template>
        </Toolbar>

        <DataTable
          :value="rolesFiltered"
          :loading="loading"
          dataKey="_id"
          responsiveLayout="scroll"
          class="p-datatable-sm"
          paginator
          :rows="10"
          emptyMessage="Nessun ruolo trovato."
        >
          <Column field="roleName" header="Nome ruolo" sortable />

          <Column header="Permessi" style="min-width: 420px;">
            <template #body="{ data }">
              <div class="d-flex flex-wrap gap-1 align-items-center">
                <template v-if="(rolePermissionNames(data).length || 0) > 0">
                  <!-- Mostro fino a maxTags; poi “+N” -->
                  <Tag
                    v-for="p in rolePermissionNames(data).slice(0, maxTags)"
                    :key="`${data._id}-${p}`"
                    :value="p"
                    severity="secondary"
                  />
                  <Tag
                    v-if="rolePermissionNames(data).length > maxTags"
                    :value="`+${rolePermissionNames(data).length - maxTags}`"
                    severity="info"
                  />
                </template>
                <span v-else class="text-muted small">—</span>
              </div>

              <div class="small text-muted mt-1">
                {{ rolePermissionNames(data).length }} permessi
                <span v-if="isSystemRole(data)" class="ms-2">(ruolo di sistema)</span>
              </div>
            </template>
          </Column>

          <Column header="Azioni" style="width: 220px;">
            <template #body="{ data }">
              <div class="d-flex justify-content-end gap-2">
                <Button
                  label="Dettagli"
                  icon="pi pi-eye"
                  class="p-button-text p-button-sm"
                  @click="openDetails(data)"
                />
                <Button
                  label="Elimina"
                  icon="pi pi-trash"
                  class="p-button-text p-button-danger p-button-sm"
                  :disabled="isSystemRole(data) || deleting[data._id] === true"
                  :loading="deleting[data._id] === true"
                  @click="confirmDelete(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>

      <!-- DETAILS dialog -->
      <Dialog v-model:visible="details.visible" header="Dettagli ruolo" modal :style="{ width: '760px', maxWidth: '96vw' }">
        <div v-if="details.role">
          <div class="fw-semibold mb-2">{{ details.role.roleName }}</div>

          <div class="text-muted small mb-2">
            Permessi base di <code>user_base</code> sono inclusi automaticamente alla creazione.
          </div>

          <div class="d-flex flex-wrap gap-2">
            <Tag
              v-for="p in rolePermissionNames(details.role)"
              :key="`${details.role._id}-d-${p}`"
              :value="p"
              severity="info"
            />
          </div>
        </div>

        <template #footer>
          <Button label="Chiudi" class="p-button-text" icon="pi pi-times" @click="details.visible = false" />
        </template>
      </Dialog>

      <!-- Create dialog -->
      <Dialog v-model:visible="dlg.visible" header="Crea ruolo" modal :style="{ width: '720px', maxWidth: '96vw' }">
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label">Nome ruolo *</label>
            <InputText v-model="form.roleName" class="w-100" placeholder="Es. admin_locale" />
            <div v-if="errors.roleName" class="small text-danger mt-1">{{ errors.roleName }}</div>
          </div>

          <div class="col-12">
            <div class="d-flex align-items-start gap-2 p-2 border rounded">
              <Checkbox v-model="form.inheritAllBuildings" binary />
              <div>
                <div class="fw-semibold">Eredita tutti gli edifici (permesso speciale)</div>
                <div class="small text-muted">
                  Se attivo, l’utente con questo ruolo è automaticamente associato a tutti gli edifici (use-case 3.2).
                </div>
              </div>
            </div>
          </div>

          <div class="col-12">
            <label class="form-label">Permessi extra (oltre a user_base)</label>
            <MultiSelect
              v-model="form.extraPermissions"
              :options="extraPermissionsOptions"
              optionLabel="label"
              optionValue="value"
              display="chip"
              filter
              class="w-100"
              placeholder="Seleziona permessi..."
            />
            <div class="small text-muted mt-2">
              I permessi base <code>user_base</code> non sono mostrati perché vengono aggiunti automaticamente.
            </div>
          </div>
        </div>

        <template #footer>
          <Button label="Annulla" class="p-button-text" :disabled="dlg.saving" @click="close" />
          <Button label="Crea" icon="pi pi-check" size="small" :loading="dlg.saving" @click="createRole" />
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import api from "@/services/api";
import { usePermissions } from "@/composables/usePermissions";
import NoPermissions from "@/components/NoPermissions.vue";

import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";
import Toolbar from "primevue/toolbar";
import Tag from "primevue/tag";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Dialog from "primevue/dialog";
import Checkbox from "primevue/checkbox";
import MultiSelect from "primevue/multiselect";

const toast = useToast();
const confirm = useConfirm();
const { hasPermission } = usePermissions();

const canManage = computed(() => hasPermission("roles:manage"));

const loading = ref(false);
const roles = ref([]);

const allPermissions = ref([]);
const basePermissions = ref([]); // dal backend (se esposto), altrimenti vuoto

const globalFilter = ref("");
const maxTags = 8;

const dlg = reactive({ visible: false, saving: false });
const details = reactive({ visible: false, role: null });

// Delete per-riga
const deleting = reactive({});

const form = reactive({
  roleName: "",
  inheritAllBuildings: false,
  extraPermissions: [],
});

const errors = reactive({ roleName: "" });

function isSystemRole(r) {
  const name = String(r?.roleName || "").toLowerCase();
  return name === "user_base" || name === "admin";
}

function validate() {
  errors.roleName = "";
  const n = String(form.roleName || "").trim();
  if (n.length < 2) {
    errors.roleName = "Nome ruolo obbligatorio (min 2 caratteri)";
    return false;
  }
  return true;
}

function rolePermissionNames(role) {
  // Normalizza i possibili shape che arrivano dal backend
  // - role.permissionNames: string[]
  // - role.permissions: string[]
  // - role.permission: [{name}] oppure string[]
  const a = [];

  const pn = role?.permissionNames;
  if (Array.isArray(pn)) a.push(...pn);

  const perms = role?.permissions;
  if (Array.isArray(perms)) a.push(...perms);

  const perm = role?.permission;
  if (Array.isArray(perm)) {
    for (const p of perm) {
      if (typeof p === "string") a.push(p);
      else if (p?.name) a.push(p.name);
    }
  }

  return Array.from(new Set(a.filter(Boolean).map((s) => String(s)))).sort((x, y) => x.localeCompare(y));
}

const rolesFiltered = computed(() => {
  const q = String(globalFilter.value || "").trim().toLowerCase();
  if (!q) return roles.value || [];
  return (roles.value || []).filter((r) => String(r.roleName || "").toLowerCase().includes(q));
});

const extraPermissionsOptions = computed(() => {
  // Escludo basePermissions e il permesso speciale (gestito da checkbox)
  const excluded = new Set([...(basePermissions.value || []), "buildings:inherit_all"]);

  return (allPermissions.value || [])
    .filter((p) => !excluded.has(p))
    .map((p) => ({ label: p, value: p }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

async function fetchPermissions() {
  const res = await api.get("/permissions");

  const payload = res.data;

  // 1) Se backend torna direttamente string[]
  if (Array.isArray(payload)) {
    allPermissions.value = payload.map(String);
    basePermissions.value = [];
    return;
  }

  // 2) Se backend torna oggetto
  allPermissions.value = Array.isArray(payload?.allPermissions) ? payload.allPermissions.map(String) : [];
  basePermissions.value = Array.isArray(payload?.basePermissions) ? payload.basePermissions.map(String) : [];
}

async function fetchRoles() {
  const res = await api.get("/roles");
  roles.value = Array.isArray(res.data) ? res.data : [];
}

async function reloadAll() {
  loading.value = true;
  try {
    await fetchPermissions();
    await fetchRoles();
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: e?.response?.data?.message || "Impossibile caricare ruoli/permessi",
      life: 3500,
    });
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.roleName = "";
  form.inheritAllBuildings = false;
  form.extraPermissions = [];
  errors.roleName = "";
  dlg.visible = true;
}

function close() {
  dlg.visible = false;
  dlg.saving = false;
}

function openDetails(role) {
  details.role = role;
  details.visible = true;
}

function setDeleting(id, v) {
  deleting[id] = v;
}

async function createRole() {
  if (!validate()) return;

  dlg.saving = true;
  try {
    const extras = [...(form.extraPermissions || [])];
    if (form.inheritAllBuildings) extras.push("buildings:inherit_all");

    // Mantengo esattamente il tuo payload attuale:
    // { roleName, extraPermissions }
    await api.post("/roles", {
      roleName: String(form.roleName).trim(),
      extraPermissions: extras,
    });

    toast.add({ severity: "success", summary: "Ok", detail: "Ruolo creato", life: 2500 });
    close();
    await fetchRoles();
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: e?.response?.data?.message || "Creazione ruolo fallita",
      life: 3500,
    });
  } finally {
    dlg.saving = false;
  }
}

function confirmDelete(role) {
  confirm.require({
    message: `Vuoi eliminare il ruolo "${role.roleName}"?`,
    header: "Conferma",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Elimina",
    rejectLabel: "Annulla",
    accept: async () => {
      setDeleting(role._id, true);
      try {
        await api.delete(`/roles/${role._id}`);
        toast.add({ severity: "success", summary: "Ok", detail: "Ruolo eliminato", life: 2500 });
        await fetchRoles();
      } catch (e) {
        toast.add({
          severity: "error",
          summary: "Errore",
          detail: e?.response?.data?.message || "Eliminazione fallita",
          life: 3500,
        });
      } finally {
        setDeleting(role._id, false);
      }
    },
  });
}

onMounted(async () => {
  if (!canManage.value) return;
  await reloadAll();
});
</script>
