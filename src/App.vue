<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container">
        <a class="navbar-brand" href="#">My App</a>
        <div>
          <router-link class="btn btn-primary me-2" to="/">Home</router-link>
          <router-link class="btn btn-secondary" to="/about">About</router-link>
        </div>
      </div>
    </nav>

    <router-view />
  </div>
</template>

<script setup>
</script>