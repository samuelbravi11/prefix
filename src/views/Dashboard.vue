<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div class="container">
        <a class="navbar-brand" href="#">PreFix Dashboard</a>
        <div>
          <button class="btn btn-outline-danger" @click="logout">Logout</button>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <h1>Benvenuto, {{ username }}!</h1>
      <p>Questa è la tua dashboard.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('Utente')
const router = useRouter()

function logout() {
  router.push('/')  // Torna al login
}
</script>