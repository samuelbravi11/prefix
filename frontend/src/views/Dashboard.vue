<template>
  <div class="d-flex vh-100">
    <Sidebar />

    <div class="flex-grow-1 d-flex flex-column">
      <Navbar />

      <div class="flex-grow-1 overflow-auto p-4 bg-light" ref="scrollContainer">
        <div class="container-fluid">
          <div class="row mt-4 justify-content-center align-items-center">
            <div class="col-11 mb-4" id="pannello-riepilogativo">
              <PannelloRiepigolativo />
            </div>
            <div class="col-11 mb-4" id="grafico-linee">
              <GraficoLinee />
            </div>
            <div class="col-11 mb-4" id="grafico-torta">
              <GraficoTorta />
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>


<script setup>
import Sidebar from '../component/Sidebar.vue'
import Navbar from '../component/Navbar.vue'
import PannelloRiepigolativo from '../component/PannelloRiepilogativo.vue'
import GraficoLinee from '../component/GraficoLinee.vue'
import GraficoTorta from '../component/GraficoTorta.vue'
</script>
