<template>
  <div class="flex-grow-1 p-4 bg-light">
    <div class="container-fluid">
      <div class="row mt-4 justify-content-center align-items-center">
        <div class="col-11 mb-5" id="pannello-riepilogativo">
          <PannelloRiepigolativo />
        </div>

        <div class="col-11 mb-5" id="grafico-linee">
          <GraficoLinee />
        </div>

        <div class="col-11 mb-5" id="grafico-torta">
          <GraficoTorta />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PannelloRiepigolativo from "../components/PannelloRiepilogativo.vue";
import GraficoLinee from "../components/GraficoLinee.vue";
import GraficoTorta from "../components/GraficoTorta.vue";

/* Dashboard.vue
  Contiene i grafici principali e il pannello riepilogativo.
  Ogni grafico ha un id per poter essere raggiunto dalla sidebar.
*/

</script>
