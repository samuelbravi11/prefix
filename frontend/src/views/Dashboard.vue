<template>
  <div class="d-flex min-vh-100">
    <Sidebar />

    <div class="flex-grow-1 bg-light">
      <Navbar />

      <div class="container-fluid mt-4">

        <div class="row mt-4 justify-content-center align-items-center">
          <div class="col-11 mb-4">
            <PannelloRiepigolativo/>
          </div>
          <div class="col-12 mb-4">
            <GraficoLinee/>
          </div>
          <div class="col-12 mb-4">
            <GraficoTorta/>
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
