<!-- src/views/UsersInfo.vue -->
<template>
  <div class="card shadow-sm border-0">
    <div class="card-body">
      <Toast />

      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h4 class="mb-1">Informazioni utenti</h4>
          <div class="text-muted small">
            Cerca un utente e visualizza i dettagli in basso (selezione multipla supportata).
          </div>
        </div>

        <Button
          label="Ricarica"
          icon="pi pi-refresh"
          size="small"
          class="p-button-text"
          :loading="loading"
          @click="loadUsers"
        />
      </div>

      <div class="row g-3 align-items-end mb-3">
        <div class="col-12 col-lg-6">
          <label class="form-label">Ricerca</label>
          <InputText
            v-model="query"
            class="w-100"
            placeholder="Cerca per nome, cognome o email..."
          />
        </div>

        <div class="col-12 col-lg-6 d-flex justify-content-start justify-content-lg-end gap-2 flex-wrap">
          <Button
            label="Mostra risultati"
            icon="pi pi-list"
            size="small"
            :disabled="selectedUsers.length === 0"
            @click="showSelected = true"
          />
          <Button
            label="Svuota selezione"
            icon="pi pi-times"
            size="small"
            class="p-button-text"
            :disabled="selectedUsers.length === 0"
            @click="clearSelection"
          />
        </div>
      </div>

      <DataTable
        :value="filteredUsers"
        dataKey="_id"
        paginator
        :rows="8"
        :rowsPerPageOptions="[8, 12, 20]"
        selectionMode="multiple"
        v-model:selection="selectedUsers"
        class="p-datatable-sm"
        responsiveLayout="scroll"
        emptyMessage="Nessun utente trovato."
      >
        <Column selectionMode="multiple" headerStyle="width:3rem" />
        <Column field="name" header="Nome" />
        <Column field="surname" header="Cognome" />
        <Column field="email" header="Email" />
        <Column header="Status">
          <template #body="{ data }">
            <span class="badge" :class="statusClass(data.status)">
              {{ data.status }}
            </span>
          </template>
        </Column>
        <Column header="Ruolo">
          <template #body="{ data }">
            {{ data.role?.name || data.role || "—" }}
          </template>
        </Column>
      </DataTable>

      <div v-if="showSelected && selectedUsers.length" class="mt-4">
        <h6 class="fw-semibold mb-2">Dettagli utenti selezionati</h6>

        <div class="row g-3">
          <div class="col-12 col-lg-6" v-for="u in selectedUsers" :key="u._id">
            <div class="card border-0 bg-light">
              <div class="card-body">
                <div class="fw-semibold">{{ u.name }} {{ u.surname }}</div>
                <div class="text-muted small">{{ u.email }}</div>

                <div class="mt-2 small">
                  <div><span class="text-muted">Status:</span> {{ u.status }}</div>
                  <div><span class="text-muted">Ruolo:</span> {{ u.role?.name || u.role || "—" }}</div>
                  <div v-if="u.createdAt"><span class="text-muted">Creato:</span> {{ formatDate(u.createdAt) }}</div>
                  <div v-if="u.lastLoginAt"><span class="text-muted">Ultimo login:</span> {{ formatDate(u.lastLoginAt) }}</div>
                </div>
              </div>
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

import api from "@/services/api";

const toast = useToast();

const loading = ref(false);
const users = ref([]);
const query = ref("");

const selectedUsers = ref([]);
const showSelected = ref(false);

function statusClass(s) {
  if (s === "active") return "bg-success";
  if (s === "disabled") return "bg-danger";
  if (s === "pending") return "bg-warning text-dark";
  return "bg-secondary";
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

async function loadUsers() {
  loading.value = true;
  try {
    const res = await api.get("/users");
    users.value = res?.data || [];
  } catch {
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare utenti", life: 3500 });
  } finally {
    loading.value = false;
  }
}

function clearSelection() {
  selectedUsers.value = [];
  showSelected.value = false;
}

const filteredUsers = computed(() => {
  const qv = (query.value || "").trim().toLowerCase();
  if (!qv) return users.value;

  return users.value.filter((u) => {
    const name = `${u.name || ""} ${u.surname || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    return name.includes(qv) || email.includes(qv);
  });
});

onMounted(loadUsers);
</script>

<style scoped>
.badge {
  padding: 0.35rem 0.55rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.8rem;
  color: white;
}

/* input coerente con gli altri */
:deep(.p-inputtext) {
  height: 42px;
}
</style>
