<template>
  <div class="card text-center">
    <div class="card-body">
      <h5 class="card-title">{{ title }}</h5>
      <p class="display-6">{{ value }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: String
})
</script>
