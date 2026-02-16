<template>
  <div class="container-fluid vh-100 bg-light">
    <div class="row h-100 g-0">
      
      <!-- Colonna sinistra -->
      <div class="col-md-9 d-flex flex-column h-100">
        
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center p-4 border-bottom">
          <div class="d-flex align-items-center">
            <img src="../assets/images/logo.png" class="me-3" style="height: 35px" alt="Logo" />
            <h4 class="mb-0 text-dark fw-bold">PreFix</h4>
          </div>
          <div>
            <button class="btn btn-link text-decoration-none" @click="backToLogin" :disabled="loading">
              Torna al login
            </button>
          </div>
        </div>

        <!-- Form TOTP -->
        <div class="d-flex justify-content-center align-items-center flex-grow-1 p-4">
          <div class="w-100" style="max-width: 400px">
            
            <div class="text-center mb-5">
              <h1 class="fw-bold text-dark mb-3">Verifica TOTP</h1>
              <p class="text-muted">Inserisci il codice a 6 cifre della tua app Authenticator</p>
            </div>

            <form @submit.prevent="verifyTotp">
              <div class="mb-4">
                <label class="form-label fw-medium text-dark mb-2">Codice TOTP</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-shield-lock text-muted"></i>
                  </span>
                  <input
                    v-model="code"
                    class="form-control border-start-0"
                    placeholder="123456"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                class="btn btn-primary w-100 py-3 fw-medium"
                :disabled="loading"
              >
                <span v-if="loading">
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Verifica in corso...
                </span>
                <span v-else>
                  <i class="bi bi-check2-circle me-2"></i>
                  Verifica
                </span>
              </button>
            </form>

          </div>
        </div>

        <!-- Footer -->
        <div class="border-top p-3 text-center">
          <p class="text-muted small mb-0">
            © 2024 PreFix. Tutti i diritti riservati.
          </p>
        </div>
      </div>

      <!-- Colonna destra -->
      <div class="col-md-3 d-none d-md-block p-0 bg-dark" style="height: 100vh;">
        <img 
          :src="bgImage" 
          class="w-100 h-100"
          style="object-fit: contain; object-position: center;"
          alt="Background"
        />
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { useSelectedBuildingsStore } from "@/stores/selectedBuildings";
import { loginVerifyTotp } from "@/api/authService.js";
import api from "@/services/api";
import bgImage from "../assets/images/login_image.jpg";

const router = useRouter();
const authStore = useAuthStore();
const selectedBuildingsStore = useSelectedBuildingsStore();

const code = ref("");
const loading = ref(false);

onMounted(() => {
  const challenge = sessionStorage.getItem("loginChallengeToken");
  if (!challenge) {
    router.replace("/login");
  }
});

async function fetchAllBuildings() {
  try {
    const response = await api.get("/buildings");
    return response.data;
  } catch (error) {
    console.error("Errore nel caricamento degli edifici:", error);
    return [];
  }
}

async function initializeSelectedBuildings() {
  if (selectedBuildingsStore.selectedIds.length > 0) return;

  const buildings = await fetchAllBuildings();
  if (buildings.length > 0) {
    const buildingIds = buildings.map((b) => b._id);
    selectedBuildingsStore.setSelectedBuildings(buildingIds);
    console.log(`Inizializzati ${buildingIds.length} edifici dopo login`);
  }
}

async function verifyTotp() {
  if (!code.value) return;

  loading.value = true;

  try {
    // Il backend ora imposta accessToken/refreshToken su cookie HttpOnly.
    await loginVerifyTotp(code.value);

    // one-shot: cancella challenge
    sessionStorage.removeItem("loginChallengeToken");

    await authStore.fetchMe();
    await initializeSelectedBuildings();

    router.push("/");
  } catch (error) {
    console.error("Errore login/verify-totp:", error);

    if (error.response?.status === 400) {
      alert(error.response?.data?.message || "Codice TOTP non valido");
    } else if (error.response?.status === 401) {
      alert("Challenge scaduto. Rifai il login.");
      sessionStorage.removeItem("loginChallengeToken");
      router.push("/login");
    } else if (error.response?.status === 403) {
      alert(error.response?.data?.message || "Accesso non consentito");
    } else {
      alert("Errore durante la verifica TOTP");
    }
  } finally {
    loading.value = false;
  }
}

function backToLogin() {
  sessionStorage.removeItem("loginChallengeToken");
  router.push("/login");
}
</script>

<style scoped>
.bg-dark {
  background-color: #1F263E !important;
}
</style>
