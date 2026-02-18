<template>
  <div class="card shadow-sm border-0 w-100 h-100">
    <!-- Titolo -->
    <div class="card-body ps-5">
      <div class="d-flex align-items-center">
        <div>
          <h4 class="mb-0 fw-bold">Pannello Riepilogativo KPI</h4>
          <small class="text-muted">Monitoraggio attività e rischi</small>
        </div>
        <div class="ms-auto">
          <span class="badge bg-light text-dark border">
            <i class="bi bi-building me-1"></i>
            {{ buildingCount }} edifici
          </span>
        </div>
      </div>
    </div>

    <!-- Fascia grigia -->
    <div class="bg-secondary bg-opacity-25 px-3 py-2 border-bottom d-flex align-items-center ps-5">
      <span class="fw-medium text-dark">Seleziona periodo</span>
    </div>

    <!-- Contenuto -->
    <div class="card-body ps-5">
      <!-- Selettore periodo -->
      <div class="mb-4">
        <SelezioneMesi :selected="selectedPeriod" @periodSelected="changePeriod" />
      </div>

      <!-- KPI Totali -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card bg-light">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="me-3">
                  <i class="bi bi-bar-chart-fill text-primary fs-1"></i>
                </div>
                <div class="flex-grow-1">
                  <h6 class="text-muted mb-1">TOTALE INTERVENTI</h6>
                  <h2 class="text-dark fw-bold mb-0">{{ kpi.total }}</h2>
                </div>
                <div class="text-end">
                  <small class="text-muted d-block">Periodo selezionato</small>
                  <small class="text-primary fw-semibold">{{ getPeriodLabel(selectedPeriod) }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tipologie interventi -->
      <h6 class="fw-semibold text-uppercase text-muted mb-3">
        <i class="bi bi-list-task me-2"></i>Tipologie di intervento
      </h6>

      <div class="row mb-4">
        <div v-for="item in interventionTypes" :key="item.key" class="col-md-3 mb-3">
          <div class="card border h-100">
            <div class="card-body">
              <div class="d-flex align-items-center mb-2">
                <div :class="[item.bgClass, 'p-2 rounded me-2']">
                  <i :class="[item.icon, item.textClass]"></i>
                </div>
                <h6 class="text-muted mb-0">{{ item.label }}</h6>
              </div>
              <h4 class="fw-bold mb-2">{{ kpi[item.key] }}</h4>
              <div class="progress" style="height: 6px;">
                <div
                  :class="['progress-bar', item.bgClass.replace('bg-opacity-10', '')]"
                  :style="{ width: calculatePercentage(kpi[item.key], kpi.total) + '%' }"
                ></div>
              </div>
              <small class="text-muted">
                {{ calculatePercentage(kpi[item.key], kpi.total) }}% del totale
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Livelli di rischio -->
      <h6 class="fw-semibold text-uppercase text-muted mb-3">
        <i class="bi bi-shield-exclamation me-2"></i>Livelli di rischio
      </h6>

      <div class="row">
        <div v-for="risk in riskLevels" :key="risk.key" class="col-md-4 mb-3">
          <div class="card border h-100">
            <div class="card-body">
              <div class="d-flex align-items-center mb-2">
                <div :class="[risk.bgClass, 'p-2 rounded me-2']">
                  <i :class="[risk.icon, risk.textClass]"></i>
                </div>
                <h6 class="text-muted mb-0">{{ risk.label }}</h6>
              </div>
              <h4 class="fw-bold mb-2">{{ kpi[risk.key] }}</h4>
              <div class="d-flex align-items-center">
                <div class="progress flex-grow-1 me-2" style="height: 8px;">
                  <div
                    :class="['progress-bar', risk.bgClass.replace('bg-opacity-10', '')]"
                    :style="{ width: calculatePercentage(kpi[risk.key], kpi.total) + '%' }"
                  ></div>
                </div>
                <span :class="['badge', risk.bgClass, risk.textClass]">
                  {{ calculatePercentage(kpi[risk.key], kpi.total) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-4 pt-3 border-top">
        <div class="d-flex justify-content-between align-items-center">
          <div class="small text-muted">
            <i class="bi bi-info-circle me-1"></i>
            <span v-if="loading">
              <span class="spinner-border spinner-border-sm me-1"></span>
              Caricamento dati...
            </span>
            <span v-else>Dati aggiornati alle {{ lastUpdate }}</span>
          </div>
          <button @click="fetchKpi" class="btn btn-sm btn-outline-primary" :disabled="loading">
            <i class="bi bi-arrow-clockwise me-1"></i>
            Aggiorna
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from "vue";
import api from "@/services/api";
import SelezioneMesi from "./SelezioneMesi.vue";
import { useSelectedBuildingsStore } from "@/stores/selectedBuildings";

const selectedPeriod = ref("anno");
const loading = ref(false);
const lastUpdate = ref("");

const kpi = reactive({
  total: 0,
  maintenance: 0,
  inspection: 0,
  repair: 0,
  failure: 0,
  lowRisk: 0,
  mediumRisk: 0,
  highRisk: 0,
});

const selectedBuildingsStore = useSelectedBuildingsStore();

const periods = [
  { value: "mese", label: "Mese" },
  { value: "trimestre", label: "Trimestre" },
  { value: "anno", label: "Anno" },
];

const interventionTypes = [
  { key: "maintenance", label: "Manutenzione", icon: "bi-tools", bgClass: "bg-primary bg-opacity-10", textClass: "text-primary" },
  { key: "inspection", label: "Ispezione", icon: "bi-search", bgClass: "bg-info bg-opacity-10", textClass: "text-info" },
  { key: "repair", label: "Riparazione", icon: "bi-wrench", bgClass: "bg-warning bg-opacity-10", textClass: "text-warning" },
  { key: "failure", label: "Guasto", icon: "bi-exclamation-triangle", bgClass: "bg-danger bg-opacity-10", textClass: "text-danger" },
];

const riskLevels = [
  { key: "lowRisk", label: "Rischio Basso", icon: "bi-shield-check", bgClass: "bg-success bg-opacity-10", textClass: "text-success" },
  { key: "mediumRisk", label: "Rischio Medio", icon: "bi-shield", bgClass: "bg-warning bg-opacity-10", textClass: "text-warning" },
  { key: "highRisk", label: "Rischio Alto", icon: "bi-shield-exclamation", bgClass: "bg-danger bg-opacity-10", textClass: "text-danger" },
];

const buildingCount = computed(() => selectedBuildingsStore.selectedIds?.length || 0);

function mapPeriod(period) {
  return { mese: "month", trimestre: "quarter", anno: "year" }[period] || "year";
}

function getPeriodLabel(period) {
  return periods.find((p) => p.value === period)?.label || "Anno";
}

function calculatePercentage(part, total) {
  return !total ? 0 : Math.round((part / total) * 100);
}

function updateTimestamp() {
  lastUpdate.value = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function resetKpi() {
  Object.assign(kpi, {
    total: 0,
    maintenance: 0,
    inspection: 0,
    repair: 0,
    failure: 0,
    lowRisk: 0,
    mediumRisk: 0,
    highRisk: 0,
  });
  updateTimestamp();
}

async function fetchKpi() {
  const buildingIds = selectedBuildingsStore.selectedIds;
  if (!buildingIds?.length) return resetKpi();

  loading.value = true;
  try {
    const response = await api.get("/dashboard/stats", {
      params: { period: mapPeriod(selectedPeriod.value), buildingIds: buildingIds.join(",") },
    });

    const totals = response.data.totals || {};
    const byType = totals.byType || {};
    const bySeverity = totals.bySeverity || {};

    Object.assign(kpi, {
      total: totals.total || 0,
      maintenance: byType.maintenance || 0,
      inspection: byType.inspection || 0,
      repair: byType.repair || 0,
      failure: byType.failure || 0,
      lowRisk: bySeverity.low || 0,
      mediumRisk: bySeverity.medium || 0,
      highRisk: bySeverity.high || 0,
    });

    updateTimestamp();
  } catch (error) {
    console.error("Errore caricamento KPI:", error);
    resetKpi();
  } finally {
    loading.value = false;
  }
}

function changePeriod(period) {
  selectedPeriod.value = period;
  fetchKpi();
}

watch(() => selectedBuildingsStore.selectedIds, fetchKpi, { deep: true });
onMounted(fetchKpi);
</script>

<style scoped>
.badge { border-radius: 20px; padding: 5px 10px; font-size: 0.85em; }
.btn-sm { border-radius: 8px; }
.card { border-radius: 12px; }
</style>
