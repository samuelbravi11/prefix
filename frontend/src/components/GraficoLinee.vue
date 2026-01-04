<template>
  <div class="card shadow-sm border-0 w-100 h-100">
    <!-- Titolo -->
    <div class="card-body ps-5">
      <div class="d-flex align-items-center">
        <div>
          <h4 class="mb-0 fw-bold">Grafico a Linee</h4>
          <small class="text-muted">Andamento interventi nel tempo</small>
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
        <SelezioneMesi
          :selected="selectedPeriod"
          @periodSelected="changePeriod"
        />
      </div>

      <!-- Card contenitore grafico -->
      <div class="card border h-100">
        <div class="card-body">
          <!-- Header grafico -->
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 class="fw-semibold mb-1">
                <i class="bi bi-graph-up me-2 text-primary"></i>
                Andamento Interventi
              </h6>
              <small class="text-muted">
                Periodo: <span class="fw-semibold text-primary">{{ getPeriodLabel(selectedPeriod) }}</span>
              </small>
            </div>
            <div class="d-flex align-items-center">
              <span class="badge bg-light text-dark border me-3">
                <i class="bi bi-calendar3 me-1"></i>
                {{ getPeriodUnit(selectedPeriod) }}
              </span>
              <button 
                @click="fetchChartData" 
                class="btn btn-sm btn-outline-primary"
                :disabled="loading"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>
                Aggiorna
              </button>
            </div>
          </div>

          <!-- Legenda -->
          <div v-if="hasData" class="mb-3">
            <div class="d-flex flex-wrap gap-3">
              <div class="d-flex align-items-center">
                <span class="legend-dot bg-primary me-2"></span>
                <small class="text-muted">Interventi totali</small>
              </div>
              <div class="d-flex align-items-center">
                <span class="badge bg-primary bg-opacity-10 text-primary">
                  <i class="bi bi-bar-chart me-1"></i>
                  Totale: {{ totalInterventions }}
                </span>
              </div>
            </div>
          </div>

          <!-- Grafico -->
          <div class="position-relative" style="height: 400px;">
            <v-chart
              v-if="!loading"
              :option="chartOptions"
              autoresize
              class="w-100 h-100"
            />
            
            <!-- Loading -->
            <div v-if="loading" class="position-absolute top-50 start-50 translate-middle text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Caricamento...</span>
              </div>
              <p class="text-muted mt-2">Caricamento dati grafico...</p>
            </div>

            <!-- No data -->
            <div v-if="!hasData && !loading" class="position-absolute top-50 start-50 translate-middle text-center">
              <i class="bi bi-bar-chart text-muted display-5 mb-3"></i>
              <p class="text-muted mb-0">Nessun dato disponibile</p>
              <small class="text-muted">Seleziona almeno un edificio</small>
            </div>
          </div>

          <!-- Stats footer -->
          <div v-if="hasData && !loading" class="mt-4 pt-3 border-top">
            <div class="row">
              <div v-for="stat in stats" :key="stat.label" class="col-md-4">
                <div class="text-center">
                  <small class="text-muted d-block">{{ stat.label }}</small>
                  <h6 :class="['fw-bold', stat.color]">{{ stat.value }}</h6>
                  <small class="text-muted">{{ stat.subtitle }}</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-3 pt-3 border-top">
            <div class="d-flex justify-content-between align-items-center">
              <div class="small text-muted">
                <i class="bi bi-info-circle me-1"></i>
                <span v-if="loading">
                  <span class="spinner-border spinner-border-sm me-1"></span>
                  Aggiornamento...
                </span>
                <span v-else>Dati aggiornati alle {{ lastUpdate }}</span>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import axios from 'axios'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import SelezioneMesi from './SelezioneMesi.vue'
import { useSelectedBuildingsStore } from '@/stores/selectedBuildings'

// ECharts
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, TitleComponent, TooltipComponent, GridComponent, CanvasRenderer])

// Stato
const selectedPeriod = ref('anno')
const chartOptions = ref({})
const loading = ref(false)
const lastUpdate = ref('')
const chartData = ref([])

const selectedBuildingsStore = useSelectedBuildingsStore()
const token = localStorage.getItem('accessToken')

// Configurazioni
const periods = [
  { value: 'mese', label: 'Mese', unit: 'giorni' },
  { value: 'trimestre', label: 'Trimestre', unit: 'settimane' },
  { value: 'anno', label: 'Anno', unit: 'mesi' }
]

const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

// Computed
const buildingCount = computed(() => selectedBuildingsStore.selectedIds?.length || 0)
const hasData = computed(() => chartData.value.length > 0 && chartData.value.some(item => item.total > 0))
const totalInterventions = computed(() => chartData.value.reduce((sum, item) => sum + (item.total || 0), 0))
const maxInterventions = computed(() => chartData.value.length ? Math.max(...chartData.value.map(item => item.total || 0)) : 0)
const minInterventions = computed(() => chartData.value.length ? Math.min(...chartData.value.map(item => item.total || 0)) : 0)
const averageInterventions = computed(() => chartData.value.length ? (totalInterventions.value / chartData.value.length).toFixed(1) : 0)

const maxPeriod = computed(() => {
  if (!chartData.value.length) return '-'
  const maxItem = chartData.value.find(item => item.total === maxInterventions.value)
  return maxItem ? formatXAxisLabel(maxItem.date) : '-'
})

const minPeriod = computed(() => {
  if (!chartData.value.length) return '-'
  const minItem = chartData.value.find(item => item.total === minInterventions.value)
  return minItem ? formatXAxisLabel(minItem.date) : '-'
})

const stats = computed(() => [
  { label: 'Interventi Max', value: maxInterventions.value, color: 'text-primary', subtitle: maxPeriod.value },
  { label: 'Interventi Min', value: minInterventions.value, color: 'text-info', subtitle: minPeriod.value },
  { label: 'Media', value: averageInterventions.value, color: 'text-success', subtitle: 'per periodo' }
])

// Funzioni
function getPeriodLabel(period) {
  return periods.find(p => p.value === period)?.label || 'Anno'
}

function getPeriodUnit(period) {
  return periods.find(p => p.value === period)?.unit || 'mesi'
}

function mapPeriod(period) {
  return { mese: 'month', trimestre: 'quarter', anno: 'year' }[period] || 'year'
}

function updateTimestamp() {
  lastUpdate.value = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function formatXAxisLabel(dateString) {
  const date = new Date(dateString)
  if (selectedPeriod.value === 'mese') return `Giorno ${date.getDate()}`
  if (selectedPeriod.value === 'trimestre') return `Settimana ${getWeekNumber(date)}`
  return monthNames[date.getMonth()]
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// API
async function fetchChartData() {
  const buildingIds = selectedBuildingsStore.selectedIds
  if (!buildingIds?.length) {
    chartOptions.value = getEmptyChart()
    chartData.value = []
    updateTimestamp()
    return
  }

  loading.value = true
  try {
    const response = await axios.get('/api/v1/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        period: mapPeriod(selectedPeriod.value),
        buildingIds: buildingIds.join(',')
      }
    })

    const timeline = response.data.timeline || []
    chartData.value = timeline

    const xData = timeline.map(item => formatXAxisLabel(item.date))
    const yData = timeline.map(item => item.total || 0)

    chartOptions.value = {
      title: { text: 'Numero interventi nel tempo', left: 'center', textStyle: { color: '#212529', fontSize: 16 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params) => {
          const date = new Date(timeline[params[0].dataIndex].date)
          const formattedDate = selectedPeriod.value === 'anno' 
            ? date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
            : date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
          return `<strong>${formattedDate}</strong><br/>Interventi: <b class="text-primary">${params[0].value}</b>`
        }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: { type: 'category', data: xData, axisLine: { lineStyle: { color: '#dee2e6' } } },
      yAxis: { type: 'value', name: 'Numero Interventi', splitLine: { lineStyle: { color: '#f8f9fa', type: 'dashed' } } },
      series: [{
        name: 'Interventi',
        type: 'line',
        data: yData,
        smooth: true,
        itemStyle: { color: '#0d6efd' },
        lineStyle: { color: '#0d6efd', width: 3 },
        symbol: 'circle',
        symbolSize: 8,
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(13, 110, 253, 0.2)' },
              { offset: 1, color: 'rgba(13, 110, 253, 0)' }
            ]
          }
        }
      }]
    }

    updateTimestamp()
  } catch (error) {
    console.error('Errore caricamento grafico:', error)
    chartOptions.value = getEmptyChart()
    chartData.value = []
    updateTimestamp()
  } finally {
    loading.value = false
  }
}

function getEmptyChart() {
  return {
    title: { text: 'Nessun edificio selezionato', textStyle: { color: '#6c757d' } },
    xAxis: { type: 'category', data: [] },
    yAxis: { type: 'value' },
    series: [{ name: 'Interventi', type: 'line', data: [] }]
  }
}

function changePeriod(period) {
  selectedPeriod.value = period
  fetchChartData()
}

// Watch & Mounted
watch(() => selectedBuildingsStore.selectedIds, fetchChartData, { deep: true })
onMounted(fetchChartData)
</script>

<style scoped>
.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.display-5 {
  font-size: 3rem;
}
</style>