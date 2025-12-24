<template>
    <div class="card shadow-sm border-0 w-100 h-100">
        <!-- Titolo -->
        <div class="card-body ps-5">
            <h4>Pannello Riepilogativo Gravità Interventi</h4>
        </div>

        <!-- Fascia grigia -->
        <div class="bg-secondary bg-opacity-25 px-3 py-2 border-bottom d-flex align-items-center ps-5">
            <span class="fw-medium text-dark">Seleziona periodo</span>
        </div>

        <!-- Selezione periodo -->
        <div class="card-body ps-5">
            <SelezioneMesi :selected="selectedPeriod" @periodSelected="changePeriod" />

            <!-- Grafico a torta -->
            <v-chart :option="chartOptions" autoresize class="w-100" style="height: 500px;" />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import SelezioneMesi from './SelezioneMesi.vue'

// Componenti ECharts necessari
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Registra componenti
use([PieChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer])

// Periodo selezionato
const selectedPeriod = ref('anno')

// Dati della torta
const chartOptions = ref(generateChartData(selectedPeriod.value))

function generateChartData(period) {
    let title, data

    // Esempio: dati diversi per periodo
    if (period === 'mese') {
        title = 'Gravità Interventi - Ultimo Mese'
        data = [
            { value: 12, name: 'Bassa' },
            { value: 7, name: 'Media' },
            { value: 3, name: 'Alta' }
        ]
    } else if (period === 'trimestre') {
        title = 'Gravità Interventi - Ultimo Trimestre'
        data = [
            { value: 30, name: 'Bassa' },
            { value: 20, name: 'Media' },
            { value: 10, name: 'Alta' }
        ]
    } else {
        title = 'Gravità Interventi - Ultimo Anno'
        data = [
            { value: 120, name: 'Bassa' },
            { value: 80, name: 'Media' },
            { value: 50, name: 'Alta' }
        ]
    }

    return {
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', left: 'left' },
        series: [
            {
                name: 'Gravità',
                type: 'pie',
                radius: '50%',
                data,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0,0,0,0.5)'
                    }
                }
            }
        ]
    }
}

// Cambia periodo
function changePeriod(period) {
    selectedPeriod.value = period
    chartOptions.value = generateChartData(period)
}
</script>
