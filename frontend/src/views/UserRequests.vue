<template>
  <NoPermissions v-if="!canEnter" hint="Permesso richiesto: requests:manage" />

  <div v-else class="p-3">
    <Toast />
    <ConfirmDialog />

    <div class="d-flex align-items-center justify-content-between mb-3">
      <div>
        <h4 class="mb-1">Gestione richieste utenti</h4>
        <div class="text-muted">Accetta o rifiuta le richieste di assegnazione edificio.</div>
      </div>

      <Button label="Ricarica" icon="pi pi-refresh" :loading="loading" size="small" class="p-button-text" @click="reload" />
    </div>

    <DataTable
      :value="requests"
      dataKey="_id"
      paginator
      :rows="10"
      :loading="loading"
      class="p-datatable-sm"
      responsiveLayout="scroll"
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
      Nota: in questa tab vengono mostrate (di default) le richieste <b>PENDING</b>.
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import NoPermissions from "@/components/NoPermissions.vue";
import { usePermissions } from "@/composables/usePermissions";
import { fetchAllBuildings } from "@/services/userAdmin.service";
import { fetchRequests, updateRequestStatus } from "@/services/requests.service";

const toast = useToast();
const confirm = useConfirm();
const { hasPermission } = usePermissions();

const canEnter = computed(() => hasPermission("requests:manage"));

const loading = ref(false);
const requests = ref([]);
const buildings = ref([]);
const rowBusy = reactive({});

function setRowBusy(id, v) {
  rowBusy[id] = v;
}

function statusSeverity(st) {
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

function formatDateTime(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString("it-IT");
  } catch {
    return "-";
  }
}

async function reload() {
  loading.value = true;
  try {
    const [bRes, rRes] = await Promise.all([
      fetchAllBuildings(),
      fetchRequests({ type: "ASSIGN_BUILDING", status: "PENDING" }),
    ]);

    buildings.value = Array.isArray(bRes.data) ? bRes.data : [];
    requests.value = Array.isArray(rRes.data) ? rRes.data : [];
  } catch (err) {
    // fallback: carica richieste senza filtri se backend non li supporta
    try {
      const rRes2 = await fetchRequests();
      requests.value = Array.isArray(rRes2.data) ? rRes2.data : [];
    } catch (e2) {
      toast.add({ severity: "error", summary: "Errore", detail: "Impossibile caricare richieste", life: 3500 });
    }
  } finally {
    loading.value = false;
  }
}

function confirmAccept(req) {
  confirm.require({
    message: `Accettare richiesta su "${buildingNameById(req.buildingId)}"?`,
    header: "Conferma",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Accetta",
    rejectLabel: "Annulla",
    accept: async () => {
      setRowBusy(req._id, true);
      try {
        await updateRequestStatus(req._id, "APPROVED");
        toast.add({ severity: "success", summary: "Ok", detail: "Richiesta accettata", life: 2500 });
        await reload();
      } catch (err) {
        toast.add({ severity: "error", summary: "Errore", detail: err?.response?.data?.message || "Operazione fallita", life: 3500 });
      } finally {
        setRowBusy(req._id, false);
      }
    },
  });
}

function confirmReject(req) {
  confirm.require({
    message: `Rifiutare richiesta su "${buildingNameById(req.buildingId)}"?`,
    header: "Conferma",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Rifiuta",
    rejectLabel: "Annulla",
    accept: async () => {
      setRowBusy(req._id, true);
      try {
        await updateRequestStatus(req._id, "REJECTED");
        toast.add({ severity: "success", summary: "Ok", detail: "Richiesta rifiutata", life: 2500 });
        await reload();
      } catch (err) {
        toast.add({ severity: "error", summary: "Errore", detail: err?.response?.data?.message || "Operazione fallita", life: 3500 });
      } finally {
        setRowBusy(req._id, false);
      }
    },
  });
}

onMounted(() => {
  if (canEnter.value) reload();
});
</script>
