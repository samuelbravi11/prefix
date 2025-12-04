<template>
  <div class="card shadow-sm border-0 w-100 h-100">
    <!-- Titolo -->
    <div class="card-body ps-5">
      <h4>Pannello Riepigolativo KPI</h4>
    </div>

    <!-- Fascia grigia -->
    <div class="bg-secondary bg-opacity-25 px-3 py-2 border-bottom d-flex align-items-center ps-5">
      <span class="fw-medium text-dark">Seleziona periodo</span>
    </div>

    <!-- Selezione periodo -->
    <div class="card-body ps-5">
      <SelezioneMesi :selected="selectedPeriod" @periodSelected="changePeriod" />

      <!-- Grafico -->
      <v-chart :option="chartOptions" autoresize class="w-100" style="height: 500px;" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import SelezioneMesi from './SelezioneMesi.vue'

// ECharts componenti
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Registra componenti
use([LineChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer])

// Periodo selezionato
const selectedPeriod = ref('anno')

// Dati del grafico
const chartOptions = ref(generateChartData(selectedPeriod.value))

// Funzione per generare dati in base al periodo
function generateChartData(period) {
  let data, title
  if (period === 'mese') {
    title = 'Vendite Ultimo Mese'
    data = [10, 20, 15, 30, 25, 18, 10, 20, 15, 30, 25, 18]
  } else if (period === 'trimestre') {
    title = 'Vendite Ultimo Trimestre'
    data = [120, 200, 150, 80, 70, 110, 300, 400, 350, 500, 450, 480]
  } else {
    title = 'Vendite Ultimo Anno'
    data = [300, 400, 350, 500, 450, 480, 300, 400, 350, 500, 450, 480]
  }

  return {
    title: { text: title },
    tooltip: { trigger: 'axis' },
    legend: { data: ['Vendite'] },
    xAxis: { type: 'category', data: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'] },
    yAxis: { type: 'value' },
    series: [{ name: 'Vendite', type: 'line', data }]
  }
}

// Cambia periodo quando l'utente seleziona
function changePeriod(period) {
  selectedPeriod.value = period
  chartOptions.value = generateChartData(period)
}
</script>

