<template></template>

<script setup>
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useSelectedBuildingsStore } from "@/stores/selectedBuildings";
import api from "@/services/api";

const route = useRoute();
const selectedBuildingsStore = useSelectedBuildingsStore();

// Route pubbliche: qui NON dobbiamo chiamare API protette come /api/v1/buildings
function isPublicRoute(path) {
  // attenzione: la tua app usa /auth/* per login/refresh/csrf e pagine SPA /login, /bootstrap, ecc.
  const PUBLIC_PREFIXES = ["/login", "/bootstrap", "/register", "/forgot", "/reset"];
  if (PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return true;

  // anche se qualcuno naviga su /auth/* dal browser (raro), consideriamolo pubblico
  if (path === "/auth" || path.startsWith("/auth/")) return true;

  return false;
}

onMounted(async () => {
  // Se sono in pagina pubblica, non inizializzare edifici selezionati
  if (isPublicRoute(route.path)) return;

  // Se già inizializzato, non rifare chiamate
  if (selectedBuildingsStore.selectedIds.length > 0) return;

  try {
    const response = await api.get("/buildings");
    if (Array.isArray(response.data) && response.data.length > 0) {
      const buildingIds = response.data.map((b) => b._id);
      selectedBuildingsStore.setSelectedBuildings(buildingIds);
    }
  } catch (error) {
    // Qui NON vogliamo redirect forzati: l'interceptor ora gestirà correttamente i 401 su route protette
    console.error("Errore inizializzazione edifici:", error);
  }
});
</script>