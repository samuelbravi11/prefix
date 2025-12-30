<template>
  <div class="flex-grow-1 p-4 bg-light">
    <div class="container-fluid">
      <div class="row mt-4 justify-content-center align-items-center">
        <!-- Pannello riepilogativo -->
        <div class="col-11 mb-4" id="pannello-riepilogativo">
          <PannelloRiepigolativo />
        </div>
        <!-- Grafico a linee -->
        <div class="col-11 mb-4" id="grafico-linee">
          <GraficoLinee />
        </div>
        <!-- Grafico a torta -->
        <div class="col-11 mb-4" id="grafico-torta">
          <GraficoTorta />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PannelloRiepigolativo from '../components/PannelloRiepilogativo.vue'
import GraficoLinee from '../components/GraficoLinee.vue'
import GraficoTorta from '../components/GraficoTorta.vue'

/* Dashboard.vue
   Contiene i grafici principali e il pannello riepilogativo.
   Ogni grafico ha un id per poter essere raggiunto dalla sidebar.
*/
</script>
