<template>
  <div class="container-fluid py-4">
    <Toast />

    <div class="d-flex align-items-center justify-content-between mb-3">
      <div>
        <h4 class="mb-0">Notifiche</h4>
        <div class="text-muted small">Centro notifiche con filtri, ricerca e azioni rapide.</div>
      </div>

      <div class="d-flex gap-2 align-items-center">
        <Tag v-if="store.unreadCount" :value="`${store.unreadCount} non lette`" severity="info" />
        <Button label="Ricarica" icon="pi pi-refresh" size="small" class="p-button-text" :loading="store.loading" @click="reload" />
      </div>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-body">
        <!-- Filtri -->
        <div class="row g-2 align-items-center mb-3">
          <div class="col-12 col-lg-4">
            <label class="form-label">Stato</label>
            <Dropdown v-model="q.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-100" />
          </div>

          <div class="col-12 col-lg-4">
            <label class="form-label">Tipologia</label>
            <Dropdown v-model="q.type" :options="typeOptions" optionLabel="label" optionValue="value" class="w-100" placeholder="Tutte" />
          </div>

          <div class="col-12 col-lg-4">
            <label class="form-label">Severità</label>
            <Dropdown v-model="q.severity" :options="severityOptions" optionLabel="label" optionValue="value" class="w-100" placeholder="Tutte" />
          </div>

          <div class="col-12 col-lg-8">
            <label class="form-label">Ricerca</label>
            <div class="input-group">
              <span class="input-group-text bg-transparent"><i class="bi bi-search"></i></span>
              <input v-model="q.q" type="text" class="form-control" placeholder="Cerca per titolo/messaggio..." />
            </div>
          </div>

          <div class="col-12 col-lg-4 d-flex gap-2 align-items-end">
            <Button label="Applica" icon="pi pi-filter" size="small" @click="apply" />
            <Button label="Reset" icon="pi pi-times" size="small" class="p-button-text" @click="reset" />
          </div>
        </div>

        <!-- Bulk actions -->
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="text-muted small">
            Totale: <strong>{{ store.total }}</strong>
          </div>

          <div class="d-flex gap-2 flex-wrap">
            <Button
              label="Segna lette"
              icon="pi pi-check"
              size="small"
              class="p-button-text"
              :disabled="selectedIds.length===0"
              @click="bulkRead"
            />
            <Button
              label="Archivia"
              icon="pi pi-inbox"
              size="small"
              class="p-button-text"
              :disabled="selectedIds.length===0"
              @click="bulkArchive"
            />
            <Button
              label="Elimina"
              icon="pi pi-trash"
              size="small"
              class="p-button-text"
              :disabled="selectedIds.length===0"
              @click="bulkDelete"
            />
          </div>
        </div>

        <!-- Lista -->
        <div v-if="store.loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
          <div class="text-muted mt-2">Caricamento...</div>
        </div>

        <div v-else-if="store.items.length === 0" class="text-center py-5">
          <i class="bi bi-bell-slash text-muted fs-1 mb-3"></i>
          <p class="text-muted mb-0">Nessuna notifica trovata</p>
        </div>

        <div v-else>
          <DataTable
            :value="store.items"
            dataKey="_id"
            class="p-datatable-sm"
            responsiveLayout="scroll"
            v-model:selection="selected"
          >
            <Column selectionMode="multiple" headerStyle="width: 40px"></Column>

            <Column header="Stato" style="width: 120px">
              <template #body="{ data }">
                <Tag :value="statusLabel(data)" :severity="data.readAt ? 'success' : 'warning'" />
              </template>
            </Column>

            <Column header="Severità" style="width: 120px">
              <template #body="{ data }">
                <Tag :value="data.severity || 'info'" :severity="severityToTag(data.severity)" />
              </template>
            </Column>

            <Column field="title" header="Titolo" />
            <Column header="Data" style="width: 140px">
              <template #body="{ data }">{{ fmtDate(data.createdAt) }}</template>
            </Column>

            <Column header="Azioni" style="width: 260px">
              <template #body="{ data }">
                <div class="d-flex gap-2 flex-wrap">
                  <Button
                    :label="data.readAt ? 'Non letta' : 'Letta'"
                    icon="pi pi-check"
                    size="small"
                    class="p-button-text"
                    @click="toggleRead(data)"
                  />
                  <Button
                    :label="data.archivedAt ? 'Ripristina' : 'Archivia'"
                    icon="pi pi-inbox"
                    size="small"
                    class="p-button-text"
                    @click="toggleArchive(data)"
                  />
                  <Button
                    label="Elimina"
                    icon="pi pi-trash"
                    size="small"
                    class="p-button-text"
                    @click="removeOne(data)"
                  />
                </div>
              </template>
            </Column>

            <Column header="" style="width: 70px">
              <template #body="{ data }">
                <Button label="Dettagli" size="small" class="p-button-text" @click="openDetails(data)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- dettagli -->
    <Dialog v-model:visible="details.open" modal header="Dettagli notifica" :style="{ width: '760px' }">
      <div v-if="details.item">
        <div class="mb-2">
          <div class="fw-semibold">{{ details.item.title }}</div>
          <div class="text-muted small">{{ details.item.message }}</div>
        </div>

        <div class="row g-2">
          <div class="col-12 col-lg-4">
            <div class="small text-muted">Tipologia</div>
            <div>{{ details.item.type || "-" }}</div>
          </div>
          <div class="col-12 col-lg-4">
            <div class="small text-muted">Severità</div>
            <div>{{ details.item.severity || "-" }}</div>
          </div>
          <div class="col-12 col-lg-4">
            <div class="small text-muted">Creato</div>
            <div>{{ fmtDateTime(details.item.createdAt) }}</div>
          </div>

          <div class="col-12 mt-2" v-if="details.item.entity">
            <div class="small text-muted">Entità</div>
            <div class="d-flex gap-2 flex-wrap">
              <Tag :value="details.item.entity.type" severity="info" />
              <span>{{ details.item.entity.name || details.item.entity.id }}</span>
            </div>
          </div>

          <div class="col-12 mt-2" v-if="details.item.action?.route">
            <div class="small text-muted">Azione</div>
            <Button
              :label="details.item.action.label || 'Apri'"
              icon="pi pi-arrow-right"
              size="small"
              @click="goTo(details.item.action.route)"
            />
          </div>

          <div class="col-12 mt-3">
            <div class="small text-muted mb-1">Payload</div>
            <pre class="payload-box">{{ pretty(details.item.data) }}</pre>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Chiudi" class="p-button-text" @click="details.open=false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import { useNotificationStore } from "@/stores/notification.store";
import { usePreferencesStore } from "@/stores/preferences.store";

const router = useRouter();
const toast = useToast();

const store = useNotificationStore();
const prefsStore = usePreferencesStore();

const q = reactive({ ...store.query });

const statusOptions = [
  { label: "Tutte", value: "all" },
  { label: "Non lette", value: "unread" },
  { label: "Archiviate", value: "archived" },
];

const typeOptions = [
  { label: "—", value: "" },
  { label: "Richieste edificio", value: "building_request" },
  { label: "Assegnazione edificio", value: "building_assignment" },
  { label: "Regole", value: "rule_triggered" },
  { label: "AI", value: "ai_alert" },
  { label: "Interventi", value: "intervention" },
  { label: "Sistema", value: "system" },
];

const severityOptions = [
  { label: "—", value: "" },
  { label: "Info", value: "info" },
  { label: "Success", value: "success" },
  { label: "Warning", value: "warning" },
  { label: "Error", value: "error" },
];

const selected = ref([]);
const selectedIds = computed(() => selected.value.map((x) => x._id));

const details = reactive({ open: false, item: null });

function fmtDate(d) {
  try { return new Date(d).toLocaleDateString("it-IT"); } catch { return "-"; }
}
function fmtDateTime(d) {
  try { return new Date(d).toLocaleString("it-IT"); } catch { return "-"; }
}
function pretty(x) {
  try { return JSON.stringify(x || {}, null, 2); } catch { return "{}"; }
}
function statusLabel(n) {
  if (n.archivedAt) return "archiviata";
  return n.readAt ? "letta" : "non letta";
}
function severityToTag(s) {
  if (s === "error") return "danger";
  if (s === "warning") return "warning";
  if (s === "success") return "success";
  return "info";
}

async function reload() {
  await store.fetchUnreadCount();
  await store.fetchList();
}

function apply() {
  store.setQuery({ ...q, page: 1 });
  reload();
}

function reset() {
  q.status = "all";
  q.q = "";
  q.type = "";
  q.severity = "";
  store.setQuery({ status: "all", q: "", type: "", severity: "", page: 1 });
  reload();
}

async function toggleRead(item) {
  try {
    await store.markRead(item._id, !item.readAt);
  } catch (e) {
    toast.add({ severity: "error", summary: "Errore", detail: "Operazione fallita", life: 3000 });
  }
}

async function toggleArchive(item) {
  try {
    await store.archive(item._id, !item.archivedAt);
    // se filtro archived/unread, ricarica per coerenza
    if (store.query.status !== "all") await store.fetchList();
  } catch {
    toast.add({ severity: "error", summary: "Errore", detail: "Operazione fallita", life: 3000 });
  }
}

async function removeOne(item) {
  try {
    await store.remove(item._id);
  } catch {
    toast.add({ severity: "error", summary: "Errore", detail: "Eliminazione fallita", life: 3000 });
  }
}

async function bulkRead() {
  try {
    await store.bulkMarkRead(selectedIds.value);
    selected.value = [];
  } catch {
    toast.add({ severity: "error", summary: "Errore", detail: "Operazione bulk fallita", life: 3000 });
  }
}

async function bulkArchive() {
  try {
    await store.bulkArchive(selectedIds.value);
    selected.value = [];
    if (store.query.status !== "all") await store.fetchList();
  } catch {
    toast.add({ severity: "error", summary: "Errore", detail: "Operazione bulk fallita", life: 3000 });
  }
}

async function bulkDelete() {
  try {
    await store.bulkRemove(selectedIds.value);
    selected.value = [];
  } catch {
    toast.add({ severity: "error", summary: "Errore", detail: "Operazione bulk fallita", life: 3000 });
  }
}

function openDetails(item) {
  details.item = item;
  details.open = true;
  // se apro dettagli, segno come letta (comportamento comune)
  if (!item.readAt) store.markRead(item._id, true);
}

function goTo(route) {
  details.open = false;
  router.push(route);
}

onMounted(async () => {
  // preferenze (tema + pollingSeconds)
  await prefsStore.fetch();

  // sincronizza query locale dalla store
  Object.assign(q, store.query);

  await reload();

  // polling unread (solo count)
  store.startPolling(prefsStore.prefs.scheduler.pollingSeconds);
});

onBeforeUnmount(() => {
  // non fermo polling globale (puoi decidere); se vuoi fermarlo qui:
  // store.stopPolling();
});
</script>

<style scoped>
.payload-box {
  background: #0b1020;
  color: #d6e2ff;
  border-radius: 10px;
  padding: 12px;
  font-size: 12px;
  max-height: 260px;
  overflow: auto;
}
</style>
