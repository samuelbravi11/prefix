<template>
  <div class="d-flex vh-100">
    <Sidebar />

    <div class="flex-grow-1 d-flex flex-column">
      <Navbar />

      <!-- Questa div scrolla -->
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
