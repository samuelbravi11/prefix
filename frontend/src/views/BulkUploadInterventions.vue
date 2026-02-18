<!-- src/views/BulkUploadInterventions.vue -->
<template>
  <div class="card shadow-sm border-0">
    <div class="card-body">
      <Toast />

      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h4 class="mb-1">Carica interventi (bulk)</h4>
          <div class="text-muted small">
            Carica un file JSON, esegui una preview con validazione lato server e invia solo i record validi.
          </div>
        </div>

        <Button label="Reset" icon="pi pi-refresh" size="small" class="p-button-text" @click="resetAll" />
      </div>

      <div class="row g-3 align-items-end">
        <div class="col-12 col-lg-7">
          <label class="form-label">File JSON</label>
          <input class="form-control form-control-sm" type="file" accept=".json,application/json" @change="onFile" />
          <div class="text-muted small mt-1">
            Formato atteso: <code>[{ assetId, buildingId, performedAt, type, outcome?, severity?, description?, durationMinutes? }]</code>
          </div>
        </div>

        <div class="col-12 col-lg-5 d-flex gap-2">
          <Button
            label="Preview (server)"
            icon="pi pi-eye"
            size="small"
            :disabled="!rawText"
            :loading="previewLoading"
            @click="previewOnServer"
          />
          <Button
            label="Invia al database"
            icon="pi pi-upload"
            size="small"
            class="p-button-success"
            :disabled="!canCommit"
            :loading="commitLoading"
            @click="commit"
          />
        </div>
      </div>

      <!-- Errori client -->
      <div v-if="clientErrors.length" class="mt-3 alert alert-danger">
        <div class="fw-semibold mb-2">Errori di parsing/validazione (client)</div>
        <ul class="mb-0">
          <li v-for="(e, idx) in clientErrors" :key="idx">{{ e }}</li>
        </ul>
      </div>

      <!-- Preview server -->
      <div v-if="serverPreview.visible" class="mt-4">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="fw-semibold">Anteprima (validazione server)</div>
          <div class="d-flex gap-2">
            <Tag :value="`Validi: ${serverPreview.okCount}`" severity="success" />
            <Tag :value="`Scartati: ${serverPreview.errorCount}`" severity="warning" />
          </div>
        </div>

        <div v-if="serverPreview.errorCount" class="alert alert-warning">
          Alcuni record sono stati scartati (formato non valido o non autorizzati per gli edifici selezionati).
        </div>

        <DataTable
          :value="serverPreview.okRows"
          class="p-datatable-sm"
          responsiveLayout="scroll"
          paginator
          :rows="10"
          emptyMessage="Nessun record valido in preview."
        >
          <Column field="performedAt" header="Data" style="width: 150px">
            <template #body="{ data }">{{ formatDate(data.performedAt) }}</template>
          </Column>
          <Column field="type" header="Tipo" style="width: 160px" />
          <Column field="outcome" header="Esito" style="width: 140px" />
          <Column field="severity" header="Severità" style="width: 140px" />
          <Column field="assetId" header="assetId" style="width: 260px" />
          <Column field="buildingId" header="buildingId" style="width: 260px" />
          <Column field="description" header="Descrizione" />
        </DataTable>

        <div class="text-muted small mt-2">
          L’invio userà i record normalizzati/validati dal server (solo quelli <strong>validi</strong>).
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useToast } from "primevue/usetoast";
import api from "@/services/api";

const toast = useToast();

const rawText = ref("");

const previewLoading = ref(false);
const commitLoading = ref(false);

const clientErrors = ref([]);

const serverPreview = ref({
  visible: false,
  okCount: 0,
  errorCount: 0,
  okRows: [],
  // valori normalizzati per commit
  commitRows: [],
});

const canCommit = computed(() => serverPreview.value.visible && serverPreview.value.commitRows.length > 0);

function resetAll() {
  rawText.value = "";
  previewLoading.value = false;
  commitLoading.value = false;
  clientErrors.value = [];
  serverPreview.value = { visible: false, okCount: 0, errorCount: 0, okRows: [], commitRows: [] };
}

function onFile(evt) {
  resetAll();
  const file = evt.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    rawText.value = String(reader.result || "");
  };
  reader.onerror = () => {
    toast.add({ severity: "error", summary: "Errore", detail: "Impossibile leggere il file", life: 3500 });
  };
  reader.readAsText(file);
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString("it-IT");
  } catch {
    return "-";
  }
}

function isReasonableId(x) {
  return typeof x === "string" && x.length >= 6 && x.length <= 64;
}

function validateClientRow(item, idx) {
  const errs = [];
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    errs.push(`Record #${idx + 1}: non è un oggetto valido`);
    return errs;
  }

  if (!isReasonableId(item.assetId)) errs.push(`Record #${idx + 1}: assetId mancante/non valido`);
  if (!isReasonableId(item.buildingId)) errs.push(`Record #${idx + 1}: buildingId mancante/non valido`);

  const performedAt = item.performedAt;
  const dt = performedAt ? new Date(performedAt) : null;
  if (!performedAt || !dt || Number.isNaN(dt.getTime())) errs.push(`Record #${idx + 1}: performedAt non valido`);

  const type = String(item.type || "").trim();
  if (!type) errs.push(`Record #${idx + 1}: type mancante`);

  return errs;
}

function parseJsonArray() {
  clientErrors.value = [];

  let parsed;
  try {
    parsed = JSON.parse(rawText.value);
  } catch {
    clientErrors.value = ["JSON non valido: controlla virgole, parentesi e virgolette."];
    return null;
  }

  if (!Array.isArray(parsed)) {
    clientErrors.value = ["Il JSON deve essere un array di interventi."];
    return null;
  }

  if (parsed.length === 0) {
    clientErrors.value = ["Il file è vuoto (array senza elementi)."];
    return null;
  }

  if (parsed.length > 5000) {
    clientErrors.value = ["Troppi record (max 5000 per upload)."];
    return null;
  }

  const errs = [];
  const normalized = [];

  parsed.forEach((item, idx) => {
    const e = validateClientRow(item, idx);
    if (e.length) errs.push(...e);

    normalized.push({
      assetId: String(item.assetId || "").trim(),
      buildingId: String(item.buildingId || "").trim(),
      performedAt: item.performedAt,
      type: String(item.type || "").trim(),
      outcome: item.outcome != null ? String(item.outcome).trim() : undefined,
      severity: item.severity != null ? String(item.severity).trim() : undefined,
      description: item.description != null ? String(item.description).trim() : "",
      durationMinutes: item.durationMinutes != null ? Number(item.durationMinutes) : undefined,
      calendarEventId: item.calendarEventId != null ? String(item.calendarEventId).trim() : undefined,
    });
  });

  if (errs.length) {
    clientErrors.value = errs.slice(0, 60);
    return null;
  }

  return normalized;
}

async function previewOnServer() {
  const rows = parseJsonArray();
  if (!rows) return;

  previewLoading.value = true;
  serverPreview.value = { visible: false, okCount: 0, errorCount: 0, okRows: [], commitRows: [] };

  try {
    const res = await api.post("/interventions/bulk/preview", rows);
    const items = Array.isArray(res.data?.items) ? res.data.items : [];

    const ok = items.filter((x) => x?.ok).map((x) => x.value);
    const okCount = Number(res.data?.okCount ?? ok.length);
    const errorCount = Number(res.data?.errorCount ?? (items.length - ok.length));

    serverPreview.value = {
      visible: true,
      okCount,
      errorCount,
      okRows: ok,
      commitRows: ok, // commit usa direttamente i normalized del server
    };

    toast.add({ severity: "info", summary: "Preview pronta", detail: "Controlla i record validi prima di inviare", life: 2500 });
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: e?.response?.data?.message || "Preview fallita",
      life: 3500,
    });
  } finally {
    previewLoading.value = false;
  }
}

async function commit() {
  if (!canCommit.value) return;

  commitLoading.value = true;
  try {
    await api.post("/interventions/bulk/commit", serverPreview.value.commitRows);
    toast.add({ severity: "success", summary: "Ok", detail: "Upload completato", life: 2500 });
    resetAll();
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: e?.response?.data?.message || "Upload fallito",
      life: 3500,
    });
  } finally {
    commitLoading.value = false;
  }
}
</script>
