<template>
  <div class="card shadow-sm border-0 w-100 pannello-riepilogo">
    
    <!-- Titolo -->
    <div class="card-body ps-5">
      <h4>Pannello Riepigolativo KPI</h4>
    </div>

    <!-- Fascia grigia superiore -->
    <div class="bg-secondary bg-opacity-25 px-3 py-2 border-bottom d-flex align-items-center ps-5">
      <span class="fw-medium text-dark">Seleziona periodo</span>
    </div>

    <div class="card-body ps-5">

      <!-- Componente di selezione mesi/periodo -->
      <SelezioneMesi @periodSelected="changePeriod" :selected="selectedPeriod" />

      <!-- Contenuto principale -->
      <div class="card-body px-3">

        <!-- Prima riga di KPI -->
        <div class="row mb-3">
          <div class="col-md-4">
            <h6 class="text-muted">Interventi in corso</h6>
            <h4 class="fw-bold">{{ kpi.inCorso }}</h4>
          </div>
          <div class="col-md-4">
            <h6 class="text-muted">Completati</h6>
            <h4 class="fw-bold">{{ kpi.completati }}</h4>
          </div>
          <div class="col-md-4">
            <h6 class="text-muted">Pianificati</h6>
            <h4 class="fw-bold">{{ kpi.pianificati }}</h4>
          </div>
        </div>

        <!-- Seconda riga -->
        <div class="row mb-3">
          <div class="col-md-4">
            <h6 class="text-muted">Tempo medio di risoluzione</h6>
            <h4 class="fw-bold">{{ kpi.tempoMedio }}</h4>
          </div>
        </div>

        <!-- Terza riga -->
        <div class="row mb-3">
          <div class="col-md-4">
            <h6 class="text-muted">Risparmio stimato tramite dati predittivi</h6>
            <h4 class="fw-bold">{{ kpi.risparmio }}€</h4>
          </div>
        </div>

        <!-- Quarta riga -->
        <div class="row mb-3">
          <div class="col-md-4">
            <h6 class="text-muted">Stato complessivo dell’edificio</h6>
            <h4 class="fw-bold">{{ kpi.stato }}</h4>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import SelezioneMesi from './SelezioneMesi.vue'

// Periodo selezionato di default
const selectedPeriod = ref('anno')

// KPI reactive
const kpi = reactive({
  inCorso: 0,
  completati: 0,
  pianificati: 0,
  tempoMedio: '',
  risparmio: 0,
  stato: ''
})

// Funzione per cambiare periodo e aggiornare i dati
function changePeriod(period) {
  selectedPeriod.value = period
  fetchKpi(period)
}

// Funzione mock per aggiornare KPI (da sostituire con fetch/axios)
function fetchKpi(period) {
  if (period === 'mese') {
    Object.assign(kpi, {
      inCorso: 5,
      completati: 12,
      pianificati: 3,
      tempoMedio: '2gg 5h',
      risparmio: 3456,
      stato: 'NELLA NORMA'
    })
  } else if (period === 'trimestre') {
    Object.assign(kpi, {
      inCorso: 12,
      completati: 35,
      pianificati: 10,
      tempoMedio: '3gg 12h',
      risparmio: 9876,
      stato: 'NELLA NORMA'
    })
  } else if (period === 'anno') {
    Object.assign(kpi, {
      inCorso: 7,
      completati: 47,
      pianificati: 20,
      tempoMedio: '3gg 12h',
      risparmio: 12345,
      stato: 'NELLA NORMA'
    })
  }
}

// Carica dati iniziali
fetchKpi(selectedPeriod.value)
</script>


