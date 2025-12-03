<template>
  <div class="d-flex vh-100">
    <Sidebar />

    <div class="flex-grow-1 bg-light">
      <Navbar />

      <div class="container mt-4">
        <h2>SEEEEEEE</h2>

        <div class="row mt-4">
          <div class="col-md-4">
            <pannelloRiepigolativo/>
          </div>
          <div class="col-md-4">
            <graficoLinee/>
          </div>
          <div class="col-md-4">
            <graficoTorta/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '../component/Sidebar.vue'
import Navbar from '../component/Navbar.vue'
import pannelloRiepigolativo from '../component/pannelloRiepigolativo.vue'
import graficoLinee from '../component/graficoLinee.vue'
import graficoTorta from '../component/graficoTorta.vue'
</script>
