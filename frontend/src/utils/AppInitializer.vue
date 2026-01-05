<template>
  <!-- Componente vuoto, solo per logica -->
</template>

<script setup>
import { onMounted } from 'vue'
import { useSelectedBuildingsStore } from '@/stores/selectedBuildings'
import axios from 'axios'

const selectedBuildingsStore = useSelectedBuildingsStore()

onMounted(async () => {
  const token = localStorage.getItem('accessToken')
  
  if (token && selectedBuildingsStore.selectedIds.length === 0) {
    try {
      const response = await axios.get('/api/v1/buildings', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.data.length > 0) {
        const buildingIds = response.data.map(b => b._id)
        selectedBuildingsStore.setSelectedBuildings(buildingIds)
        console.log(`Inizializzati ${buildingIds.length} edifici`)
      }
    } catch (error) {
      console.error('Errore inizializzazione edifici:', error)
    }
  }
})
</script>