<template>
  <div class="card shadow-sm border-0">
    <div class="card-body p-3">
      <Toast />

      <div class="d-flex align-items-start justify-content-between mb-3 gap-3">
        <div>
          <h4 class="mb-1">Informazioni utenti</h4>
          <div class="text-muted small">
            Cerca un utente e visualizza i dettagli in basso (selezione multipla supportata).
          </div>
        </div>

        <Button
          label="Ricarica"
          icon="pi pi-refresh"
          class="p-button-text"
          size="small"
          :loading="loading"
          @click="reload"
        />
      </div>

      <div class="mb-3">
        <div class="fw-semibold mb-1">Ricerca</div>
        <InputText
          v-model="q"
          placeholder="Cerca per nome, cognome o email..."
          class="w-100"
          @input="onQueryChange"
        />
      </div>

      <div class="d-flex justify-content-end gap-2 mb-2">
        <Button
          label="Mostra risultati"
          icon="pi pi-list"
          size="small"
          :disabled="selectedIds.length === 0"
          @click="showSelected"
        />
        <Button
          label="Svuota selezione"
          icon="pi pi-times"
          class="p-button-text"
          size="small"
          :disabled="selectedIds.length === 0"
          @click="clearSelection"
        />
      </div>

      <DataTable
        :value="users"
        :loading="loading"
        dataKey="_id"
        responsiveLayout="scroll"
        class="p-datatable-sm"
        paginator
        :rows="8"
        emptyMessage="Nessun utente trovato."
      >
        <Column selectionMode="multiple" headerStyle="width: 3rem" />

        <Column field="name" header="Nome" />
        <Column field="surname" header="Cognome" />
        <Column field="email" header="Email" />

        <Column header="Status" style="width: 160px;">
          <template #body="{ data }">
            <Tag :value="data.status" :severity="statusSeverity(data.status)" />
          </template>
        </Column>

        <Column header="Ruolo" style="width: 220px;">
          <template #body="{ data }">
            <span class="fw-semibold">{{ displayRoleLabel(data) }}</span>
          </template>
        </Column>
      </DataTable>

      <div class="mt-4">
        <h6 class="mb-2">Dettagli utenti selezionati</h6>

        <div v-if="selectedDetails.length === 0" class="text-muted small">
          Seleziona uno o più utenti e clicca “Mostra risultati”.
        </div>

        <div v-else class="d-flex flex-column gap-2">
          <div v-for="u in selectedDetails" :key="u._id" class="p-3 border rounded bg-light">
            <div class="fw-semibold">{{ u.name }} {{ u.surname }}</div>
            <div class="text-muted">{{ u.email }}</div>

            <div class="small mt-2">
              <div>Status: <span class="fw-semibold">{{ u.status }}</span></div>
              <div>Ruolo: <span class="fw-semibold">{{ displayRoleLabel(u) }}</span></div>
              <div>Creato: <span class="fw-semibold">{{ formatDate(u.createdAt) }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useToast } from "primevue/usetoast";
import Toast from "primevue/toast";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";

import api from "@/services/api";

const toast = useToast();

const loading = ref(false);
const q = ref("");
const users = ref([]);

const selected = ref([]);
const selectedDetails = ref([]);

const selectedIds = computed(() => (selected.value || []).map((u) => u._id).filter(Boolean));

function isBootstrap(u) {
  return u?.isBootstrapAdmin === true;
}

function normalizeRoleNameFromUser(u) {
  if (isBootstrap(u)) return "admin";
  const arr = Array.isArray(u?.roles) ? u.roles : [];
  const first = arr[0]?.roleName || arr[0];
  if (first) return String(first);
  return "user_base";
}

function displayRoleLabel(u) {
  const r = normalizeRoleNameFromUser(u);
  if (r === "admin" && isBootstrap(u)) return "admin (bootstrap)";
  return r;
}

function statusSeverity(s) {
  if (s === "active") return "success";
  if (s === "disabled") return "warning";
  if (s === "pending") return "info";
  return "secondary";
}

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString();
}

let debounceTimer = null;
function onQueryChange() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => reload(), 250);
}

async function reload() {
  loading.value = true;
  try {
    // backend supporta /api/v1/users/search?q=...
    // se q è vuota, il backend ritorna comunque una lista (gestita lato backend)
    const res = await api.get("/users/search", { params: { q: q.value || "" } });
    users.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: e?.response?.data?.message || "Impossibile caricare utenti",
      life: 3500,
    });
  } finally {
    loading.value = false;
  }
}

function showSelected() {
  const ids = new Set(selectedIds.value);
  selectedDetails.value = (users.value || []).filter((u) => ids.has(u._id));
}

function clearSelection() {
  selected.value = [];
  selectedDetails.value = [];
}

onMounted(() => {
  reload();
});
</script>