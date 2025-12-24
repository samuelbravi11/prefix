<template>
  <div class="flex-grow-1 overflow-auto p-4 bg-light">
    <div class="container-fluid">
      <div class="row mt-4 justify-content-center align-items-center">
        <div class="col-11 mb-4">
          <PannelloRiepigolativo />
        </div>
        <div class="col-11 mb-4">
          <GraficoLinee />
        </div>
        <div class="col-11 mb-4">
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
</script>
