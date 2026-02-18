<template>
  <div class="card shadow-sm border-0 w-100 h-100">
    <div class="card-body ps-5">
      <div class="d-flex align-items-center">
        <div>
          <h4 class="mb-0 fw-bold">Gravità Interventi</h4>
          <small class="text-muted">Distribuzione per livello di rischio</small>
        </div>
        <div class="ms-auto">
          <span class="badge bg-light text-dark border">
            <i class="bi bi-building me-1"></i>
            {{ buildingCount }} edifici
          </span>
        </div>
      </div>
    </div>

    <div class="bg-secondary bg-opacity-25 px-3 py-2 border-bottom d-flex align-items-center ps-5">
      <span class="fw-medium text-dark">Seleziona periodo</span>
    </div>

    <div class="card-body ps-5">
      <div class="mb-4">
        <SelezioneMesi :selected="selectedPeriod" @periodSelected="changePeriod" />
      </div>

      <div class="card border h-100">
        <div class="card-body">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 class="fw-semibold mb-1">
                <i class="bi bi-pie-chart me-2 text-primary"></i>
                Distribuzione Gravità
              </h6>
              <small class="text-muted">
                Periodo: <span class="fw-semibold text-primary">{{ getPeriodLabel(selectedPeriod) }}</span>
              </small>
            </div>
            <button @click="fetchChartData" class="btn btn-sm btn-outline-primary" :disabled="loading">
              <i class="bi bi-arrow-clockwise me-1"></i>
              Aggiorna
            </button>
          </div>

          <div class="position-relative" style="height: 400px;">
            <v-chart v-if="!loading" :option="chartOptions" autoresize class="w-100 h-100" />

            <div v-if="loading" class="position-absolute top-50 start-50 translate-middle text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Caricamento...</span>
              </div>
              <p class="text-muted mt-2">Caricamento dati...</p>
            </div>

            <div v-if="!hasData && !loading" class="position-absolute top-50 start-50 translate-middle text-center">
              <i class="bi bi-pie-chart text-muted display-5 mb-3"></i>
              <p class="text-muted mb-0">Nessun dato disponibile</p>
              <small class="text-muted">Seleziona almeno un edificio</small>
            </div>
          </div>

          <div class="mt-3 pt-3 border-top">
            <div class="d-flex justify-content-between align-items-center">
              <div class="small text-muted">
                <i class="bi bi-info-circle me-1"></i>
                <span v-if="loading">
                  <span class="spinner-border spinner-border-sm me-1"></span>
                  Aggiornamento...
                </span>
                <span v-else> Dati aggiornati alle {{ lastUpdate }} </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import api from "@/services/api";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import SelezioneMesi from "./SelezioneMesi.vue";
import { useSelectedBuildingsStore } from "@/stores/selectedBuildings";

import { PieChart } from "echarts/charts";
import { TitleComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

use([PieChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const selectedPeriod = ref("anno");
const chartOptions = ref({});
const loading = ref(false);
const lastUpdate = ref("");
const severity = ref({ low: 0, medium: 0, high: 0 });

const selectedBuildingsStore = useSelectedBuildingsStore();

const periods = [
  { value: "mese", label: "Mese" },
  { value: "trimestre", label: "Trimestre" },
  { value: "anno", label: "Anno" },
];

const colors = {
  Bassa: "#28a745",
  Media: "#ffc107",
  Alta: "#dc3545",
};

const buildingCount = computed(() => selectedBuildingsStore.selectedIds?.length || 0);
const totalInterventions = computed(() => Object.values(severity.value).reduce((a, b) => a + b, 0));
const hasData = computed(() => totalInterventions.value > 0);

const getPeriodLabel = (period) => periods.find((p) => p.value === period)?.label || "Anno";
const mapPeriod = (period) => ({ mese: "month", trimestre: "quarter", anno: "year" }[period] || "year");
const updateTimestamp = () => (lastUpdate.value = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));

async function fetchChartData() {
  const buildingIds = selectedBuildingsStore.selectedIds;
  if (!buildingIds?.length) {
    chartOptions.value = getEmptyChart();
    severity.value = { low: 0, medium: 0, high: 0 };
    updateTimestamp();
    return;
  }

  loading.value = true;
  try {
    const response = await api.get("/dashboard/stats", {
      params: { period: mapPeriod(selectedPeriod.value), buildingIds: buildingIds.join(",") },
    });

    const severityData = response.data.totals?.bySeverity || {};
    severity.value = {
      low: severityData.low || 0,
      medium: severityData.medium || 0,
      high: severityData.high || 0,
    };

    const data = [
      { value: severity.value.low, name: "Bassa" },
      { value: severity.value.medium, name: "Media" },
      { value: severity.value.high, name: "Alta" },
    ];

    chartOptions.value = {
      title: { text: "Distribuzione gravità interventi", left: "center" },
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { orient: "vertical", left: "left" },
      series: [
        {
          name: "Gravità",
          type: "pie",
          radius: "55%",
          data,
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.5)" } },
          itemStyle: { color: (params) => colors[params.name] || "#6c757d" },
        },
      ],
    };

    updateTimestamp();
  } catch (error) {
    console.error("Errore caricamento grafico:", error);
    chartOptions.value = getEmptyChart();
    severity.value = { low: 0, medium: 0, high: 0 };
    updateTimestamp();
  } finally {
    loading.value = false;
  }
}

const getEmptyChart = () => ({
  title: { text: "Nessun edificio selezionato", left: "center" },
  tooltip: { trigger: "item" },
  legend: { show: false },
  series: [{ type: "pie", radius: "50%", data: [] }],
});

const changePeriod = (period) => {
  selectedPeriod.value = period;
  fetchChartData();
};

watch(() => selectedBuildingsStore.selectedIds, fetchChartData, { deep: true });
onMounted(fetchChartData);
</script>

<style scoped>
.badge { border-radius: 20px; padding: 5px 10px; font-size: 0.85em; }
.btn-sm { border-radius: 8px; }
.card { border-radius: 12px; }
.display-5 { font-size: 3rem; }
</style>
