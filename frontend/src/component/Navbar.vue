<template>
  <nav class="navbar navbar-light bg-white px-4 shadow py-4 overflow-hidden flex-shrink-0">
    <div class="container-fluid">
      <button @click="darkMode = !darkMode" class="btn btn-sm btn-secondary">
    {{ darkMode ? 'Light Mode' : 'Dark Mode' }}
  </button>
      <span class="navbar-brand mb-0 h5">Dashboard</span>
      <div class="d-flex align-items-center gap-3">

        <img :src="iconaUtente" style="height: 33px" />
        <img :src="settings" style="height: 18px" />
        <!-- Notifiche -->
        <div class="position-relative d-inline-block">
          
          <img :src="notifiche" class="me-2" style="height: 18px" />

          <!-- Badge notifiche -->
          <span v-if="notificationCount > 0"
            class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style="font-size: 10px; padding: 4px 6px;">
            {{ notificationCount }}
          </span>

        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import notifiche from "@/assets/images/Notifiche.png"
import settings from "@/assets/images/Setting.png"
import iconaUtente from "@/assets/images/icona_utente.png"


import { ref, watch } from 'vue'

const darkMode = ref(false)

// Aggiorna la classe sul body
watch(darkMode, (newVal) => {
  if (newVal) document.body.classList.add('dark-mode')
  else document.body.classList.remove('dark-mode')
})

// Per salvarlo anche in localStorage
watch(darkMode, (newVal) => localStorage.setItem('darkMode', newVal))

const notificationCount = ref(3)

</script>