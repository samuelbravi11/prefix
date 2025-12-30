<template>
  <div class="container-fluid vh-100 bg-light">
    <div class="row h-100 g-0">
      
      <!-- Colonna sinistra: Registrazione -->
      <div class="col-md-9 d-flex flex-column h-100">
        
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center p-4 border-bottom">
          <div class="d-flex align-items-center">
            <img src="../assets/images/logo.png" class="me-3" style="height: 35px" alt="Logo" />
            <h4 class="mb-0 text-dark fw-bold">PreFix</h4>
          </div>
          <div>
            <span class="text-muted me-2">Hai già un account?</span>
            <router-link to="/" class="text-primary text-decoration-none fw-medium">
              Accedi
            </router-link>
          </div>
        </div>

        <!-- Form Registrazione -->
        <div class="d-flex justify-content-center align-items-center flex-grow-1 p-4">
          <div class="w-100" style="max-width: 400px">
            
            <!-- Titolo -->
            <div class="text-center mb-5">
              <h1 class="fw-bold text-dark mb-3">Registrati su PreFix</h1>
              <p class="text-muted">Crea un account per iniziare a utilizzare la piattaforma</p>
            </div>

            <!-- Form -->
            <form @submit.prevent="doRegister">
              <div class="mb-3">
                <label class="form-label fw-medium text-dark mb-2">Nome</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-person text-muted"></i>
                  </span>
                  <input 
                    type="text" 
                    v-model="name" 
                    class="form-control border-start-0"
                    placeholder="Il tuo nome"
                    required
                  />
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-medium text-dark mb-2">Cognome</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-person-badge text-muted"></i>
                  </span>
                  <input 
                    type="text" 
                    v-model="surname" 
                    class="form-control border-start-0"
                    placeholder="Il tuo cognome"
                  />
                </div>
              </div>

              <div class="mb-3">
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
                    placeholder="Crea una password"
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

              <button 
                type="submit" 
                class="btn btn-primary w-100 py-3 fw-medium"
                :disabled="loading"
              >
                <span v-if="loading">
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Registrazione in corso...
                </span>
                <span v-else>
                  <i class="bi bi-person-plus me-2"></i>
                  Registrati
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
import bgImage from "../assets/images/login_image.jpg";
import { register as registerService } from "../api/authService.js";

const email = ref("");
const password = ref("");
const name = ref("");
const surname = ref("");
const showPassword = ref(false);
const loading = ref(false);
const router = useRouter();

async function doRegister() {
  if (!email.value || !password.value || !name.value) {
    alert("Compila tutti i campi obbligatori");
    return;
  }

  loading.value = true;

  try {
    await registerService({
      email: email.value,
      password: password.value,
      name: name.value,
      surname: surname.value
    });

    alert("Registrazione completata. Attendi l'attivazione e poi accedi.");
    router.push("/");
  } catch (err) {
    console.error(err);
    
    let errorMessage = "Errore durante la registrazione";
    if (err.response?.status === 409) {
      errorMessage = "Email già registrata";
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    }
    
    alert(errorMessage);
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
