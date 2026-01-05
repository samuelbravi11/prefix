<template>
  <div class="container-fluid vh-100 bg-light">
    <div class="row h-100 g-0">
      
      <!-- Colonna sinistra: Login -->
      <div class="col-md-9 d-flex flex-column h-100">
        
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center p-4 border-bottom">
          <div class="d-flex align-items-center">
            <img src="../assets/images/logo.png" class="me-3" style="height: 35px" alt="Logo" />
            <h4 class="mb-0 text-dark fw-bold">PreFix</h4>
          </div>
          <div>
            <span class="text-muted me-2">Non hai un account?</span>
            <router-link to="/register" class="text-primary text-decoration-none fw-medium">
              Registrati
            </router-link>
          </div>
        </div>

        <!-- Form Login -->
        <div class="d-flex justify-content-center align-items-center flex-grow-1 p-4">
          <div class="w-100" style="max-width: 400px">
            
            <!-- Titolo -->
            <div class="text-center mb-5">
              <h1 class="fw-bold text-dark mb-3">Accedi a PreFix</h1>
              <p class="text-muted">Inserisci le tue credenziali per accedere</p>
            </div>

            <!-- Form -->
            <form @submit.prevent="login">
              <div class="mb-4">
                <label class="form-label fw-medium text-dark mb-2">Email</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-envelope text-muted"></i>
                  </span>
                  <input 
                    type="email" 
                    v-model="email" 
                    class="form-control border-start-0"
                    placeholder="nome@esempio.com"
                    required
                  />
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label fw-medium text-dark mb-2">Password</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-lock text-muted"></i>
                  </span>
                  <input 
                    :type="showPassword ? 'text' : 'password'"
                    v-model="password" 
                    class="form-control border-start-0"
                    placeholder="Inserisci la password"
                    required
                  />
                  <button 
                    type="button" 
                    class="input-group-text bg-white border-start-0"
                    @click="showPassword = !showPassword"
                  >
                    <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center mb-4">
                <div></div>
                <router-link to="/forgot-password" class="text-primary text-decoration-none small">
                  Password dimenticata?
                </router-link>
              </div>

              <button 
                type="submit" 
                class="btn btn-primary w-100 py-3 fw-medium"
                :disabled="loading"
              >
                <span v-if="loading">
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Accesso in corso...
                </span>
                <span v-else>
                  <i class="bi bi-box-arrow-in-right me-2"></i>
                  Accedi
                </span>
              </button>

              <div class="text-center my-4 position-relative">
                <hr class="position-absolute top-50 start-0 end-0">
                <span class="bg-light px-3 text-muted small position-relative">
                  oppure
                </span>
              </div>

              <button type="button" class="btn btn-outline-secondary w-100 py-2 mb-3">
                <i class="bi bi-shield-lock me-2"></i>
                Accedi con SPID
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

      <!-- Colonna destra: Immagine (mantiene proporzioni originali) -->
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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { useSelectedBuildingsStore } from '@/stores/selectedBuildings'; // AGGIUNTO
import { login as loginService } from "@/api/authService.js";
import axios from "axios"; // AGGIUNTO
import bgImage from "../assets/images/login_image.jpg";

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const router = useRouter();
const authStore = useAuthStore();
const selectedBuildingsStore = useSelectedBuildingsStore(); // AGGIUNTO

// Funzione per ottenere tutti gli edifici
async function fetchAllBuildings() {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await axios.get("/api/v1/buildings", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error("Errore nel caricamento degli edifici:", error);
    return [];
  }
}

async function login() {
  if (!email.value || !password.value) {
    alert("Inserisci email e password");
    return;
  }

  loading.value = true;

  try {
    // 1. Effettua il login
    const response = await loginService(email.value, password.value);
    localStorage.setItem("accessToken", response.data.accessToken);
    
    // 2. Carica i dati dell'utente
    await authStore.fetchMe();
    
    // 3. Ottieni tutti gli edifici disponibili
    const buildings = await fetchAllBuildings();
    
    if (buildings.length > 0) {
      // 4. Estrai tutti gli ID degli edifici
      const buildingIds = buildings.map(b => b._id);
      
      // 5. Popola lo store selectedBuildings con tutti gli edifici
      selectedBuildingsStore.setSelectedBuildings(buildingIds);
      
      console.log(`Selezionati automaticamente ${buildingIds.length} edifici`);
    } else {
      console.log("Nessun edificio disponibile");
    }
    
    // 6. Reindirizza alla dashboard
    router.push("/");
    
  } catch (error) {
    console.error("Errore login:", error);
    
    if (error.response?.status === 401) {
      alert("Email o password errati");
    } else if (error.response?.status === 403) {
      alert("Utente non ancora attivo");
    } else {
      alert("Errore durante il login");
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Solo 1 regola CSS personale! */
.bg-dark {
  background-color: #1F263E !important;
}

/* Nessun altro CSS necessario */
</style>