import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSelectedBuildingsStore = defineStore('selectedBuildings', () => {
  const selectedIds = ref([])

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
