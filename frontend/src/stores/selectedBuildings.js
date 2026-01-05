import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSelectedBuildingsStore = defineStore('selectedBuildings', () => {
  // Carica da localStorage all'inizializzazione
  const storedIds = localStorage.getItem('selectedBuildingIds')
  const selectedIds = ref(storedIds ? JSON.parse(storedIds) : [])

  // Salva in localStorage ogni volta che cambia
  watch(selectedIds, (newIds) => {
    localStorage.setItem('selectedBuildingIds', JSON.stringify(newIds))
  }, { deep: true })

  const setSelectedBuildings = (ids) => {
    selectedIds.value = ids
  }

  const clear = () => {
    selectedIds.value = []
  }

  return {
    selectedIds,
    setSelectedBuildings,
    clear
  }
})