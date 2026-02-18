<template></template>

<script setup>
import { onMounted } from "vue";
import { useSelectedBuildingsStore } from "@/stores/selectedBuildings";
import api from "@/services/api";

const selectedBuildingsStore = useSelectedBuildingsStore();

onMounted(async () => {
  if (selectedBuildingsStore.selectedIds.length === 0) {
    try {
      const response = await api.get("/buildings");
      if (Array.isArray(response.data) && response.data.length > 0) {
        const buildingIds = response.data.map((b) => b._id);
        selectedBuildingsStore.setSelectedBuildings(buildingIds);
      }
    } catch (error) {
      console.error("Errore inizializzazione edifici:", error);
    }
  }
});
</script>
